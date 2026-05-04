# BTH Retargeting Audiences — Setup Guide

Seven audiences to build inside Meta Ads Manager and TikTok Ads Manager once the pixels start firing. Each audience has a URL rule, a retention window, and a job to do in the funnel.

The principle: every visitor falls into a bucket, every bucket gets a follow-up offer that matches where they were when they left.

---

## Audience 1 — All Site Visitors (Top of Funnel)

**Job:** Re-warm anyone who has touched the brand.
**Retention:** 180 days
**URL rule:** People who visited any page on `built-to-hoop.com`
**Use it for:** Brand awareness, content amplification, "you've seen us, here's what we do" creative.

**Meta setup:** Audiences → Create Audience → Custom Audience → Website → "All website visitors" → 180 days.

**TikTok setup:** Assets → Audiences → Create → Website Traffic → Pixel: BTH → "All visitors" → 180 days.

---

## Audience 2 — Pricing / Tier Page Visitors (Mid-Funnel — High Intent)

**Job:** Hit people who looked at the buy page but didn't buy.
**Retention:** 30 days
**URL rule:** URL contains `tier-1` OR `tier-2` OR `tier-3` OR `addons`
**Use it for:** Direct-response ads with proof, FAQ answers, "still on the fence?" creative, urgency.

**Meta setup:** Custom Audience → Website → People who visited specific web pages → URL contains: `tier-1`, `tier-2`, `tier-3`, `addons` → 30 days.

**TikTok setup:** Pixel-based audience → URL contains the same set → 30 days.

**Why 30 days:** Buying window for fitness products is short. After 30 days they're either cold or they've moved on.

---

## Audience 3 — Checkout / Cart Visitors (Bottom of Funnel — Hottest)

**Job:** Recover the people who clicked "Get the System" but bailed before paying.
**Retention:** 14 days
**URL rule:** URL contains `gumroad.com/l/` OR fired the `InitiateCheckout` event
**Use it for:** The abandoned-checkout email sequence backstop. Run direct-response ads with a strong "you left this behind" hook. This audience converts at the highest rate — spend the most per impression here.

**Meta setup:**
1. Custom Audience → Website → "InitiateCheckout" standard event in last 14 days.
2. AND exclude "Purchase" event in last 60 days (don't ad-stalk buyers).

**TikTok setup:** Event-based audience → InitiateCheckout in last 14 days, exclude CompletePayment in last 60.

---

## Audience 4 — Email Subscribers (Owned, Not Ad-Owned)

**Job:** Sync the email list to the ad platforms so we can show ads to non-buyers AND build a lookalike off them.
**Retention:** N/A (refresh weekly)
**Source:** MailerLite export → CSV upload to Meta and TikTok.

**Meta setup:** Custom Audience → Customer List → upload CSV from MailerLite (export weekly: Subscribers → Export → CSV).

**TikTok setup:** Customer File audience → upload CSV.

**Suppression rule:** Exclude this audience from cold prospecting campaigns. They're already warm — they need product/launch ads, not intro creative.

---

## Audience 5 — Buyers (Existing Customers)

**Job:** Power lookalikes (find new people who look like buyers) AND run retention/upsell creative ("you've got Tier 1 — here's why Tier 2 is the next step").
**Retention:** 365 days
**Source:** Gumroad sales export → CSV upload, refreshed monthly.

**Meta setup:**
1. Customer List audience from Gumroad export.
2. Then build a 1% Lookalike off this audience (USA) — this is the most valuable cold audience the brand will run.

**TikTok setup:** Same — build a Lookalike (1–3%) from the buyer file.

**Suppression rule:** Exclude buyers from ALL acquisition ads. Feed them upsell-only creative (add-ons, Tier 3 subscription, next-tier upgrade).

---

## Audience 6 — Social Engagers (IG + FB + TikTok)

**Job:** Catch people who interacted with content but never clicked through to the site.
**Retention:** 365 days
**Source:** Native engagement audiences inside each platform — no pixel needed.

**Meta setup:**
1. Custom Audience → Instagram Account → "Everyone who engaged with this account" → 365 days.
2. Custom Audience → Facebook Page → same setting → 365 days.
3. Combine into one audience for ad delivery.

**TikTok setup:** Audiences → Create → Engagement → "Followers" + "Profile visits" + "Video viewers" → 180 days (TikTok caps engagement audiences at 180).

**Use it for:** Conversion ads with stronger CTAs. They know the voice — sell the product directly.

---

## Audience 7 — Video Watchers (75%+ Completers)

**Job:** Find the people who watched enough of a long-form video that they're qualified buyers in waiting.
**Retention:** 180 days
**Source:** Video engagement audiences inside each platform.

**Meta setup:** Custom Audience → Video → "People who watched at least 75% of your video" → select hero/explainer videos → 180 days.

**TikTok setup:** Engagement audience → "Video viewers (50% completion)" → 180 days. (TikTok doesn't expose 75% — 50% is the strongest tier available.)

**Use it for:** Direct sales creative. 75% video completion is the strongest non-buyer intent signal on Meta. Pair with a strong offer ad.

---

## Suppression Matrix (Critical)

When running any campaign, ALWAYS apply these exclusions or you'll burn ad spend on the wrong people:

| Campaign Type | Include | Exclude |
|---|---|---|
| Cold prospecting | Lookalikes, interests | Audiences 1–7 (all warm + buyers) |
| Mid-funnel retarget | Audience 1 (all visitors) | Audiences 3, 4, 5 |
| Bottom-funnel retarget | Audience 3 (checkout) | Audience 5 (buyers) |
| Email-list ads | Audience 4 | Audience 5 |
| Upsell to buyers | Audience 5 | Everyone else |

---

## Standard Events to Track (Match Pixel + Audience Rules)

These are the events the BTH pixels will fire. Use them as the basis for audience rules instead of URL contains where possible — events survive URL restructures.

| Event | When it fires | Why it matters |
|---|---|---|
| `PageView` | Every page load | Audience 1 |
| `ViewContent` | Tier/Addon page load | Audience 2 (more reliable than URL) |
| `Lead` | Email form submit | Audience 4 confirmation + Lookalike seed |
| `InitiateCheckout` | Click on Gumroad CTA | Audience 3 |
| `Purchase` | Gumroad webhook → server-side event | Audience 5 + ROAS tracking |

**Implementation note:** `Purchase` requires a Gumroad → Meta Conversions API connection (or Zapier middleware). Tier 5 of this rollout — get it done in week 2 once basic audiences are running.

---

## Build Order (When Pixels Are Live)

**Day 1 (immediately after pasting pixel IDs):**
1. Audiences 1, 2, 3 (URL/event-based — start collecting data NOW even if not running ads yet)
2. Audience 6 (social engagers — works without pixel)

**Day 7 (after 100+ pixel events):**
3. Audience 7 (video watchers — needs reach to qualify)

**Day 14 (or when email list ≥ 50):**
4. Audiences 4, 5 (CSV uploads)
5. Lookalikes off Audience 5

**Day 30:**
6. Server-side `Purchase` event live via Gumroad → Conversions API.

---

*Run `swap_tracking.py` once the pixel IDs are pasted, push to GitHub, then come back here and start building these audiences in order.*
