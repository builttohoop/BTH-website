// BTH Email HTML Generator
// Run: node generate-html-emails.mjs
// Output: email-sequences/html/email-0.html ... email-7.html

import fs from 'fs';
import path from 'path';

const OUT_DIR = './email-sequences/html';
fs.mkdirSync(OUT_DIR, { recursive: true });

// ─── SHARED STYLES ───────────────────────────────────────────────
const BRAND = {
  black: '#111318',
  cream: '#F3EFE7',
  gold: '#E6A800',
  white: '#FFFFFF',
  muted: '#6B7280',
};

function wrap(subject, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${subject}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');
    body { margin:0; padding:0; background:${BRAND.cream}; -webkit-text-size-adjust:100%; }
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
<body style="margin:0;padding:0;background:${BRAND.cream};font-family:'DM Sans',Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.cream};">
  <tr>
    <td align="center" class="email-wrap" style="padding:32px 16px;">

      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:${BRAND.white};border:1px solid rgba(17,19,24,0.1);">

        <!-- HEADER -->
        <tr>
          <td class="email-header" style="background:${BRAND.black};padding:24px 40px;">
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
          <td class="email-body" style="padding:40px;color:${BRAND.black};font-family:'DM Sans',Arial,sans-serif;font-size:16px;line-height:1.75;">
            ${bodyHtml}
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td class="email-footer" style="background:${BRAND.black};padding:28px 40px;text-align:center;">
            <p style="margin:0 0 6px;font-family:Oswald,Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.white};">BUILT TO <span style="color:${BRAND.gold};">HOOP</span></p>
            <p style="margin:0 0 12px;font-family:'DM Sans',Arial,sans-serif;font-size:12px;color:rgba(255,255,255,0.45);">built-to-hoop.com · tyrell@built-to-hoop.com</p>
            <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.3);line-height:1.6;">
              You're on this list because you signed up for the Free 5-Day Basketball Reset.<br>
              <a href="{$unsubscribe}" style="color:rgba(255,255,255,0.4);text-decoration:underline;">Unsubscribe</a>
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
  return `<p style="margin:0 0 24px;font-size:16px;color:${BRAND.black};">{$name|Hooper},</p>`;
}

function divider() {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;"><tr><td style="height:1px;background:rgba(17,19,24,0.1);"></td></tr></table>`;
}

function pdfButton(day, filename) {
  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 28px;">
  <tr>
    <td>
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="background:${BRAND.gold};border-radius:2px;">
            <a href="https://built-to-hoop.com/reset-pdfs/output/${filename}"
               class="btn"
               style="display:inline-block;font-family:Oswald,Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${BRAND.black};text-decoration:none;padding:14px 28px;">
              ↓ Download Day ${day} Workout Guide (PDF)
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:8px 0 0;font-size:12px;color:${BRAND.muted};">Print it or pull it up on your phone before you start.</p>
    </td>
  </tr>
</table>`;
}

function membershipCta(code) {
  const link = 'https://builttohoop.gumroad.com/l/thxqs';
  if (code) {
    return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
  <tr>
    <td style="background:${BRAND.cream};border:1px solid rgba(17,19,24,0.12);border-left:4px solid ${BRAND.gold};padding:24px 28px;">
      <p style="margin:0 0 4px;font-family:Oswald,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${BRAND.gold};">Limited Offer</p>
      <p style="margin:0 0 12px;font-family:Oswald,Arial,sans-serif;font-size:22px;font-weight:700;color:${BRAND.black};line-height:1.2;">10% Off Your First Month</p>
      <p style="margin:0 0 16px;font-size:15px;color:${BRAND.black};">Use code <strong style="color:${BRAND.gold};letter-spacing:0.08em;">RISE10</strong> at checkout. $27/mo becomes <strong>$24.30</strong> your first month. Expires in 48 hours.</p>
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="background:${BRAND.black};border-radius:2px;">
            <a href="${link}" class="btn"
               style="display:inline-block;font-family:Oswald,Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${BRAND.white};text-decoration:none;padding:14px 28px;">
              Join BTH Rise — Use RISE10 →
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
  } else {
    return `
<p style="margin:24px 0 8px;">
  <a href="${link}"
     style="display:inline-block;font-family:Oswald,Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${BRAND.white};background:${BRAND.black};text-decoration:none;padding:14px 28px;border-radius:2px;">
    Join BTH Rise →
  </a>
</p>`;
  }
}

function workoutSection(title, exercises) {
  const rows = exercises.map(ex => `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid rgba(17,19,24,0.08);">
        <p style="margin:0 0 4px;font-family:Oswald,Arial,sans-serif;font-size:15px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${BRAND.black};">${ex.name}</p>
        <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:${BRAND.gold};">${ex.sets}</p>
        <p style="margin:0;font-size:13px;color:${BRAND.muted};line-height:1.65;">${ex.cue}</p>
      </td>
    </tr>`).join('');

  return `
${divider()}
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0;background:${BRAND.cream};border:1px solid rgba(17,19,24,0.1);">
  <tr>
    <td style="background:${BRAND.black};padding:14px 24px;">
      <span style="font-family:Oswald,Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${BRAND.gold};">TODAY'S WORKOUT</span>
      <span style="font-family:Oswald,Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-left:12px;">— ${title}</span>
    </td>
  </tr>
  <tr>
    <td style="padding:4px 24px 8px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${rows}
      </table>
    </td>
  </tr>
</table>`;
}

function p(text, opts = {}) {
  const mb = opts.mb !== undefined ? opts.mb : 18;
  const color = opts.color || BRAND.black;
  const size = opts.size || 16;
  return `<p style="margin:0 0 ${mb}px;font-size:${size}px;color:${color};line-height:1.75;">${text}</p>`;
}

function h(text, level = 2) {
  const sizes = { 1: 28, 2: 20, 3: 16 };
  return `<p style="margin:0 0 12px;font-family:Oswald,Arial,sans-serif;font-size:${sizes[level]}px;font-weight:700;letter-spacing:0.03em;text-transform:uppercase;color:${BRAND.black};">${text}</p>`;
}

function sig(name = 'Ty, BTH') {
  return `${divider()}<p style="margin:0;font-size:15px;color:${BRAND.black};">— ${name}<br><span style="font-size:13px;color:${BRAND.muted};">Built to Hoop · <a href="https://built-to-hoop.com" style="color:${BRAND.muted};">built-to-hoop.com</a></span></p>`;
}

// ─── EMAILS ──────────────────────────────────────────────────────

const emails = [

  // EMAIL 0 — CONFIRMATION + DAY 1
  {
    filename: 'email-0-day1-hip-release.html',
    subject: 'your reset starts now',
    body: `
${greeting()}
${p('Your 5-Day BTH Reset is live.')}
${p('Day 1 is below. Takes 10 minutes. You\'ll feel it working before you finish.')}

${pdfButton(1, 'BTH-Reset-Day-01-Hip-Release.pdf')}

${workoutSection('Hip Release', [
  { name: '90/90 Hip Switch', sets: '3 rounds · 30 sec each side', cue: 'Sit on the floor, both legs bent at 90°. Rotate slowly side to side. Let the back hip open.' },
  { name: 'Couch Stretch', sets: '2 rounds · 45 sec each leg', cue: 'Back knee on the floor, front foot forward. Drive hips forward. You\'ll feel the hip flexor immediately.' },
  { name: 'Glute Bridge Hold', sets: '3 rounds · 10 reps + 3 sec hold at top', cue: 'Feet flat, drive through heels, squeeze at the top. Your glutes are probably not firing the way they should.' },
])}

${divider()}
${p('Do this today. Tomorrow I\'m sending Day 2.')}
${divider()}
${p('One more thing.')}
${p('The reset gives you 5 days of relief. But relief isn\'t the same as rebuilding.')}
${p('After Day 5, I\'m going to show you what comes next — the full system that keeps the reset working and adds performance on top of it.')}
${p('It\'s called <strong>BTH Rise</strong>. It\'s $27/month. And your first month is the Foundation rebuild that makes everything else possible.')}
${p('More on that Day 5.')}
${sig('Ty<br>Built to Hoop')}
`},

  // EMAIL 1 — DAY 1 / HIP EDUCATION
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
${p('For now — did you do the Day 1 hip sequence? If not, do it before Day 2 hits tomorrow.')}
${p('<strong>10 minutes. Today.</strong>')}
${sig()}
`},

  // EMAIL 2 — DAY 2 / ANKLE RESET
  {
    filename: 'email-2-day2-ankle-reset.html',
    subject: 'the cycle every hooper is stuck in',
    body: `
${greeting()}
${p('Day 2. Ankles today. Check the bottom of this email.')}
${p('But first — let me tell you something.')}
${p('I know why you\'re on this list.')}
${p('You\'ve been stuck in the cycle.')}
${p('You feel good. You get back to playing. You push it. Something starts hurting. You back off. You lose the progress. You start over.')}
${p('Maybe it\'s been months. Maybe years.')}
${p('It\'s not because you\'re getting old. It\'s not bad luck. It\'s not that pickup is too hard on your body.')}
${p('It\'s because you\'ve never had a training system built around pickup.')}
${p('Everything you\'ve tried — YouTube workouts, gym programs, "just rest more" — was built for someone else. Not for a guy who plays 3 nights a week, goes to the gym in between, and wonders why his body never cooperates.')}
${p('<strong>BTH exists to break that cycle.</strong>')}
${p('The reset is 5 days. The real system is month by month. And the first month — Foundation Month — is what I built Tier 1 around before I turned it into the starting point for BTH Rise.')}
${p('It rebuilds the base: hips, ankles, knees, core, tendon prep. In the right order. Around pickup, not against it.')}
${p('More on Day 5.', { color: BRAND.muted })}
${divider()}
${pdfButton(2, 'BTH-Reset-Day-02-Ankle-Reset.pdf')}
${workoutSection('Ankle & Lower Leg Reset', [
  { name: 'Tibialis Raise', sets: '3 × 15 reps', cue: 'Stand with your back against a wall, heels 6 inches out. Lift your toes up. This wakes up the muscle most ignored in ankle health.' },
  { name: 'Calf Raise Eccentric', sets: '3 × 10 (3 sec down, explode up)', cue: 'Two up, one down, slow on the way down. The eccentric is where the tendon work happens.' },
  { name: 'Single-Leg Balance Reach', sets: '2 × 30 sec each leg', cue: 'Stand on one leg, reach the other forward/side/back without your hip dropping. This trains the ankle stability that saves you on lateral cuts.' },
])}
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
${h('BTH Rise — $27/month. Cancel anytime.')}
${p('Here\'s what happens:')}

${h('Month 1 — Foundation', 3)}
${p('This is where the rebuild starts. 6 weeks of structured training that fixes the body before it tries to perform. Hips, ankles, knees, tendons, core movement patterns. The readiness framework so you always know when to train and when to back off. Built around pickup, not against it.')}
${p('<em style="color:${BRAND.muted};font-size:14px;">This is what used to be Tier 1 — now it\'s your starting point inside BTH Rise.</em>')}

${h('Month 2+ — Performance Track', 3)}
${p('After Foundation, you move into the performance layer. Strength to bounce. Game speed. Deceleration. Pickup-specific conditioning. The phase where your legs start feeling different by warmups.')}

${h('Also included, from day 1:', 3)}
<ul style="margin:0 0 18px;padding-left:20px;color:${BRAND.black};font-size:15px;line-height:2;">
  <li>Hip Reset Track</li>
  <li>Knee Protection Track</li>
  <li>Ankle Rebuild Track</li>
  <li>Skill Builder</li>
  <li>Recovery System</li>
</ul>
${p('All of it. $27/month. You can buy any of those tracks separately — they\'re $41.99 each standalone. Or join BTH Rise and have all of them plus the full program.')}
${p('<strong>The math is obvious.</strong>')}
${p('The link goes live on Day 5. I\'m giving you a 10% discount code that goes with it.', { color: BRAND.muted })}

${divider()}
${pdfButton(3, 'BTH-Reset-Day-03-Knee-Quad-Reset.pdf')}
${workoutSection('Knee + Quad Reset', [
  { name: 'Spanish Squat', sets: '3 × 10 · 3 sec hold at bottom', cue: 'Strap or post hold, heels down, load the quads in the deepest position. This is direct patellar tendon work.' },
  { name: 'VMO Lunge', sets: '3 × 8 each leg', cue: 'Front foot elevated slightly, drop the back knee slow. You\'ll feel the inner quad firing.' },
  { name: 'Posterior Chain Bridge (single leg)', sets: '2 × 12 each leg', cue: 'One leg glute bridge. Drive through heel. This balances the quad dominance most hoopers have.' },
])}
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
${p('<strong>That\'s what BTH Rise is.</strong>')}
${divider()}
${p('Tomorrow is Day 5 — your final reset day, and the day I send you the membership link with the discount.', { color: BRAND.muted })}

${pdfButton(4, 'BTH-Reset-Day-04-Core-Movement-Quality.pdf')}
${workoutSection('Core + Movement Quality', [
  { name: 'Dead Bug', sets: '3 × 8 each side', cue: 'Back flat, lower opposite arm/leg slowly, don\'t let your back arch. This is basketball-specific core stability.' },
  { name: 'Pallof Press', sets: '3 × 10 each side (band or cable)', cue: 'Anti-rotation. The core work that transfers to cuts, not crunches.' },
  { name: 'Hip 90/90 to Tall Kneeling', sets: '2 × 5 each', cue: 'Sit in 90/90, rise to tall kneeling without using your hands. Connects hip mobility to core stability.' },
])}
${sig()}
`},

  // EMAIL 5 — DAY 5 / HARD OFFER
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
${divider()}
${membershipCta(true)}
${divider()}
${h('What you get starting today:')}
${h('Month 1 — Foundation Rebuild', 3)}
${p('6-week base program. Hips, ankles, knees, core, tendon prep, readiness framework. Built around pickup. 3 days/week. Progressive.')}
${h('Month 2+ — Performance Track', 3)}
${p('Strength to bounce, game speed, pickup conditioning. This is where the legs start feeling different.')}
${p('<strong>All included:</strong> Hip Reset, Knee Protection, Ankle Rebuild, Skill Builder, Recovery System.')}
${p('Cancel anytime. Keep everything you download. <strong>$27/month after the first month.</strong>')}
${divider()}
${p('If you prefer one-time only: Foundation standalone is $31.99 — but it\'s only Phase 1 and 2. You\'d need the Performance Track separately at $97 to get the full picture. The membership is the better deal. But the choice is yours.', { size: 14, color: BRAND.muted })}

${pdfButton(5, 'BTH-Reset-Day-05-Power-Reset.pdf')}
${workoutSection('Power Reset + Readiness Check', [
  { name: 'Repeat Day 1 Hip Sequence', sets: 'Full circuit', cue: 'Run through the 90/90, Couch Stretch, and Glute Bridge from Day 1. Note how much easier it is vs. Monday.' },
  { name: 'Single-Leg Balance Reach', sets: '2 × 30 sec each leg', cue: 'From Day 2. Check your stability. Better than when you started?' },
  { name: '10 Min Easy Walk', sets: 'After the above', cue: 'Then ask yourself: am I looser than I was Day 1? If yes — that\'s what this system does over 4 weeks.' },
])}
${sig()}
`},

  // EMAIL 6 — URGENCY CLOSE
  {
    filename: 'email-6-urgency-close.html',
    subject: 'your code expires tonight',
    body: `
${greeting()}
${p('Quick one.')}
${p('Your 10% discount code — <strong style="color:${BRAND.gold};letter-spacing:0.06em;">RISE10</strong> — expires tonight.')}
${p('After that, BTH Rise is $27/month. Which is still the best deal in the system. But if you want the first month at $24.30, today is the day.')}
${membershipCta(false)}
${p('If you have questions — reply to this email. I read every one.')}
${p('If you\'re not ready yet — no pressure. The list stays open. But don\'t let the code go to waste if you were already thinking about it.')}
${sig()}
`},

  // EMAIL 7 — RE-ENGAGE
  {
    filename: 'email-7-re-engage.html',
    subject: 'still thinking about it?',
    body: `
${greeting()}
${p('I\'m not going to hit you with another discount.')}
${p('I just want to ask you something real:')}
${p('<strong>What\'s stopping you?</strong>')}
${p('Is it the price? ($27/month — that\'s one pickup session\'s worth of gym cost)')}
${p('Is it timing? (The Foundation Month is designed for guys who play 2–3x/week and have a regular life)')}
${p('Is it trust? (That one I can\'t argue — you\'d have to try it)')}
${divider()}
${p('Whatever it is — hit reply and tell me. I\'ll give you a straight answer.')}
${p('If you\'re in a spot where your body is the thing keeping you from playing the way you want — BTH Rise is built for exactly that.')}
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

console.log(`\nDone. ${emails.length} emails written to ${OUT_DIR}/`);
