// BTH Email HTML Generator — CANONICAL SOURCE OF TRUTH
// Run: node email-sequences/generate-html-emails.mjs
// Output: email-sequences/html/email-0..7.html  → seeded into Mail OS by seed-free-reset.mjs
//
// Token source: BTH/design-system/bth-system.css (the single source of truth).
// Email constraints require inline CSS — the BRAND object below mirrors bth-system.css
// dark-surface tokens. Any palette change updates bth-system.css first, then this file.
//
//   bth-system.css token → email inline value
//   --bth-gold   #E6A800  → BRAND.gold
//   --bth-black  #111318  → BRAND.header / BRAND.btnText
//   --bth-white  #FFFFFF  → BRAND.white / BRAND.heading
//   --r-square   2px      → border-radius:2px on all buttons (no mid-radius)
//   --font-display Oswald → Oswald,Arial,sans-serif (safe email stack)
//   --font-body   DM Sans → 'DM Sans',Arial,sans-serif (safe email stack)
//
// Design rules (locked):
//  • DARK-FIRST premium black/gold (see automations/bth-mail-os/BTH-EMAIL-STYLE.md).
//    Light emails get force-inverted to mud by Gmail/iOS dark mode; dark designs are left alone.
//  • LINK-ONLY reset delivery — emails NEVER list the exercises. Each reset-day email carries
//    ONE gold CTA that links to that day's real reset (the workout lives in the PDF, not the email).
//  • Membership = "Stay Ready" $27/mo (locked taxonomy). No "BTH Rise", no RISE10 discount, no hype.
//  • Checkout happens ON THE WEBSITE (CHECKOUT_URL), not Gumroad. One constant to flip at cutover.
//
// This file replaces the old generate→darkify two-step. Do not re-introduce inline workouts.

import fs from 'fs';
import path from 'path';

const OUT_DIR = './email-sequences/html';
fs.mkdirSync(OUT_DIR, { recursive: true });

// Website checkout — everyone buys on built-to-hoop.com. The /join page routes to whatever
// processor is live (Gumroad today → owned Stripe/PayPal checkout at cutover). Flip in ONE place.
const CHECKOUT_URL = 'https://built-to-hoop.com/join';
// Base path for the real reset PDFs (restored from Ty's canonical Drive set — see reset-pdfs/generate.mjs).
const RESET_BASE = 'https://built-to-hoop.com/reset-pdfs/output';

// ─── DARK PALETTE (BTH-EMAIL-STYLE.md) ───────────────────────────
const BRAND = {
  canvas:  '#0B0C0F',
  card:    '#15171C',
  header:  '#111318',
  border:  '#2A2D34',
  gold:    '#E6A800',
  white:   '#FFFFFF',
  heading: '#FFFFFF',
  body:    '#D7D9DE',
  muted:   '#A8ABB2',
  btnText: '#111318',
};

function wrap(subject, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="dark light">
  <meta name="supported-color-schemes" content="dark light">
  <title>${subject}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');
    body { margin:0; padding:0; background:${BRAND.canvas}; -webkit-text-size-adjust:100%; }
    a { color:${BRAND.gold}; }
    @media only screen and (max-width:620px) {
      .email-wrap { padding:16px 0 !important; }
      .email-body { padding:32px 24px !important; }
      .email-header { padding:20px 24px !important; }
      .email-footer { padding:24px 24px !important; }
      .btn { padding:14px 24px !important; font-size:14px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${BRAND.canvas};font-family:'DM Sans',Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.canvas};">
  <tr>
    <td align="center" class="email-wrap" style="padding:32px 16px;">

      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:${BRAND.card};border:1px solid ${BRAND.border};">

        <!-- HEADER -->
        <tr>
          <td class="email-header" style="background:${BRAND.header};padding:24px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td>
                  <span style="font-family:Oswald,Arial,sans-serif;font-size:20px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.white};">BUILT TO <span style="color:${BRAND.gold};">HOOP</span></span>
                </td>
                <td align="right">
                  <span style="font-family:'DM Sans',Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.45);">FREE 5-DAY RESET</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td class="email-body" style="padding:40px;color:${BRAND.body};font-family:'DM Sans',Arial,sans-serif;font-size:16px;line-height:1.75;">
            ${bodyHtml}
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td class="email-footer" style="background:${BRAND.header};padding:28px 40px;text-align:center;">
            <p style="margin:0 0 6px;font-family:Oswald,Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.white};">BUILT TO <span style="color:${BRAND.gold};">HOOP</span></p>
            <p style="margin:0 0 12px;font-family:'DM Sans',Arial,sans-serif;font-size:12px;color:rgba(255,255,255,0.45);">built-to-hoop.com · tyrell@built-to-hoop.com</p>
            <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.3);line-height:1.6;">
              You're on this list because you signed up for the Free 5-Day Basketball Reset.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

// ─── HELPERS ─────────────────────────────────────────────────────

function greeting() {
  return `<p style="margin:0 0 24px;font-size:16px;color:${BRAND.body};">Hooper,</p>`;
}

function divider() {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;"><tr><td style="height:1px;background:${BRAND.border};"></td></tr></table>`;
}

// The ONLY reset content in an email: a single gold CTA to that day's real workout (PDF).
// No exercises in the email body — ever.
function resetButton(day, title, filename) {
  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
  <tr>
    <td>
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="background:${BRAND.gold};border-radius:2px;">
            <a href="${RESET_BASE}/${filename}"
               class="btn"
               style="display:inline-block;font-family:Oswald,Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${BRAND.btnText};text-decoration:none;padding:15px 30px;">
              ↓ Open Day ${day} — ${title}
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:10px 0 0;font-size:13px;color:${BRAND.muted};">The full workout, step by step. Pull it up on your phone or print it before you start.</p>
    </td>
  </tr>
</table>`;
}

function membershipCta(featured) {
  if (featured) {
    return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
  <tr>
    <td style="background:${BRAND.canvas};border:1px solid ${BRAND.border};border-left:4px solid ${BRAND.gold};padding:24px 28px;">
      <p style="margin:0 0 4px;font-family:Oswald,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${BRAND.gold};">The next step</p>
      <p style="margin:0 0 12px;font-family:Oswald,Arial,sans-serif;font-size:22px;font-weight:700;color:${BRAND.heading};line-height:1.2;">Stay Ready — $27/month</p>
      <p style="margin:0 0 16px;font-size:15px;color:${BRAND.body};line-height:1.7;">Cancel anytime. Keep everything you download. Foundation Month picks up exactly where the reset left off.</p>
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="background:${BRAND.gold};border-radius:2px;">
            <a href="${CHECKOUT_URL}" class="btn"
               style="display:inline-block;font-family:Oswald,Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${BRAND.btnText};text-decoration:none;padding:15px 30px;">
              Join Stay Ready →
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
  }
  return `
<p style="margin:24px 0 8px;">
  <a href="${CHECKOUT_URL}"
     style="display:inline-block;font-family:Oswald,Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${BRAND.btnText};background:${BRAND.gold};text-decoration:none;padding:15px 30px;border-radius:2px;">
    Join Stay Ready →
  </a>
</p>`;
}

function p(text, opts = {}) {
  const mb = opts.mb !== undefined ? opts.mb : 18;
  const color = opts.color || BRAND.body;
  const size = opts.size || 16;
  return `<p style="margin:0 0 ${mb}px;font-size:${size}px;color:${color};line-height:1.75;">${text}</p>`;
}

function h(text, level = 2) {
  const sizes = { 1: 28, 2: 20, 3: 16 };
  return `<p style="margin:0 0 12px;font-family:Oswald,Arial,sans-serif;font-size:${sizes[level]}px;font-weight:700;letter-spacing:0.03em;text-transform:uppercase;color:${BRAND.heading};">${text}</p>`;
}

function sig(name = 'Ty, BTH') {
  return `${divider()}<p style="margin:0;font-size:15px;color:${BRAND.body};">— ${name}<br><span style="font-size:13px;color:${BRAND.muted};">Built to Hoop · <a href="https://built-to-hoop.com" style="color:${BRAND.muted};">built-to-hoop.com</a></span></p>`;
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
${p('More on Day 5.', { color: BRAND.muted })}
${resetButton(2, 'Ankle Reset', 'BTH-Reset-Day-02-Ankle-Reset.pdf')}
${p('Your ankles are probably the real reason your knees hurt. Today trains the real system — not just taping over it.', { size: 14, color: BRAND.muted })}
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
${p('<em style="color:' + BRAND.muted + ';font-size:14px;">This is what used to be Tier 1 — now it\'s your starting point inside Stay Ready.</em>')}

${h('Month 2+ — Performance Track', 3)}
${p('After Foundation, you move into the performance layer. Strength to bounce. Game speed. Deceleration. Pickup-specific conditioning. The phase where your legs start feeling different by warmups.')}

${h('Also included, from day 1:', 3)}
<ul style="margin:0 0 18px;padding-left:20px;color:${BRAND.body};font-size:15px;line-height:2;">
  <li>Hip Reset Track</li>
  <li>Knee Protection Track</li>
  <li>Ankle Rebuild Track</li>
  <li>Skill Builder</li>
  <li>Recovery System</li>
</ul>
${p('All of it. $27/month. Cancel anytime, keep everything you download.')}
${p('The full link goes live on Day 5.', { color: BRAND.muted })}
${resetButton(3, 'Movement Control', 'BTH-Reset-Day-03-Movement-Control.pdf')}
${p('Today the hip and ankle work start talking to each other.', { size: 14, color: BRAND.muted })}
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
${p('Tomorrow is Day 5 — your final reset day, and the day I send you the link to join.', { color: BRAND.muted })}
${resetButton(4, 'Strength That Moves', 'BTH-Reset-Day-04-Strength-That-Moves.pdf')}
${p('Strength that supports movement — not strength that stays in the gym. This is the foundation that makes Day 5 possible.', { size: 14, color: BRAND.muted })}
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
${p('But here\'s the truth: <strong>the reset is maintenance, not building.</strong>')}
${p('The reset gets you back to baseline. Foundation Month builds you above it.')}
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
${p('Your last reset day — convert five days of work into game-ready power. Then ask yourself: am I looser than I was on Day 1?', { size: 14, color: BRAND.muted })}
${sig()}
`},

  // EMAIL 6 — URGENCY CLOSE (no reset content)
  {
    filename: 'email-6-urgency-close.html',
    subject: 'The reset\'s done. Keep the body that earned it.',
    body: `
${greeting()}
${p('Quick one.')}
${p('You finished the reset. Five days in, your hips are looser, your ankles move better, your knees feel less stacked. You earned that.')}
${p('But a reset is maintenance, not building. Stop now and it slips. Keep going and you build on top of it.')}
${p('That\'s what Stay Ready is for. Foundation Month picks up exactly where the reset left off — $27/month, cancel anytime, keep everything you download.')}
${membershipCta(false)}
${p('Questions? Reply to this email. I read every one.')}
${p('Not ready yet? No pressure — the list stays open. But the body you just earned is worth keeping.')}
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
${p('If you\'re genuinely not interested, no hard feelings. The reset was free and I hope it helped.', { color: BRAND.muted, size: 14 })}
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

console.log(`\nDone. ${emails.length} emails written to ${OUT_DIR}/  (dark, link-only, Stay Ready)`);
