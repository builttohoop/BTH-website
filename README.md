# BTH Website — Upload to GitHub

These 7 HTML files are the **final, locked version** of the BuiltToHoop website.
Upload them to your repo at: **https://github.com/builttohoop/BTH-website**

Goal: Replace the current site files on the `main` branch with this folder's contents.

---

## Step 1 — Upload the 7 new files

1. Open: **https://github.com/builttohoop/BTH-website/upload/main**
2. Drag **all 7 files from this folder** (`index.html`, `about.html`, `addons.html`, `tier-1.html`, `tier-2.html`, `tier-3.html`, `reset.html`) into the upload area.
3. At the bottom, set the commit message to:

   ```
   Launch full website: 7 pages, all tiers live, addons wired
   ```

4. Make sure **"Commit directly to the main branch"** is selected.
5. Click **Commit changes**.

This will overwrite `index.html` and `about.html` and add the 5 new pages. **GitHub will prompt you on duplicates — confirm "Replace".**

---

## Step 2 — Delete the 6 obsolete files

Go to: **https://github.com/builttohoop/BTH-website**

Open each of these files one at a time, click the **trash icon** in the top right, and commit the deletion:

- `contact.html`
- `faq.html`
- `free-reset.html`
- `programs.html`
- `script.js`
- `styles.css`

Use commit message: `Remove obsolete pages and unused assets`

---

## Step 3 — DO NOT TOUCH

- **`CNAME`** — This is the custom domain config (`built-to-hoop.com`). Leave it alone. It must stay in the repo or the custom domain breaks.

---

## Step 4 — Verify the live site (after ~1–2 min)

Visit **https://built-to-hoop.com** (or the GitHub Pages URL) and check:

- [ ] Homepage loads with cream/white/gold/black palette, Oswald + DM Sans fonts
- [ ] Tier 1, Tier 2, Tier 3 cards all show **"Available Now"**
- [ ] Every Gumroad button lands on a real product page (not 404)
- [ ] About page loads
- [ ] Reset page loads
- [ ] Addons page lists all 5 add-ons with working "Get It Now" links
- [ ] No `href="#"` placeholders anywhere
- [ ] No bare `gumroad.com` URLs (every link includes a `/l/{slug}`)

---

## Files in this folder

| File | Size | Purpose |
|------|------|---------|
| `index.html` | 43.8 KB | Homepage — hero, 3-tier offer ladder, addons, about preview |
| `about.html` | 22.0 KB | Founder story + methodology |
| `tier-1.html` | 21.3 KB | Tier 1 product page (lowest tier) |
| `tier-2.html` | 23.2 KB | Tier 2 product page (mid tier) |
| `tier-3.html` | 24.8 KB | Tier 3 product page (top tier) |
| `addons.html` | 28.5 KB | 5 add-on products with Gumroad CTAs |
| `reset.html` | 21.7 KB | Free Reset opt-in / lead magnet page |

---

## What's already correct in these files (do not edit)

- All 9 Gumroad slugs are verified and live (full slug list is in `/sessions/.auto-memory/project_website.md`)
- Tier 2 and Tier 3 cards say **"Available Now"** (not "Coming Soon")
- All 5 add-ons have correct Gumroad product URLs
- No leftover `href="#"` placeholders
- No bare `gumroad.com` URLs (every link is `https://builttohoop.gumroad.com/l/{slug}`)
- Design system locked: Oswald (display), DM Sans (body), cream `#F4ECD8`, white, gold `#D4A24E`, black

---

## If something looks wrong after deploying

The local source of truth is `/sessions/vigilant-amazing-pasteur/mnt/Bth/pending-launch/website/`. Re-copy from there if needed. **Don't edit files inside this `upload-to-github/` folder** — it's a staging copy for upload only.
