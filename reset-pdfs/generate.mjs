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
const days = [
  {
    num: '01',
    title: 'Hip Release',
    tagline: 'Open what pickup locks.',
    intro: 'Most guys are tight here — not from age, but because pickup loads the hips and nobody ever resets them. Do these three moves in order. Take your time on each.',
    note: 'You\'ll feel this working before you finish. That\'s the hip flexors and glutes activating like they\'re supposed to.',
    exercises: [
      {
        name: '90/90 Hip Switch',
        sets: '3 rounds · 30 sec each side',
        cue: 'Sit on the floor, both legs bent at 90°. Rotate slowly side to side. Let the back hip open — don\'t force it, let gravity do the work.',
      },
      {
        name: 'Couch Stretch',
        sets: '2 rounds · 45 sec each leg',
        cue: 'Back knee on the floor, front foot forward. Drive hips forward. You\'ll feel the hip flexor immediately. Keep your glute squeezed on the rear leg.',
      },
      {
        name: 'Glute Bridge Hold',
        sets: '3 rounds · 10 reps + 3 sec hold',
        cue: 'Feet flat, drive through your heels, squeeze hard at the top. Hold 3 seconds. Your glutes are probably not firing the way they should — this teaches them.',
      },
    ],
  },
  {
    num: '02',
    title: 'Ankle Reset',
    tagline: 'Rebuild the joints your body stopped trusting.',
    intro: 'The ankle isn\'t just tight — it\'s been abandoned. Every hard plant and lateral cut without proper tendon prep builds scar tissue, not stability. Today you rebuild the trust.',
    note: 'These three moves target the exact structures that fail on bad ankle rolls. Run them in order and don\'t rush the eccentrics.',
    exercises: [
      {
        name: 'Tibialis Raise',
        sets: '3 × 15 reps',
        cue: 'Stand with your back against a wall, heels 6 inches out. Lift your toes up toward your shins. This wakes up the muscle most ignored in ankle health — the one that controls dorsiflexion on cuts.',
      },
      {
        name: 'Calf Raise Eccentric',
        sets: '3 × 10 reps (3 sec down, explode up)',
        cue: 'Two feet up, one foot down — slow 3-count on the way down. The eccentric phase is where the tendon work happens. This is the same protocol used in Achilles rehab.',
      },
      {
        name: 'Single-Leg Balance Reach',
        sets: '2 × 30 sec each leg',
        cue: 'Stand on one leg, reach the other forward / side / back without letting your hip drop. If you wobble badly, you\'ve found the gap. This trains the ankle stability that saves you on lateral cuts.',
      },
    ],
  },
  {
    num: '03',
    title: 'Knee + Quad Reset',
    tagline: 'Fix the patellar load before it becomes a problem.',
    intro: 'Knee pain after pickup isn\'t random. It\'s quad dominance without the posterior chain to balance it, and patellar tendons that have never been progressively loaded. Today you start loading them right.',
    note: 'The Spanish Squat is direct patellar tendon work. Don\'t skip it. The VMO lunge is why your inner knee stabilizes (or doesn\'t) on lateral cuts.',
    exercises: [
      {
        name: 'Spanish Squat',
        sets: '3 × 10 reps · 3 sec hold at bottom',
        cue: 'Use a strap or post for support. Heels flat, squat deep, hold 3 seconds at the bottom. This is direct patellar tendon loading — the kind that actually prevents tendinopathy.',
      },
      {
        name: 'VMO Lunge',
        sets: '3 × 8 each leg',
        cue: 'Front foot elevated slightly on a small step or plate. Drop the back knee slowly. You\'ll feel the inner quad (VMO) firing hard. That\'s the muscle that prevents your knee from caving on landings.',
      },
      {
        name: 'Single-Leg Glute Bridge',
        sets: '2 × 12 each leg',
        cue: 'One leg in the air, drive through the heel on the planted foot. Squeeze hard at the top. This balances the quad dominance most hoopers have from years of running without posterior chain work.',
      },
    ],
  },
  {
    num: '04',
    title: 'Core + Movement Quality',
    tagline: 'The stability that makes your first step matter.',
    intro: 'Core strength for basketball isn\'t about crunches — it\'s about anti-rotation, anti-extension, and staying stiff when the game tries to destabilize you. These three moves build the kind of core that transfers.',
    note: 'If Dead Bug feels easy, you\'re probably cheating. Keep your lower back glued to the floor. The second your back arches, the rep is done.',
    exercises: [
      {
        name: 'Dead Bug',
        sets: '3 × 8 each side',
        cue: 'Back flat on the floor, arms straight up, knees at 90°. Slowly extend opposite arm and leg toward the floor. Do NOT let your lower back arch. The whole point is keeping the spine neutral under load.',
      },
      {
        name: 'Pallof Press',
        sets: '3 × 10 each side',
        cue: 'Use a band anchored at chest height, or a cable machine. Press straight out from your chest and hold 2 seconds. Anti-rotation — this is the core work that transfers to cuts, not crunches.',
      },
      {
        name: '90/90 to Tall Kneeling',
        sets: '2 × 5 each side',
        cue: 'Sit in 90/90 hip position, then rise to tall kneeling without using your hands. This move connects hip mobility (Day 1) to core stability — exactly what\'s required when you plant and cut.',
      },
    ],
  },
  {
    num: '05',
    title: 'Power Reset',
    tagline: 'Bring the bounce back — the right way.',
    intro: 'Day 5. The bounce protocol. Not another round of box jumps that trash your knees — reactive power from a base that\'s actually been reset. You\'ve earned this.',
    note: 'Also your readiness check: do the Day 1 hip sequence again after this session. If you\'re looser than you were Monday, that\'s the BTH method working.',
    exercises: [
      {
        name: 'Hip Reset Recap',
        sets: 'Full Day 1 sequence · 1 round each',
        cue: 'Run through all three Day 1 exercises once before loading any power work. This is the activation sequence — hips firing means power transfers. Skip it and you\'re leaving bounce on the floor.',
      },
      {
        name: 'Box Step-Up + Drive',
        sets: '3 × 6 each leg',
        cue: 'Step onto a box (12–18 inches), drive the opposite knee up hard at the top. Controlled step down. This is hip extension power — the same movement pattern as your first step.',
      },
      {
        name: 'Broad Jump + Stick',
        sets: '4 reps · full reset between each',
        cue: 'Jump forward as far as you can, land on two feet and STICK it for 3 full seconds. No wobble, no extra steps. Quality over distance. This trains the landing mechanics that let you jump again without pain.',
      },
    ],
  },
];

// ─── HTML TEMPLATE ───
function buildHTML(day) {
  const exercises = day.exercises.map((ex, i) => `
    <div class="exercise">
      <div class="ex-header">
        <span class="ex-num">${String(i + 1).padStart(2, '0')}</span>
        <div>
          <div class="ex-name">${ex.name}</div>
          <div class="ex-sets">${ex.sets}</div>
        </div>
      </div>
      <p class="ex-cue">${ex.cue}</p>
    </div>
  `).join('');

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
html, body { width: 8.5in; height: 11in; background: ${C.white}; }
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
  padding: 18px 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.logo {
  font-family: 'Oswald', sans-serif;
  font-size: 17pt;
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
  padding: 28px 40px 24px;
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
  font-size: 36pt;
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

/* ─── MAIN CONTENT ─── */
.content {
  padding: 24px 40px 0;
}

/* ─── INTRO ─── */
.intro-block {
  background: ${C.cream};
  border-left: 3px solid ${C.gold};
  padding: 14px 20px;
  margin-bottom: 24px;
  border-radius: 0 2px 2px 0;
}
.intro-text {
  font-size: 10pt;
  color: rgba(17,19,24,0.75);
  line-height: 1.65;
}

/* ─── EXERCISES HEADER ─── */
.ex-section-label {
  font-family: 'DM Sans', sans-serif;
  font-size: 7.5pt;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: ${C.gold};
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.ex-section-label::after {
  content: '';
  flex: 1;
  height: 1px;
  background: ${C.border};
}

/* ─── EXERCISE CARD ─── */
.exercise {
  background: ${C.white};
  border: 1px solid ${C.border};
  border-radius: 2px;
  padding: 16px 20px;
  margin-bottom: 10px;
  border-left: 3px solid ${C.black};
}
.exercise:last-child { margin-bottom: 0; }
.ex-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 8px;
}
.ex-num {
  font-family: 'Oswald', sans-serif;
  font-size: 18pt;
  font-weight: 700;
  color: ${C.gold};
  line-height: 1;
  flex-shrink: 0;
  width: 32px;
}
.ex-name {
  font-family: 'Oswald', sans-serif;
  font-size: 13pt;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: ${C.black};
  line-height: 1.1;
}
.ex-sets {
  font-size: 9pt;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${C.gold};
  margin-top: 3px;
}
.ex-cue {
  font-size: 9.5pt;
  color: rgba(17,19,24,0.7);
  line-height: 1.6;
  padding-left: 46px;
}

/* ─── NOTE BAND ─── */
.note-band {
  margin: 20px 0 0;
  padding: 14px 20px;
  background: ${C.black};
  border-radius: 2px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
}
.note-icon {
  font-family: 'Oswald', sans-serif;
  font-size: 9pt;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${C.gold};
  flex-shrink: 0;
  padding-top: 1px;
}
.note-text {
  font-size: 9pt;
  color: rgba(255,255,255,0.75);
  line-height: 1.6;
}

/* ─── FOOTER ─── */
.foot {
  padding: 20px 40px 18px;
  margin-top: 20px;
  border-top: 1px solid ${C.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.foot-logo {
  font-family: 'Oswald', sans-serif;
  font-size: 10pt;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(17,19,24,0.3);
}
.foot-logo span { color: ${C.gold}; }
.foot-url {
  font-size: 8pt;
  color: rgba(17,19,24,0.3);
  letter-spacing: 0.04em;
}
.foot-day {
  font-family: 'Oswald', sans-serif;
  font-size: 9pt;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(17,19,24,0.3);
}
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
</div>

<!-- CONTENT -->
<div class="content">

  <!-- INTRO -->
  <div class="intro-block">
    <p class="intro-text">${day.intro}</p>
  </div>

  <!-- EXERCISES -->
  <div class="ex-section-label">Today's Protocol</div>
  ${exercises}

  <!-- NOTE -->
  <div class="note-band">
    <div class="note-icon">Note</div>
    <div class="note-text">${day.note}</div>
  </div>

</div>

<!-- FOOTER -->
<div class="foot">
  <div class="foot-logo">Built to <span>Hoop</span></div>
  <div class="foot-day">Day ${day.num} — ${day.title}</div>
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
