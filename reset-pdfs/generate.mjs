import puppeteer from 'puppeteer';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'output');
mkdirSync(OUT, { recursive: true });

// ─── BRAND TOKENS ───
// Source: BTH/design-system/bth-system.css — the single source of truth.
// PDF constraints require inline CSS; this object mirrors bth-system.css tokens.
// Any palette change updates bth-system.css first, then propagates here.
//
//   bth-system.css token      → C value
//   --bth-black  #111318      → C.black  (text, headers, card borders)
//   --bth-white  #FFFFFF      → C.white  (card backgrounds, section fill)
//   --bth-cream  #F3EFE7      → C.cream  (intro block background)
//   --bth-gold   #E6A800      → C.gold   (hero band, accents, CTAs)
//   --bth-muted  rgba(17,19,24,0.52)  → C.muted  (secondary text)
//   --bth-border rgba(17,19,24,0.12)  → C.border (hairlines)
//   --r-square   2px          → border-radius:2px on all cards/blocks
//   --font-display Oswald     → 'Oswald', sans-serif (headings, labels)
//   --font-body   DM Sans     → 'DM Sans', sans-serif (body text, cues)
//   --shadow-none             → no box-shadow used; depth via borders only
const C = {
  black: '#111318',
  white: '#FFFFFF',
  cream: '#F3EFE7',
  gold:  '#E6A800',
  muted: 'rgba(17,19,24,0.52)',
  border:'rgba(17,19,24,0.12)',
};

// ─── DAY DATA ───
// CANONICAL SOURCE: the real "_v2" Free 5-Day Reset PDFs in Ty's Drive
// (folder 1zPk3z3erNdwCSv7qCTQkQMb3xGw4IFwV, set dated 2026-05-31).
// The earlier delivered version drifted (Days 3/4/5 had the wrong titles and
// moves). This restores the real program — titles, blocks, exercises, cues.
import { days } from './reset-content.mjs';

// ─── HTML TEMPLATE ───
function buildHTML(day) {
  let exNum = 0;
  const blocks = day.blocks.map((block) => {
    const exercises = block.exercises.map((ex) => {
      exNum += 1;
      return `
      <div class="exercise">
        <div class="ex-header">
          <span class="ex-num">${String(exNum).padStart(2, '0')}</span>
          <div>
            <div class="ex-name">${ex.name}</div>
            <div class="ex-sets">${ex.sets}</div>
          </div>
        </div>
        <p class="ex-cue">${ex.cue}</p>
      </div>`;
    }).join('');
    return `
    <div class="block">
      <div class="block-label"><span>${block.label}</span><em>${block.sub}</em></div>
      ${exercises}
    </div>`;
  }).join('');

  const feel = day.feel.map((f) => `<li>${f}</li>`).join('');
  const tomorrow = day.tomorrow
    ? `<div class="foot-day">Tomorrow — ${day.tomorrow}</div>`
    : `<div class="foot-day">Five days done. Go unleash your game.</div>`;

  // Stay Ready CTA (BTH-GOAL-0052 D3): Days 1–4 get a compact footer line; Day 5 gets the
  // dedicated full close band instead — distinct and larger by design, never footer-sized.
  const isDay5 = !day.tomorrow;
  const footCta = isDay5 ? '' : `
  <div class="foot-cta">Keep it going after the Reset — <b>BTH Stay Ready</b> · <b>$27/mo</b> · <a href="https://built-to-hoop.com/join.html">built-to-hoop.com/join.html</a></div>`;
  const closeBand = !isDay5 ? '' : `
<!-- STAY READY — THE CLOSE -->
<div class="close-band">
  <div class="close-kicker">The Reset was the start</div>
  <div class="close-title">Stay Ready year-round</div>
  <p class="close-body">Five days fixed the stiffness. <b>BTH Stay Ready</b> is the system that keeps it fixed — the full month-by-month training system plus all 5 add-on tracks, built for hoopers who still play for real. A new block every month. Cancel anytime.</p>
  <div class="close-offer">BTH Stay Ready — <b>$27/mo</b></div>
  <div class="close-url"><a href="https://built-to-hoop.com/join.html">Join at built-to-hoop.com/join.html</a></div>
</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BTH Reset · Day ${day.num} · ${day.title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 8.5in; background: ${C.white}; }
body {
  font-family: 'DM Sans', sans-serif;
  color: ${C.black};
  font-size: 10.5pt;
  line-height: 1.5;
  padding: 0;
}

/* ─── TOP BAR ─── */
.top-bar {
  background: ${C.black};
  padding: 16px 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.logo {
  font-family: 'Oswald', sans-serif;
  font-size: 16pt;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${C.white};
}
.logo span { color: ${C.gold}; }
.top-label {
  font-family: 'DM Sans', sans-serif;
  font-size: 8pt;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.5);
}

/* ─── HERO BAND ─── */
.hero-band {
  background: ${C.gold};
  padding: 24px 40px 22px;
  position: relative;
  overflow: hidden;
}
.hero-band::after {
  content: '${day.num}';
  position: absolute;
  right: -8px;
  top: 50%;
  transform: translateY(-50%);
  font-family: 'Oswald', sans-serif;
  font-size: 120pt;
  font-weight: 700;
  color: rgba(17,19,24,0.08);
  line-height: 1;
  letter-spacing: -0.02em;
  pointer-events: none;
}
.day-label {
  font-family: 'DM Sans', sans-serif;
  font-size: 8pt;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: rgba(17,19,24,0.6);
  margin-bottom: 6px;
}
.day-title {
  font-family: 'Oswald', sans-serif;
  font-size: 34pt;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: ${C.black};
  line-height: 0.95;
  margin-bottom: 8px;
}
.day-tagline {
  font-size: 10.5pt;
  font-weight: 500;
  color: rgba(17,19,24,0.65);
}
.day-meta {
  position: relative;
  z-index: 2;
  margin-top: 12px;
  display: flex;
  gap: 22px;
}
.day-meta div { font-size: 8pt; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(17,19,24,0.7); }
.day-meta b { display: block; font-family: 'Oswald', sans-serif; font-size: 12pt; letter-spacing: 0.04em; color: ${C.black}; margin-top: 2px; }

/* ─── MAIN CONTENT ─── */
.content { padding: 22px 40px 0; }

/* ─── INTRO ─── */
.intro-block {
  background: ${C.cream};
  border-left: 3px solid ${C.gold};
  padding: 13px 18px;
  margin-bottom: 20px;
  border-radius: 0 2px 2px 0;
}
.intro-text { font-size: 9.5pt; color: rgba(17,19,24,0.78); line-height: 1.6; }

/* ─── BLOCK ─── */
.block { margin-bottom: 18px; break-inside: avoid; }
.block-label {
  font-family: 'DM Sans', sans-serif;
  font-size: 8pt;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: ${C.gold};
  margin-bottom: 10px;
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.block-label em { font-style: normal; font-weight: 600; letter-spacing: 0.04em; color: rgba(17,19,24,0.4); text-transform: none; font-size: 8.5pt; }

/* ─── EXERCISE CARD ─── */
.exercise {
  background: ${C.white};
  border: 1px solid ${C.border};
  border-radius: 2px;
  padding: 13px 18px;
  margin-bottom: 8px;
  border-left: 3px solid ${C.black};
  break-inside: avoid;
}
.ex-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 6px; }
.ex-num {
  font-family: 'Oswald', sans-serif;
  font-size: 17pt;
  font-weight: 700;
  color: ${C.gold};
  line-height: 1;
  flex-shrink: 0;
  width: 30px;
}
.ex-name {
  font-family: 'Oswald', sans-serif;
  font-size: 12.5pt;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: ${C.black};
  line-height: 1.1;
}
.ex-sets { font-size: 8.5pt; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: ${C.gold}; margin-top: 3px; }
.ex-cue { font-size: 9pt; color: rgba(17,19,24,0.7); line-height: 1.55; padding-left: 44px; }

/* ─── FEEL / FOCUS ─── */
.feel-band { margin: 20px 0 0; padding: 16px 18px; background: ${C.black}; border-radius: 2px; break-inside: avoid; }
.feel-title { font-family: 'Oswald', sans-serif; font-size: 9pt; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: ${C.gold}; margin-bottom: 8px; }
.feel-list { list-style: none; display: flex; flex-wrap: wrap; gap: 6px 22px; margin-bottom: 12px; }
.feel-list li { font-size: 9pt; color: rgba(255,255,255,0.82); position: relative; padding-left: 16px; }
.feel-list li::before { content: '↑'; position: absolute; left: 0; color: ${C.gold}; font-weight: 700; }
.focus-line { font-size: 9pt; color: rgba(255,255,255,0.7); line-height: 1.55; border-top: 1px solid rgba(255,255,255,0.12); padding-top: 10px; }
.focus-line b { color: ${C.gold}; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; font-size: 8pt; }

/* ─── FOOTER ─── */
.foot {
  padding: 18px 40px 18px;
  margin-top: 18px;
  border-top: 1px solid ${C.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 6px;
}
.foot-logo { font-family: 'Oswald', sans-serif; font-size: 10pt; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(17,19,24,0.3); }
.foot-logo span { color: ${C.gold}; }
.foot-url { font-size: 8pt; color: rgba(17,19,24,0.3); letter-spacing: 0.04em; }
.foot-day { font-family: 'Oswald', sans-serif; font-size: 9pt; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(17,19,24,0.35); }
.foot-cta {
  width: 100%;
  border-top: 1px solid ${C.border};
  padding-top: 9px;
  font-size: 8.5pt;
  letter-spacing: 0.04em;
  color: rgba(17,19,24,0.55);
}
.foot-cta b { color: ${C.black}; font-weight: 700; }
.foot-cta a { color: ${C.black}; font-weight: 700; text-decoration: none; }

/* ─── DAY 5 CLOSE BAND ─── */
.close-band {
  background: ${C.gold};
  padding: 26px 40px 24px;
  margin-top: 20px;
  break-inside: avoid;
}
.close-kicker {
  font-family: 'DM Sans', sans-serif;
  font-size: 8pt; font-weight: 700;
  letter-spacing: 0.2em; text-transform: uppercase;
  color: rgba(17,19,24,0.55);
  margin-bottom: 6px;
}
.close-title {
  font-family: 'Oswald', sans-serif;
  font-size: 22pt; font-weight: 700;
  letter-spacing: 0.02em; text-transform: uppercase;
  color: ${C.black}; line-height: 1;
  margin-bottom: 10px;
}
.close-body { font-size: 9.5pt; color: rgba(17,19,24,0.78); line-height: 1.6; max-width: 6in; margin-bottom: 12px; }
.close-body b { color: ${C.black}; }
.close-offer {
  font-family: 'Oswald', sans-serif;
  font-size: 13pt; font-weight: 700;
  letter-spacing: 0.04em; text-transform: uppercase;
  color: ${C.black}; margin-bottom: 4px;
}
.close-url { font-size: 9.5pt; font-weight: 700; color: ${C.black}; letter-spacing: 0.04em; }
.close-url a { color: ${C.black}; text-decoration: none; }
</style>
</head>
<body>

<!-- TOP BAR -->
<div class="top-bar">
  <div class="logo">Built to <span>Hoop</span></div>
  <div class="top-label">Free 5-Day Reset</div>
</div>

<!-- HERO BAND -->
<div class="hero-band">
  <div class="day-label">Day ${day.num} of 05</div>
  <div class="day-title">${day.title}</div>
  <div class="day-tagline">${day.tagline}</div>
  <div class="day-meta">
    <div>Goal<b>${day.goal}</b></div>
    <div>Time<b>${day.time}</b></div>
  </div>
</div>

<!-- CONTENT -->
<div class="content">

  <!-- INTRO -->
  <div class="intro-block">
    <p class="intro-text">${day.intro}</p>
  </div>

  <!-- BLOCKS -->
  ${blocks}

  <!-- FEEL / FOCUS -->
  <div class="feel-band">
    <div class="feel-title">What you should feel</div>
    <ul class="feel-list">${feel}</ul>
    <div class="focus-line"><b>Focus</b> &nbsp;${day.focus}</div>
  </div>

</div>

${closeBand}

<!-- FOOTER -->
<div class="foot">
  <div class="foot-logo">Built to <span>Hoop</span></div>
  ${tomorrow}
  <div class="foot-url">built-to-hoop.com</div>${footCta}
</div>

</body>
</html>`;
}

// ─── PDF DETERMINISM ───
// Chromium stamps every PDF with run-varying metadata (/CreationDate, /ModDate, trailer /ID).
// Pin them to constants of IDENTICAL byte length (xref offsets must not move) so `node
// generate.mjs` is byte-for-byte reproducible — regen-vs-committed diffs then prove no hand-edits.
function normalizePdf(buf) {
  let s = buf.toString('latin1');
  s = s.replace(/\/(CreationDate|ModDate)\s*\(([^)]*)\)/g, (m, key, val) =>
    `/${key} (${val.replace(/\d/g, '0')})`);
  s = s.replace(/\/ID\s*\[\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*\]/g, (m, a, b) =>
    `/ID [<${'0'.repeat(a.length)}><${'0'.repeat(b.length)}>]`);
  return Buffer.from(s, 'latin1');
}

// ─── GENERATE PDFs ───
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

for (const day of days) {
  const html = buildHTML(day);
  const htmlPath = join(OUT, `day-${day.num}.html`);
  const pdfPath  = join(OUT, `BTH-Reset-Day-${day.num}-${day.title.replace(/\s+/g, '-')}.pdf`);

  writeFileSync(htmlPath, html, 'utf8');

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfBuf = await page.pdf({
    format: 'Letter',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });
  writeFileSync(pdfPath, normalizePdf(Buffer.from(pdfBuf)));

  await page.close();
  console.log(`✓  Day ${day.num} — ${day.title} → ${pdfPath}`);
}

await browser.close();
console.log('\nAll 5 PDFs generated in reset-pdfs/output/');
