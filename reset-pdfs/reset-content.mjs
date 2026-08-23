// The Free 5-Day Reset content — the single source for BOTH the PDFs
// (reset-pdfs/generate.mjs) and the on-site day pages
// (reset-pdfs/generate-day-pages.mjs).
//
// Extracted from generate.mjs 2026-08-23, byte-identical, so a page and its PDF can
// never drift. Ty's approved Reset content: do not edit the movements, sets, or cues
// here without regenerating both outputs.
export const days = [
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
