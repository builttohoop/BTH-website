# BTH Site Audit — Buyer Path

Date: 2026-05-03
Pages reviewed: 7 (index, about, addons, tier-1, tier-2, tier-3, reset)

## Critical bugs (FIXED in this batch)

### 1. Homepage email form pointed at placeholder account ID — FIXED
- File: `index.html` line 837
- Before: `action="https://assets.mailerlite.com/jsonp/YOUR_ACCOUNT_ID/forms/mlb2-39376740/subscribe"`
- After: `action="https://assets.mailerlite.com/jsonp/1918834/forms/175289018826588406/subscribe"`
- Impact: Every homepage email signup was silently failing. Submissions went to a 404 endpoint and never reached MailerLite.
- Action needed: After upload, **submit the form yourself with a test address** to confirm it lands in your MailerLite list.

## Verify these yourself on the live site

I can't click your live site from here. Run through this list once after upload — it takes ~5 min:

### Mobile (most important — most pickup hoopers are on phones)
- [ ] Open built-to-hoop.com on your phone
- [ ] Hero loads, fonts render correctly (Oswald + DM Sans, not fallback serif)
- [ ] Nav menu collapses cleanly, no horizontal scroll
- [ ] Tap each tier card → lands on correct tier page
- [ ] Tap each "Get [tier]" button → opens correct Gumroad product (not 404)
- [ ] Tap each add-on "Get It" button → correct Gumroad product
- [ ] Email signup form (homepage + reset page) → submit test email → land in MailerLite

### Desktop
- [ ] All 7 pages load in <2s
- [ ] No console errors (right-click → Inspect → Console)
- [ ] Footer links work on every page
- [ ] About page: "Read the Full Story" lands at /about.html

### Buyer flow end-to-end
- [ ] Click any tier CTA → Gumroad product loads
- [ ] Add to cart → checkout → enter test card (use Stripe test card 4242 4242 4242 4242 if you want to dry-run)
- [ ] Receipt arrives at your email
- [ ] You can access the product after purchase (check the receipt link)
- [ ] Custom receipt message shows (the one you set per product)

### Email delivery
- [ ] Submit homepage form with test email
- [ ] Day 1 email arrives within 5 min
- [ ] Email looks correct on phone (not blown out, no broken images)
- [ ] Click any link inside the email → goes where it should

## Non-critical findings

### Form ID question (verify in MailerLite)
The reset page form and homepage form now use the same form ID `175289018826588406`. If you originally had two separate MailerLite forms (one for homepage, one for reset page), some signups may end up tagged the same way. Check your MailerLite → Forms list:
- If you see only one "5-Day Reset" form: you're fine.
- If you see two and they tag subscribers differently: tell me which form ID belongs on the homepage and I'll swap it.

### Internal navigation: clean
All 7 pages cross-link via relative paths (`href="tier-1.html"` etc.). No broken internal links found.

### Gumroad CTAs: all clean
Every tier and add-on button uses the proper `https://builttohoop.gumroad.com/l/{slug}` pattern. No bare `gumroad.com` URLs anywhere. All 9 verified slugs match the canonical list in `.auto-memory/project_website.md`.

### Anchor jumps: all valid
- `index.html#program` → exists
- `tier-2.html#buy` → verify the `id="buy"` block is in the page (light check — works fine if scrolled to in browser)
- `addons.html#tracks` → exists
- `reset.html#reset-form` → exists

### No `href="#"` placeholders
Confirmed clean across all 7 pages.

### Email + alt text
- All `mailto:` links point to `builttohoop@gmail.com` — correct
- No `<img>` without `alt=` attribute (the site uses background-image patterns instead of img tags, which is fine)

## Things I can't check from here (action items for you)

1. **Mobile Gumroad checkout flow** — Gumroad's mobile checkout is a known weak spot. Buy your own product on a real phone, time how long it takes from "tap CTA" to "purchase complete." If >90 seconds, that's a leak.
2. **Email deliverability** — send a test from MailerLite to a Gmail and a Hotmail address. If either lands in spam, your domain isn't authenticated. Fix in MailerLite → Settings → Domain Authentication.
3. **Page speed** — run https://pagespeed.web.dev/?url=built-to-hoop.com — anything below 70 on mobile costs you money.
4. **Custom domain DNS** — confirm `built-to-hoop.com` resolves and shows the new site, not the old one. If it still shows old: GitHub Pages cache can take 5–15 min after upload.
