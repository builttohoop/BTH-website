#!/usr/bin/env node
/**
 * BTH PR TIER CLASSIFIER
 *
 * Reads .github/merge-tiers.json and decides whether a PR may auto-merge (Tier A/B)
 * or must wait for Ty's approving review (Tier C/D).
 *
 * Design rules, in priority order:
 *   1. force_tier_d wins over everything. The gate cannot modify itself.
 *   2. The PR's tier is the HIGHEST tier across all changed paths (D > C > B > A).
 *   3. A path matching NO glob is Tier D. Unknown is never automatic — this FAILS CLOSED.
 *   4. Content patterns scan ADDED lines only and promote to at least C, whatever the path.
 *
 * Zero dependencies. Usage:
 *   node .github/scripts/classify-pr.mjs --base origin/main --head HEAD
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, appendFileSync } from 'node:fs';
import path from 'node:path';

const RANK = { A: 1, B: 2, C: 3, D: 4 };
const BY_RANK = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith('--')) continue;
    const key = argv[i].slice(2);
    const next = argv[i + 1];
    out[key] = next && !next.startsWith('--') ? argv[++i] : true;
  }
  return out;
}

/** Convert a glob to an anchored regex. Supports **, *, ? — / is a hard boundary for single *. */
function globToRegExp(glob) {
  let rx = '';
  for (let i = 0; i < glob.length; i += 1) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        // ** — match across directory separators
        i += 1;
        if (glob[i + 1] === '/') i += 1; // `**/` also matches zero directories
        rx += '.*';
      } else {
        rx += '[^/]*';
      }
    } else if (c === '?') {
      rx += '[^/]';
    } else if ('\\^$+.()|{}[]'.includes(c)) {
      rx += `\\${c}`;
    } else {
      rx += c;
    }
  }
  return new RegExp(`^${rx}$`);
}

/** A path matches a glob list if it hits >=1 positive glob and 0 negated (!) globs. */
function matchesGlobList(file, globs) {
  let positive = false;
  for (const glob of globs) {
    if (glob.startsWith('!')) {
      if (globToRegExp(glob.slice(1)).test(file)) return false;
    } else if (globToRegExp(glob).test(file)) {
      positive = true;
    }
  }
  return positive;
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
}

function changedFiles(base, head) {
  return git(['diff', '--name-only', '--diff-filter=ACMR', `${base}...${head}`])
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/\\/g, '/'));
}

/** Only ADDED lines. We do not care what the diff removed — you cannot ship a removal of a claim. */
function addedLines(base, head) {
  const diff = git(['diff', '--unified=0', `${base}...${head}`]);
  const out = [];
  let file = null;
  for (const line of diff.split(/\r?\n/)) {
    if (line.startsWith('+++ b/')) {
      file = line.slice(6);
      continue;
    }
    if (line.startsWith('+') && !line.startsWith('+++')) {
      out.push({ file: file ?? '(unknown)', text: line.slice(1) });
    }
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const base = String(args.base || 'origin/main');
  const head = String(args.head || 'HEAD');

  const mapPath = path.resolve('.github/merge-tiers.json');
  const map = JSON.parse(readFileSync(mapPath, 'utf8'));

  const files = changedFiles(base, head);
  const reasons = [];
  let tier = 'A';

  const bump = (to, reason) => {
    if (RANK[to] > RANK[tier]) tier = to;
    reasons.push(reason);
  };

  if (files.length === 0) {
    // An empty diff should never be waved through as "safe by default".
    bump('D', 'No changed files detected — refusing to classify as automatic.');
  }

  // ---- Rule 1: force_tier_d. The gate cannot modify itself. -----------------
  const forced = files.filter((f) => matchesGlobList(f, map.force_tier_d.globs));
  for (const f of forced) {
    bump('D', `\`${f}\` touches the gate's own machinery (force_tier_d) — Tier D by construction.`);
  }

  // ---- Rules 2 + 3: per-path tier, unmapped => D (fail closed) --------------
  for (const f of files) {
    if (forced.includes(f)) continue;
    let best = null;
    for (const name of ['A', 'B', 'C']) {
      const t = map.tiers[name];
      if (t && matchesGlobList(f, t.globs)) {
        if (!best || RANK[name] > RANK[best]) best = name;
      }
    }
    if (!best) {
      bump('D', `\`${f}\` matches no tier glob — unmapped paths fail CLOSED to Tier D.`);
    } else if (best === 'C') {
      bump('C', `\`${f}\` is Tier C (money / tracking / claims / sends).`);
    } else if (RANK[best] > RANK[tier]) {
      bump(best, `\`${f}\` is Tier ${best}.`);
    }
  }

  // ---- Rule 4: content scan on ADDED lines, promotes to >= C ----------------
  const added = addedLines(base, head);
  const contentHits = [];
  for (const pattern of map.content_promote_to_c.patterns) {
    const rx = new RegExp(pattern.rx.replace(/^\(\?i\)/, ''), pattern.rx.startsWith('(?i)') ? 'i' : '');
    const hit = added.find((l) => rx.test(l.text));
    if (hit) contentHits.push({ id: pattern.id, note: pattern.note, file: hit.file });
  }
  for (const h of contentHits) {
    bump('C', `Added line in \`${h.file}\` matched **${h.id}** (${h.note}) — promoted to Tier C.`);
  }

  const autoEligible = Boolean(map.tiers[tier]?.auto_merge);
  const result = {
    tier,
    tier_label: map.tiers[tier]?.label ?? 'Irreversible / self-modifying — Ty presses',
    auto_merge_eligible: autoEligible,
    changed_file_count: files.length,
    files,
    content_hits: contentHits,
    reasons,
  };

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `tier=${tier}\n`);
    appendFileSync(process.env.GITHUB_OUTPUT, `auto_eligible=${autoEligible}\n`);
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    const lines = [
      `## Merge gate — Tier ${tier}`,
      '',
      `**${result.tier_label}**`,
      '',
      autoEligible
        ? '✅ Eligible to auto-merge once every other check is green.'
        : "🔒 **Requires Ty's approving review.** This will not merge on its own.",
      '',
      '### Why',
      ...reasons.map((r) => `- ${r}`),
      '',
      `<sub>${files.length} changed file(s). Unmapped paths fail closed to Tier D.</sub>`,
    ];
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`);
  }
}

main();
