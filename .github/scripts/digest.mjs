#!/usr/bin/env node
/**
 * MERGE DIGEST — "what shipped while you were away".
 *
 * This is the oversight mechanism. Since Ty's green-only ruling (2026-10-04) an agent may merge
 * any PR whose required checks are green, so nothing is approved BEFORE it ships — Ty reviews
 * AFTER the fact, and this is the thing he reviews.
 *
 * There is no ledger FILE. GitHub is the ledger: every PR merged in the window IS the record.
 * Nothing to maintain, nothing to drift, and no bot pushing to main. (Before the ruling this
 * listed only PRs carrying the gate's `auto-merge:eligible` label; with the gate gone that label
 * is never applied, and the old split would have reported every merge as "with your approval".)
 *
 * Every entry carries a one-line revert command, because a digest you can't act on is just noise.
 *
 * Usage: node .github/scripts/digest.mjs --days 1 --repo owner/name
 */

import { execFileSync } from 'node:child_process';

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith('--')) continue;
    const k = argv[i].slice(2);
    const n = argv[i + 1];
    out[k] = n && !n.startsWith('--') ? argv[++i] : true;
  }
  return out;
}

const gh = (args) =>
  JSON.parse(execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }) || 'null');

const args = parseArgs(process.argv.slice(2));
const repo = String(args.repo || process.env.GITHUB_REPOSITORY);
const days = Number(args.days || 1);

const sinceMs = Date.now() - days * 24 * 60 * 60 * 1000;
const since = new Date(sinceMs).toISOString();

const prs = (
  gh([
    'pr', 'list', '--repo', repo, '--state', 'merged', '--limit', '100',
    '--json', 'number,title,mergedAt,mergeCommit,labels,author,url,additions,deletions,files',
  ]) || []
).filter((p) => p.mergedAt && p.mergedAt >= since);

// Every merge is listed. Nothing here says who pressed merge — agents and Ty share one account.
const auto = prs;

const window = days === 1 ? 'the last 24 hours' : `the last ${days} days`;
const out = [];

out.push(`## What shipped in ${window}`);
out.push('');

if (auto.length === 0) {
  out.push('**Nothing merged.**');
} else {
  out.push(
    `**${auto.length} PR(s) merged to \`main\` — live on the site.** No PR waits for an approval any more; ` +
      'each one below passed the required checks (`validate`, `leak-scan`) and nothing else.',
  );
  out.push('');
  out.push('| PR | What | Files | Revert |');
  out.push('|---|---|---|---|');
  for (const p of auto) {
    const sha = p.mergeCommit?.oid?.slice(0, 8) ?? '?';
    const n = p.files?.length ?? 0;
    out.push(
      `| [#${p.number}](${p.url}) | ${p.title.replace(/\|/g, '\\|')} | ${n} (+${p.additions}/-${p.deletions}) | \`git revert -m 1 ${sha}\` |`,
    );
  }
  out.push('');
  out.push('<details><summary>Files touched</summary>');
  out.push('');
  for (const p of auto) {
    out.push(`**#${p.number}** — ${(p.files ?? []).map((f) => `\`${f.path}\``).join(', ') || '_none_'}`);
  }
  out.push('');
  out.push('</details>');
}

out.push('');
out.push('---');
out.push('');
out.push('**Something look wrong?** Copy its revert command above — Pages rebuilds in ~35s.');
out.push('');
out.push('**Want it all to stop?** One command requires an approving review on every PR again:');
out.push('');
out.push('```bash');
out.push(
  `gh api -X PATCH repos/${repo}/branches/main/protection/required_pull_request_reviews -F required_approving_review_count=1`,
);
out.push('```');
out.push('');
out.push(
  '<sub>Pricing, `/join`, checkout, tracking, the service worker — all of it can now merge on green checks alone. ' +
    'If this digest goes unread, BTH is running with no oversight at all; that is the one risk the machine cannot cover.</sub>',
);

process.stdout.write(`${out.join('\n')}\n`);
