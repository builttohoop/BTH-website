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
  `You just joined the only training system built around how pickup basketball actually loads your body. No dunk-first hype — just a plan that respects the fact you're still playing.`,
  `${RESET_BASE}/BTH-Reset-Day-01-Hip-Reset.pdf`,
  'Start the 5-Day Reset'
)}
${p('Your 5-Day BTH Reset is live. Day 1 — the Hip Reset — is ready and takes about 15 minutes. You\'ll feel it working before you finish.')}
${p('Move slow on every rep. No pain — if something pinches, back off. This is about control and position, not effort.')}
${p('Do this today. Tomorrow I\'m sending Day 2.')}
${divider()}
${p('One more thing.')}
${p('The reset gives you 5 days of relief. But relief isn\'t the same as rebuilding.')}
${p('After Day 5, I\'m going to show you what comes next — the full system that keeps the reset working and adds performance on top of it.')}
${p('It\'s called <strong>Stay Ready</strong>. It\'s $27/month. And your first month is the rebuild that makes everything else possible.')}
${p('More on that Day 5.', { muted: true })}
${sig('Ty<br>Built to Hoop')}
`},

  // EMAIL 1 — DAY 1 / HIP EDUCATION (pure education/sell)
  {
    filename: 'email-1-hip-education.html',
    subject: 'your hips are lying to you',
    preheader: 'It\'s not that your hips are tight. It\'s that they shut down.',
    body: `
${hero('Day 1 · Hips', `Your hips are ${g('lying')} to you.`)}
${p('Here\'s what nobody tells you about hip tightness:')}
${p('It\'s not that your hips are tight.')}
${p('It\'s that your hips <strong>shut down</strong> — and your lower back took over to protect them.')}
${p('Every lateral cut. Every hard stop. Every time you planted on the wrong angle and felt that pull — your hips were supposed to absorb that. But if they\'ve never been trained to load and reset, they stop doing the job.')}
${p('So your back tightens. Your knees start compensating. Your first step gets slower without you realizing why.')}
${p('That\'s the cycle.')}
${divider()}
${p('The reset you\'re doing this week interrupts it. But only for a few days.')}
${p('What actually fixes it is a progressive system that teaches your hips to load properly and keep loading. That\'s Phase 1 of the BTH method — <strong>the rebuild month.</strong>')}
${p('You\'ll hear more about that on Day 5.')}
${divider()}
${p('For now — did you do the Day 1 hip reset? If not, do it before Day 2 hits tomorrow.')}
${p('<strong>15 minutes. Today.</strong>')}
${sig()}
`},

  // EMAIL 2 — DAY 2 / ANKLE RESET
  {
    filename: 'email-2-day2-ankle-reset.html',
    subject: 'the cycle every hooper is stuck in',
    preheader: 'You feel good, you push it, something hurts, you back off, you start over.',
    body: `
${hero('Day 2 · Ankles', `The cycle every hooper's ${g('stuck')} in.`)}
${p('Day 2 is ready: Ankle Reset. The link\'s below — but first, let me tell you something.')}
${p('I know why you\'re on this list.')}
${p('You\'ve been stuck in the cycle.')}
${p('You feel good. You get back to playing. You push it. Something starts hurting. You back off. You lose the progress. You start over.')}
${p('Maybe it\'s been months. Maybe years.')}
${p('It\'s not because you\'re getting old. It\'s not bad luck. It\'s not that pickup is too hard on your body.')}
${p('It\'s because you\'ve never had a training system built around pickup.')}
${p('Everything you\'ve tried — YouTube workouts, gym programs, "just rest more" — was built for someone else. Not for a guy who plays 3 nights a week, goes to the gym in between, and wonders why his body never cooperates.')}
${p('<strong>BTH exists to break that cycle.</strong>')}
${p('The reset is 5 days. The real system is month by month. And the first month — the rebuild — is where Stay Ready starts.')}
${p('It rebuilds the base: hips, ankles, knees, core, tendon prep. In the right order. Around pickup, not against it.')}
${p('More on Day 5.', { muted: true })}
${resetButton(2, 'Ankle Reset', 'BTH-Reset-Day-02-Ankle-Reset.pdf')}
${p('Your ankles are probably the real reason your knees hurt. Today trains the real system — not just taping over it.', { size: 14, muted: true })}
${sig()}
`},

  // EMAIL 3 — DAY 3 / MEMBERSHIP REVEAL
  {
    filename: 'email-3-day3-membership-reveal.html',
    subject: 'what month 1 actually looks like',
    preheader: 'You\'re halfway through the reset. Here\'s what comes after it.',
    body: `
${hero('Day 3 · The System', `What month 1 ${g('actually')} looks like.`)}
${p('Day 3. You\'re halfway through the reset.')}
${p('Today I want to show you what comes after it.')}
${divider()}
${h('Stay Ready — $27/month. Cancel anytime.')}
${p('Here\'s what happens:')}
${h('Month 1 — Foundation', 3)}
${p('This is where the rebuild starts. 6 weeks of structured training that fixes the body before it tries to perform. Hips, ankles, knees, tendons, core movement patterns. The readiness framework so you always know when to train and when to back off. Built around pickup, not against it.')}
${p('<em>Foundation is your first month inside Stay Ready — not a separate purchase.</em>', { size: 14, muted: true })}
${h('Month 2+ — The Strength Block', 3)}
${p('After month 1, you move into the performance layer. Strength to bounce. Game speed. Deceleration. Pickup-specific conditioning. The phase where your legs start feeling different by warmups.')}
${h('Also included, from day 1:', 3)}
${ul(['Hip Reset Track','Knee Protection Track','Ankle Rebuild Track','Skill Builder','Recovery System'])}
${p('All of it. $27/month. Cancel anytime, keep everything you download.')}
${p('The full link goes live on Day 5.', { muted: true })}
${resetButton(3, 'Movement Control', 'BTH-Reset-Day-03-Movement-Control.pdf')}
${p('Today the hip and ankle work start talking to each other.', { size: 14, muted: true })}
${sig()}
`},

  // EMAIL 4 — DAY 4 / STORY
  {
    filename: 'email-4-day4-core-story.html',
    subject: 'the guy who almost stopped playing at 27',
    preheader: 'Could be you. Could be me. Could be someone you run with.',
    body: `
${hero('Day 4 · The Story', `The guy who almost ${g('quit')} at 27.`)}
${p('Day 4. Almost there.')}
${p('Let me tell you about a guy — could be you, could be me, could be someone you run with.')}
${p('27 years old. Played pickup three nights a week all through college. Then life happened — desk job, less playing time, came back at 25 and nothing worked the same.')}
${p('Hips tight every time he got to the gym. Knees barking after hard sessions. First step gone. Not slower — just not there.')}
${p('He tried everything. Stretched more. Bought a program. Rested for two weeks. Came back and it was the same.')}
${divider()}
${p('What he didn\'t know: <strong>his body had never been trained to handle pickup AND gym work at the same time.</strong>')}
${p('Everything he\'d ever done in the gym was built for someone who only went to the gym.')}
${p('No one had ever given him a system that accounted for pickup recovery, lateral load, tendon prep, and the specific kind of fatigue that comes from playing 3 nights a week on hardwood.')}
${p('He found the BTH method. Did the rebuild month. Eight weeks later he was playing full speed without dreading the next day.')}
${p('Not because it was magic. Because for the first time, the training matched the sport.')}
${p('<strong>That\'s what Stay Ready is.</strong>')}
${divider()}
${p('Tomorrow is Day 5 — your final reset day, and the day I send you the link to join.', { muted: true })}
${resetButton(4, 'Strength That Moves', 'BTH-Reset-Day-04-Strength-That-Moves.pdf')}
${p('Strength that supports movement — not strength that stays in the gym. This is the foundation that makes Day 5 possible.', { size: 14, muted: true })}
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
${p('You made it through the reset. If you did all 5 days, your hips are looser, your ankles have more range, and your knees are less compressed than they were on Day 1.')}
${p('That\'s real. That\'s the BTH method working.')}
${p('Here\'s the truth: <strong>the reset is maintenance, not building.</strong> It gets your body back to baseline. It doesn\'t keep building once you stop opening the emails.')}
${p('The reset ends today. The work doesn\'t have to.')}
${p('Stay Ready is the system that keeps going where the reset stops — same method, same coaching voice, now in the BTH app so it fits into the weeks you actually play.')}
${membershipCta(true)}
${divider()}
${h('What you get starting today:')}
${h('Month 1 — Foundation', 3)}
${p('6-week base program. Hips, ankles, knees, core, tendon prep, readiness framework. Built around pickup. 3 days/week. Progressive.')}
${h('Month 2+ — The Strength Block', 3)}
${p('Strength to bounce, game speed, pickup conditioning. This is where the legs start feeling different.')}
${p('<strong>All included:</strong> Hip Reset, Knee Protection, Ankle Rebuild, Skill Builder, Recovery System.')}
${p('Cancel anytime. Keep everything you download. <strong>$27/month.</strong>')}
${resetButton(5, 'Power Reset', 'BTH-Reset-Day-05-Power-Reset.pdf')}
${p('Your last reset day — convert five days of work into game-ready power. Then ask yourself: am I looser than I was on Day 1?', { size: 14, muted: true })}
${sig()}
`},

  // EMAIL 6 — THE CLOSE (no reset content, no fake deadlines)
  {
    filename: 'email-6-the-close.html',
    subject: 'The reset\'s done. Keep the body that earned it.',
    preheader: 'A reset is maintenance, not building. Keep going and you build on top of it.',
    body: `
${hero('The Close', `Keep the body you ${g('earned.')}`)}
${p('Straight talk.')}
${p('You finished the reset. Five days in, your hips are looser, your ankles move better, your knees feel less stacked. You earned that — and you did the work to get it.')}
${p('Here\'s the part most guys miss: a reset is maintenance, not building. Stop now and it slips back in a few weeks. Keep going and you build on top of it instead.')}
${p('That\'s the whole difference between Stay Ready and everything else you\'ve tried.')}
${h('What you\'re actually getting:')}
${ul([
  'The full BTH method — the rebuild month, then the performance layer, run for you month to month',
  'Hip Reset, Knee Protection, Ankle Rebuild, Skill Builder, and Recovery System — all included',
  'The BTH app, so the training lives on your phone instead of in your inbox',
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
    preheader: 'I\'m not going to hit you with another discount. Just one real question.',
    body: `
${hero('Still In?', `What's ${g('stopping')} you?`)}
${p('I\'m not going to hit you with another discount.')}
${p('I just want to ask you something real:')}
${p('<strong>What\'s stopping you?</strong>')}
${p('Is it the price? ($27/month — that\'s one pickup session\'s worth of gym cost)')}
${p('Is it timing? (Month 1 is designed for guys who play 2–3x/week and have a regular life)')}
${p('Is it trust? (That one I can\'t argue — you\'d have to try it)')}
${divider()}
${p('Whatever it is — hit reply and tell me. I\'ll give you a straight answer.')}
${p('If you\'re in a spot where your body is the thing keeping you from playing the way you want — Stay Ready is built for exactly that.')}
${membershipCta(false)}
${p('If you\'re genuinely not interested, no hard feelings. The reset was free and I hope it helped.', { muted: true, size: 14 })}
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
