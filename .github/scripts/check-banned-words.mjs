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
 *   node .github/scripts/check-banned-words.mjs            # the public surfaces
 *   node .github/scripts/check-banned-words.mjs a.html     # specific files
 *   node .github/scripts/check-banned-words.mjs --strict   # the WARN classes fail too
 *   node .github/scripts/check-banned-words.mjs --json     # machine-readable, both lists
 *
 * Exit 0 = no enforced hit (WARN lines may still print). Exit 1 = a banned word reached copy.
 * Tests: node --test .github/scripts/check-banned-words.test.mjs
 *
 * FOUR THINGS THAT MAKE THIS NON-TRIVIAL, all learned the hard way:
 *
 *  1. "shot" is sense-dependent. The banned sense is RUIN — "your knee is shot". The basketball
 *     noun — "your shot flattens out" — is core brand vocabulary and appears on reset.html today.
 *     A blanket ban fires forever on a basketball brand, so only the ruin sense is matched.
 *
 *  2. Markup is not copy. "position:fixed" is CSS, not a claim. <style> and <script> blocks,
 *     comments and every tag are blanked before scanning. A class of "fix-card", an id of
 *     "fix-grid" and an href are identifiers, not claims.
 *
 *  3. ...but some attributes ARE copy (added 2026-10-08). Blanking every tag also blanked the alt
 *     text, titles, aria-labels, placeholders, the meta description, the og/twitter card text and
 *     the label of an input button — and the gate passed main for weeks with "6-week reset that
 *     fixes the pain" in tier-1's meta description, the line Google shows under the link. Those
 *     values are now scanned, each one as its own unit of copy. Identifiers still are not.
 *
 *  4. A banned word inside an explicit denial is allowed, and is how the safety line is written:
 *     "Nothing here treats, cures or diagnoses any condition." The denial has to be in the SAME
 *     sentence (narrowed 2026-10-08): the old window reached into the previous sentence and onto
 *     the neighbouring line, so "No equipment. We fix your knee." passed. It also stops at a "but"
 *     ("Not a dunk program, but it will fix your knee") and never reaches past the old 60
 *     characters. One cross-sentence shape is kept on purpose — a question answered with a denial:
 *     "Is this ankle rehab?" / "No. BTH is basketball training".
 *
 * WARN-ONLY FOR THE NEW CLASSES. On 2026-10-08 main carried hits that only rules 3 and 4 find, and
 * the PR that added them fixes no copy. So a hit the gate failed before still fails, exactly as
 * before; a hit only the new rules find prints as WARN and exits 0. `--strict` (or
 * BANNED_WORDS_STRICT=1) fails on both. Flip CI to --strict once the WARN list is empty, then the
 * legacy* helpers below can go.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

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
const PATTERNS = [BANNED_RE, PHRASE_RE, SHOT_RE];

// A typographic apostrophe is the same denial: "isn’t rehab" is as safe as "isn't rehab". "don't"
// and "do not" sit beside "doesn't" and "does not": "Compression sleeves… Don't fix structural
// problems" (seo/basketball-injury-prevention.html) only passed before because the old window
// reached a "Doesn't" on the next line.
const NEGATORS = /\b(not|nothing|never|no|isn['’]t|doesn['’]t|don['’]t|won['’]t|does not|do not|is not)\b/i;
// The reach the gate has always had. The new rules only ever narrow it.
const WINDOW = 60;
// A clause that starts with one of these is not covered by a denial in the clause before it.
const CLAUSE_BREAK = /\b(but|however)\b/gi;
// After a question: an optional data key ("a: '") and then a denial opens the answer.
const DENIAL_ANSWER = /^[\s\u001E'"`’”,:;)\]}]*(?:[A-Za-z_$][\w$]{0,11}\s*:\s*[\s\u001E'"`]*)?(no|nope|not|never|nothing|none)\b/i;

// Marks the edge of a unit of copy (a block element, a string literal) in the scanned text. It is
// one character wide so every offset and line number still matches the source file.
const SEP = '\u001E';

// Public surfaces only. Generated output is checked via its generator too, which is where a
// reviewer can actually fix it.
const SCAN_DIRS = ['.', 'lp', 'seo', 'reset', 'email-sequences', 'reset-pdfs'];
const SCAN_EXT = new Set(['.html', '.mjs', '.js', '.json']);
const SKIP_DIRS = new Set(['node_modules', '.git', '.github', 'assets', 'output', 'html']);
const SKIP_FILES = new Set(['check-banned-words.mjs']);

// Tags that sit INSIDE a sentence. Every other tag ends the unit of copy, the way it ends a line
// on the rendered page — including <br>, an unknown tag, and anything not listed here.
const INLINE_TAGS = new Set([
  'a', 'abbr', 'b', 'bdi', 'bdo', 'cite', 'code', 'data', 'del', 'dfn', 'em', 'font', 'i', 'ins',
  'kbd', 'mark', 'q', 's', 'samp', 'small', 'span', 'strong', 'sub', 'sup', 'time', 'u', 'var', 'wbr',
]);

// Attributes a reader sees, or hears through a screen reader, on any element.
const COPY_ATTRS = new Set([
  'alt', 'title', 'placeholder',
  'aria-label', 'aria-description', 'aria-roledescription', 'aria-placeholder', 'aria-valuetext',
  // Rendered as the button text while a form submits: assets/bth-form.css, content: attr(data-working-label).
  'data-working-label',
]);
// <meta content> is copy only for these keys: the search snippet, the share card, the home-screen
// name. og:url, og:image, keywords and the rest are URLs or identifiers.
const META_COPY_KEYS = new Set([
  'description',
  'og:title', 'og:description', 'og:image:alt', 'og:site_name',
  'twitter:title', 'twitter:description', 'twitter:image:alt',
  'application-name', 'apple-mobile-web-app-title',
]);
// value is the visible label only on an input drawn as a button. <button value> is never shown —
// a <button>'s label is its text, which is already scanned.
const BUTTON_INPUT_TYPES = new Set(['submit', 'button', 'reset']);
const LABEL_ATTR_TAGS = new Set(['option', 'optgroup', 'track']);

const TAG_RE = /<(\/?)([A-Za-z][A-Za-z0-9:-]*)((?:\s+[^\s"'<>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*\/?>/g;
const ATTR_RE = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/dg;

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

const blank = (m) => m.replace(/[^\n]/g, ' ');

/** Blank code that is never copy: style and script blocks, comments. Offsets are preserved. */
function stripCode(src, isHtml) {
  let s = src
    .replace(/<style[\s\S]*?<\/style>/gi, blank)
    .replace(/<script[\s\S]*?<\/script>/gi, blank)
    .replace(/<!--[\s\S]*?-->/g, blank);
  if (!isHtml) s = s.replace(/^\s*(\/\/|\*|\/\*).*$/gm, blank); // JS line/block comments
  return s;
}

/** The attributes of one tag that are copy, with each value's absolute offset in the file. */
function copyAttributes(tag, attrSrc, base) {
  const parsed = [];
  ATTR_RE.lastIndex = 0;
  let a;
  while ((a = ATTR_RE.exec(attrSrc)) !== null) {
    const g = a[2] !== undefined ? 2 : a[3] !== undefined ? 3 : a[4] !== undefined ? 4 : 0;
    parsed.push({
      name: a[1].toLowerCase(),
      value: g ? a[g] : '',
      start: g ? base + a.indices[g][0] : -1,
    });
  }
  const valueOf = (n) => (parsed.find((p) => p.name === n) || { value: '' }).value.trim().toLowerCase();
  const out = [];
  for (const p of parsed) {
    if (p.start < 0 || !p.value.trim()) continue;
    let where = null;
    if (COPY_ATTRS.has(p.name)) {
      where = p.name;
    } else if (p.name === 'content' && tag === 'meta') {
      const key = valueOf('name') || valueOf('property');
      if (META_COPY_KEYS.has(key)) where = `meta ${key}`;
    } else if (p.name === 'value' && tag === 'input' && BUTTON_INPUT_TYPES.has(valueOf('type'))) {
      where = `input[type=${valueOf('type')}] value`;
    } else if (p.name === 'label' && LABEL_ATTR_TAGS.has(tag)) {
      where = `${tag} label`;
    }
    if (where) out.push({ where, start: p.start, value: p.value });
  }
  return out;
}

/**
 * Split a file into what a reader sees.
 *   text  — the file with every non-copy character blanked and every unit edge marked with SEP,
 *           offset-for-offset with the source, so line numbers stay exact.
 *   attrs — attribute values that are copy, each scanned on its own (an alt text is not part of
 *           the sentence around the image).
 */
export function copyOnly(src, isHtml) {
  const stripped = stripCode(src, isHtml);
  if (!isHtml) {
    // Generator data. A string literal's edges end a unit — ['No equipment', 'Fix your knee'] is
    // two pieces of copy — and so does a block-level tag inside a template literal.
    const text = stripped
      .replace(/(['"`])(?=\s*[,:;\]})+])/g, SEP)
      .replace(/(?<=[[{(,:;=+]\s*)(['"`])/g, SEP)
      .replace(/<(\/?)([A-Za-z][A-Za-z0-9-]*)/g, (all, _sl, name) =>
        (INLINE_TAGS.has(name.toLowerCase()) ? all : SEP + all.slice(1)));
    return { text, attrs: [] };
  }
  const chars = stripped.split('');
  const attrs = [];
  TAG_RE.lastIndex = 0;
  let m;
  while ((m = TAG_RE.exec(stripped)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    for (let k = start; k < end; k++) if (chars[k] !== '\n') chars[k] = ' ';
    const tag = m[2].toLowerCase();
    if (!INLINE_TAGS.has(tag)) chars[start] = SEP;
    if (!m[1]) attrs.push(...copyAttributes(tag, m[3], start + 1 + m[2].length));
  }
  // Anything tag-shaped the parser above did not take (a doctype, a malformed tag) is blanked the
  // way the gate always did it.
  const text = chars.join('').replace(/<[^>]*>/g, (t) => SEP + blank(t.slice(1)));
  return { text, attrs };
}

function lineStarts(text) {
  const starts = [0];
  for (let k = 0; k < text.length; k++) if (text[k] === '\n') starts.push(k + 1);
  return starts;
}

function lineIndex(starts, offset) {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= offset) lo = mid; else hi = mid - 1;
  }
  return lo;
}

/** . ! or ? ends a sentence only when a space, an edge, a quote, a bracket or the end follows. */
function endsSentence(text, k) {
  const c = text[k];
  if (c !== '.' && c !== '!' && c !== '?') return false;
  const next = text[k + 1];
  return next === undefined || /[\s\u001E'"`’”)\]]/.test(next);
}

/**
 * Is the hit at [start, end) inside a denial? Only text in the same sentence counts, cut at a
 * "but", within WINDOW characters, and never outside [lo, hi) — the lines the old gate could see.
 * The one cross-sentence exception: the hit is in a question and the answer opens with a denial.
 */
export function negatedInSentence(text, start, end, lo = 0, hi = text.length) {
  let left = start;
  while (left > lo && text[left - 1] !== SEP && !endsSentence(text, left - 1)) left--;
  let right = end;
  let question = false;
  while (right < hi && text[right] !== SEP) {
    if (endsSentence(text, right)) { question = text[right] === '?'; right++; break; }
    right++;
  }
  let before = text.slice(Math.max(left, start - WINDOW), start);
  let after = text.slice(end, Math.min(right, end + WINDOW));
  let cut = -1;
  for (const c of before.matchAll(CLAUSE_BREAK)) cut = c.index + c[0].length;
  if (cut >= 0) before = before.slice(cut);
  const brk = after.search(/\b(but|however)\b/i);
  if (brk >= 0) after = after.slice(0, brk);
  if (NEGATORS.test(before) || NEGATORS.test(after)) return true;
  return question && DENIAL_ANSWER.test(text.slice(right, Math.min(hi, end + WINDOW)));
}

// ---- The gate as it stood before 2026-10-08. Kept ONLY to decide which hits were already ----
// ---- failures, so the warn-only window is exact. Delete once CI runs --strict.           ----

const LEGACY_NEGATORS = /\b(not|nothing|never|no|isn't|doesn't|won't|does not|is not)\b/i;

function legacyCopyOnly(src, isHtml) {
  const s = stripCode(src, isHtml);
  return isHtml ? s.replace(/<[^>]*>/g, blank) : s;
}

function legacyNegated(lines, i, index, word) {
  const line = lines[i];
  const before = line.slice(Math.max(0, index - WINDOW), index);
  const after = line.slice(index + word.length, index + word.length + WINDOW);
  const prev = (lines[i - 1] || '').slice(-WINDOW);
  const next = (lines[i + 1] || '').slice(0, WINDOW);
  return LEGACY_NEGATORS.test(before) || LEGACY_NEGATORS.test(after)
      || LEGACY_NEGATORS.test(prev) || LEGACY_NEGATORS.test(next);
}

// ---------------------------------------------------------------------------------------------

const snippet = (s, at = 0) => {
  const flat = s.replace(/[\u001E\s]+/g, ' ').trim();
  if (flat.length <= 120) return flat;
  const from = Math.max(0, Math.min(at - 50, flat.length - 120));
  return `${from > 0 ? '…' : ''}${flat.slice(from, from + 120)}…`;
};

/**
 * Scan one file's source. Returns { enforced, warn }:
 *   enforced — hits the gate already failed on before 2026-10-08 (class "legacy");
 *   warn     — hits only the new rules find: "attribute" (rule 3) and "sentence" (rule 4).
 */
export function scanSource(raw, file = 'page.html') {
  const isHtml = /\.html?$/i.test(file);
  const { text, attrs } = copyOnly(raw, isHtml);
  const starts = lineStarts(text);
  const legacyLines = legacyCopyOnly(raw, isHtml).split(/\r?\n/);
  const enforced = [];
  const warn = [];

  for (const re of PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      const start = m.index;
      const end = start + m[0].length;
      const i = lineIndex(starts, start);
      const lo = starts[Math.max(0, i - 1)];
      const hiLine = i + 2 < starts.length ? starts[i + 2] - 1 : text.length;
      if (negatedInSentence(text, start, end, lo, hiLine)) continue;
      const col = start - starts[i];
      const lineEnd = i + 1 < starts.length ? starts[i + 1] - 1 : text.length;
      const hit = {
        file, line: i + 1, col, word: m[0],
        text: snippet(text.slice(starts[i], lineEnd), col),
      };
      const old = legacyLines[i] || '';
      const oldSaw = old.slice(col, col + m[0].length).toLowerCase() === m[0].toLowerCase();
      if (oldSaw && !legacyNegated(legacyLines, i, col, m[0])) {
        enforced.push({ ...hit, cls: 'legacy' });
      } else {
        warn.push({
          ...hit, cls: 'sentence',
          where: oldSaw ? 'denial is outside this sentence' : 'text the old scan did not reach',
        });
      }
    }
  }

  for (const a of attrs) {
    for (const re of PATTERNS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(a.value)) !== null) {
        if (negatedInSentence(a.value, m.index, m.index + m[0].length)) continue;
        const i = lineIndex(starts, a.start + m.index);
        warn.push({
          file, line: i + 1, col: a.start + m.index - starts[i], word: m[0],
          cls: 'attribute', where: a.where, text: snippet(a.value, m.index),
        });
      }
    }
  }

  const order = (x, y) => x.line - y.line || x.col - y.col;
  return { enforced: enforced.sort(order), warn: warn.sort(order) };
}

/** Scan a list of absolute paths. */
export function scanFiles(fileList) {
  const enforced = [];
  const warn = [];
  for (const file of fileList) {
    let raw;
    try { raw = readFileSync(file, 'utf8'); } catch { continue; }
    const r = scanSource(raw, relative(ROOT, file).replace(/\\/g, '/'));
    enforced.push(...r.enforced);
    warn.push(...r.warn);
  }
  return { enforced, warn };
}

const ghEscape = (s) => String(s).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');

function main(argv) {
  const strict = argv.includes('--strict') || /^(1|true|yes)$/i.test(process.env.BANNED_WORDS_STRICT || '');
  const asJson = argv.includes('--json');

  /**
   * Scope. Introducing a lint to a codebase that already violates it has to be done without either
   * (a) failing every PR forever or (b) hiding the backlog. So:
   *
   *   --changed <baseRef>  enforce on the files THIS PR touches, and REPORT the sitewide count.
   *   (no flag)            audit everything — used locally and by whoever works the backlog down.
   *
   * A file you touch must come out clean. A file you did not touch is counted, named and left.
   */
  const changedIdx = argv.indexOf('--changed');
  const baseRef = changedIdx !== -1 ? argv[changedIdx + 1] : null;
  // NB: only skip the value after --changed when --changed is actually present. Using
  // `i !== changedIdx + 1` unguarded drops argv[0] when changedIdx is -1, which silently turned
  // `check-banned-words.mjs routine.html` into a full-site scan.
  const explicit = argv.filter((a, i) =>
    !a.startsWith('--') && !(changedIdx !== -1 && i === changedIdx + 1));

  let files;
  let scopeNote = '';
  const notes = [];
  if (explicit.length) {
    files = explicit.map((f) => join(ROOT, f));
  } else if (baseRef) {
    const diff = (spec) => execFileSync('git', ['diff', '--name-only', '--diff-filter=ACMR', ...spec], { encoding: 'utf8' })
      .split('\n').map((l) => l.trim()).filter(Boolean);

    let changed = null;
    // Three-dot is what we want — only what this branch added. But CI checkouts are shallow and
    // `A...B` needs a merge base, which a shallow clone may not have ("fatal: no merge base").
    // Two-dot needs no merge base; it can over-include commits that landed on the base since
    // branching, which for a lint is safe: it never under-reports.
    for (const spec of [[`${baseRef}...HEAD`], [baseRef, 'HEAD']]) {
      try { changed = diff(spec); break; } catch { /* try the next form */ }
    }
    if (changed === null) {
      console.error(`banned-words: could not diff against ${baseRef} (tried three-dot and two-dot).`);
      console.error('  In CI, fetch the base branch with enough history — `git fetch --unshallow` or fetch-depth: 0.');
      process.exit(1);
    }
    const all = listFiles().map((f) => relative(ROOT, f).replace(/\\/g, '/'));
    const allow = new Set(all);
    files = changed.filter((f) => allow.has(f)).map((f) => join(ROOT, f));
    scopeNote = ` (changed vs ${baseRef})`;

    // Always report the sitewide backlog so it cannot quietly grow.
    const site = scanFiles(listFiles());
    if (site.enforced.length > 0) {
      notes.push(`banned-words: NOTE — ${site.enforced.length} pre-existing enforced hit(s) remain sitewide.`);
    }
    if (site.warn.length > 0) {
      notes.push(`banned-words: NOTE — ${site.warn.length} WARN-class hit(s) remain sitewide (attribute text, same-sentence negation).`);
    }
    if (notes.length) {
      notes.push('  Run `node .github/scripts/check-banned-words.mjs` for the full list. These numbers should only go down.');
    }
  } else {
    files = listFiles();
  }

  const { enforced, warn } = scanFiles(files);
  const failing = strict ? [...enforced, ...warn] : enforced;

  if (asJson) {
    console.log(JSON.stringify({ scanned: files.length, scope: scopeNote.trim() || 'all', strict, enforced, warn }, null, 2));
    process.exit(failing.length ? 1 : 0);
  }

  for (const n of notes) console.log(n);

  const where = (h) => (h.cls === 'legacy' ? '' : `  [${h.cls}: ${h.where}]`);
  const print = (log, h) => {
    log(`  ${h.file}:${h.line}  "${h.word}"${where(h)}`);
    log(`    ${h.text}\n`);
  };

  if (!strict && warn.length) {
    console.log(`banned-words: WARN — ${warn.length} hit(s) only the 2026-10-08 rules find${scopeNote}.`);
    console.log('  Not enforced yet: main carries hits in these classes and the copy fix is its own PR.');
    console.log('  `--strict` (or BANNED_WORDS_STRICT=1) makes them fail.\n');
    for (const h of warn) print(console.log, h);
    if (process.env.GITHUB_ACTIONS === 'true') {
      for (const h of warn) {
        console.log(`::warning file=${h.file},line=${h.line},title=Banned word (${h.cls})::${ghEscape(`"${h.word}" — ${h.where}: ${h.text}`)}`);
      }
    }
  }

  if (failing.length === 0) {
    console.log(`banned-words: PASS — ${files.length} file(s) scanned${scopeNote}, 0 enforced hits${warn.length && !strict ? `, ${warn.length} WARN` : ''}.`);
    process.exit(0);
  }

  console.error(`banned-words: FAIL — ${failing.length} hit(s)${scopeNote}${strict ? ' (strict)' : ''}.\n`);
  for (const h of failing) print(console.error, h);
  console.error('These words are banned by FOUNDER-STORY.md section 4 because they make a claim BTH');
  console.error('cannot stand behind. Use instead: build toward, work toward, help you, over time,');
  console.error('once it holds, most. For "fix", BTH\'s own wording is "work ... loose".');
  console.error('\nIf a hit is inside an explicit denial ("nothing here cures"), it is allowed — the');
  console.error('denial has to sit in the same sentence as the word, before any "but".');
  process.exit(1);
}

const invokedDirectly = (() => {
  try {
    const a = resolve(process.argv[1] || '');
    const b = fileURLToPath(import.meta.url);
    return process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b;
  } catch { return false; }
})();

if (invokedDirectly) main(process.argv.slice(2));
