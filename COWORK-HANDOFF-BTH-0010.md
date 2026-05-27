# Claude to Codex Handoff

> Most recent handoff lives here; overwrite when a new one is issued.
> Codex: read THIS file top to bottom, then execute.

## Task ID
BTH-0010 — Post-Funnel-Audit QA Pass + Gumroad Product 2 Copy Paste

## Date
2026-05-27 · From: Claude Code · To: Codex

## Read these first (in order)
1. `C:\Users\built\.claude\agent-system\01-agent-roles\CODEX_ROLE.md`
2. `C:\Users\built\.claude\agent-system\00-project-context\BTH_CONTEXT.md`
3. This file top to bottom

---

## Context: What Claude Just Did

Claude ran a full funnel audit and found **stale prices across 18 HTML files**. All were fixed and pushed in two commits:
- `7cb399c` — 14 files (primary funnel + product pages + 6 SEO pages)
- `4847b66` — 4 more files (bounce.html, tier-2.html, 2 more SEO pages)

Additionally:
- BTH-0004 (**anti-positioning line**) was added to index.html hero
- reset.html FAQ routing fixed: now sends warm leads to BTH Rise Monthly (tier-3.html), not Tier 1 Foundation
- about.html CTA updated to Free Reset (cold traffic rule)
- thank-you.html upsell updated to BTH Rise Monthly

**Repo:** `C:\Users\built\BTH-website-fix` — push to main = live at built-to-hoop.com in ~60s

---

## Codex Task 1 — QA Pass: Verify the Live Site

The site just had 18 files edited. Do a QA pass to confirm nothing broke visually or functionally.

**Method:** Use Claude in Chrome MCP (browser automation) to visit each key page on `https://built-to-hoop.com` and spot-check the changes.

### Pages to check + what to verify:

| Page | URL | Check |
|------|-----|-------|
| Homepage | `/` | Anti-positioning line shows in hero. Price block shows $27/mo BTH Rise Membership. Stat bar shows "$27 Rise Monthly". Free Reset CTA in nav. |
| Free Reset | `/reset.html` | MailerLite form loads (form kJZHo2). FAQ says BTH Rise Monthly $27/mo (not $19). FAQ "After Day 5" links to tier-3. |
| BTH Rise (Tier 3) | `/tier-3.html` | Value stack shows Foundation $31.99, all 4 add-ons $41.99, total $338.94. 30s popup appears after 30s (wait for it). |
| Tier 1 Foundation | `/tier-1.html` | Hero price shows $31.99. Gumroad CTA link goes to ecyzaa. |
| Tier 2 Rise | `/tier-2.html` | Hero price $97. No "$57" or "$67" text anywhere. CTA says "$97". |
| Addons | `/addons.html` | All 5 tracks show $41.99 standalone. Injury Bundle shows $79.99. |
| Thank You | `/thank-you.html` | Upsell section shows "Join BTH Rise Monthly — $27/mo" not Foundation $19. |

### Popup check (tier-3.html):
Wait 30 seconds on the page. Popup should appear: "10% off your first month of BTH Rise" + code RISE10 + $24.30 first month + Gumroad link to thxqs.

### No-regression check:
- Navigation works on all pages (hamburger menu on mobile)
- All Gumroad links open to the correct slugs:
  - Foundation → ecyzaa
  - Rise Monthly → thxqs
  - Performance standalone → groedz
  - Add-on tracks → their respective slugs (don't need to verify exact purchase, just that links open)

---

## Codex Task 2 — Gumroad Product 2 Copy (BTH Rise Performance Track)

The Gumroad listing for the Performance Track standalone (slug: `groedz`) was never given proper sales copy. It currently has placeholder copy.

**What to do:** Write and paste the Gumroad product listing copy for `groedz`. This is a Gumroad dashboard action — use the Zapier MCP or browser automation to navigate to `https://app.gumroad.com/products/groedz/edit` and update the product description with the copy below.

**Product:** BTH Rise — Performance Track (Standalone)
**Price:** $97 one-time (Ty must update this in Gumroad dashboard manually — see Ty actions below)
**Gumroad slug:** groedz

### Product description copy (paste exactly):

---

**12 weeks. 3 phases. The phase most hoopers never reach.**

BTH Rise is Phases 3–5 of the Built to Hoop method — the performance layer built on top of Foundation Month.

If you've done the Foundation work (or you're already moving well), this is where your body stops just surviving pickup and starts dominating it.

**Phase 3 — Strength to Bounce (Weeks 1–4)**
Build the type of strength that transfers. Hip-dominant loading, single-leg power, tendon prep for jumping and landing. Your first step starts here.

**Phase 4 — Game Speed (Weeks 5–8)**
Explosive change of direction. Deceleration. Pickup-specific conditioning built around your real schedule. This is where the game feels different.

**Phase 5 — Stay Ready (Weeks 9–12)**
Maintain the output. You've built it — now you keep it. Reduced volume, higher quality, pickup integrated at full intensity.

**What's included:**
- Full 12-week progressive training program (3 days/week)
- Pickup integration system — know exactly when to push and when to back off
- Full exercise library with coaching cues
- Intensity scaling guide for pickup weeks
- Instant download. Keep forever.

**Note:** Foundation Month is recommended first if you're coming back from injury or rebuilding from scratch. If you're already moving well and want the performance upgrade, start here.

**Better value:** BTH Rise Monthly ($27/mo) includes this program + Foundation Month + all 5 add-on tracks. If you want the full library, the membership is the move.

---

**Product name:** BTH Rise — Performance Track
**Product thumbnail:** Use existing (or leave as-is)

---

## Success Criteria

- [ ] QA pass complete — all 7 pages verified, no broken links, prices correct
- [ ] Popup verified on tier-3.html (fires at 30s with RISE10 code)
- [ ] Gumroad groedz description updated with copy above
- [ ] Any issues found documented in codex-to-claude.md

---

## Write Back To

`03-handoffs\codex-to-claude.md` — confirm QA pass result, any issues found, Gumroad copy status.
Update `04-status\agent-status.md`.

## If Blocked

Gumroad access via browser may require Ty's login credentials — if so, document it and skip that task, complete the QA pass instead.
