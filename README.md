# Built to Hoop — Website

Live site: **https://built-to-hoop.com**
Repo: `builttohoop/BTH-website` → GitHub Pages

Static HTML/CSS/JS. No build pipeline. Edit files, push to `main`, site updates in ~60 seconds.

> ⚠️ **Business facts below (tier prices, the Gumroad products table, MailerLite IDs) may be stale.**
> Pricing/offer changes and the **GUMROAD-OFF cutover** (owned Mail OS licensing + Stripe replacing
> Gumroad) are in flight. **Source of truth for the offer = Motherboard `data/command-center/products.json`
> (membership = BTH Stay Ready $27/mo).** Treat the tables here as a rough map, not the live truth.
> (Price columns reconciled to `products.json` on 2026-07-25; the Gumroad slugs are the OLD keys still
> used by `assets/bth-tracking.js` PRODUCT_MAP, not the current clean Gumroad slugs.)
>
> **Business/strategy/ads docs that used to sit in this repo root were relocated to the BTH tree on
> 2026-07-05** — `03-strategy/marketing-ops/`, `04-content/copy/`, `08-handoffs-and-prompts/`. See
> `BTH/MIGRATION-LOG.md`.

---

## Site structure

```
/
├── index.html          Homepage — hero, start-here, tiers, add-ons, about preview
├── tier-1.html         BTH Foundation — $31.99 one-time
├── tier-2.html         BTH Rise — $97 launch price
├── tier-3.html         BTH Stay Ready — $27/mo membership
├── addons.html         5 targeted add-on tracks
├── about.html          Founder story + methodology
├── reset.html          Free 5-Day Reset opt-in (MailerLite lead magnet)
├── bounce.html         Lost Your Bounce landing page
├── knee.html           Knee pain landing page
├── mobility.html       Hip mobility landing page
│
├── assets/
│   ├── bth-tracking.js     Unified conversion tracking (GA4 + Meta + TikTok)
│   ├── favicon.svg / .ico / .png   Favicons
│   └── apple-touch-icon.png
│
├── seo/                10 SEO content pages targeting specific search queries
├── privacy/  updates/  Privacy page · announcements registry (updates.json)
│
├── email-sequences/    Free-reset funnel email generator + generated HTML
└── reset-pdfs/         Free 5-Day Reset PDFs + Puppeteer generator (node_modules gitignored)
```

---

## Tracking

Every page loads:
- **GTM** `GTM-T9SFFTB7` — container for future tags
- **GA4** `G-YBE7PRPCLK` — PageView automatic
- **Meta Pixel** `1320146003572375` — PageView automatic
- **TikTok Pixel** `D7RNU1RC77U2TFGF3SO0` — PageView automatic

`assets/bth-tracking.js` fires `ViewContent`, `Lead`, and `InitiateCheckout` to all three platforms.

---

## Gumroad products

| Slug | Product | Price |
|------|---------|-------|
| `ecyzaa` | BTH Foundation — Tier 1 | $31.99 |
| `groedz` | BTH Rise — Tier 2 | $97 |
| `thxqs` | BTH Stay Ready — Tier 3 | $27/mo |
| `dwcyc` | Hip Reset Track | $41.99 |
| `novpg` | Knee Protection Track | $41.99 |
| `mtqyvi` | Ankle Rebuild Track | $41.99 |
| `axona` | Skill Track | $41.99 |
| `xbxhqc` | Recovery Track | $41.99 |
| `esgvfq` | Injury Bundle | $79.99 |

---

## MailerLite

- Account ID: `1918834`
- Form ID: `175289018826588406`
- Groups: Built To Hoop · Free Reset Subscribers · Buyers (`186510231292871802`)

---

## Domain

`built-to-hoop.com` → CNAME → GitHub Pages. Do not delete the `CNAME` file or the custom domain breaks.

---

## To deploy changes

```bash
git add -A
git commit -m "your message"
git push origin main
```

Site goes live in ~60 seconds. No build step.




