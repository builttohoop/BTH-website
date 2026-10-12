// Tests for check-banned-words.mjs. Run: node --test .github/scripts/check-banned-words.test.mjs
//
// Written before the 2026-10-08 change, against the two gaps it closes:
//   1. user-visible attributes (alt, title, aria-label, placeholder, meta description/og/twitter
//      content, the value of an input button) were never scanned, because every tag was blanked;
//   2. the negation allowance reached across sentences and onto the neighbouring line, so
//      "No equipment. We fix your knee." passed.
// Every fixture is copy, never a real page, so a test can never go stale when the site changes.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { scanSource } from './check-banned-words.mjs';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'check-banned-words.mjs');

const html = (body) => scanSource(body, 'page.html');
const js = (body) => scanSource(body, 'gen.mjs');
const words = (hits) => hits.map((h) => h.word.toLowerCase());

// ---------------------------------------------------------------------------------------------
// 1. The old behaviour is the floor: everything it caught is still caught, and still enforced.
// ---------------------------------------------------------------------------------------------

test('control from ae1e9b9: a deliberate claim is caught three times and enforced', () => {
  const r = html('<p>Heal your knee overnight, guaranteed.</p>');
  assert.deepEqual(words(r.enforced), ['heal', 'overnight', 'guaranteed']);
  assert.equal(r.warn.length, 0);
});

test('control from ae1e9b9: the safety line wrapped across two source lines is allowed', () => {
  const r = html('<p><strong>Assessment and training, not diagnosis.</strong> Nothing here treats, cures or\n  diagnoses any condition.</p>');
  assert.equal(r.enforced.length + r.warn.length, 0);
});

test('identifiers are still not copy: class, id, href, data-*, inline style', () => {
  const r = html('<div class="fix-card" id="fix-grid" data-x="cure" style="position:fixed"><a href="/fix">Training</a></div>');
  assert.equal(r.enforced.length + r.warn.length, 0);
});

test('"shot" keeps its sense rule: the basketball noun passes, the ruin sense is caught', () => {
  assert.equal(html('<p>Your shot flattens out late in the run.</p>').enforced.length, 0);
  assert.deepEqual(words(html('<p>Your knee is shot.</p>').enforced), ['knee is shot']);
});

test('"shot" sense rule applies inside attributes too', () => {
  const r = html('<img src="a.jpg" alt="Your knee is shot">');
  assert.deepEqual(words(r.warn), ['knee is shot']);
  assert.equal(html('<img src="a.jpg" alt="Your shot after the reset">').warn.length, 0);
});

test('line numbers are right after multi-line tags and comments', () => {
  const src = '<!--\n a comment\n-->\n<div\n  class="x">\n<p>We fix it.</p>\n</div>';
  const r = html(src);
  assert.equal(r.enforced.length, 1);
  assert.equal(r.enforced[0].line, 6);
});

// ---------------------------------------------------------------------------------------------
// 2. Attributes a reader sees (or hears, through a screen reader) are copy.
// ---------------------------------------------------------------------------------------------

const ATTR_CASES = [
  ['alt', '<img src="k.jpg" alt="A hooper rehab session">', 'rehab'],
  ['title', '<a href="/x" title="Guaranteed results">Start</a>', 'guaranteed'],
  ['aria-label', '<button aria-label="Fix my knee">Go</button>', 'fix'],
  ['placeholder', '<input type="email" placeholder="Heal faster — enter email">', 'heal'],
  ['meta description', '<meta name="description" content="A 6-week reset that fixes the pain.">', 'fixes'],
  ['og:description', '<meta property="og:description" content="Proven training for hoopers">', 'proven'],
  ['og:title', '<meta property="og:title" content="Results overnight">', 'overnight'],
  ['twitter:title', '<meta name="twitter:title" content="Risk-free training">', 'risk-free'],
  ['twitter:description', '<meta name="twitter:description" content="You will jump higher">', 'you will'],
  ['input submit value', '<input type="submit" value="Cure my back">', 'cure'],
  ['input button value', '<input type="button" value="Never again sore">', 'never again'],
  ['data-working-label (rendered by bth-form.css)', '<button><span class="bth-btn-label" data-working-label="Fixing your plan">Send</span></button>', 'fixing'],
];

for (const [name, src, word] of ATTR_CASES) {
  test(`attribute is scanned: ${name}`, () => {
    const r = html(src);
    assert.deepEqual(words(r.warn), [word], `expected one WARN for "${word}"`);
    assert.equal(r.warn[0].cls, 'attribute');
    assert.equal(r.enforced.length, 0, 'a new class must not fail the build while main carries a backlog');
  });
}

test('attribute hit reports the right line and names the attribute', () => {
  const r = html('<head>\n<title>BTH</title>\n<meta name="description"\n  content="We fix knees.">\n</head>');
  assert.equal(r.warn.length, 1);
  assert.equal(r.warn[0].line, 4);
  assert.match(r.warn[0].where, /meta description/);
});

test('a denial inside the attribute itself is allowed', () => {
  const r = html('<img src="a.jpg" alt="Not a rehab program — basketball training">');
  assert.equal(r.warn.length, 0);
});

test('attribute values that are identifiers or URLs are not scanned', () => {
  const r = html([
    '<meta property="og:url" content="https://example.com/fix-your-knee">',
    '<meta property="og:image" content="https://example.com/heal.png">',
    '<meta name="keywords" content="rehab, cure">',
    '<input type="text" name="q" value="fix">',
    '<button type="submit" value="fix">Start</button>',
  ].join('\n'));
  assert.equal(r.enforced.length + r.warn.length, 0);
});

test('a negator in the surrounding text does not excuse an attribute, and vice versa', () => {
  assert.equal(html('<p>No gym needed. <img src="a.jpg" alt="Fix your knee"></p>').warn.length, 1);
  assert.equal(html('<p><img src="a.jpg" alt="No gym"> Heal faster.</p>').enforced.length, 1);
});

test('an attribute value on an inline tag does not split the sentence around it', () => {
  const r = html('<p>Nothing here <a href="/s" title="Safety">cures</a> anything.</p>');
  assert.equal(r.enforced.length + r.warn.length, 0);
});

test('a > inside an attribute value does not leak the rest of the tag into the copy', () => {
  const r = html('<a href="/x" data-note="a > b" onclick="fix()">Start</a>');
  assert.equal(r.enforced.length + r.warn.length, 0);
});

// ---------------------------------------------------------------------------------------------
// 3. Negation counts only inside the same sentence.
// ---------------------------------------------------------------------------------------------

test('negation in the PREVIOUS sentence no longer excuses the hit', () => {
  const r = html('<p>No pressure. We fix the base.</p>');
  assert.deepEqual(words(r.warn), ['fix']);
  assert.equal(r.warn[0].cls, 'sentence');
});

test('negation in the NEXT sentence no longer excuses the hit', () => {
  const r = html('<p>We fix the base. No gym needed.</p>');
  assert.deepEqual(words(r.warn), ['fix']);
});

test('negation in a neighbouring element no longer excuses the hit', () => {
  const r = html('<ul>\n  <li>No equipment</li>\n  <li>Fix your knee</li>\n</ul>');
  assert.deepEqual(words(r.warn), ['fix']);
});

test('a <br> ends the unit too', () => {
  assert.deepEqual(words(html('<h1>No gym needed<br>Fix your knee</h1>').warn), ['fix']);
});

test('negation inside the same sentence is still allowed, before or after the word', () => {
  assert.equal(html('<p>This is not rehab.</p>').enforced.length + html('<p>This is not rehab.</p>').warn.length, 0);
  const after = html('<p>Rehab is not what this is.</p>');
  assert.equal(after.enforced.length + after.warn.length, 0);
});

test('the window is never wider than the old 60 characters, even inside one sentence', () => {
  const far = '<p>No ' + 'x'.repeat(70) + ' fix.</p>';
  const r = html(far);
  assert.equal(r.enforced.length, 1, 'the old gate flagged this; it stays enforced');
});

test('"but" starts a new clause: the denial before it does not cover the claim after it', () => {
  assert.deepEqual(words(html('<p>Not a dunk program, but it will fix your knee.</p>').warn), ['fix']);
  assert.deepEqual(words(html('<p>This is nothing but rehab.</p>').warn), ['rehab']);
  assert.equal(html('<p>This is not rehab but training.</p>').warn.length, 0);
});

test('"but not" still denies the word that follows it', () => {
  const r = html('<p>Build the base, but not overnight.</p>');
  assert.equal(r.enforced.length + r.warn.length, 0);
});

test('a question answered with a denial is allowed (HTML FAQ, answer in the next element)', () => {
  const r = html('<h3 class="faq-q">Is this ankle rehab?</h3>\n      <p class="faq-a">No. BTH is basketball training.</p>');
  assert.equal(r.enforced.length + r.warn.length, 0);
});

test('a question answered with a denial is allowed (generator data)', () => {
  const r = js("      { q: 'Is this ankle rehab?', a: 'No. BTH is basketball training, not treatment or rehab.' },");
  assert.equal(r.enforced.length + r.warn.length, 0);
});

test('a question NOT answered with a denial is caught', () => {
  const r = html('<h3>Is this ankle rehab?</h3>\n<p>Yes, and it heals.</p>');
  assert.deepEqual(words(r.enforced).sort(), ['heals', 'rehab']);
});

test('generator data: adjacent strings are separate units', () => {
  const r = js("    bullets: ['No equipment needed', 'Fix your knee in five days'],");
  assert.deepEqual(words(r.warn), ['fix']);
});

test('generator data: code after a string is not part of its sentence', () => {
  const r = js("    const h1 = 'We fix knees'; const sub = no ? a : b;");
  assert.deepEqual(words(r.warn), ['fix']);
});

test('generator data: a denial inside the same string is allowed', () => {
  const r = js("    bullets: ['Honest training — no overnight promises', 'Free to start'],");
  assert.equal(r.enforced.length + r.warn.length, 0);
});

test('curly apostrophes in a denial count the same as straight ones', () => {
  const r = html('<p>This isn’t rehab.</p>');
  assert.equal(r.enforced.length + r.warn.length, 0);
});

test('"don\'t" and "do not" deny like "doesn\'t" and "does not"', () => {
  // The shape on seo/basketball-injury-prevention.html: the old window only passed it by reaching
  // a "Doesn't" on the next line.
  const r = html('<p><strong>Compression sleeves.</strong> Help with proprioception slightly. Don\'t fix structural problems.</p>');
  assert.equal(r.enforced.length + r.warn.length, 0);
  assert.equal(html('<p>Stretching alone do not cure it.</p>').warn.length, 0);
  assert.equal(html('<p>Don’t expect a cure.</p>').warn.length, 0);
});

// ---------------------------------------------------------------------------------------------
// 4. The CLI: warn-only for the new classes, --strict enforces them, exit codes hold.
// ---------------------------------------------------------------------------------------------

function cli(files, args = [], env = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'bw-'));
  try {
    for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body);
    try {
      const out = execFileSync(process.execPath, [SCRIPT, ...args, ...Object.keys(files)], {
        cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, BANNED_WORDS_STRICT: '', ...env },
      });
      return { code: 0, out };
    } catch (e) {
      return { code: e.status, out: `${e.stdout || ''}${e.stderr || ''}` };
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('CLI: a new-class hit prints WARN and exits 0', () => {
  const r = cli({ 'a.html': '<img src="k.jpg" alt="Fix your knee">' });
  assert.equal(r.code, 0);
  assert.match(r.out, /WARN/);
  assert.match(r.out, /a\.html:1/);
});

test('CLI: --strict turns the same hit into a failure', () => {
  assert.equal(cli({ 'a.html': '<img src="k.jpg" alt="Fix your knee">' }, ['--strict']).code, 1);
});

test('CLI: BANNED_WORDS_STRICT=1 is the same as --strict', () => {
  assert.equal(cli({ 'a.html': '<img src="k.jpg" alt="Fix your knee">' }, [], { BANNED_WORDS_STRICT: '1' }).code, 1);
});

test('CLI: an old-class hit still fails without --strict', () => {
  const r = cli({ 'a.html': '<p>Heal your knee.</p>' });
  assert.equal(r.code, 1);
  assert.match(r.out, /FAIL/);
});

test('CLI: clean file passes', () => {
  const r = cli({ 'a.html': '<p>Build toward a stronger base, over time.</p>' });
  assert.equal(r.code, 0);
  assert.match(r.out, /PASS/);
});

test('CLI: --json prints both lists', () => {
  const r = cli({ 'a.html': '<p>Heal it.</p><img src="k.jpg" alt="Fix it">' }, ['--json']);
  const j = JSON.parse(r.out.slice(r.out.indexOf('{')));
  assert.equal(j.enforced.length, 1);
  assert.equal(j.warn.length, 1);
});
