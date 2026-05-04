# TikTok Pixel — Final Setup Checklist

Everything code-side is done. This file documents the TikTok-side steps and the verification process. Work through it once you have the Pixel ID.

---

## Step 1 — Get the Pixel ID

1. Go to **TikTok Ads Manager** → top-left menu → **Assets** → **Events**.
2. If no pixel exists yet: **Web Events** → **Set Up Web Events** → choose **TikTok Pixel** → **Manually Set Up Pixel Code**.
3. Name it `BTH Main Pixel`. Connect to: `built-to-hoop.com`.
4. **Event Setup Method:** choose **Developer Mode** (we'll send events from `bth-tracking.js`).
5. **Cookie consent:** set to "Manage by yourself" (we're not running a CMP).
6. Save → copy the **Pixel ID** (looks like `C9ABCD123EFGH456IJKL`).

---

## Step 2 — Paste the ID and Push

Run from the `/Bth/` directory:

```bash
python3 swap_tracking.py --tiktok=CYOUR_REAL_ID_HERE
```

Then commit and push the `upload-to-github/` folder to GitHub. The pixel goes live as soon as Pages redeploys.

---

## Step 3 — Configure Standard Events Inside TikTok

The site already fires these events (via `assets/bth-tracking.js`), but TikTok needs to know about each one inside Events Manager:

| Event sent | Maps to TikTok event | Where it fires |
|---|---|---|
| `PageView` | `Pageview` | Every page load (base pixel) |
| `ViewContent` | `ViewContent` | Tier/Addon/Knee/Mobility/Bounce page loads |
| `InitiateCheckout` | `InitiateCheckout` | Click on any Gumroad CTA |
| `Lead` | `SubmitForm` | MailerLite email form submit |
| `Purchase` | `CompletePayment` | Server-side via Gumroad webhook (later) |

In TikTok Events Manager:

1. Open the BTH pixel → **Web Events** tab.
2. Click **Manage Events** → confirm each of the above is in the list. If TikTok hasn't auto-detected them yet, that's fine — they'll appear after the first time real traffic fires them.
3. For each event, set the **Statistical Type** so TikTok knows how to optimize:
   - `ViewContent` → Optimization Event: ON
   - `InitiateCheckout` → Optimization Event: ON, Value: dynamic (passed in event)
   - `Lead` → Optimization Event: ON
   - `CompletePayment` → Optimization Event: ON, Value: dynamic

---

## Step 4 — Verify Events Are Firing

Two ways:

### A. TikTok Pixel Helper (Chrome extension)

1. Install [TikTok Pixel Helper](https://chrome.google.com/webstore/detail/tiktok-pixel-helper) from Chrome Web Store.
2. Visit `built-to-hoop.com`. Helper icon should turn red and show **1 pixel** + **Pageview** event.
3. Visit `/tier-1`. Helper should now show **Pageview + ViewContent**.
4. Click a Tier 1 buy button (don't complete the purchase). Helper should show **InitiateCheckout** event with `value: 19, currency: USD`.
5. Submit the homepage email form with a test email. Helper should show **SubmitForm** event.

### B. TikTok Test Events Tool (server-side)

1. In Events Manager → BTH pixel → **Test Events** tab.
2. Enter `https://built-to-hoop.com` → **Open Website**.
3. Repeat the above interactions in the popup. Each event should appear in the Test Events feed within 5 seconds.

If an event doesn't fire: open browser DevTools → Console → look for `ttq` errors. Most common cause is content-blocker extensions — verify in Incognito with extensions disabled.

---

## Step 5 — Build the TikTok Audiences

Once events have been firing for ~24 hours and you have at least 100 events recorded:

1. **Audience 1 (All Visitors)** — Audiences → Create → Website Traffic → "All visitors" → 180 days.
2. **Audience 2 (Tier Page Visitors)** — Website Traffic → URL contains `tier-1`, `tier-2`, `tier-3`, `addons` → 30 days.
3. **Audience 3 (Checkout)** — Engagement → Pixel Event = `InitiateCheckout` → 14 days. Exclude `CompletePayment` last 60 days.
4. **Audience 6 (Engagers)** — Engagement → Followers + Profile Visits + Video Viewers → 180 days.
5. **Audience 7 (Video 50%+)** — Engagement → Video Viewers (50% completion) → 180 days.

Detailed setup notes for each in `retargeting-audiences.md`.

---

## Step 6 — Connect TikTok Events API (Server-Side, Optional but Strong)

Browser pixels lose ~20–30% of events to ad blockers and iOS privacy. The Events API (server-to-server) recovers them. Set this up after the basic flow is working:

1. Events Manager → BTH pixel → **Settings** → **Events API**.
2. Generate **Access Token** → save it (treat like a password).
3. Easiest path: use **Zapier** or **Make.com** with these flows:
   - Gumroad: New Sale → TikTok Events API: Send `CompletePayment` event with the buyer's email + value.
   - MailerLite: New Subscriber → TikTok Events API: Send `SubmitForm` event with their email.
4. Verify in **Test Events** that server events appear and dedupe correctly with browser events (same `event_id` will collapse them — `bth-tracking.js` doesn't yet send an `event_id`; add this when wiring up the API).

**Why bother:** the `CompletePayment` event is what trains TikTok's algorithm to find more buyers. Without it, ad spend optimizes for clicks instead of revenue.

---

## Status — What's Done vs. What's On You

| Step | Status | Owner |
|---|---|---|
| Base pixel snippet in `<head>` | ✅ Done | — |
| `bth-tracking.js` event firing | ✅ Done | — |
| Script linked on all 20 pages | ✅ Done | — |
| Pixel ID swapped in (`D7RNU1RC77U2TFGF3SO0`) | ✅ Done | — |
| Push to GitHub | ⏳ Pending | Ty (drag updated files) |
| Events configured in TikTok manager | ⏳ After deploy | Ty (5 min) |
| Audiences built | ⏳ After 24h of events | Ty |
| Events API server-side (token saved locally) | ⏳ Future | Ty (Zapier setup) |

**Pixel ID in use:** `D7RNU1RC77U2TFGF3SO0`
**Events API token:** stored in `/Bth/.credentials.local` (NOT pushed to GitHub — server-side only)
