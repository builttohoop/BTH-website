// BTH Email HTML Generator — CANONICAL SOURCE OF TRUTH
// Run: node email-sequences/generate-html-emails.mjs
// Output: email-sequences/html/email-0..7.html  → seeded into Mail OS by seed-free-reset.mjs
//
// SHELL = BTH design-system template 1B "Baseline" (the design team's "BTH Email
// Template" canvas, direction 1B, light render). Light-first canvas with REAL dark
// mode (@media prefers-color-scheme + Outlook [data-ogsc]). A solid black header
// band with a 3px gold stripe (constant in both inboxes), left-aligned editorial
// body, white card on light / near-black on dark. Ty selected 1B on 2026-07-07,
// superseding 1A "Center Court". Gold (#E6A800) stays the accent constant on both modes.
//
// CTA = BTH Forms & CTA System tiers (button by how important the click is):
//  • Tier 1 · Primary (COMMIT) — solid gold — "Start the 5-Day Reset", "Join Stay Ready".
//  • Tier 2 · Secondary (NAVIGATE) — hairline outline — "Open Day X" (go read the workout).
//
// Footer + tracking: this shell carries the footer WITH {{MAILING_ADDRESS}} /
// {{PREFERENCES_URL}} / {{UNSUBSCRIBE_URL}} placeholders and a <!-- BTH-SHELL:1B -->
// marker. The Mail OS Worker renderEmail() resolves those per-contact and injects
// the open pixel + click tracking; it must NOT append a second (legacy dark)
// footer for BTH-SHELL bodies.
//
// Design rules (locked):
//  • LINK-ONLY reset delivery — emails NEVER list exercises. Each reset-day email
//    carries ONE Tier-2 CTA that links to that day's real reset PDF.
//  • Membership = "Stay Ready" $27/mo (locked taxonomy). No "BTH Rise", no discount, no hype.
//  • ONE named offer per sequence: Stay Ready $27/mo. (BTH-0041)
//    BANNED as phase names — they are separate purchasable products with their own checkouts:
//      "Performance Track" (= BTH Rise, $97 one-time)  → say "The Strength Block"
//        (Ty ruled 2026-08-17: name it for the workout. Was "The Performance Layer" here and
//         "Performance Track" on the website — two substitutes for one thing. Now one name everywhere.)
//      "Tier 1 / 2 / 3"    (= the standalone product pages) → never referenced at all
//    ALLOWED — "Foundation" is the sanctioned name of Stay Ready's month-1 phase (Ty's ruling,
//    2026-08-03; matches the app's own `foundation` program, access:'member'). It collides with
//    the standalone "BTH Foundation" $31.99 SKU, so the rule is BINDING, not banning: in this
//    COLD sequence never let "Foundation" stand alone as if it were a buyable thing — always
//    pin it to the membership ("your first month inside Stay Ready — not a separate purchase")
//    and keep it OUT of subject lines, where there is no room to disambiguate.
//  • Checkout happens ON THE WEBSITE (CHECKOUT_URL), not Gumroad. One constant to flip at cutover.
//  • Every email opens with the 1B hero (eyebrow + big headline, ONE gold accent word).

import fs from 'fs';
import path from 'path';

const OUT_DIR = './email-sequences/html';
fs.mkdirSync(OUT_DIR, { recursive: true });

// Website checkout — everyone buys on built-to-hoop.com. Flip in ONE place at cutover.
const CHECKOUT_URL = 'https://built-to-hoop.com/join';
// Base path for the real reset PDFs (restored from Ty's canonical Drive set — see reset-pdfs/generate.mjs).
const RESET_BASE = 'https://built-to-hoop.com/reset-pdfs/output';

// ─── 1B PALETTE ──────────────────────────────────────────────────
// Inline styles carry the LIGHT default; the classes below flip to dark via
// @media (prefers-color-scheme:dark) + [data-ogsc]. Mirrors bth-system.css tokens.
// 1B "Baseline": white card on light, near-black card on dark, and a CONSTANT
// black header band (gold stripe) that never flips — so the top always looks
// intentional in either inbox.
const C = {
  page:    '#FFFFFF',   // 1B light page canvas — plain white (no visible background box)
  card:    '#FFFFFF',   // 1B light card = white
  border:  '#E7E3D9',   // light hairline / card border
  band:    '#111318',   // header band fill — CONSTANT both modes
  bandInk: '#F3EFE7',   // wordmark text on the band
  ink:     '#111318',   // headings + wordmark (light)
  body:    '#45474D',   // body copy (light)
  muted:   '#8A8578',   // secondary text (light)
  goldText:'#B4841A',   // gold for eyebrow / small text / links on white (reads better than #E6A800 on light)
  gold:    '#E6A800',   // Tier-1 CTA fill + headline accent — CONSTANT both modes
  btnText: '#111318',   // Tier-1 CTA label — CONSTANT
  btn2:    'rgba(17,19,24,0.24)', // Tier-2 outline border (light)
  boxSoft: '#F6F3EC',   // featured-card fill (light)
};

// The 1B dark-mode + mobile stylesheet. Class = dark override; inline = light value.
// Note: the header band (.band-*) is deliberately NOT flipped — it stays black in both modes.
const STYLE = `
  :root { color-scheme: light dark; supported-color-schemes: light dark; }
  html, body { margin:0 !important; padding:0 !important; width:100% !important; }
  * { -ms-text-size-adjust:100%; -webkit-text-size-adjust:100%; }
  table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; border-collapse:collapse; }
  img { -ms-interpolation-mode:bicubic; border:0; height:auto; line-height:100%; outline:none; text-decoration:none; }
  a { text-decoration:none; }
  body, table, td { font-family:'DM Sans',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; }
  .oswald { font-family:'Oswald','Arial Narrow',Arial,Helvetica,sans-serif; }

  @media (prefers-color-scheme: dark) {
    .bg-page{background:#0B0C0F!important;} .bg-card{background:#111318!important;}
    .border-card{border-color:#2A2D35!important;}
    .box-soft{background:#17191F!important;border-color:#2A2D35!important;}
    .t-ink{color:#F3EFE7!important;} .t-body{color:#C9CBD0!important;}
    .t-gold{color:#E6A800!important;} .t-muted{color:#8A8D94!important;}
    .rule{background-color:#2A2D35!important;} .link{color:#E6A800!important;}
    .btn1{background:#E6A800!important;color:#111318!important;}
    .btn2{border-color:rgba(255,255,255,0.30)!important;color:#F3EFE7!important;}
  }
  [data-ogsc] .bg-page{background:#0B0C0F!important;} [data-ogsc] .bg-card{background:#111318!important;}
  [data-ogsc] .border-card{border-color:#2A2D35!important;}
  [data-ogsc] .box-soft{background:#17191F!important;border-color:#2A2D35!important;}
  [data-ogsc] .t-ink{color:#F3EFE7!important;} [data-ogsc] .t-body{color:#C9CBD0!important;}
  [data-ogsc] .t-gold{color:#E6A800!important;} [data-ogsc] .t-muted{color:#8A8D94!important;}
  [data-ogsc] .rule{background-color:#2A2D35!important;} [data-ogsc] .link{color:#E6A800!important;}
  [data-ogsc] .btn1{background:#E6A800!important;color:#111318!important;}
  [data-ogsc] .btn2{border-color:rgba(255,255,255,0.30)!important;color:#F3EFE7!important;}

  @media only screen and (max-width:600px) {
    .container{width:100%!important;} .px{padding-left:26px!important;padding-right:26px!important;} .h1{font-size:33px!important;}
  }
`;

// ─── SHELL (1B "Baseline") ───────────────────────────────────────
// Black header band + 3px gold stripe (constant in both inboxes), left-aligned
// editorial body, white card on light / near-black on dark, footer split off by a
// hairline. Carries the {{MAILING_ADDRESS}}/{{PREFERENCES_URL}}/{{UNSUBSCRIBE_URL}}
// placeholders + the <!-- BTH-SHELL:1B --> marker the Worker resolves.
function wrap(subject, bodyHtml, preheader) {
  const pre = preheader || 'A training system built around how pickup basketball actually loads your body.';
  const body = bodyHtml.trim();
  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${subject}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>${STYLE}</style>
</head>
<body class="bg-page" style="margin:0;padding:0;background-color:${C.page};">
<!-- BTH-SHELL:1B -->

  <!-- PREHEADER (hidden inbox-preview line) -->
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${pre}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="bg-page" style="background-color:${C.page};">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" class="container bg-card border-card" style="width:600px;max-width:600px;background-color:${C.card};border:1px solid ${C.border};border-radius:16px;overflow:hidden;">

          <!-- HEADER · black band + gold stripe (constant both modes) -->
          <tr>
            <td class="px" align="center" style="padding:20px 40px;background-color:${C.band};border-bottom:3px solid ${C.gold};">
              <div class="oswald" style="font-size:16px;font-weight:700;letter-spacing:2.6px;color:${C.bandInk};">BUILT TO <span style="color:${C.gold};">HOOP</span></div>
            </td>
          </tr>

          <!-- BODY (left-aligned editorial) -->
          <tr>
            <td class="px" style="padding:32px 40px 0;">
${body}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td class="px" style="padding:26px 40px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td class="rule" style="height:1px;background-color:${C.border};line-height:1px;font-size:1px;">&nbsp;</td></tr></table>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:16px 40px 34px;">
              <p class="t-muted" style="margin:0;font-size:12px;line-height:1.6;color:${C.muted};">You're getting this because you joined the Free 5-Day Reset or bought from BTH.<br>Built to Hoop · {{MAILING_ADDRESS}}</p>
              <p style="margin:10px 0 0;font-size:12px;line-height:1.6;">
                <a class="link" href="{{PREFERENCES_URL}}" style="color:${C.goldText};text-decoration:underline;">Email preferences</a>
                <span class="t-muted" style="color:${C.muted};"> · </span>
                <a class="link" href="{{UNSUBSCRIBE_URL}}" style="color:${C.goldText};text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
        <!--[if mso]></td></tr></table><![endif]-->

      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── HELPERS ─────────────────────────────────────────────────────

// ── CTA SYSTEM (BTH Forms & CTA System — button by how important the click is) ──
// Tier 1 · Primary (COMMIT): solid electric-gold — the CTA system's commit button,
// reserved for "Start the 5-Day Reset" / "Join Stay Ready". Gold reads on both light
// and dark, so it stays gold in both modes. Bulletproof: MSO <v:roundrect> + link.
function btnPrimary(url, label, widthPx = 236) {
  return `<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:48px;v-text-anchor:middle;width:${widthPx}px;" arcsize="10%" fillcolor="${C.gold}" stroke="f">
<w:anchorlock/>
<center style="color:${C.btnText};font-family:Arial,sans-serif;font-size:14px;font-weight:bold;letter-spacing:1px;">${label.toUpperCase()}</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-->
<a href="${url}" style="display:inline-block;background-color:${C.gold};color:${C.btnText};font-family:'Oswald','Arial Narrow',Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;padding:15px 30px;border-radius:8px;">${label}</a>
<!--<![endif]-->`;
}

// Tier 2 · Secondary (NAVIGATE): hairline outline that reads quieter than Tier 1.
// Used for "open the day's workout" — you're going somewhere to read, not committing.
// Border + label flip to light in dark mode via the .btn2 class.
function btnSecondary(url, label, widthPx = 300) {
  return `<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:46px;v-text-anchor:middle;width:${widthPx}px;" arcsize="4%" fillcolor="${C.card}" strokecolor="${C.ink}">
<w:anchorlock/>
<center style="color:${C.ink};font-family:Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:1px;">${label.toUpperCase()}</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-->
<a href="${url}" class="btn2" style="display:inline-block;background:transparent;border:1.5px solid ${C.btn2};color:${C.ink};font-family:'Oswald','Arial Narrow',Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;padding:13px 26px;border-radius:8px;">${label}</a>
<!--<![endif]-->`;
}

// 1B hero: left-aligned eyebrow + big Oswald headline (pass ONE gold accent word as
// <span class="t-gold" style="color:#E6A800;">word</span>), optional lead line + Tier-1 CTA.
function hero(eyebrow, headlineHtml, leadText, ctaUrl, ctaLabel) {
  const lead = leadText
    ? `\n  <p class="t-body" style="margin:15px 0 0;font-size:15px;line-height:1.68;color:${C.body};">${leadText}</p>`
    : '';
  const cta = ctaUrl
    ? `\n  <div style="padding:24px 0 4px;">${btnPrimary(ctaUrl, ctaLabel, 236)}</div>`
    : '';
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:0 0 4px;">
  <div class="t-gold" style="font-family:'DM Sans',Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:2.2px;text-transform:uppercase;color:${C.goldText};">${eyebrow}</div>
  <h1 class="oswald h1 t-ink" style="margin:13px 0 0;font-size:38px;line-height:1.02;font-weight:700;letter-spacing:0.4px;text-transform:uppercase;color:${C.ink};">${headlineHtml}</h1>${lead}${cta}
</td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:26px 0 0;"><tr><td class="rule" style="height:1px;background:${C.border};line-height:1px;font-size:1px;">&nbsp;</td></tr></table>
<div style="height:26px;line-height:26px;font-size:1px;">&nbsp;</div>`;
}

function divider() {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;"><tr><td class="rule" style="height:1px;background:${C.border};line-height:1px;font-size:1px;">&nbsp;</td></tr></table>`;
}

// The ONLY reset content in an email: a single Tier-2 (navigate) CTA to that day's
// real workout (PDF). Quieter than a Tier-1 commit — you're opening a doc to read.
function resetButton(day, title, filename) {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td>
      ${btnSecondary(`${RESET_BASE}/${filename}`, `Open Day ${day} — ${title}`, 300)}
      <p class="t-muted" style="margin:12px 0 0;font-size:13px;color:${C.muted};">The full workout, step by step. Pull it up on your phone or print it before you start.</p>
    </td>
  </tr>
</table>`;
}

function membershipCta(featured) {
  if (featured) {
    return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
  <tr>
    <td class="box-soft" style="background:${C.boxSoft};border:1px solid ${C.border};border-left:4px solid ${C.gold};padding:24px 28px;">
      <p class="oswald t-gold" style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${C.goldText};">The next step</p>
      <p class="oswald t-ink" style="margin:0 0 12px;font-size:22px;font-weight:700;line-height:1.2;color:${C.ink};">Stay Ready — $27/month</p>
      <p class="t-body" style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${C.body};">Cancel anytime. Keep everything you download. Month 1 picks up exactly where the reset left off.</p>
      ${btnPrimary(CHECKOUT_URL, 'Join Stay Ready →', 240)}
    </td>
  </tr>
</table>`;
  }
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
  <tr><td>${btnPrimary(CHECKOUT_URL, 'Join Stay Ready →', 240)}</td></tr>
</table>`;
}

function p(text, opts = {}) {
  const mb = opts.mb !== undefined ? opts.mb : 18;
  const muted = !!opts.muted;
  const cls = muted ? 't-muted' : 't-body';
  const color = muted ? C.muted : C.body;
  const size = opts.size || 16;
  return `<p class="${cls}" style="margin:0 0 ${mb}px;font-size:${size}px;line-height:1.75;color:${color};">${text}</p>`;
}

function h(text, level = 2) {
  const sizes = { 1: 28, 2: 20, 3: 16 };
  return `<p class="oswald t-ink" style="margin:0 0 12px;font-size:${sizes[level]}px;font-weight:700;letter-spacing:0.03em;text-transform:uppercase;color:${C.ink};">${text}</p>`;
}

// Bulleted list that flips to light text in dark mode (class t-body).
function ul(items) {
  return `<ul class="t-body" style="margin:0 0 18px;padding-left:20px;font-size:15px;line-height:2;color:${C.body};">${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
}

function sig(name = 'Ty, BTH') {
  return `${divider()}<p class="t-body" style="margin:0;font-size:15px;color:${C.body};">— ${name}<br><span class="t-muted" style="font-size:13px;color:${C.muted};">Built to Hoop · <a class="link" href="https://built-to-hoop.com" style="color:${C.goldText};">built-to-hoop.com</a></span></p>`;
}

// Gold accent word for headlines (constant #E6A800 both modes).
function g(word) {
  return `<span class="t-gold" style="color:${C.gold};">${word}</span>`;
}

// ─── EMAILS ──────────────────────────────────────────────────────
// Each email = { filename, subject, preheader, hero{...}, body }.
// Reset-day emails (0,2,3,4,5) carry exactly ONE resetButton and ZERO inline exercises.
//
// REWRITE 2026-08-18 — warmth-before-price pass (live D1 data, sequence_id=1, 277 delivered /
// 66 opens (24%) / 10 clicks (3.6%), 7 weeks, $0 revenue). Diagnosis: price appeared in E0 before
// a single rep was done, got re-pitched in E1/E2, then E3 ran a full product teardown (54% open —
// the funnel's best-read email — and 0 clicks: the highest-attention slot produced zero motion).
// Fix: price now first appears (soft, unnamed) in E4 and fully (name + $27/mo + breakdown) in E5 —
// the first email that actually carries a buy CTA. E1/E3 each add a reply-based micro-commitment
// (no product ask) so warmth is earned before the ask, and E4/E5/E6 read back whatever the
// reader told Ty on Day 3 so the eventual ask feels answered, not cold. E3's old teardown content
// (Month 1 — Foundation / Month 2 — Strength Block / included tracks) moved into E5 rather than
// being duplicated, closing the exact gap the data pointed at. Sequence length (8 emails / 9 days)
// deliberately UNCHANGED — with 25 lifetime signups there's no volume to A/B a longer version yet;
// revisit once signups clear ~100.
//
// CTA-placement note: E0-E4 render with ZERO join/checkout links (verified by grep on
// email-sequences/html/*.html) -- only E5/E6/E7 carry one. That matches the BRAND_RULES
// sequence rule ("Days 0-4: soft seed, Day 5: hard offer") and is NOT changed wholesale here --
// restoring a hard CTA to every early email would re-introduce the exact over-pitching this
// rewrite removes. The one gap worth closing: a reader already sold by Day 4 previously had no
// path to buy before Day 5. E4 now carries a single low-key text link (not a Tier-1 button) as
// an escape hatch for that reader; E0-E3 intentionally still carry none.
//
// RE-AIM 2026-08-19 — Returning Hooper pass (Ty ruling, bth-brain PR #52 MERGED: the Returning
// Hooper — 24-32, coming back from injury/life, hesitant — is now the PRIMARY target; the Pickup
// Grinder is secondary). E2 was the Grinder-specific email ("plays 3 nights a week, goes to the
// gym in between") — its cycle is now the comeback cycle. E4 was already a returning-hooper story
// (kept; first line now closes E3's named promise). E0/E1/E5 framing re-aimed from "still playing
// 3 nights a week" to "coming back and hesitant". All three 2026-08-18 defect fixes, the soft-seed
// days 0-4 / hard-offer day 5 structure, "The Strength Block", and the Foundation month-1 binding
// sentence are UNCHANGED. Also folded in FO-66 (delivery-teardown finding): each day email's close
// names what the next email delivers (words, not just a day number), and the next email's first
// line pays that promise off by name — the six-brand teardown showed the vague forward-tease is
// the weakest link in an open chain. And E5/E6's "now in the BTH app" claim is corrected to match
// live delivery (join.html: "Everything delivered by email — BTH app coming soon"; production
// APP_LIVE="false"; join.html's own comment bans app-access promises until the app ships).
// QA round 2026-08-19 (re-aim pass): bth-mission-qa REVISE→fixed (E7 "another discount" implied a
// discount this funnel never offered); compliance-reviewer REVISE→fixed (E0 durability claim
// hedged, E1 diagnosis-as-fact generalized to "for a lot of guys", E4 fixed-8-week outcome
// de-welded from the product, E5 "never have to come back again" softened); adversarial
// verifier 7/7 CONFIRMED (defect fixes retained, re-aim complete, FO-66 stitch named both
// ways on all six pairs, structure + template integrity clean).
//
// CLICK PASS 2026-08-20 — the click drought (live D1, all 3 click instruments reconciled: Day-02
// and Day-03 PDFs had ZERO human clicks lifetime; 3 clicks/183 sends post-08-09; opens healthy at
// 21-50%, so this is body/CTA structure, not subjects). E2/E3/E4 restructured deliverable-first
// (short lead → day's resetButton + one payoff line → essay/connection → FO-66 close); E1 eyebrow
// 'Day 1 · Hips' → 'The Truth · Hips' (it's the hour-24 between-days email, not a reset day) + one
// low-key Day-1 PDF re-link; E5 CTA-adjacent lines tightened. Subjects and preheaders UNCHANGED.
// QA round 2026-08-20: compliance REVISE→fixed (E2 payoff hedged to "For a lot of guys", E3
// "you'll feel it" → "some guys feel it as early as", E6 app line hedged to launch-readiness — no
// priority-access promise); bth-mission-qa REVISE→fixed (E2 lead now pays off its own promise
// before the button: "...: stopping, then starting over from further back every time"); adversarial
// verifier 11/12 CONFIRMED (byte-reproducible regen, seeder delays untouched; the 12th was the
// E6→E7 stitch, which FO-66 never specified — six pairs E0→E6 only, informational).
//
// CLICK-DROUGHT FIX 2026-08-20 — deliverable-first restructure (live D1, all three click
// instruments reconciled, zero bot noise, read 2026-08-20). Day-02/03 PDFs: ZERO human clicks
// ever (41/40 sends). Day-04/05: 1 human click ever each. Day-01: 7. Post-08-09: 3 clicks across
// ~183 sends, even though opens are healthy (21-50%). Diagnosis: E2/E3/E4 all opened with "the
// link's below — but first…" and buried the day's resetButton() under a full essay — readers got
// the essay, never reached (or never felt a reason to reach) today's PDF. Fix: E2/E3/E4 now open
// with a short (2-3 line) lead that pays off the prior email's FO-66 promise, run resetButton()
// immediately, add ONE concrete payoff line at the button, THEN the essay/connection content, THEN
// the FO-66 close — unchanged in substance, just no longer buried under it. E3's reply check-in ask
// stays intact and prominent (its job is still connection, not conversion). E5 got a light touch
// only (membershipCta(true) stays the primary CTA in its place; tightened the one line immediately
// before it and the payoff line after resetButton(5) into one-line reasons-to-act). E1's hero
// eyebrow changed 'Day 1 · Hips' → 'The Truth · Hips' (E1 arrives hour 24 as between-days
// education, not a reset day — the old eyebrow read as a Day-1 repeat to a reader expecting Day 2)
// and gained one low-key Day-1 PDF re-link line (42/49 recipients never fetched Day 1; a reset-PDF
// link, not a join link, so it doesn't touch the soft-seed join-link ban). E0/E6/E7 untouched. All
// prior QA hedges kept verbatim (E0 durability, E1 "for a lot of guys", E4 "Weeks later — not
// overnight…", E5 "don't have to start the comeback over again" / "knees feel less loaded"). No
// subject lines changed — opens are healthy, only clicks are the problem.

const emails = [

  // EMAIL 0 — CONFIRMATION + DAY 1 (the 1A "Center Court" welcome hero)
  {
    filename: 'email-0-day1-hip-release.html',
    subject: 'your reset starts now',
    preheader: 'The only training system built around how pickup basketball actually loads your body. Start Day 1.',
    body: `
${hero(
  'Restore · Rebuild · Rise',
  `Welcome to<br>the ${g('System.')}`,
  `You just joined the only training system built for hoopers working their way back — to the court, and to a body they can trust again. No dunk-first hype. A plan that respects the years you've already put in.`,
  `${RESET_BASE}/BTH-Reset-Day-01-Hip-Reset.pdf`,
  'Start the 5-Day Reset'
)}
${p('Your 5-Day BTH Reset is live. Day 1 — the Hip Reset — is ready and takes about 15 minutes. You\'ll feel it working before you finish.')}
${p('Move slow on every rep. No pain — if something pinches, back off. This is about control and position, not effort.')}
${p('Do this today. Tomorrow I\'m sending you the truth about why your hips feel locked up &mdash; it\'s not what you think. Day 2 of the reset lands the day after.')}
${divider()}
${p('One more thing.')}
${p('This isn\'t a random stretch routine. It\'s the same method I use to help grown men who stepped away — injury, work, life — rebuild a body that can handle coming back to the court.')}
${p('Five days won\'t undo years away. But it\'ll show you what changes when the training is actually built for the comeback.')}
${p('There\'s more after Day 5 — I\'ll show you then.', { muted: true })}
${sig('Ty<br>Built to Hoop')}
`},

  // EMAIL 1 — DAY 1 / HIP EDUCATION (pure education/sell)
  {
    filename: 'email-1-hip-education.html',
    subject: 'your hips are lying to you',
    preheader: 'It\'s not that your hips are tight. It\'s that they shut down.',
    body: `
${hero('The Truth · Hips', `Your hips are ${g('lying')} to you.`)}
${p('Yesterday I promised you the truth about why your hips feel locked up. Here it is &mdash; the part nobody tells you:')}
${p('It\'s usually not that your hips are tight.')}
${p('For a lot of guys, it\'s that the hips <strong>shut down</strong> — and the lower back takes over to protect them.')}
${p('Every lateral cut. Every hard stop. Every time you planted on the wrong angle and felt that pull — your hips were supposed to absorb that. But if they\'ve never been trained to load and reset, they stop doing the job.')}
${p('So the back tightens. The knees start compensating. The first step gets slower — and nobody connects the dots until it\'s gone.')}
${p('And if you\'ve been away &mdash; injury, work, life &mdash; the shutdown had that whole time to set in. Coming back doesn\'t undo it. Coming back <strong>tests</strong> it.')}
${p('That\'s the cycle.')}
${divider()}
${p('The reset you\'re doing this week interrupts it. That\'s real — for a few days your hips get permission to move again.')}
${p('Interrupting a pattern and rebuilding it are two different jobs, though. More on that later this week.')}
${divider()}
${p('Quick favor —')}
${p('Reply to this email with one word: <strong>RIGHT</strong> if your right hip\'s worse, <strong>LEFT</strong> if it\'s your left, <strong>EVEN</strong> if they\'re about the same. I read every reply myself — it tells me what to send you next.')}
${divider()}
${p('For now — did you do the Day 1 hip reset? If not, do it before tomorrow.')}
${p('<strong>15 minutes. Today.</strong>')}
${p(`Missed Day 1? <a href="${RESET_BASE}/BTH-Reset-Day-01-Hip-Reset.pdf" class="link" style="color:${C.goldText};text-decoration:underline;">It's still here</a> — do it before Day 2 lands tomorrow.`, { size: 14, muted: true })}
${p('Tomorrow: Day 2 — the Ankle Reset. And I\'m naming the thing that kills more comebacks than any injury ever has.', { muted: true })}
${sig()}
`},

  // EMAIL 2 — DAY 2 / ANKLE RESET
  {
    filename: 'email-2-day2-ankle-reset.html',
    subject: 'the cycle that kills comebacks',
    preheader: 'You come back. Something flares. You back off. You start over — from further back.',
    body: `
${hero('Day 2 · Ankles', `The cycle that kills ${g('comebacks.')}`)}
${p('Day 2 — the Ankle Reset — is ready. And here\'s the thing that kills more comebacks than any injury ever has: stopping, then starting over from further back every time.')}
${resetButton(2, 'Ankle Reset', 'BTH-Reset-Day-02-Ankle-Reset.pdf')}
${p('For a lot of guys, unstable ankles are the real reason the knees take the hit. Today trains the system underneath them — not just taping over it.', { size: 14, muted: true })}
${divider()}
${p('I know why you\'re on this list.')}
${p('You\'ve been stuck in the cycle.')}
${p('You take time off — an injury, a job, a kid, life. You finally come back. The first few runs feel almost normal. Then something flares — a hip, a knee, that ankle that never fully healed. You back off. You wait. You come back again — from further back than last time.')}
${p('Maybe it\'s been months. Maybe years.')}
${p('It\'s not because you\'re getting old. It\'s not bad luck. It\'s not that your window closed.')}
${p('It\'s because nothing you\'ve tried was built for a comeback.')}
${p('Everything out there — YouTube workouts, gym programs, "just rest more" — was built for someone who never left. Not for a hooper coming back to a body that kept score while he was gone.')}
${p('<strong>BTH exists to break that cycle.</strong>')}
${p('The reset is 5 days. What actually breaks the cycle for good takes longer than that — and in a couple days I\'ll show you exactly what it looks like.')}
${divider()}
${p('Tomorrow is Day 3 — the one email this week where I ask you a question and actually want the answer.', { muted: true })}
${sig()}
`},

  // EMAIL 3 — DAY 3 / CHECK-IN
  // Was "membership reveal" — the funnel's highest-open (54%) / zero-click slot.
  // Diagnosis (live D1, 2026-08-18): this email pitched the SAME offer E5 pitches, two
  // days early, with no CTA button to act on (only the reset-day PDF link). Readers
  // absorbed the full pitch here with nothing to do about it, then saw it again on Day 5
  // when the real button existed — by then the pitch had already been "spent." Its job is
  // now connection, not conversion: no price, no product breakdown (that content moved to
  // E5, the first real ask), just a reply-based check-in that earns a felt result the
  // reader attributes to Ty before any money is asked for.
  {
    filename: 'email-3-day3-checkpoint.html',
    subject: 'day 3: what\'s actually different?',
    preheader: 'Halfway through the reset. This is the one where I actually want to hear from you.',
    body: `
${hero('Day 3 · Check-In', `What's actually ${g('different?')}`)}
${p('Day 3. Halfway through — this is the email I told you about: no pitch, I actually want to hear from you.')}
${resetButton(3, 'Movement Control', 'BTH-Reset-Day-03-Movement-Control.pdf')}
${p('This is the day the hip work and the ankle work stop moving separately and start working as one system — some guys feel it as early as their first step.', { size: 14, muted: true })}
${divider()}
${p('Some guys feel looser by day 3. Some don\'t notice anything until day 5. Both are normal — the reset works on its own clock, not a marketing calendar.')}
${p('And if you\'ve been away a while: day 3 is usually when the doubt shows up. <em>Is this going to hold when I actually play?</em> That\'s not a red flag. That\'s every comeback ever made.')}
${divider()}
${p('Quick check-in —')}
${p('Reply to this email with one line: what\'s different since Day 1? Hips, ankles, sleep — or nothing yet. Tell me that too.')}
${p('I read every reply. It\'s how I know what\'s actually working.', { muted: true })}
${divider()}
${p('Tomorrow I want to tell you about a guy who almost quit playing at 27. Might sound familiar.', { muted: true })}
${sig()}
`},

  // EMAIL 4 — DAY 4 / STORY
  {
    filename: 'email-4-day4-core-story.html',
    subject: 'the guy who almost stopped playing at 27',
    preheader: 'Could be you. Could be me. Could be someone you run with.',
    body: `
${hero('Day 4 · The Story', `The guy who almost ${g('quit')} at 27.`)}
${p('Day 4. Almost there — this is the guy I told you about yesterday. Could be you, could be me, could be someone you run with.')}
${resetButton(4, 'Strength That Moves', 'BTH-Reset-Day-04-Strength-That-Moves.pdf')}
${p('Strength that supports movement — not strength that stays in the gym. This is the foundation that makes Day 5 possible.', { size: 14, muted: true })}
${divider()}
${p('27 years old. Played pickup three nights a week all through college. Then life happened — desk job, less playing time, came back at 25 and nothing worked the same.')}
${p('Hips tight every time he got to the gym. Knees barking after hard sessions. First step gone. Not slower — just not there.')}
${p('He tried everything. Stretched more. Bought a program. Rested for two weeks. Came back and it was the same.')}
${p('He started wondering if this was just it now. That\'s the part nobody says out loud.')}
${divider()}
${p('What he didn\'t know: <strong>his body had never been trained to handle pickup AND gym work at the same time.</strong>')}
${p('Everything he\'d ever done in the gym was built for someone who only went to the gym.')}
${p('No one had ever given him a system that accounted for pickup recovery, lateral load, tendon prep, and the specific kind of fatigue that hits a body coming back to hardwood after years away.')}
${p('He found the BTH method. Put in the first month exactly the way it was laid out. Weeks later — not overnight, and not on the same clock as anybody else — he was playing full speed without dreading the next day.')}
${p('Not because it was magic. Because for the first time, the training matched the sport.')}
${p('<strong>That\'s what Stay Ready is built to do.</strong>')}
${p('If you replied on Day 3 and told me something already felt different — that\'s not nothing. That\'s the same shift that got him back on the court.', { size: 14, muted: true })}
${p(`Already know you're in? You don't have to wait for Day 5 — <a href="${CHECKOUT_URL}" class="link" style="color:${C.goldText};text-decoration:underline;">join Stay Ready here</a>. I'll still send the rest of the reset either way.`, { size: 14, muted: true })}
${divider()}
${p('Tomorrow is Day 5 — your final reset day, and the day I send you the full link to join.', { muted: true })}
${sig()}
`},

  // EMAIL 5 — DAY 5 / OFFER
  {
    filename: 'email-5-day5-offer.html',
    subject: '5 days done. here\'s the move.',
    preheader: 'The reset ends today. The work doesn\'t have to.',
    body: `
${hero('Day 5 · The Move', `5 days done. Here's the ${g('move.')}`)}
${p('Day 5. Last one.')}
${p('You made it through the reset. If you did all 5 days, a lot of guys feel their hips looser, ankles with more range, knees carrying less load than Day 1.')}
${p('That\'s real. That\'s the BTH method working.')}
${p('Here\'s the truth: <strong>the reset is maintenance, not building.</strong> It gets your body back to baseline. It doesn\'t keep building once you stop opening these emails.')}
${p('The reset ends today. Here\'s the move — and it\'s not the ask you\'re expecting.')}
${p('I\'m not asking you to buy anything right now. I want to ask you something more useful first.')}
${h('What\'s still not working?')}
${p('Maybe the reset helped, and something specific is still holding you back — an old injury that\'s still barking, a schedule that won\'t cooperate, a part of your game you don\'t trust yet. Maybe none of it moved the needle and you want to tell me why. Either way — hit reply, one sentence. I read every reply myself, and it tells me what to actually build for guys like you, not what I assume you need.')}
${resetButton(5, 'Power Reset', 'BTH-Reset-Day-05-Power-Reset.pdf')}
${p('Your last reset day — the work you put in over the last five is real, whatever\'s next.', { size: 14, muted: true })}
${p('Whatever you tell me shapes what I send you. If Stay Ready — the system that keeps building where this reset stops, $27 a month — turns out to be the right next step for you, I\'ll tell you exactly why, not just pitch you again. If it\'s not, I want to know that too.')}
${p('Tomorrow: one straight answer about what happens to the body you just rebuilt if you stop here.', { size: 14, muted: true })}
${sig()}
`},

  // EMAIL 6 — THE CLOSE (no reset content, no fake deadlines)
  {
    filename: 'email-6-the-close.html',
    subject: 'The reset\'s done. Keep the body that earned it.',
    preheader: 'A reset is maintenance, not building. Keep going and you build on top of it.',
    body: `
${hero('The Close', `Keep the body you ${g('earned.')}`)}
${p('Straight talk — the answer I promised you yesterday.')}
${p('You finished the reset. Five days in, your hips are looser, your ankles move better, your knees feel less stacked. You earned that — and you did the work to get it.')}
${p('A few of you replied on Day 3 telling me your hips already felt different by then. If that was you — this is the fork: keep building on that, or let it slide back.', { size: 14, muted: true })}
${p('Here\'s the part most guys miss: a reset is maintenance, not building. Stop now and it slips back in a few weeks. Keep going and you build on top of it instead.')}
${p('That\'s the whole difference between Stay Ready and everything else you\'ve tried.')}
${h('What you\'re actually getting:')}
${ul([
  'The full BTH method — Foundation (your first month inside), then The Strength Block, run for you month to month',
  'Hip Reset, Knee Protection, Ankle Rebuild, Skill Builder, and Recovery System — all included',
  'Everything delivered straight to you the day you join — and the BTH app is on the way. When it launches, you\'ll be set up for it.',
])}
${p('$27/month. Cancel anytime. Keep everything you download.')}
${membershipCta(true)}
${p('Questions? Reply to this email. I read every one.')}
${p('Not ready yet? No pressure — the list stays open. But the body you just earned is worth keeping ready.')}
${sig()}
`},

  // EMAIL 7 — RE-ENGAGE (no reset content)
  {
    filename: 'email-7-re-engage.html',
    subject: 'still thinking about it?',
    preheader: 'No discount coming. Just one real question.',
    body: `
${hero('Still In?', `What's ${g('stopping')} you?`)}
${p('I\'m not going to try to talk you into this with a discount.')}
${p('I\'m also not going to ask you the same thing twice. If you replied on Day 5, I already have what you told me — and if I owe you an answer I haven\'t sent, tell me and I\'ll fix that.')}
${p('If you didn\'t reply — this is the last email in this run, so let me ask it a different way.')}
${h('Which one of these is actually true for you right now?')}
${ul([
  '<strong>Price.</strong> ($27/month is one pickup session\'s worth of gym cost — but "worth it" is still your call, not mine.)',
  '<strong>Timing.</strong> (Month 1 is built for guys easing back in — 3 days a week, around a real schedule — but if life\'s genuinely too full right now, that\'s real too.)',
  '<strong>Trust.</strong> (You haven\'t seen it work yet. Fair. That one only gets solved by trying it — I can\'t argue you out of it.)',
  '<strong>Something else.</strong> Tell me what it actually is.',
])}
${p('Hit reply and give me a letter, or just say it in your own words. I read every one, and I\'ll give you a straight answer back — not another pitch.')}
${p('If Stay Ready ends up being the move, it\'s still $27 a month, cancel anytime — no lock-in.')}
${p('If it\'s genuinely not for you right now, no hard feelings — the reset was free and I hope it did what it was supposed to do.', { muted: true, size: 14 })}
${sig()}
`},
];

// ─── WRITE FILES ─────────────────────────────────────────────────

for (const email of emails) {
  const html = wrap(email.subject, email.body, email.preheader);
  const outPath = path.join(OUT_DIR, email.filename);
  fs.writeFileSync(outPath, html, 'utf8');
  console.log(`✓ ${email.filename}`);
}

console.log(`\nDone. ${emails.length} emails written to ${OUT_DIR}/  (1B "Baseline" shell · light-first + dark mode · CTA tiers · link-only · Stay Ready)`);
