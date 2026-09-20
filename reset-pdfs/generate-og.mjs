/**
 * BTH social share cards (og:image) — 1200x630 PNGs.
 *
 * Why this lives in reset-pdfs/: puppeteer is already a dependency here and nowhere else in the
 * website repo, and the site has no build step. Same pattern as generate.mjs — a small node
 * generator that produces a committed asset, so the image is reproducible instead of a mystery
 * binary someone dropped in assets/.
 *
 * Before this ran, NO page on built-to-hoop.com had an og:image at all — every link pasted into a
 * text or a DM rendered as a bare card. Add a CARDS entry per page that needs one.
 *
 *   cd reset-pdfs && node generate-og.mjs
 *
 * Colours are the design-system tokens (assets/bth-system.css), hard-coded here because a headless
 * render cannot resolve the stylesheet's custom properties from a data: URL.
 */

import puppeteer from 'puppeteer';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS = resolve(__dirname, '..', 'assets');

const BLACK = '#111318';
const GOLD = '#E6A800';
const CREAM = '#F3EFE7';

const CARDS = [
  {
    out: 'og-routine.png',
    eyebrow: 'Built to Hoop — Personalized Routine',
    headline: 'Nobody is watching<br>you move.',
    sub: 'Run a five-minute check. Get a night routine built off what your body actually does.',
  },
];

function html({ eyebrow, headline, sub }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1200px;height:630px}
  body{background:${BLACK};color:#fff;font-family:'DM Sans',sans-serif;
       display:flex;flex-direction:column;justify-content:space-between;
       padding:64px 72px;position:relative;overflow:hidden}
  .stripe{position:absolute;top:0;left:0;right:0;height:10px;background:${GOLD}}
  .eyebrow{font-family:'Oswald',sans-serif;font-size:21px;font-weight:600;letter-spacing:.2em;
           text-transform:uppercase;color:${GOLD}}
  h1{font-family:'Oswald',sans-serif;font-size:92px;font-weight:700;line-height:1.02;
     letter-spacing:.01em;text-transform:uppercase;max-width:1000px}
  .sub{font-size:30px;line-height:1.4;color:rgba(243,239,231,.72);max-width:900px;margin-top:22px}
  .foot{display:flex;align-items:center;justify-content:space-between}
  .wordmark{font-family:'Oswald',sans-serif;font-size:26px;font-weight:700;letter-spacing:.14em;
            text-transform:uppercase}
  .wordmark span{color:${GOLD}}
  .url{font-family:'Oswald',sans-serif;font-size:20px;font-weight:500;letter-spacing:.1em;
       text-transform:uppercase;color:rgba(243,239,231,.45)}
</style></head><body>
  <div class="stripe"></div>
  <div class="eyebrow">${eyebrow}</div>
  <div>
    <h1>${headline}</h1>
    <div class="sub">${sub}</div>
  </div>
  <div class="foot">
    <div class="wordmark">Built to <span>Hoop</span></div>
    <div class="url">built-to-hoop.com</div>
  </div>
</body></html>`;
}

const browser = await puppeteer.launch({ headless: 'new' });
try {
  mkdirSync(ASSETS, { recursive: true });
  for (const card of CARDS) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
    await page.setContent(html(card), { waitUntil: 'networkidle0' });
    // Webfonts must be resolved before the shot or the card renders in a fallback serif.
    await page.evaluate(() => document.fonts.ready);
    const buf = await page.screenshot({ type: 'png' });
    const dest = resolve(ASSETS, card.out);
    writeFileSync(dest, buf);
    console.log(`wrote ${dest} (${buf.length} bytes, 1200x630)`);
    await page.close();
  }
} finally {
  await browser.close();
}
