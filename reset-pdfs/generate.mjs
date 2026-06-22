import puppeteer from 'puppeteer';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'output');
mkdirSync(OUT, { recursive: true });

// ─── BRAND TOKENS ───
const C = {
  black: '#111318',
  white: '#FFFFFF',
  cream: '#F3EFE7',
  gold:  '#E6A800',
  muted: 'rgba(17,19,24,0.52)',
  border:'rgba(17,19,24,0.12)',
};

// ─── DAY DATA ───
// CANONICAL SOURCE: the real "_v2" Free 5-Day Reset PDFs in Ty's Drive
// (folder 1zPk3z3erNdwCSv7qCTQkQMb3xGw4IFwV, set dated 2026-05-31).
// The earlier delivered version drifted (Days 3/4/5 had the wrong titles and
// moves). This restores the real program — titles, blocks, exercises, cues.
const days = [
  {
    num: '01',
    title: 'Hip Reset',
    goal: 'RESET',
    time: '15–20 MIN',
    tagline: 'Open what pickup locks.',
    intro: 'Open your hips, reduce stiffness, and give your body a foundation worth building on. Move slow on every rep — this is not a conditioning workout. No pain. If something pinches, back off immediately. This is about control and position, not effort.',
    blocks: [
      {
        label: 'Reset Block',
        sub: 'Breathing + hip mobility first',
        exercises: [
          { name: '90/90 Hip Lift Breathing', sets: '2–3 × 4 breaths / side', cue: 'Exhale fully at the bottom. Let the hip melt. No forcing range.' },
          { name: 'Adductor Rockbacks', sets: '2 × 6 each side', cue: 'Slow and controlled. Stop at the first sign of pinching.' },
          { name: 'Glute Bridge ISO Hold', sets: '2 × 20 sec', cue: 'Drive through both heels. Squeeze at the top. Breathe through it.' },
        ],
      },
      {
        label: 'Control Block',
        sub: 'Stability and hip loading',
        exercises: [
          { name: 'Assisted Split Squat', sets: '2 × 5 each leg', cue: 'Use a wall or rack for support. Stay tall. Front leg working, not collapsing.' },
          { name: 'Standing Hip Shift', sets: '2 × 6 each side', cue: 'Slow lateral shift. Feel the hip loading. No rushing — the glute catches the pelvis.' },
        ],
      },
    ],
    feel: ['Less stiffness in the hips', 'More control through range', 'Smoother, freer movement'],
    focus: 'Move slow — every single rep. No pain. Back off if it pinches.',
    tomorrow: 'Ankle Reset — building stability from the ground up.',
  },
  {
    num: '02',
    title: 'Ankle Reset',
    goal: 'STABILITY',
    time: '15–20 MIN',
    tagline: 'The joint your knees are paying for.',
    intro: 'Build ankle strength, control, and stability for cutting, jumping, and landing. When ankles are stiff or unstable, the knees absorb what the ankles should handle — every landing, every cut, every push-off. That load compounds and breaks things down. Today trains the real system, not just taping over it.',
    blocks: [
      {
        label: 'Reset Block',
        sub: 'Range and sensation first',
        exercises: [
          { name: 'Ankle Rocks — Knee Over Toe', sets: '2 × 8 each side', cue: 'Slow drive forward. Knee tracks over the toe. Full range.' },
          { name: 'Tibialis Raises', sets: '3 × 15', cue: 'Stand against a wall. Pull your toes up as high as possible. Feel the shin working.' },
        ],
      },
      {
        label: 'Stability Block',
        sub: 'Single-leg control',
        exercises: [
          { name: 'Single-Leg Balance', sets: '2 × 20 sec each', cue: 'Eyes open first. Slight knee bend. Stay still. Progress to eyes closed.' },
          { name: 'Slow Calf Raises', sets: '3 × 10', cue: '3 counts up, 3 counts down. Full range. Both legs, then single-leg if ready.' },
        ],
      },
      {
        label: 'Reactivity Block',
        sub: 'Light and springy',
        exercises: [
          { name: 'Mini Pogo Hops (Light)', sets: '2 × 10', cue: 'Quick and springy. Land soft. No heavy stomping — the ankles absorb, not the floor.' },
        ],
      },
    ],
    feel: ['Ankles warming up instead of stiff', 'Better balance and control', 'Lighter, more reactive steps'],
    focus: 'Move light, stay springy. Control every rep and landing. Instability now = the training working.',
    tomorrow: 'Movement Control — where Days 1 and 2 start connecting.',
  },
  {
    num: '03',
    title: 'Movement Control',
    goal: 'CONTROL',
    time: '20–25 MIN',
    tagline: 'Where the hips and ankles start talking.',
    intro: 'Improve control, coordination, and pain-free movement so your body moves efficiently on the court. Hip and ankle work is done — now those two start talking to each other. Movement control is the part most hoopers skip; they go straight from stiff to heavy lifts and it never transfers, because they never taught the body to move with control first.',
    blocks: [
      {
        label: 'Reset Block',
        sub: 'Carry over from Days 1 + 2',
        exercises: [
          { name: '90/90 Hip Lift', sets: '4 breaths', cue: 'Exhale fully. Reset your breathing pattern.' },
          { name: 'Ankle Rocks', sets: '2 × 8 each', cue: 'Slow drive. Knee tracks over the toe.' },
          { name: 'Glute Bridge Hold', sets: '2 × 20 sec', cue: 'Squeeze at the top. Breathe through it.' },
        ],
      },
      {
        label: 'Movement Block',
        sub: 'Direction changes with control',
        exercises: [
          { name: 'Controlled Jog → Stop → Change Direction', sets: '3–5 reps', cue: 'Take your time. No rushing the change. Decelerate — don’t crash.' },
        ],
      },
      {
        label: 'Control Block',
        sub: 'Stability under load',
        exercises: [
          { name: 'Dead Bugs', sets: '3 × 8 each side', cue: 'Low back stays flat the whole time. Slow and deliberate. Breathe on the way down.' },
          { name: 'Step-Ups (Controlled)', sets: '3 × 6 each leg', cue: 'Drive through the heel. Don’t push off the back foot. 3 counts up, 3 counts down.' },
          { name: 'Split Squat Hold', sets: '3 × 20 sec each leg', cue: 'Stay tall. Front knee tracks the toe. Breathe.' },
          { name: 'Single-Leg Balance Reach', sets: '2 × 6 each side', cue: 'Slow reach in each direction. Control the return. Don’t rush.' },
        ],
      },
    ],
    feel: ['More coordination in movement', 'Better balance under control', 'Smoother direction changes'],
    focus: 'Move controlled — every rep. Stay balanced. No rushed reps, ever.',
    tomorrow: 'Strength That Moves — the kind that actually transfers.',
  },
  {
    num: '04',
    title: 'Strength That Moves',
    goal: 'STRENGTH',
    time: '25–30 MIN',
    tagline: 'Strength that leaves the gym with you.',
    intro: 'Build strength that supports movement, not just size. Most gym programs build strength that stays in the gym. Movement-based strength trains through basketball-relevant positions — unilateral, controlled, functional. Every rep today should feel strong but smooth. No grinding through force. This is the foundation that makes Day 5 possible.',
    blocks: [
      {
        label: 'Strength Block',
        sub: 'Lower body load',
        exercises: [
          { name: 'Goblet Squats', sets: '3 × 8', cue: 'Chest up. Knees track the toes. Sit into it. Full depth with control.' },
          { name: 'DB Romanian Deadlift', sets: '3 × 8', cue: 'Hinge at the hips. Slight knee bend. Feel the hamstrings. Back stays neutral.' },
          { name: 'Split Squats', sets: '2 × 6 each leg', cue: 'Stay tall. Front heel stays down. Control the descent — 3 sec down.' },
        ],
      },
      {
        label: 'Core + Support Block',
        sub: 'Stability for movement',
        exercises: [
          { name: 'Dead Bugs', sets: '2 × 8 each side', cue: 'Low back flat the whole time. Slow and deliberate. Never rush.' },
          { name: 'Side Plank', sets: '2 × 20 sec each', cue: 'Hips stacked. Don’t let them sag. Breathe steady.' },
        ],
      },
      {
        label: 'Control Block',
        sub: 'Single-leg work to finish',
        exercises: [
          { name: 'Step-Ups (Slow)', sets: '2 × 6 each leg', cue: '3 counts up, 3 counts down. No push-off from the back leg. The heel drives.' },
          { name: 'Single-Leg Balance', sets: '2 × 20 sec each', cue: 'Slight knee bend. Hold perfectly still. Breathe.' },
        ],
      },
    ],
    feel: ['Strong but not stiff', 'More stable on one leg', 'Movements feel controlled'],
    focus: 'Move strong, stay smooth. No forced or grinding reps. Control over load, always.',
    tomorrow: 'Power Reset — everything converts to game-ready movement. Last one.',
  },
  {
    num: '05',
    title: 'Power Reset',
    goal: 'POWER',
    time: '20–25 MIN',
    tagline: 'Turn five days of work into game-ready power.',
    intro: 'Rapidly convert all your resetting into game-ready power. This is what the first four days were building toward. Land soft. Absorb first — then explode. Don’t crash into the ground and hope. The power comes from control, not force — the same principle as every day this week.',
    blocks: [
      {
        label: 'Movement Block',
        sub: 'Convert mobility to power',
        exercises: [
          { name: 'Skater Bounds', sets: '3 × 4 each side', cue: 'Land on one leg. Absorb and hold. Load before you explode.' },
          { name: 'Scissor Jumps', sets: '3 × 8', cue: 'Quick switch. Land soft. Stay springy between reps.' },
          { name: 'Side Lunge + Crossover Step', sets: '2 × 6 each side', cue: 'Lateral load, then cross. Feel the hip working.' },
        ],
      },
      {
        label: 'Athletic Block',
        sub: 'Speed and explosiveness',
        exercises: [
          { name: 'Approach Jumps', sets: '3 × 3', cue: 'Two-step run-up. Jump, land, and stick. Full intent on each one.' },
          { name: 'Reactive Sprints (Short)', sets: '4 × 1', cue: 'Accelerate hard. Stop under control. 10–15 yards max.' },
        ],
      },
      {
        label: 'Big Finish',
        sub: '2-minute basketball finisher — 1 round, full intent',
        exercises: [
          { name: 'Dribble Drills (any)', sets: '1 round', cue: 'Move like a hooper. This is what the whole week was for.' },
          { name: 'Layups', sets: 'Full intent', cue: 'Finish clean at the rim. Every one counts.' },
          { name: 'Pull-Up Jumpers', sets: 'Full intent', cue: 'Explode to your spot. Shoot with authority.' },
        ],
      },
    ],
    feel: ['Light — move explosive', 'Reactive off the floor', 'Powerful when it counts'],
    focus: 'Full intent every rep. Land soft, explode fast. Finish strong. Five days done — now go unleash your game.',
    tomorrow: null,
  },
];

// ─── HTML TEMPLATE ───
function buildHTML(day) {
  let exNum = 0;
  const blocks = day.blocks.map((block) => {
    const exercises = block.exercises.map((ex) => {
      exNum += 1;
      return `
      <div class="exercise">
        <div class="ex-header">
          <span class="ex-num">${String(exNum).padStart(2, '0')}</span>
          <div>
            <div class="ex-name">${ex.name}</div>
            <div class="ex-sets">${ex.sets}</div>
          </div>
        </div>
        <p class="ex-cue">${ex.cue}</p>
      </div>`;
    }).join('');
    return `
    <div class="block">
      <div class="block-label"><span>${block.label}</span><em>${block.sub}</em></div>
      ${exercises}
    </div>`;
  }).join('');

  const feel = day.feel.map((f) => `<li>${f}</li>`).join('');
  const tomorrow = day.tomorrow
    ? `<div class="foot-day">Tomorrow — ${day.tomorrow}</div>`
    : `<div class="foot-day">Five days done. Go unleash your game.</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BTH Reset · Day ${day.num} · ${day.title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 8.5in; background: ${C.white}; }
body {
  font-family: 'DM Sans', sans-serif;
  color: ${C.black};
  font-size: 10.5pt;
  line-height: 1.5;
  padding: 0;
}

/* ─── TOP BAR ─── */
.top-bar {
  background: ${C.black};
  padding: 16px 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.logo {
  font-family: 'Oswald', sans-serif;
  font-size: 16pt;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${C.white};
}
.logo span { color: ${C.gold}; }
.top-label {
  font-family: 'DM Sans', sans-serif;
  font-size: 8pt;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.5);
}

/* ─── HERO BAND ─── */
.hero-band {
  background: ${C.gold};
  padding: 24px 40px 22px;
  position: relative;
  overflow: hidden;
}
.hero-band::after {
  content: '${day.num}';
  position: absolute;
  right: -8px;
  top: 50%;
  transform: translateY(-50%);
  font-family: 'Oswald', sans-serif;
  font-size: 120pt;
  font-weight: 700;
  color: rgba(17,19,24,0.08);
  line-height: 1;
  letter-spacing: -0.02em;
  pointer-events: none;
}
.day-label {
  font-family: 'DM Sans', sans-serif;
  font-size: 8pt;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: rgba(17,19,24,0.6);
  margin-bottom: 6px;
}
.day-title {
  font-family: 'Oswald', sans-serif;
  font-size: 34pt;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: ${C.black};
  line-height: 0.95;
  margin-bottom: 8px;
}
.day-tagline {
  font-size: 10.5pt;
  font-weight: 500;
  color: rgba(17,19,24,0.65);
}
.day-meta {
  position: relative;
  z-index: 2;
  margin-top: 12px;
  display: flex;
  gap: 22px;
}
.day-meta div { font-size: 8pt; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(17,19,24,0.7); }
.day-meta b { display: block; font-family: 'Oswald', sans-serif; font-size: 12pt; letter-spacing: 0.04em; color: ${C.black}; margin-top: 2px; }

/* ─── MAIN CONTENT ─── */
.content { padding: 22px 40px 0; }

/* ─── INTRO ─── */
.intro-block {
  background: ${C.cream};
  border-left: 3px solid ${C.gold};
  padding: 13px 18px;
  margin-bottom: 20px;
  border-radius: 0 2px 2px 0;
}
.intro-text { font-size: 9.5pt; color: rgba(17,19,24,0.78); line-height: 1.6; }

/* ─── BLOCK ─── */
.block { margin-bottom: 18px; break-inside: avoid; }
.block-label {
  font-family: 'DM Sans', sans-serif;
  font-size: 8pt;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: ${C.gold};
  margin-bottom: 10px;
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.block-label em { font-style: normal; font-weight: 600; letter-spacing: 0.04em; color: rgba(17,19,24,0.4); text-transform: none; font-size: 8.5pt; }

/* ─── EXERCISE CARD ─── */
.exercise {
  background: ${C.white};
  border: 1px solid ${C.border};
  border-radius: 2px;
  padding: 13px 18px;
  margin-bottom: 8px;
  border-left: 3px solid ${C.black};
  break-inside: avoid;
}
.ex-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 6px; }
.ex-num {
  font-family: 'Oswald', sans-serif;
  font-size: 17pt;
  font-weight: 700;
  color: ${C.gold};
  line-height: 1;
  flex-shrink: 0;
  width: 30px;
}
.ex-name {
  font-family: 'Oswald', sans-serif;
  font-size: 12.5pt;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: ${C.black};
  line-height: 1.1;
}
.ex-sets { font-size: 8.5pt; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: ${C.gold}; margin-top: 3px; }
.ex-cue { font-size: 9pt; color: rgba(17,19,24,0.7); line-height: 1.55; padding-left: 44px; }

/* ─── FEEL / FOCUS ─── */
.feel-band { margin: 20px 0 0; padding: 16px 18px; background: ${C.black}; border-radius: 2px; break-inside: avoid; }
.feel-title { font-family: 'Oswald', sans-serif; font-size: 9pt; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: ${C.gold}; margin-bottom: 8px; }
.feel-list { list-style: none; display: flex; flex-wrap: wrap; gap: 6px 22px; margin-bottom: 12px; }
.feel-list li { font-size: 9pt; color: rgba(255,255,255,0.82); position: relative; padding-left: 16px; }
.feel-list li::before { content: '↑'; position: absolute; left: 0; color: ${C.gold}; font-weight: 700; }
.focus-line { font-size: 9pt; color: rgba(255,255,255,0.7); line-height: 1.55; border-top: 1px solid rgba(255,255,255,0.12); padding-top: 10px; }
.focus-line b { color: ${C.gold}; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; font-size: 8pt; }

/* ─── FOOTER ─── */
.foot {
  padding: 18px 40px 18px;
  margin-top: 18px;
  border-top: 1px solid ${C.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 6px;
}
.foot-logo { font-family: 'Oswald', sans-serif; font-size: 10pt; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(17,19,24,0.3); }
.foot-logo span { color: ${C.gold}; }
.foot-url { font-size: 8pt; color: rgba(17,19,24,0.3); letter-spacing: 0.04em; }
.foot-day { font-family: 'Oswald', sans-serif; font-size: 9pt; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(17,19,24,0.35); }
</style>
</head>
<body>

<!-- TOP BAR -->
<div class="top-bar">
  <div class="logo">Built to <span>Hoop</span></div>
  <div class="top-label">Free 5-Day Reset</div>
</div>

<!-- HERO BAND -->
<div class="hero-band">
  <div class="day-label">Day ${day.num} of 05</div>
  <div class="day-title">${day.title}</div>
  <div class="day-tagline">${day.tagline}</div>
  <div class="day-meta">
    <div>Goal<b>${day.goal}</b></div>
    <div>Time<b>${day.time}</b></div>
  </div>
</div>

<!-- CONTENT -->
<div class="content">

  <!-- INTRO -->
  <div class="intro-block">
    <p class="intro-text">${day.intro}</p>
  </div>

  <!-- BLOCKS -->
  ${blocks}

  <!-- FEEL / FOCUS -->
  <div class="feel-band">
    <div class="feel-title">What you should feel</div>
    <ul class="feel-list">${feel}</ul>
    <div class="focus-line"><b>Focus</b> &nbsp;${day.focus}</div>
  </div>

</div>

<!-- FOOTER -->
<div class="foot">
  <div class="foot-logo">Built to <span>Hoop</span></div>
  ${tomorrow}
  <div class="foot-url">built-to-hoop.com</div>
</div>

</body>
</html>`;
}

// ─── GENERATE PDFs ───
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

for (const day of days) {
  const html = buildHTML(day);
  const htmlPath = join(OUT, `day-${day.num}.html`);
  const pdfPath  = join(OUT, `BTH-Reset-Day-${day.num}-${day.title.replace(/\s+/g, '-')}.pdf`);

  writeFileSync(htmlPath, html, 'utf8');

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: pdfPath,
    format: 'Letter',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });

  await page.close();
  console.log(`✓  Day ${day.num} — ${day.title} → ${pdfPath}`);
}

await browser.close();
console.log('\nAll 5 PDFs generated in reset-pdfs/output/');
