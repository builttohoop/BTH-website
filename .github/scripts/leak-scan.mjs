#!/usr/bin/env node

import { execFile as execFileCallback } from 'node:child_process';
import { lstat, readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFile = promisify(execFileCallback);
const ALLOWED_EMAIL_DOMAIN = 'built-to-hoop.com';
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})\b/gi;
const PHONE_PATTERN = /(?:^|\D)(?:\+?1[ .-]?)?(?:\([2-9]\d{2}\)|[2-9]\d{2})[ .-]\d{3}[ .-]\d{4}(?:\s*(?:x|ext\.?)[ .-]?\d{1,6})?(?=\D|$)/i;

const FIXED_DETECTORS = Object.freeze([
  {
    kind: 'bearer-token',
    pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{12,}/i,
    detail: 'authorization bearer value',
  },
  {
    kind: 'openai-style-secret',
    pattern: /\bsk-[A-Za-z0-9_-]{16,}\b/i,
    detail: 'secret key with sk- prefix',
  },
  {
    kind: 'aws-access-key',
    pattern: /\bAKIA[0-9A-Z]{16}\b/,
    detail: 'AWS access-key identifier',
  },
  {
    kind: 'stripe-secret',
    pattern: /\b(?:sk_live|rk_live)_[A-Za-z0-9]{16,}\b/i,
    detail: 'live Stripe secret',
  },
  {
    kind: 'stripe-webhook-secret',
    pattern: /\bwhsec_[A-Za-z0-9]{16,}\b/i,
    detail: 'Stripe webhook secret',
  },
  {
    kind: 'resend-api-key',
    pattern: /\bre_[A-Za-z0-9_-]{20,}\b/,
    detail: 'Resend-style API key',
  },
  {
    kind: 'gmail-message-id',
    pattern: /\br-\d{15,}\b/,
    detail: 'raw Gmail message id',
  },
  {
    kind: 'private-key',
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/,
    detail: 'private-key material',
  },
]);

const SENSITIVE_ASSIGNMENT = /\b([A-Z][A-Z0-9_]*(?:TOKEN|API_KEY|SECRET|PASSWORD|PASSWD|PWD|WEBHOOK|CREDENTIAL)[A-Z0-9_]*)\s*[:=]\s*([^\s,;#]+)/i;

function isPlaceholderValue(rawValue) {
  const value = String(rawValue).replace(/^['"]|['"]$/g, '').trim();
  return (
    !value ||
    /^(?:null|none|undefined|redacted|placeholder|example|dummy|test|changeme|change-me|x+|\*+)$/i.test(value) ||
    /^(?:process\.env|os\.environ|env\[|\$\{|\$env:|<|\[)/i.test(value)
  );
}

function lineNumberAt(text, index) {
  let line = 1;
  for (let cursor = 0; cursor < index; cursor += 1) {
    if (text.charCodeAt(cursor) === 10) line += 1;
  }
  return line;
}

function safePath(value) {
  return String(value)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email-redacted]')
    .replace(/\br-\d{15,}\b/g, '[gmail-id-redacted]');
}

function addFinding(findings, seen, finding) {
  const key = `${finding.kind}\0${finding.file}\0${finding.line ?? ''}\0${finding.detail}`;
  if (seen.has(key)) return;
  seen.add(key);
  findings.push(finding);
}

export function scanText(text, relativePath) {
  const findings = [];
  const seen = new Set();
  let allowedBthEmails = 0;

  for (const detector of FIXED_DETECTORS) {
    const match = detector.pattern.exec(text);
    detector.pattern.lastIndex = 0;
    if (match) {
      addFinding(findings, seen, {
        kind: detector.kind,
        file: safePath(relativePath),
        line: lineNumberAt(text, match.index),
        detail: detector.detail,
      });
    }
  }

  for (const line of text.split(/\r?\n/).entries()) {
    const [zeroBasedLine, content] = line;
    const assignment = content.match(SENSITIVE_ASSIGNMENT);
    if (assignment && !isPlaceholderValue(assignment[2])) {
      addFinding(findings, seen, {
        kind: 'secret-assignment',
        file: safePath(relativePath),
        line: zeroBasedLine + 1,
        detail: 'sensitive environment/config value assigned inline',
      });
    }
    if (PHONE_PATTERN.test(content)) {
      addFinding(findings, seen, {
        kind: 'phone-number',
        file: safePath(relativePath),
        line: zeroBasedLine + 1,
        detail: 'possible member/lead phone number',
      });
    }
    PHONE_PATTERN.lastIndex = 0;
  }

  EMAIL_PATTERN.lastIndex = 0;
  for (let match = EMAIL_PATTERN.exec(text); match; match = EMAIL_PATTERN.exec(text)) {
    const domain = match[1].toLowerCase();
    if (domain === ALLOWED_EMAIL_DOMAIN) {
      allowedBthEmails += 1;
      continue;
    }
    addFinding(findings, seen, {
      kind: 'non-bth-email',
      file: safePath(relativePath),
      line: lineNumberAt(text, match.index),
      detail: 'email outside the allowed BTH domain',
    });
  }

  const normalizedPath = relativePath.replace(/\\/g, '/');
  const isCsv = normalizedPath.toLowerCase().endsWith('.csv');
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  if (isCsv && /(?:^|,|\t)(?:name|email|phone|mobile|contact)(?:,|\t|$)/i.test(firstLine)) {
    addFinding(findings, seen, {
      kind: 'raw-contact-export',
      file: safePath(relativePath),
      line: 1,
      detail: 'CSV has contact/lead fields',
    });
  }

  const inPublicPath = normalizedPath.split('/').some((part) => part.toLowerCase() === 'public');
  if (
    inPublicPath &&
    (isCsv || /(?:^|[-_.])(export|contacts?|leads?|members?|customers?|backend-report)(?:[-_.]|$)/i.test(path.basename(normalizedPath)))
  ) {
    addFinding(findings, seen, {
      kind: 'private-artifact-in-public',
      file: safePath(relativePath),
      line: null,
      detail: 'raw export or backend report staged under a public path',
    });
  }

  return { findings, allowed_bth_email_count: allowedBthEmails };
}

async function changedFiles(repo, base, head) {
  const { stdout } = await execFile(
    'git',
    ['-C', repo, 'diff', '--name-only', '--diff-filter=ACMR', `${base}...${head}`],
    { encoding: 'utf8', windowsHide: true, maxBuffer: 10 * 1024 * 1024 },
  );
  return stdout.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
}

function normalizeFiles(value) {
  if (!value) return null;
  return (Array.isArray(value) ? value : [value])
    .flatMap((item) => String(item).split(','))
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function scanBranch({ repo, base = 'origin/main', head = 'HEAD', files = null } = {}) {
  if (!repo) throw new Error('repo is required');
  const repoRoot = path.resolve(repo);
  const relativeFiles = normalizeFiles(files) ?? await changedFiles(repoRoot, base, head);
  const findings = [];
  const seen = new Set();
  const skipped = [];
  let allowedBthEmails = 0;

  for (const relativeFile of relativeFiles) {
    const absoluteFile = path.resolve(repoRoot, relativeFile);
    const boundary = path.relative(repoRoot, absoluteFile);
    if (
      boundary === '..' ||
      boundary.startsWith(`..${path.sep}`) ||
      boundary.startsWith('../') ||
      boundary.startsWith('..\\') ||
      path.isAbsolute(boundary)
    ) {
      addFinding(findings, seen, {
        kind: 'path-outside-repo',
        file: safePath(relativeFile),
        line: null,
        detail: 'changed path resolves outside the repository',
      });
      continue;
    }

    let stats;
    try {
      stats = await lstat(absoluteFile);
    } catch (error) {
      if (error?.code === 'ENOENT') {
        skipped.push({ file: safePath(relativeFile), reason: 'missing after diff' });
        continue;
      }
      throw error;
    }
    if (stats.isSymbolicLink()) {
      addFinding(findings, seen, {
        kind: 'changed-symlink',
        file: safePath(relativeFile),
        line: null,
        detail: 'changed file is a symbolic link; inspect its target before push',
      });
      continue;
    }
    if (!stats.isFile()) {
      skipped.push({ file: safePath(relativeFile), reason: 'not a regular file' });
      continue;
    }

    const bytes = await readFile(absoluteFile);
    if (bytes.includes(0)) {
      skipped.push({ file: safePath(relativeFile), reason: 'binary file' });
      continue;
    }
    const result = scanText(bytes.toString('utf8'), relativeFile);
    allowedBthEmails += result.allowed_bth_email_count;
    for (const finding of result.findings) addFinding(findings, seen, finding);
  }

  return {
    verdict: findings.length ? 'BLOCK' : 'PASS',
    scanned_file_count: relativeFiles.length,
    findings,
    allowed_ignored: { bth_email_count: allowedBthEmails },
    skipped,
    base,
    head,
    writes_performed: false,
  };
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) throw new Error(`Unexpected argument: ${token}`);
    const key = token.slice(2);
    const next = argv[index + 1];
    const value = next && !next.startsWith('--') ? argv[++index] : true;
    if (Object.hasOwn(options, key)) {
      options[key] = Array.isArray(options[key]) ? [...options[key], value] : [options[key], value];
    } else {
      options[key] = value;
    }
  }
  return options;
}

async function main(argv) {
  const options = parseArgs(argv);
  const result = await scanBranch({
    repo: path.resolve(String(options.repo || process.cwd())),
    base: String(options.base || 'origin/main'),
    head: String(options.head || 'HEAD'),
    files: options.files || null,
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.verdict === 'BLOCK') process.exitCode = 2;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
