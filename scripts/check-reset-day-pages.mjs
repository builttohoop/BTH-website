// BTH-0065 static check for reset/day-2..5.html — no deps, no network, never opens a page.
// Run: node scripts/check-reset-day-pages.mjs   (exit 0 = all assertions hold)
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TITLES = { 2: 'Ankle Reset', 3: 'Movement Control', 4: 'Strength That Moves', 5: 'Power Reset' };
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const count = (hay, re) => (hay.match(new RegExp(re.source, 'g')) || []).length;
let failures = 0;
const check = (n, ok, msg) => { if (!ok) { failures++; console.log(`FAIL day-${n}: ${msg}`); } };

for (const n of [2, 3, 4, 5]) {
  const file = join(ROOT, 'reset', `day-${n}.html`);
  check(n, existsSync(file), 'page missing'); if (!existsSync(file)) continue;
  const html = readFileSync(file, 'utf8');
  const src = readFileSync(join(ROOT, 'reset-pdfs', 'output', `day-0${n}.html`), 'utf8');

  check(n, !html.includes('\r'), 'CRLF present — must be LF');
  check(n, html.includes('<script src="../assets/bth-events.js" defer></script>'), 'bth-events.js include missing');
  check(n, count(html, /BTHEvents\.track\("reset_day_viewed", \{ day: \d \}\)/) === 1, 'expected exactly one reset_day_viewed track call');
  check(n, html.includes(`BTHEvents.track("reset_day_viewed", { day: ${n} })`), `track call must carry day: ${n}`);
  check(n, html.includes('<meta name="robots" content="noindex, nofollow">'), 'noindex, nofollow meta missing');
  check(n, html.includes(`<title>Day ${n} — ${TITLES[n]} · Free 5-Day Reset · Built to Hoop</title>`), 'title wrong');

  const pdfRe = new RegExp(`href="\\.\\./reset-pdfs/output/BTH-Reset-Day-0${n}-[A-Za-z-]+\\.pdf"`);
  check(n, count(html, pdfRe) === 1, 'expected exactly one ../reset-pdfs/output/BTH-Reset-Day-0N-*.pdf link');
  const pdfHref = (html.match(pdfRe) || [''])[0].slice(6, -1); // keep the ../ so it resolves from reset/
  check(n, pdfHref && existsSync(join(ROOT, 'reset', pdfHref)), `linked PDF does not exist: ${pdfHref}`);
  check(n, html.includes('>Download the PDF<'), 'PDF button label must be "Download the PDF"');

  const joinCta = count(html, /<a href="\.\.\/join\.html" class="btn-gold"/);
  check(n, joinCta === (n === 5 ? 1 : 0), `Day-5 CTA link to ../join.html: expected ${n === 5 ? 1 : 0}, got ${joinCta}`);
  check(n, count(html, /track\("offer_viewed"/) === 0, 'page must not fire offer_viewed (join.html does)');

  // Exercise content must be verbatim from the canonical render (names, sets/reps, cues).
  for (const re of [/<div class="ex-name">(.*?)<\/div>/g, /<div class="ex-sets">(.*?)<\/div>/g, /<p class="ex-cue">(.*?)<\/p>/g]) {
    for (const m of src.matchAll(re)) check(n, html.includes(m[1]), `not verbatim: "${m[1]}"`);
  }
  const names = [...src.matchAll(/<div class="ex-name">/g)].length;
  check(n, count(html, /<span class="ex-name">/) === names, `exercise count ${names} expected`);
  const intro = (src.match(/<p class="intro-text">(.*?)<\/p>/) || [])[1];
  check(n, intro && html.includes(intro), 'intro not verbatim');
  for (const m of src.matchAll(/<li>(.*?)<\/li>/g)) check(n, html.includes(m[1]), `feel line not verbatim: "${m[1]}"`);
  const focus = (src.match(/<b>Focus<\/b> &nbsp;(.*?)<\/div>/) || [])[1];
  check(n, focus && html.includes(focus), 'focus line not verbatim');
  check(n, count(html, new RegExp(esc('<!-- COPY: DRAFT — Claude finalizes -->'))) === 0, 'DRAFT copy marker still present — copy was finalized by Claude');
}

console.log(failures ? `${failures} failure(s)` : 'check-reset-day-pages: OK (day-2..5)');
process.exit(failures ? 1 : 0);
