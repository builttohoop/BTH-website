# Built to Hoop — Website

Live site: **https://built-to-hoop.com**
Repo: `builttohoop/BTH-website` → GitHub Pages

Static HTML/CSS/JS. No build pipeline. Edit files, push to `main`, site updates in ~60 seconds.

---

## Site structure

```
/
├── index.html          Homepage — hero, start-here, tiers, add-ons, about preview
├── tier-1.html         BTH Foundation — $19 one-time
├── tier-2.html         BTH Rise — $57 launch price
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
│
├── email-sequences/    MailerLite automation copy (paste into dashboard)
│
├── AUDIT_REPORT.md     Site audit — bugs fixed + conversion recommendations
└── GTM-SETUP-GUIDE.md  Optional GTM tag configuration guide
```

---

## Tracking

Every page loads:
- **GTM** `GTM-T9SFFTB7` — container for future tags
- **GA4** `G-P72FN3GQ7G` — PageView automatic
- **Meta Pixel** `1728040128369123` — PageView automatic
- **TikTok Pixel** `D7RNU1RC77U2TFGF3SO0` — PageView automatic

`assets/bth-tracking.js` fires `ViewContent`, `Lead`, and `InitiateCheckout` to all three platforms.

---

## Gumroad products

| Slug | Product | Price |
|------|---------|-------|
| `ecyzaa` | BTH Foundation — Tier 1 | $19 |
| `groedz` | BTH Rise — Tier 2 | $57 |
| `thxqs` | BTH Stay Ready — Tier 3 | $27/mo |
| `dwcyc` | Hip Reset Track | $19 |
| `novpg` | Knee Protection Track | $19 |
| `mtqyvi` | Ankle Rebuild Track | $19 |
| `axona` | Skill Track | $19 |
| `xbxhqc` | Recovery Track | $19 |
| `esgvfq` | Add-On Bundle | $47 |

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
