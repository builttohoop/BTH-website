#!/usr/bin/env node
/**
 * BANNED-WORD GATE — FOUNDER-STORY.md section 4, enforced.
 *
 * Why this exists: the list was prose-only, and on 2026-09-20 a sweep found six live breaches on
 * the site — including the H1 of the top-of-funnel page, which read "5 Days. 5 Fixes.", and three
 * FAQ answers opening with "You will". Prose does not stop a word coming back. This does.
 *
 * Same shape as the homepage no-price regression check: one assertion, run on every PR.
 *
 *   node .github/scripts/check-banned-words.mjs          # the public surfaces
 *   node .github/scripts/check-banned-words.mjs a.html   # specific files
 *
 * Exit 0 = clean. Exit 1 = a banned word reached copy.
 *
 * TWO THINGS THAT MAKE THIS NON-TRIVIAL, both learned the hard way:
 *
 *  1. "shot" is sense-dependent. The banned sense is RUIN — "your knee is shot". The basketball
 *     noun — "your shot flattens out" — is core brand vocabulary and appears on reset.html today.
 *     A blanket ban fires forever on a basketball brand, so only the ruin sense is matched.
 *
 *  2. Markup is not copy. "position:fixed" is CSS, not a claim. <style> and <script> blocks AND
 *     inline style="" attributes are blanked before scanning — a first pass missed the inline
 *     attributes and produced a false positive on tier-3.html.
 *
 * A banned word inside an explicit negation is allowed and is how the safety line is written:
 * "Nothing here treats, cures or diagnoses any condition." Negation is detected in a small window
 * before the hit.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const ROOT = process.cwd();

// FOUNDER-STORY section 4. "shot" is handled separately, by sense.
const BANNED = [
  'cure', 'cures', 'cured',
  'heal', 'heals', 'healed', 'healing',
  'fix', 'fixes', 'fixed', 'fixing',
  'rehab',
  'guarantee', 'guaranteed', 'guarantees',
  'proven',
  'overnight',
  'risk-free',
  'damaged',
];
const BANNED_RE = new RegExp(`\\b(${BANNED.join('|')})\\b`, 'gi');
const PHRASE_RE = /\b(you will|never again)\b/gi;
// Only the ruin sense of "shot".
const SHOT_RE = /\b(knee|knees|back|hip|hips|ankle|ankles|leg|legs|body|arm|arms|shoulder|shoulders)\s+(is|are|'s|s)\s+shot\b/gi;

const NEGATORS = /\b(not|nothing|never|no|isn't|doesn't|won't|does not|is not)\b/i;

// Public surfaces only. Generated output is checked via its generator too, which is where a
// reviewer can actually fix it.
const SCAN_DIRS = ['.', 'lp', 'seo', 'reset', 'email-sequences', 'reset-pdfs'];
const SCAN_EXT = new Set(['.html', '.mjs', '.js', '.json']);
const SKIP_DIRS = new Set(['node_modules', '.git', '.github', 'assets', 'output', 'html']);
const SKIP_FILES = new Set(['check-banned-words.mjs']);

function listFiles() {
  const out = [];
  for (const d of SCAN_DIRS) {
    const dir = join(ROOT, d);
    let entries;
    try { entries = readdirSync(dir); } catch { continue; }
    for (const e of entries) {
      if (SKIP_DIRS.has(e) || SKIP_FILES.has(e)) continue;
      const full = join(dir, e);
      let st;
      try { st = statSync(full); } catch { continue; }
      if (!st.isFile()) continue;
      if (!SCAN_EXT.has(extname(e))) continue;
      out.push(full);
    }
  }
  return out;
}

/**
 * Blank out everything that is markup or code rather than copy, preserving line numbers.
 *
 * For HTML this strips ALL tags, which also removes attribute values. A class of "fix-card",
 * an id of "fix-grid" and an href are identifiers, not claims. A first version stripped only
 * <style> blocks and reported 100 hits, roughly 90 of which were CSS class names.
 */
function copyOnly(src, isHtml) {
  const blank = (m) => m.replace(/[^\n]/g, ' ');
  let s = src
    .replace(/<style[\s\S]*?<\/style>/gi, blank)
    .replace(/<script[\s\S]*?<\/script>/gi, blank)
    .replace(/<!--[\s\S]*?-->/g, blank);
  if (isHtml) {
    s = s.replace(/<[^>]*>/g, blank);            // every tag, attributes included
  } else {
    s = s.replace(/^\s*(\/\/|\*|\/\*).*$/gm, blank); // JS line/block comments
  }
  return s;
}

function negated(line, index) {
  return NEGATORS.test(line.slice(Math.max(0, index - 60), index));
}

/** Scan a list of absolute paths and return every hit. */
function scan(fileList) {
  const found = [];
  for (const file of fileList) {
    let raw;
    try { raw = readFileSync(file, 'utf8'); } catch { continue; }
    const lines = copyOnly(raw, /\.html$/i.test(file)).split(/\r?\n/);
    lines.forEach((line, i) => {
      for (const re of [BANNED_RE, PHRASE_RE, SHOT_RE]) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(line)) !== null) {
          if (negated(line, m.index)) continue;
          found.push({
            file: relative(ROOT, file).replace(/\\/g, '/'),
            line: i + 1,
            word: m[0],
            text: line.trim().slice(0, 120),
          });
        }
      }
    });
  }
  return found;
}

const countHits = (fileList) => scan(fileList).length;

/**
 * Scope. Introducing a lint to a codebase that already violates it has to be done without either
 * (a) failing every PR forever or (b) hiding the backlog. So:
 *
 *   --changed <baseRef>  enforce on the files THIS PR touches, and REPORT the sitewide count.
 *   (no flag)            audit everything — used locally and by whoever works the backlog down.
 *
 * A file you touch must come out clean. A file you did not touch is counted, named and left.
 */
const argv = process.argv.slice(2);
const changedIdx = argv.indexOf('--changed');
const baseRef = changedIdx !== -1 ? argv[changedIdx + 1] : null;
const explicit = argv.filter((a, i) => a !== '--changed' && i !== changedIdx + 1 && !a.startsWith('--'));

let files;
let scopeNote = '';
if (explicit.length) {
  files = explicit.map((f) => join(ROOT, f));
} else if (baseRef) {
  const { execFileSync } = await import('node:child_process');
  let changed = [];
  try {
    changed = execFileSync('git', ['diff', '--name-only', '--diff-filter=ACMR', `${baseRef}...HEAD`], { encoding: 'utf8' })
      .split('\n').map((l) => l.trim()).filter(Boolean);
  } catch (e) {
    console.error(`banned-words: could not diff against ${baseRef} — ${e.message}`);
    process.exit(1);
  }
  const all = listFiles().map((f) => relative(ROOT, f).replace(/\\/g, '/'));
  const allow = new Set(all);
  files = changed.filter((f) => allow.has(f)).map((f) => join(ROOT, f));
  scopeNote = ` (changed vs ${baseRef})`;

  // Always report the sitewide backlog so it cannot quietly grow.
  const backlog = countHits(listFiles());
  if (backlog > 0) {
    console.log(`banned-words: NOTE — ${backlog} pre-existing hit(s) remain on untouched pages.`);
    console.log('  Run `node .github/scripts/check-banned-words.mjs` for the full list. This number should only go down.');
  }
} else {
  files = listFiles();
}

const hits = scan(files);

if (hits.length === 0) {
  console.log(`banned-words: PASS — ${files.length} file(s) scanned${scopeNote}, 0 hits.`);
  process.exit(0);
}

console.error(`banned-words: FAIL — ${hits.length} hit(s)${scopeNote}.\n`);
for (const h of hits) {
  console.error(`  ${h.file}:${h.line}  "${h.word}"`);
  console.error(`    ${h.text}\n`);
}
console.error('These words are banned by FOUNDER-STORY.md section 4 because they make a claim BTH');
console.error('cannot stand behind. Use instead: build toward, work toward, help you, over time,');
console.error('once it holds, most. For "fix", BTH\'s own wording is "work ... loose".');
console.error('\nIf a hit is inside an explicit negation ("nothing here cures"), it is allowed —');
console.error('widen the negation window rather than deleting the safety line.');
process.exit(1);
