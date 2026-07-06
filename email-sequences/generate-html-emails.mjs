// BTH Email HTML Generator — CANONICAL SOURCE OF TRUTH
// Run: node email-sequences/generate-html-emails.mjs
// Output: email-sequences/html/email-0..7.html  → seeded into Mail OS by seed-free-reset.mjs
//
// Token source: BTH/design-system/bth-system.css (the single source of truth).
// Email constraints require inline CSS — the BRAND object below mirrors bth-system.css
// dark-surface tokens. Any palette change updates bth-system.css first, then this file.
//
//   bth-system.css token → email inline value
//   --bth-gold   #E6A800  → BRAND.gold / BRAND.goldDark (BRAND.goldLight = deep #B4841A on paper)
//   --bth-black  #111318  → BRAND.header / BRAND.btnText / BRAND.inkLight
//   --bth-white  #FFFFFF  → BRAND.headerFg / BRAND.inkDark
//   --r-square   2px      → border-radius:2px on all buttons (no mid-radius)
//   --font-display Oswald → Oswald,Arial,sans-serif (safe email stack)
//   --font-body   DM Sans → 'DM Sans',Arial,sans-serif (safe email stack)
//
// Design rules (locked):
//  • PAPER-FIRST premium cream/gold, adaptive to dark mode (Ty's doctrine call,
//    2026-07-06 — supersedes the prior dark-first-only rule). Canvas/card default
//    to the "Center Court" 1A paper palette; @media (prefers-color-scheme: dark)
//    + [data-ogsc] (Outlook.com/app dark mode) flip every surface to the 1A dark
//    palette. See automations/bth-mail-os/BTH-EMAIL-STYLE.md — due for an update
//    to reflect this; the canonical palette now lives in
//    BTH/design-system/templates/bth-email-template-1A.html.
//  • LINK-ONLY reset delivery — emails NEVER list the exercises. Each reset-day email carries
//    ONE gold CTA that links to that day's real reset (the workout lives in the PDF, not the email).
//  • Membership = "Stay Ready" $27/mo (locked taxonomy). No "BTH Rise", no RISE10 discount, no hype.
//  • Checkout happens ON THE WEBSITE (CHECKOUT_URL), not Gumroad. One constant to flip at cutover.
//
// This file replaces the old generate→darkify two-step. Do not re-introduce inline workouts.
//
// BTH-GOAL-0027 update — adopts the "Center Court" email-1A shell in full: paper
// canvas by default (#EDEAE3 page / #FBF9F4 card), auto-inverting to the dark
// palette (#0B0C0F page / #17191F card) via @media (prefers-color-scheme: dark)
// and [data-ogsc] for Outlook.com/app — exactly as bth-email-template-1A.html.
// Gold (#E6A800) is the one constant that reads on both, so the CTA button
// never changes between modes. Also carries 1A's structural pieces: hidden
// preheader line, header hairline rule under the wordmark, and a bulletproof
// MSO <v:roundrect> gold button so Outlook desktop renders a real button
// instead of a plain link. The Worker's renderEmail() still injects the real
// footer (unsubscribe/preferences/postal address) — this file's own footer
// stays decorative, no {{PLACEHOLDER}} tokens (the Worker does not resolve
// {{UNSUBSCRIBE_URL}} etc. in stored HTML, so a literal placeholder would ship
// broken to inboxes).

import fs from 'fs';
import path from 'path';

const OUT_DIR = './email-sequences/html';
fs.mkdirSync(OUT_DIR, { recursive: true });

// Website checkout — everyone buys on built-to-hoop.com. The /join page routes to whatever
// processor is live (Gumroad today → owned Stripe/PayPal checkout at cutover). Flip in ONE place.
const CHECKOUT_URL = 'https://built-to-hoop.com/join';
// Base path for the real reset PDFs (restored from Ty's canonical Drive set — see reset-pdfs/generate.mjs).
const RESET_BASE = 'https://built-to-hoop.com/reset-pdfs/output';

// ─── PAPER-FIRST PALETTE (bth-email-template-1A.html "Center Court") ──────
// Light values are the CSS defaults (inline styles below); dark values are
// applied ONLY via the @media (prefers-color-scheme: dark) + [data-ogsc]
// overrides in wrap()'s <style> block, matching 1A exactly. Gold is the one
// constant — same hex in both modes.
const BRAND = {
  // paper (light, default)
  pageLight:   '#EDEAE3',
  cardLight:   '#FBF9F4',
  borderLight: '#E1DCD0',
  inkLight:    '#111318',
  bodyLight:   '#45474D',
  goldLight:   '#B4841A', // deep gold — reads on paper (wordmark accent, eyebrow, links)
  mutedLight:  '#8A8578',
  // dark (auto, via media query / [data-ogsc])
  pageDark:    '#0B0C0F',
  cardDark:    '#17191F',
  borderDark:  '#2A2D35',
  inkDark:     '#F3EFE7',
  bodyDark:    '#C9CBD0',
  goldDark:    '#E6A800', // electric gold — reads on dark
  mutedDark:   '#8A8D94',
  // constants
  gold:        '#E6A800', // CTA button fill — identical in both modes (1A rule)
  btnText:     '#111318',
  header:      '#111318', // header band + footer band stay near-black in BOTH modes (1A keeps the wordmark strip dark on paper too)
  headerFg:    '#FFFFFF',
};

function wrap(subject, bodyHtml, preheader) {
  const preheaderText = preheader || 'A training system built around how pickup basketball actually loads your body.';
  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${subject}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    html, body { margin:0 !important; padding:0 !important; width:100% !important; }
    body { background:${BRAND.pageLight}; -webkit-text-size-adjust:100%; }
    table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; border-collapse:collapse; }
    a { color:${BRAND.goldLight}; }

    /* ---- DARK MODE (Apple Mail, iOS, modern clients) ---- */
    @media (prefers-color-scheme: dark) {
      .bg-page     { background:${BRAND.pageDark} !important; }
      .bg-card     { background:${BRAND.cardDark} !important; }
      .border-card { border-color:${BRAND.borderDark} !important; }
      .t-ink       { color:${BRAND.inkDark} !important; }
      .t-body      { color:${BRAND.bodyDark} !important; }
      .t-gold      { color:${BRAND.goldDark} !important; }
      .t-muted     { color:${BRAND.mutedDark} !important; }
      .rule        { background-color:${BRAND.borderDark} !important; }
      .link        { color:${BRAND.goldDark} !important; }
    }
    /* ---- DARK MODE (Outlook.com / Outlook app) ---- */
    [data-ogsc] .bg-page     { background:${BRAND.pageDark} !important; }
    [data-ogsc] .bg-card     { background:${BRAND.cardDark} !important; }
    [data-ogsc] .border-card { border-color:${BRAND.borderDark} !important; }
    [data-ogsc] .t-ink       { color:${BRAND.inkDark} !important; }
    [data-ogsc] .t-body      { color:${BRAND.bodyDark} !important; }
    [data-ogsc] .t-gold      { color:${BRAND.goldDark} !important; }
    [data-ogsc] .t-muted     { color:${BRAND.mutedDark} !important; }
    [data-ogsc] .rule        { background-color:${BRAND.borderDark} !important; }
    [data-ogsc] .link        { color:${BRAND.goldDark} !important; }

    @media only screen and (max-width:620px) {
      .email-wrap { padding:16px 0 !important; }
      .email-body { padding:32px 24px !important; }
      .email-header { padding:20px 24px !important; }
      .email-footer { padding:24px 24px !important; }
      .btn { padding:14px 24px !important; font-size:14px !important; }
    }
  </style>
</head>
<body class="bg-page" style="margin:0;padding:0;background-color:${BRAND.pageLight};font-family:'DM Sans',Arial,sans-serif;">

  <!-- PREHEADER (hidden inbox-preview line) -->
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    ${preheaderText}
  </div>

<table width="100%" cellpadding="0" cellspacing="0" border="0" class="bg-page" style="background-color:${BRAND.pageLight};">
  <tr>
    <td align="center" class="email-wrap" style="padding:32px 16px;">

      <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
      <table width="600" cellpadding="0" cellspacing="0" border="0" class="bg-card border-card" style="max-width:600px;width:100%;background-color:${BRAND.cardLight};border:1px solid ${BRAND.borderLight};border-radius:2px;">

        <!-- HEADER (near-black band, both modes — matches 1A's wordmark treatment) -->
        <tr>
          <td class="email-header" style="background:${BRAND.header};padding:24px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td>
                  <span style="font-family:Oswald,Arial,sans-serif;font-size:20px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.headerFg};">BUILT TO <span style="color:${BRAND.gold};">HOOP</span></span>
                </td>
                <td align="right">
                  <span style="font-family:'DM Sans',Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.45);">FREE 5-DAY RESET</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- header hairline (the 1A metallic-accent rule) -->
        <tr>
          <td class="bg-card" style="padding:0 40px;background-color:${BRAND.cardLight};">
            <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="height:2px;width:46px;background:${BRAND.gold};line-height:2px;font-size:1px;">&nbsp;</td></tr></table>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td class="email-body t-body" style="padding:32px 40px 40px;color:${BRAND.bodyLight};font-family:'DM Sans',Arial,sans-serif;font-size:16px;line-height:1.75;">
            ${bodyHtml}
          </td>
        </tr>

        <!-- FOOTER (near-black band, both modes) -->
        <tr>
          <td class="email-footer" style="background:${BRAND.header};padding:28px 40px;text-align:center;">
            <p style="margin:0 0 6px;font-family:Oswald,Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.headerFg};">BUILT TO <span style="color:${BRAND.gold};">HOOP</span></p>
            <p style="margin:0 0 12px;font-family:'DM Sans',Arial,sans-serif;font-size:12px;color:rgba(255,255,255,0.45);">built-to-hoop.com · tyrell@built-to-hoop.com</p>
            <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.3);line-height:1.6;">
              You're on this list because you signed up for the Free 5-Day Basketball Reset.
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

// Bulletproof gold button: real <table>-based fallback for every client, PLUS
// an MSO <v:roundrect> so Outlook desktop (Word rendering engine) draws an
// actual button instead of collapsing the table cell padding. Identical
// technique to bth-email-template-1A.html's CTA — gold fill is the one
// constant that never changes between light and dark mode.
function msoButton(url, label, widthPx = 260) {
  return `<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:48px;v-text-anchor:middle;width:${widthPx}px;" arcsize="4%" fillcolor="${BRAND.gold}" stroke="f">
<w:anchorlock/>
<center style="color:${BRAND.btnText};font-family:Arial,sans-serif;font-size:14px;font-weight:bold;letter-spacing:1px;">${label.toUpperCase()}</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-->
<table cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="background:${BRAND.gold};border-radius:2px;">
      <a href="${url}" class="btn" style="display:inline-block;font-family:Oswald,Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${BRAND.btnText};text-decoration:none;padding:15px 30px;">
        ${label}
      </a>
    </td>
  </tr>
</table>
<!--<![endif]-->`;
}

function greeting() {
  return `<p class="t-body" style="margin:0 0 24px;font-size:16px;color:${BRAND.bodyLight};">Hooper,</p>`;
}

function divider() {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;"><tr><td class="rule" style="height:1px;background-color:${BRAND.borderLight};line-height:1px;font-size:1px;">&nbsp;</td></tr></table>`;
}

// The ONLY reset content in an email: a single gold CTA to that day's real workout (PDF).
// No exercises in the email body — ever.
function resetButton(day, title, filename) {
  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
  <tr>
    <td>
      ${msoButton(`${RESET_BASE}/${filename}`, `Open Day ${day} — ${title}`, 300)}
      <p class="t-muted" style="margin:10px 0 0;font-size:13px;color:${BRAND.mutedLight};">The full workout, step by step. Pull it up on your phone or print it before you start.</p>
    </td>
  </tr>
</table>`;
}

function membershipCta(featured) {
  if (featured) {
    return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
  <tr>
    <td class="bg-page border-card" style="background-color:${BRAND.pageLight};border:1px solid ${BRAND.borderLight};border-left:4px solid ${BRAND.gold};padding:24px 28px;">
      <p class="t-gold" style="margin:0 0 4px;font-family:Oswald,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${BRAND.goldLight};">The next step</p>
      <p class="t-ink" style="margin:0 0 12px;font-family:Oswald,Arial,sans-serif;font-size:22px;font-weight:700;color:${BRAND.inkLight};line-height:1.2;">Stay Ready — $27/month</p>
      <p class="t-body" style="margin:0 0 16px;font-size:15px;color:${BRAND.bodyLight};line-height:1.7;">Cancel anytime. Keep everything you download. Foundation Month picks up exactly where the reset left off.</p>
      ${msoButton(CHECKOUT_URL, 'Join Stay Ready →', 240)}
    </td>
  </tr>
</table>`;
  }
  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px;">
  <tr><td>${msoButton(CHECKOUT_URL, 'Join Stay Ready →', 240)}</td></tr>
</table>`;
}

function p(text, opts = {}) {
  const mb = opts.mb !== undefined ? opts.mb : 18;
  const tone = opts.tone || 'body'; // 'body' | 'muted'
  const color = opts.color || (tone === 'muted' ? BRAND.mutedLight : BRAND.bodyLight);
  const cls = opts.color ? '' : (tone === 'muted' ? ' class="t-muted"' : ' class="t-body"');
  const size = opts.size || 16;
  return `<p${cls} style="margin:0 0 ${mb}px;font-size:${size}px;color:${color};line-height:1.75;">${text}</p>`;
}

function h(text, level = 2) {
  const sizes = { 1: 28, 2: 20, 3: 16 };
  return `<p class="t-ink" style="margin:0 0 12px;font-family:Oswald,Arial,sans-serif;font-size:${sizes[level]}px;font-weight:700;letter-spacing:0.03em;text-transform:uppercase;color:${BRAND.inkLight};">${text}</p>`;
}

function sig(name = 'Ty, BTH') {
  return `${divider()}<p class="t-body" style="margin:0;font-size:15px;color:${BRAND.bodyLight};">— ${name}<br><span class="t-muted" style="font-size:13px;color:${BRAND.mutedLight};">Built to Hoop · <a class="link" href="https://built-to-hoop.com" style="color:${BRAND.mutedLight};">built-to-hoop.com</a></span></p>`;
}

// ─── EMAILS ──────────────────────────────────────────────────────
// Reset-day emails (0,2,3,4,5) carry exactly ONE resetButton and ZERO inline exercises.

const emails = [

  // EMAIL 0 — CONFIRMATION + DAY 1
  {
    filename: 'email-0-day1-hip-release.html',
    subject: 'your reset starts now',
    body: `
${greeting()}
${p('Your 5-Day BTH Reset is live.')}
${p('Day 1 is ready. Takes about 15 minutes. You\'ll feel it working before you finish.')}
${resetButton(1, 'Hip Reset', 'BTH-Reset-Day-01-Hip-Reset.pdf')}
${p('Move slow on every rep. No pain — if something pinches, back off. This is about control and position, not effort.')}
${divider()}
${p('Do this today. Tomorrow I\'m sending Day 2.')}
${divider()}
${p('One more thing.')}
${p('The reset gives you 5 days of relief. But relief isn\'t the same as rebuilding.')}
${p('After Day 5, I\'m going to show you what comes next — the full system that keeps the reset working and adds performance on top of it.')}
${p('It\'s called <strong>Stay Ready</strong>. It\'s $27/month. And your first month is the Foundation rebuild that makes everything else possible.')}
${p('More on that Day 5.')}
${sig('Ty<br>Built to Hoop')}
`},

  // EMAIL 1 — DAY 1 / HIP EDUCATION (no reset content — pure education/sell)
  {
    filename: 'email-1-hip-education.html',
    subject: 'your hips are lying to you',
    body: `
${greeting()}
${p('Here\'s what nobody tells you about hip tightness:')}
${p('It\'s not that your hips are tight.')}
${p('It\'s that your hips <strong>shut down</strong> — and your lower back took over to protect them.')}
${p('Every lateral cut. Every hard stop. Every time you planted on the wrong angle and felt that pull — your hips were supposed to absorb that. But if they\'ve never been trained to load and reset, they stop doing the job.')}
${p('So your back tightens. Your knees start compensating. Your first step gets slower without you realizing why.')}
${p('That\'s the cycle.')}
${divider()}
${p('The reset you\'re doing this week interrupts it. But only for a few days.')}
${p('What actually fixes it is a progressive system that teaches your hips to load properly and keep loading. That\'s Phase 1 of the BTH method — what I call <strong>Foundation Month.</strong>')}
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
    body: `
${greeting()}
${p('Day 2 is ready: Ankle Reset. The link\'s below — but first, let me tell you something.')}
${p('I know why you\'re on this list.')}
${p('You\'ve been stuck in the cycle.')}
${p('You feel good. You get back to playing. You push it. Something starts hurting. You back off. You lose the progress. You start over.')}
${p('Maybe it\'s been months. Maybe years.')}
${p('It\'s not because you\'re getting old. It\'s not bad luck. It\'s not that pickup is too hard on your body.')}
${p('It\'s because you\'ve never had a training system built around pickup.')}
${p('Everything you\'ve tried — YouTube workouts, gym programs, "just rest more" — was built for someone else. Not for a guy who plays 3 nights a week, goes to the gym in between, and wonders why his body never cooperates.')}
${p('<strong>BTH exists to break that cycle.</strong>')}
${p('The reset is 5 days. The real system is month by month. And the first month — Foundation Month — is what I built Tier 1 around before I turned it into the starting point for Stay Ready.')}
${p('It rebuilds the base: hips, ankles, knees, core, tendon prep. In the right order. Around pickup, not against it.')}
${p('More on Day 5.', { tone: 'muted' })}
${resetButton(2, 'Ankle Reset', 'BTH-Reset-Day-02-Ankle-Reset.pdf')}
${p('Your ankles are probably the real reason your knees hurt. Today trains the real system — not just taping over it.', { size: 14, tone: 'muted' })}
${sig()}
`},

  // EMAIL 3 — DAY 3 / MEMBERSHIP REVEAL
  {
    filename: 'email-3-day3-membership-reveal.html',
    subject: 'what Foundation Month actually looks like',
    body: `
${greeting()}
${p('Day 3. You\'re halfway through the reset.')}
${p('Today I want to show you what comes after it.')}
${divider()}
${h('Stay Ready — $27/month. Cancel anytime.')}
${p('Here\'s what happens:')}

${h('Month 1 — Foundation', 3)}
${p('This is where the rebuild starts. 6 weeks of structured training that fixes the body before it tries to perform. Hips, ankles, knees, tendons, core movement patterns. The readiness framework so you always know when to train and when to back off. Built around pickup, not against it.')}
${p('<em class="t-muted" style="color:' + BRAND.mutedLight + ';font-size:14px;">This is what used to be Tier 1 — now it\'s your starting point inside Stay Ready.</em>')}

${h('Month 2+ — Performance Track', 3)}
${p('After Foundation, you move into the performance layer. Strength to bounce. Game speed. Deceleration. Pickup-specific conditioning. The phase where your legs start feeling different by warmups.')}

${h('Also included, from day 1:', 3)}
<ul class="t-body" style="margin:0 0 18px;padding-left:20px;color:${BRAND.bodyLight};font-size:15px;line-height:2;">
  <li>Hip Reset Track</li>
  <li>Knee Protection Track</li>
  <li>Ankle Rebuild Track</li>
  <li>Skill Builder</li>
  <li>Recovery System</li>
</ul>
${p('All of it. $27/month. Cancel anytime, keep everything you download.')}
${p('The full link goes live on Day 5.', { tone: 'muted' })}
${resetButton(3, 'Movement Control', 'BTH-Reset-Day-03-Movement-Control.pdf')}
${p('Today the hip and ankle work start talking to each other.', { size: 14, tone: 'muted' })}
${sig()}
`},

  // EMAIL 4 — DAY 4 / STORY
  {
    filename: 'email-4-day4-core-story.html',
    subject: 'the guy who almost stopped playing at 27',
    body: `
${greeting()}
${p('Day 4. Almost there.')}
${p('Let me tell you about a guy — could be you, could be me, could be someone you run with.')}
${p('27 years old. Played pickup three nights a week all through college. Then life happened — desk job, less playing time, came back at 25 and nothing worked the same.')}
${p('Hips tight every time he got to the gym. Knees barking after hard sessions. First step gone. Not slower — just not there.')}
${p('He tried everything. Stretched more. Bought a program. Rested for two weeks. Came back and it was the same.')}
${divider()}
${p('What he didn\'t know: <strong>his body had never been trained to handle pickup AND gym work at the same time.</strong>')}
${p('Everything he\'d ever done in the gym was built for someone who only went to the gym.')}
${p('No one had ever given him a system that accounted for pickup recovery, lateral load, tendon prep, and the specific kind of fatigue that comes from playing 3 nights a week on hardwood.')}
${p('He found the BTH method. Did Foundation Month. Eight weeks later he was playing full speed without dreading the next day.')}
${p('Not because it was magic. Because for the first time, the training matched the sport.')}
${p('<strong>That\'s what Stay Ready is.</strong>')}
${divider()}
${p('Tomorrow is Day 5 — your final reset day, and the day I send you the link to join.', { tone: 'muted' })}
${resetButton(4, 'Strength That Moves', 'BTH-Reset-Day-04-Strength-That-Moves.pdf')}
${p('Strength that supports movement — not strength that stays in the gym. This is the foundation that makes Day 5 possible.', { size: 14, tone: 'muted' })}
${sig()}
`},

  // EMAIL 5 — DAY 5 / OFFER
  {
    filename: 'email-5-day5-offer.html',
    subject: '5 days done. here\'s the move.',
    body: `
${greeting()}
${p('Day 5. Last one.')}
${p('You made it through the reset. If you did all 5 days, your hips are looser, your ankles have more range, and your knees are less compressed than they were on Day 1.')}
${p('That\'s real. That\'s the BTH method working.')}
${p('Here\'s the truth: <strong>the reset is maintenance, not building.</strong> It gets your body back to baseline. It doesn\'t keep building once you stop opening the emails.')}
${p('The reset ends today. The work doesn\'t have to.')}
${p('Stay Ready is the system that keeps going where the reset stops — same method, same coaching voice, now in the BTH app so it fits into the weeks you actually play.')}
${membershipCta(true)}
${divider()}
${h('What you get starting today:')}
${h('Month 1 — Foundation Rebuild', 3)}
${p('6-week base program. Hips, ankles, knees, core, tendon prep, readiness framework. Built around pickup. 3 days/week. Progressive.')}
${h('Month 2+ — Performance Track', 3)}
${p('Strength to bounce, game speed, pickup conditioning. This is where the legs start feeling different.')}
${p('<strong>All included:</strong> Hip Reset, Knee Protection, Ankle Rebuild, Skill Builder, Recovery System.')}
${p('Cancel anytime. Keep everything you download. <strong>$27/month.</strong>')}
${resetButton(5, 'Power Reset', 'BTH-Reset-Day-05-Power-Reset.pdf')}
${p('Your last reset day — convert five days of work into game-ready power. Then ask yourself: am I looser than I was on Day 1?', { size: 14, tone: 'muted' })}
${sig()}
`},

  // EMAIL 6 — THE CLOSE (no reset content, no fake deadlines)
  {
    filename: 'email-6-the-close.html',
    subject: 'The reset\'s done. Keep the body that earned it.',
    body: `
${greeting()}
${p('Straight talk.')}
${p('You finished the reset. Five days in, your hips are looser, your ankles move better, your knees feel less stacked. You earned that — and you did the work to get it.')}
${p('Here\'s the part most guys miss: a reset is maintenance, not building. Stop now and it slips back in a few weeks. Keep going and you build on top of it instead.')}
${p('That\'s the whole difference between Stay Ready and everything else you\'ve tried.')}
${h('What you\'re actually getting:')}
<ul class="t-body" style="margin:0 0 18px;padding-left:20px;color:${BRAND.bodyLight};font-size:15px;line-height:2;">
  <li>The full BTH method — Foundation Month, then the Performance Track, run for you month to month</li>
  <li>Hip Reset, Knee Protection, Ankle Rebuild, Skill Builder, and Recovery System — all included</li>
  <li>The BTH app, so the training lives on your phone instead of in your inbox</li>
</ul>
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
    body: `
${greeting()}
${p('I\'m not going to hit you with another discount.')}
${p('I just want to ask you something real:')}
${p('<strong>What\'s stopping you?</strong>')}
${p('Is it the price? ($27/month — that\'s one pickup session\'s worth of gym cost)')}
${p('Is it timing? (Foundation Month is designed for guys who play 2–3x/week and have a regular life)')}
${p('Is it trust? (That one I can\'t argue — you\'d have to try it)')}
${divider()}
${p('Whatever it is — hit reply and tell me. I\'ll give you a straight answer.')}
${p('If you\'re in a spot where your body is the thing keeping you from playing the way you want — Stay Ready is built for exactly that.')}
${membershipCta(false)}
${p('If you\'re genuinely not interested, no hard feelings. The reset was free and I hope it helped.', { tone: 'muted', size: 14 })}
${sig()}
`},
];

// ─── WRITE FILES ─────────────────────────────────────────────────

for (const email of emails) {
  const html = wrap(email.subject, email.body);
  const outPath = path.join(OUT_DIR, email.filename);
  fs.writeFileSync(outPath, html, 'utf8');
  console.log(`✓ ${email.filename}`);
}

console.log(`\nDone. ${emails.length} emails written to ${OUT_DIR}/  (paper-first, adaptive dark mode, link-only, Stay Ready)`);
