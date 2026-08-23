// Generates the on-site Free Reset day pages (Days 2-5) - BTH-GOAL-0055.
//
// Run:  node reset-pdfs/generate-day-pages.mjs      (from the repo root)
// Out:  reset-day-2.html ... reset-day-5.html
//
// WHY THESE PAGES EXIST
// Until now the ONLY thing behind a days 2-5 email click was a PDF download, and days 2/3/4
// have never been clicked - not once (0 of 24, 0 of 24, 0 of 25 sends, measured 2026-08-22),
// while Day 3 is the most-opened email in the whole funnel at 46%. People read and do not
// move. These pages give the click somewhere to land where the person behind BTH is actually
// present, and give the already-shipped `reset_day_viewed` beacon something real to measure
// (it fired twice in the 30 days before this).
//
// TWO SOURCES, NO THIRD COPY
//   - the movements come from reset-content.mjs, the SAME array that builds the PDFs, so a
//     page and its PDF can never drift;
//   - the shell (tracking, nav, styles) is read out of thank-you.html at build time, so these
//     pages always look like Day 1 without duplicating 260 lines of CSS. thank-you.html is
//     READ, never written: Day 1 is a running experiment and stays untouched.
//
// Flat filenames at the repo root, not a reset/ subdirectory: every page on this site
// references assets as "assets/...", and a subdirectory would silently break all of them.

import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { days } from './reset-content.mjs';
import { proof } from './day-page-proof.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const shellSrc = readFileSync(join(root, 'thank-you.html'), 'utf8');

function region(label, startMark, endMark) {
  const a = shellSrc.indexOf(startMark);
  const b = shellSrc.indexOf(endMark, a === -1 ? 0 : a + startMark.length);
  if (a === -1 || b === -1) {
    throw new Error('generate-day-pages: could not find the ' + label + ' region in ' +
      'thank-you.html. The shell moved; fix the anchors rather than shipping pages that ' +
      'do not match Day 1.');
  }
  return shellSrc.slice(a, b + endMark.length);
}

const TRACKING = region('tracking', '<!-- ─── BTH TRACKING ─── -->', '<!-- ─── /BTH TRACKING ─── -->');
const STYLES = region('style', '  <style>', '  </style>');
const NAV = region('nav', '<!-- NAV -->', '<!-- HERO -->').replace('<!-- HERO -->', '').trimEnd();

const esc = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const PROOF_CSS = [
  '',
  '  /* --- FOUNDER PROOF (BTH-GOAL-0055) --- */',
  '  .proof { margin: 0 0 38px; padding: 0; }',
  '  .proof-img {',
  '    display: block; width: 100%; height: auto; max-width: 420px; aspect-ratio: 1 / 1;',
  '    object-fit: cover; border-radius: 3px; background: var(--black);',
  '  }',
  '  .proof-quote {',
  '    margin: 20px 0 0; padding: 0 0 0 18px;',
  '    border-left: 2px solid var(--gold);',
  '    font-family: var(--B); font-size: 16px; line-height: 1.62; color: var(--black);',
  '  }',
  '  .proof-quote q { quotes: none; }',
  '  .proof-line { margin: 12px 0 0; padding: 0 0 0 18px; font-size: 16px; line-height: 1.62; }',
  '  .proof-attr {',
  '    margin: 14px 0 0; padding: 0 0 0 18px;',
  '    font-family: var(--H); font-size: 11px; font-weight: 700;',
  '    letter-spacing: 0.14em; text-transform: uppercase; color: rgba(0,0,0,0.5);',
  '  }',
  '  .day-nav { margin: 34px 0 0; font-size: 14px; }',
  '  .day-nav a { color: var(--black); font-weight: 600; }',
  '  @media (max-width: 768px) { .proof-img { max-width: 100%; } }',
  ''
].join('\n');

function pdfName(day) {
  return 'BTH-Reset-Day-' + day.num + '-' + day.title.replace(/ /g, '-') + '.pdf';
}

function buildBlocks(day) {
  return day.blocks.map((block) => {
    const exercises = block.exercises.map((ex) =>
      '\n        <div class="exercise">' +
      '\n          <div class="ex-top"><span class="ex-name">' + esc(ex.name) + '</span>' +
      '<span class="ex-sets">' + esc(ex.sets) + '</span></div>' +
      '\n          <div class="ex-cue">' + esc(ex.cue) + '</div>' +
      '\n        </div>').join('');
    return '\n      <div class="day1-block">' +
      '\n        <div class="day1-block-label">' + esc(block.label) +
      ' <span>— ' + esc(block.sub.toLowerCase()) + '</span></div>' +
      exercises +
      '\n      </div>';
  }).join('');
}

function titleMarkup(title) {
  const words = title.split(' ');
  const last = words.pop();
  const head = words.join(' ');
  return (head ? esc(head) + '<br>' : '') + '<span class="gold">' + esc(last) + '</span>';
}

function buildPage(day) {
  const n = Number(day.num);
  const p = proof[day.num];
  if (!p) throw new Error('generate-day-pages: no proof entry for day ' + day.num);
  const next = days.find((d) => Number(d.num) === n + 1);

  const nextLine = next
    ? 'Next up: <a href="reset-day-' + (n + 1) + '.html">Day ' + (n + 1) + ' — ' + esc(next.title) + '</a>'
    : 'That is all five days. <a href="join.html">See what comes after the Reset</a>.';

  return [
    '<!DOCTYPE html>',
    '<html lang="en" style="color-scheme: light;">',
    '<head>',
    '  <link rel="icon" type="image/svg+xml" href="assets/favicon.svg">',
    '  <link rel="icon" type="image/png" sizes="32x32" href="assets/favicon-32.png">',
    '  <link rel="icon" type="image/png" sizes="16x16" href="assets/favicon-16.png">',
    '  <link rel="apple-touch-icon" sizes="180x180" href="assets/apple-touch-icon.png">',
    '  <link rel="shortcut icon" href="assets/favicon.ico">',
    '',
    '  <meta name="facebook-domain-verification" content="8j7jq4cgnwak31awpllczhuyqbxpq8" />',
    TRACKING,
    '  <script src="assets/bth-click-id.js" defer></script>',
    '  <script src="assets/bth-tracking.js" defer></script>',
    '',
    '  <!-- BTH-GOAL-0054 beacon, BTH-GOAL-0055 surface: this page IS Day ' + n + '. Unguarded',
    '       by design, exactly like Day 1 on thank-you.html - a lead re-reading a day is a real',
    '       view, and the worker dedupes per identity per day. -->',
    '  <script src="assets/bth-events.js" defer></script>',
    '  <script>',
    '  window.addEventListener("DOMContentLoaded", function () {',
    '    try { if (window.BTHEvents) window.BTHEvents.track("reset_day_viewed", { day: ' + n + ' }); } catch (e) {}',
    '  });',
    '  </script>',
    '',
    '  <meta charset="UTF-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '  <meta name="color-scheme" content="light">',
    '  <title>Day ' + n + ' — ' + esc(day.title) + ' | Built to Hoop</title>',
    '  <meta name="description" content="' + esc(day.tagline) + ' Day ' + n + ' of the Free 5-Day Reset.">',
    '  <meta name="robots" content="noindex, nofollow">',
    '  <meta property="og:title" content="Day ' + n + ' — ' + esc(day.title) + ' | Built to Hoop">',
    '  <meta property="og:description" content="' + esc(day.tagline) + '">',
    '  <meta property="og:image" content="https://built-to-hoop.com/assets/photos/bth-og-default.jpg">',
    '  <meta property="og:type" content="article">',
    '  <link rel="preconnect" href="https://fonts.googleapis.com">',
    '  <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">',
    '  <link rel="stylesheet" href="assets/bth-system.css">',
    STYLES.replace('  </style>', PROOF_CSS + '  </style>'),
    '</head>',
    '<body>',
    '<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-T9SFFTB7" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>',
    '',
    NAV,
    '',
    '<section class="hero">',
    '  <div class="hero-inner">',
    '',
    '    <div class="confirm-badge">',
    '      <div class="confirm-badge-dot"></div>',
    '      <span class="confirm-badge-text">Day ' + n + ' of 5</span>',
    '    </div>',
    '',
    '    <h1 class="hero-title">',
    '      ' + titleMarkup(day.title),
    '    </h1>',
    '',
    '    <p class="hero-sub">' + esc(day.tagline) + '</p>',
    '',
    '    <figure class="proof">',
    '      <img class="proof-img" src="assets/photos/' + p.photo + '" alt="' + esc(p.alt) + '" width="1200" height="1200" loading="lazy">',
    '      <blockquote class="proof-quote"><q>' + esc(p.quote) + '</q></blockquote>',
    '      <p class="proof-line">' + esc(p.line) + '</p>',
    '      <p class="proof-attr">Ty · Founder, Built to Hoop</p>',
    '    </figure>',
    '',
    '    <div class="day1">',
    '      <div class="day1-kicker">Day ' + n + ' — ' + esc(day.title) + '</div>',
    '      <div class="day1-meta">' + esc(day.goal.charAt(0) + day.goal.slice(1).toLowerCase()) +
      ' &nbsp;·&nbsp; ' + esc(day.time.toLowerCase()) + ' &nbsp;·&nbsp; ' + esc(day.tagline) + '</div>',
    '      <p class="day1-intro">' + esc(day.intro) + '</p>',
    buildBlocks(day),
    '',
    '      <div class="day1-foot">',
    '        <p><strong>How it should feel:</strong> ' + esc(day.feel.join(', ').toLowerCase()) + '.</p>',
    '        <p><strong>The one rule:</strong> ' + esc(day.focus) + '</p>',
    (day.tomorrow ? '        <p><strong>Tomorrow:</strong> ' + esc(day.tomorrow) + '</p>' : ''),
    '      </div>',
    '    </div>',
    '',
    '    <p class="email-note">',
    '      <strong>Want it on your phone?</strong>',
    '      <a href="reset-pdfs/output/' + pdfName(day) + '">Download the Day ' + n + ' PDF</a> —',
    '      same session, printable, works offline.',
    '    </p>',
    '',
    '    <p class="day-nav">' + nextLine + '</p>',
    '',
    '  </div>',
    '</section>',
    '',
    '</body>',
    '</html>',
    ''
  ].filter((line) => line !== '').join('\n');
}

let written = 0;
for (const day of days) {
  const n = Number(day.num);
  if (n < 2) continue; // Day 1 lives on thank-you.html and is a running experiment - untouched.
  writeFileSync(join(root, 'reset-day-' + n + '.html'), buildPage(day));
  console.log('wrote reset-day-' + n + '.html  (' + day.title + ')');
  written += 1;
}
console.log('generate-day-pages: ' + written + ' pages written');
