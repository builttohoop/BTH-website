// BTH-GOAL-0019 — per-SKAG landing page generator (C5).
// Run: node lp/generate-lps.mjs   (from the repo root)
// Emits lp/<slug>.html for every SKAG in the $1,000 Google Ads flight.
// H1 = the SKAG search term (message match). Campaign A pages carry the owned
// Free-Reset opt-in form (NO paid pricing — cold-traffic brand rule); Campaign B
// pages carry the Stay Ready $27/mo offer card on the Stripe Payment Link.
// All pages: full BTH tracking head + bth-click-id.js (gclid/utm capture) + noindex.
//
// FOUR script tags, and they must stay four. bth-events.js was live on all 18 LP pages but had
// never been in this generator, so every regenerate silently stripped conversion-event tracking
// from the whole landing-page set — pages that still build, still deploy, and look completely
// normal, with the events quietly gone. Restored 2026-08-17 while regenerating for the Strength
// Block rename. If a page gains a script, add it here too, or the generator will keep undoing it.
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const STRIPE_MONTHLY = 'https://buy.stripe.com/4gMaEXbvh7nu1sccHJaAw00';

const A_PAGES = [
  {
    slug: 'basketball-training-program', eyebrow: 'The System', h1: 'Basketball Training <span class="gold">Program</span>', keyword: 'basketball training program',
    title: 'Basketball Training Program — Built to Hoop',
    sub: 'A structured training system for hoopers — skill, strength, mobility, jump work and recovery in <strong>one plan</strong>. Start with five free days and feel the difference before you commit to anything.',
    bullets: ['A clear plan for every training day', 'One focused protocol a day — 10 to 20 minutes', 'Built by a hooper who still plays', 'Free to start — no card, no trial'],
    whyParas: [
      'Most guys looking for a real basketball training program end up with a folder of scattered YouTube workouts — no order, no progression, no way to know if it is working. BTH is built as an actual program: each day has one job, and the days stack on each other instead of repeating the same generic circuit.',
      'The free 5-Day Reset is the first week of that program, not a watered-down teaser. You get skill work, strength work, mobility and a jump-focused day — the same categories the full training system runs on, just compressed into five sessions you can finish before your next pickup run.',
    ],
    faq: [
      { q: 'Is this a real basketball training program or just a workout PDF?', a: 'It is a program — five connected days that build on each other, delivered one at a time so you actually do the work instead of skimming a PDF once and forgetting it.' },
      { q: 'Do I need a gym for this?', a: 'No. The first three days use bodyweight and minimal space. If you have basic equipment for the later days, great — if not, the program still works.' },
      { q: 'How is this different from a generic training program?', a: 'It is built specifically around what hooping demands — first-step quickness, ankle and knee durability, landing mechanics — not a bodybuilding split with a basketball label on it.' },
    ],
  },
  {
    slug: 'adult-basketball-training', eyebrow: 'For The Grown Game', h1: 'Adult Basketball <span class="gold">Training</span>', keyword: 'adult basketball training',
    title: 'Adult Basketball Training — Built to Hoop',
    sub: 'You still hoop. Your training should respect that — and respect that you are not 19 anymore. Five free days to get your <strong>legs, ankles and game speed</strong> back.',
    bullets: ['Made for hoopers past 25 who still play', 'Short sessions that fit work and family life', 'Zero gym needed for the first three days', 'Free to start — no card, no trial'],
    whyParas: [
      'Adult basketball training is a different problem than training a teenager. You are not chasing a roster spot — you are trying to survive a two-hour run, hold up the next morning, and keep playing for years, not seasons. BTH is built around that reality, not a college-strength-and-conditioning template.',
      'The free 5-Day Reset gives you a real dose of that adult basketball training approach: short sessions that respect a full-time job and a family, focused on the exact things that break down first for grown hoopers — ankles, knees, hips, and the burst that quietly disappears in your 30s.',
    ],
    faq: [
      { q: 'What makes this adult basketball training instead of just basketball training?', a: 'The sessions are built for recovery capacity and time you actually have — 10 to 20 minutes, not two-hour college practices — and they target the joints and movement patterns that wear down first once you are past 25.' },
      { q: 'I have not trained seriously in years — can I still start here?', a: 'Yes. The first three days need zero equipment and no training background. It is built as an on-ramp, not a tryout.' },
      { q: 'Will this help me play without feeling beat up the next day?', a: 'That is the exact target — the mobility and recovery pieces exist specifically to cut down the next-day soreness that keeps guys off the court.' },
    ],
  },
  {
    slug: 'basketball-training-for-adults', eyebrow: 'Past 25 And Still Playing', h1: 'Basketball Training <span class="gold">For Adults</span>', keyword: 'basketball training for adults',
    title: 'Basketball Training For Adults — Built to Hoop',
    sub: 'Training built for adults who still play — not youth drills, not influencer workouts. Start with the free 5-Day Reset and rebuild your base in <strong>under 20 minutes a day</strong>.',
    bullets: ['No youth drills, no fluff — adult training', 'One focused protocol a day', 'Runs alongside your pickup schedule', 'Free to start — no card, no trial'],
    whyParas: [
      'Search "basketball training" and you get youth AAU circuits and shooting-form influencers. Basketball training for adults needs a different starting point — you already know the game, what you are missing is the physical base that lets your body keep up with it.',
      'That is what the free 5-Day Reset rebuilds first: the legs, ankles and core control that let everything else — your handle, your first step, your jumper — actually show up on the court. It runs alongside your normal pickup schedule instead of replacing it.',
    ],
    faq: [
      { q: 'Is this basketball training for adults or is it just youth drills relabeled?', a: 'It is built from the ground up for grown players — no cone drills or youth-camp filler, just the strength, mobility and jump work an adult body actually needs.' },
      { q: 'How much time does it take?', a: 'Under 20 minutes a day. It is designed to fit before or after work, not replace your evening.' },
      { q: 'Do I need to stop playing pickup while I do this?', a: 'No — it is built to run alongside your regular games, not instead of them.' },
    ],
  },
  {
    slug: 'online-basketball-training', eyebrow: 'Train Anywhere', h1: 'Online Basketball <span class="gold">Training</span>', keyword: 'online basketball training',
    title: 'Online Basketball Training — Built to Hoop',
    sub: 'Every session delivered online — follow it at home, at the gym, or on the road. It starts with <strong>five free days</strong> straight to your inbox.',
    bullets: ['Everything delivered online, on your time', 'Train at home, at the gym, or traveling', 'Built by a hooper who still plays', 'Free to start — no card, no trial'],
    whyParas: [
      'Online basketball training only works if it actually gets followed — which is why BTH delivers one session a day instead of dumping a 40-video library on you at once. Each day lands in your inbox when you need it, not before, so it fits a real schedule instead of sitting unopened in a course you paid for.',
      'The free 5-Day Reset is the same delivery model the full system uses: short, focused, mobile-friendly sessions you can run from a living room, a hotel gym, or a park bench between sets. No app to download, no login to remember.',
    ],
    faq: [
      { q: 'Is this online basketball training actually followable, or another course I will abandon?', a: 'It is delivered one day at a time by email — you cannot binge it and forget it, because the next session only shows up once you have had a day to work with the last one.' },
      { q: 'Do I need any equipment to train online with BTH?', a: 'The first three days need none. Later sessions use minimal gear you likely already have.' },
      { q: 'Can I do this while traveling?', a: 'Yes — every session is built to run in a small space with no gym access required.' },
    ],
  },
  {
    slug: 'basketball-workout-plan', eyebrow: 'Stop Guessing', h1: 'Basketball Workout <span class="gold">Plan</span>', keyword: 'basketball workout plan',
    title: 'Basketball Workout Plan — Built to Hoop',
    sub: 'A plan that tells you exactly what to do each day — and <strong>why</strong>. Grab the free 5-day version first and see how it fits your week.',
    bullets: ['Know exactly what to do each day', 'Plans that build on each other', 'Made for hoopers, not gym rats', 'Free to start — no card, no trial'],
    whyParas: [
      'A basketball workout plan should tell you what to do today, why it matters, and what tomorrow builds off of — not hand you a spreadsheet of exercises with no sequence. BTH sessions are ordered on purpose: skill, then strength, then mobility, then a jump-focused day, each one setting up the next.',
      'The free 5-Day Reset is that plan in miniature. No guessing which day to do or whether you are "doing it right" — one clear session lands each day, built for a hooper\'s schedule, not a gym rat\'s.',
    ],
    faq: [
      { q: 'What is actually in this basketball workout plan?', a: 'Five days: skill work, strength, ankle/knee mobility, a jump-focused Power day, and a recovery-anchored close — each one a single focused session, not a mixed-bag circuit.' },
      { q: 'Do the days need to be done in order?', a: 'Yes — the plan is sequenced on purpose, with each day building on the one before it.' },
      { q: 'What happens after the 5 days?', a: 'You will know whether the approach fits your body. From there, BTH Stay Ready is the full month-by-month version of the same plan — no pressure either way.' },
    ],
  },
  {
    slug: 'basketball-workouts-at-home', eyebrow: 'No Gym Needed', h1: 'Basketball Workouts <span class="gold">At Home</span>', keyword: 'basketball workouts at home',
    title: 'Basketball Workouts At Home — Built to Hoop',
    sub: 'Living-room-sized workouts that keep you game-ready. The first three days of the free Reset need <strong>zero equipment</strong>.',
    bullets: ['Zero gym for the first three days', 'Minimal space, real work', '10 to 20 minutes a day', 'Free to start — no card, no trial'],
    whyParas: [
      'Basketball workouts at home have to solve for two things most gym programs ignore: space and equipment. BTH\'s sessions are built to run in a living room, a garage, or a hotel room — nothing that needs a squat rack or a full weight stack.',
      'The free 5-Day Reset opens with three straight days that need zero equipment at all — just floor space and 10 to 20 minutes. That is intentional: the goal is to remove every excuse between you and actually training, not add another barrier.',
    ],
    faq: [
      { q: 'Can I really do basketball workouts at home with no equipment?', a: 'Yes — the first three days of the Reset use bodyweight only. Days 4 and 5 use minimal gear, and you can substitute if you do not have it.' },
      { q: 'How much space do I need?', a: 'Roughly a yoga mat\'s worth. It is built for small rooms, not home gyms.' },
      { q: 'Is this enough on its own, or do I need a gym eventually?', a: 'The Reset stands on its own — that is the whole point of starting free.' },
    ],
  },
  {
    slug: 'workouts-for-basketball-players', eyebrow: 'Player-First', h1: 'Workouts For <span class="gold">Basketball Players</span>', keyword: 'workouts for basketball players',
    title: 'Workouts For Basketball Players — Built to Hoop',
    sub: 'Not bodybuilder splits. Workouts built around what a hooper actually needs — <strong>legs built to last, ankles built to hold, a first step built to still be there</strong>. Five free days to start.',
    bullets: ['Built around the demands of hooping', 'Skill, strength, mobility and recovery', 'Made by a hooper who still plays', 'Free to start — no card, no trial'],
    whyParas: [
      'Most workouts for basketball players are just bodybuilding splits with a ball graphic slapped on the cover — bench day, leg day, arm day, none of it built around what actually happens on a court. BTH starts from the sport instead: cutting, landing, guarding, sprinting in short bursts for two hours straight.',
      'That is what the free 5-Day Reset trains — legs built to hold up through a full run, ankles built to handle a bad landing, a first step built to still be there in the fourth quarter. It is player-first, not gym-first.',
    ],
    faq: [
      { q: 'How are these workouts for basketball players different from normal gym programs?', a: 'They are built around basketball movement patterns — lateral cuts, landings, first-step acceleration — instead of generic strength-training splits.' },
      { q: 'Will this help my ankles and knees hold up during games?', a: 'Durability is one of the main things the program trains for — the mobility and landing-mechanics work exists specifically to reduce the wear pickup ball puts on your joints over a season.' },
      { q: 'Is this for serious players only?', a: 'No — it is for anyone who plays regularly and wants their body to keep up with the game, whether that is once a week or five times.' },
    ],
  },
  {
    slug: 'vertical-jump-training-program', eyebrow: 'Bounce, Built Properly', h1: 'Vertical Jump <span class="gold">Training Program</span>', keyword: 'vertical jump training program',
    title: 'Vertical Jump Training Program — Built to Hoop',
    sub: 'Jump work that lives inside a <strong>complete training system</strong> — legs, core, landing mechanics and lift-off. No gimmicks, no instant-inches promises. Day 5 of the free Reset is the Power Reset.',
    bullets: ['Jump work as one piece of a full system', 'Legs, core, landing mechanics, lift-off', 'Honest training — no overnight promises', 'Free to start — no card, no trial'],
    whyParas: [
      'Every vertical jump training program on the internet promises inches in weeks. BTH does not — jump ability comes from the same base as everything else in the system: leg strength, hip drive, core control and landing mechanics that let you actually use the power you build.',
      'Day 5 of the free Reset is the Power Reset — a jump-focused session that puts that base to work. It is not a standalone "how to dunk" trick; it is one piece of a complete training system, which is why it holds up instead of fading after a couple sessions.',
    ],
    faq: [
      { q: 'Will this vertical jump training program actually add inches to my jump?', a: 'It builds the strength and mechanics that jump ability is made of — legs, hips, core, landing control. There is no overnight-inches promise here, honest training only.' },
      { q: 'Is jump training the whole program?', a: 'No — it is one day inside a five-day system that also covers skill, strength, mobility and recovery. Jump work built in isolation rarely holds up.' },
      { q: 'Do I need a box or special equipment to start?', a: 'No — Day 5 is built to run with bodyweight and floor space, same as the rest of the Reset.' },
    ],
  },
];

const B_PAGES = [
  {
    slug: 'basketball-training-membership', eyebrow: 'One Membership', h1: 'Basketball Training <span class="gold">Membership</span>', keyword: 'basketball training membership',
    title: 'Basketball Training Membership — BTH Stay Ready',
    sub: 'One membership, the whole BTH system — <strong>Foundation Month, the Strength Block and every add-on track</strong>, for $27 a month.',
    whyParas: [
      'A basketball training membership only earns a monthly payment if it keeps delivering after the first week. BTH Stay Ready is built as one system, not a bundle of one-off products — Foundation Month gets your base built, the Strength Block keeps the training moving, and every add-on track (jump, mobility, recovery, and more) is already included, not sold separately later.',
      'You do not need to guess whether you are "ready" for a membership. If you have run the free 5-Day Reset and it fit your body and your schedule, Stay Ready is the same approach continued — same voice, same structure, month after month.',
    ],
    faq: [
      { q: 'What is actually included in this basketball training membership?', a: 'Foundation Month, the ongoing Strength Block, and every add-on track BTH makes — jump, mobility, recovery and more — all inside one $27/month membership. Nothing held back for a future upsell.' },
      { q: 'Can I cancel anytime?', a: 'Yes — it is a self-serve monthly membership with no lock-in. Cancel whenever it stops earning its spot in your month.' },
      { q: 'What if I am not sure yet?', a: 'Start with the free 5-Day Reset first — no card required. If it fits, Stay Ready is the same training continued.' },
    ],
  },
  {
    slug: 'basketball-membership', eyebrow: 'Join The System', h1: 'Basketball <span class="gold">Membership</span>', keyword: 'basketball membership',
    title: 'Basketball Membership — BTH Stay Ready',
    sub: 'Everything Built to Hoop makes, behind one door. Train the whole year — skill, strength, mobility, jump work and recovery — for <strong>$27 a month</strong>.',
    whyParas: [
      'Most basketball membership products are one narrow thing — a shooting course, a jump program — sold behind their own separate paywall. BTH Stay Ready is a single membership that holds everything: skill, strength, mobility, jump work and recovery, all built to work together instead of competing for your time.',
      'That matters because a hooper\'s body needs all of it across a real year of playing — not just the parts that make a good sales page. One membership, one price, the whole system, updated as the training does.',
    ],
    faq: [
      { q: 'Is this basketball membership just one program or the whole system?', a: 'The whole system — skill, strength, mobility, jump work and recovery are all included, not sold as separate add-ons.' },
      { q: 'How much does it cost?', a: '$27 a month, cancel anytime. No other tiers required to get the full system.' },
      { q: 'Not ready to commit yet?', a: 'Start with the free 5-Day Reset — it is the same training philosophy, no card needed.' },
    ],
  },
  {
    slug: 'best-basketball-training-program', eyebrow: 'Comparing Programs?', h1: 'Best Basketball Training Program<span class="gold">?</span>', keyword: 'best basketball training program',
    title: 'Comparing Basketball Training Programs — BTH Stay Ready',
    sub: 'You are comparing. Good. Here is exactly what is inside BTH Stay Ready — <strong>judge it against anything else</strong> you are looking at.',
    whyParas: [
      'If you are trying to find the best basketball training program, the honest answer is: judge it on what is actually inside, not the sales page. BTH Stay Ready gives you Foundation Month, an ongoing Strength Block, and every add-on track — jump, mobility, recovery — for one price, built by someone who still plays, not a content studio.',
      'Compare that directly against whatever else you have open in another tab: what is included, what is upsold later, and who built it. Stay Ready is deliberately structured so there is nothing hidden behind a second paywall once you join.',
    ],
    faq: [
      { q: 'What makes this the best basketball training program for someone comparing options?', a: 'Everything is included at one price — Foundation Month, the Strength Block, and every add-on track — with nothing held back for a future upsell.' },
      { q: 'Who actually built this?', a: 'A hooper who still plays, not a content agency — the training reflects what the game actually demands from an adult body.' },
      { q: 'How do I know it will work for me before I pay?', a: 'Start with the free 5-Day Reset first. It is built from the same system, so you will know how it fits before committing to Stay Ready.' },
    ],
  },
  {
    slug: 'online-basketball-training-program', eyebrow: 'All Online', h1: 'Online Basketball <span class="gold">Training Program</span>', keyword: 'online basketball training program',
    title: 'Online Basketball Training Program — BTH Stay Ready',
    sub: 'The full BTH system, delivered online — train at home, at the gym, or on the road. <strong>$27 a month, cancel anytime.</strong>',
    whyParas: [
      'An online basketball training program has to earn trust without a gym, a coach in the room, or a contract locking you in. Stay Ready is built for exactly that — every session delivered digitally, no app install, no equipment requirement beyond what each day actually calls for.',
      'It runs wherever you are: home, a hotel gym on the road, or your regular gym floor. The training does not change based on your location — Foundation Month, the Strength Block and every add-on track travel with you.',
    ],
    faq: [
      { q: 'Is this online basketball training program actually complete, or a stripped-down version?', a: 'It is the full system — Foundation Month, the Strength Block and every add-on track — delivered digitally with nothing held back for an in-person version.' },
      { q: 'Do I need any special equipment to train online?', a: 'No — sessions are built to run with minimal or no equipment, so they work at home, in a hotel room, or in a gym.' },
      { q: 'Is there a contract?', a: 'No — it is $27 a month, cancel anytime, self-serve.' },
    ],
  },
];

// BTH-GOAL-0042 — reset-VARIANT pages (kind 'A' form card, pain/comeback-matched copy).
// These fix the message-match failure that killed the 2026 Knee Pain campaign (59 clicks, $194.52,
// 0 conversions): its ads promised knee-specific help and landed on the generic reset page.
// COMPLIANCE LINE (convergence ruling 2026-08-12): target the felt state, never the clinician's
// desk. Copy sells training and confidence — no diagnosis, no cure promise, no anti-PT positioning.
// Every pain page carries the "training, not treatment" line verbatim.
const TRAINING_NOT_TREATMENT = 'This is training, not treatment. If you are dealing with an injury, get it looked at by a professional — then come build the base that keeps you playing.';

const R_PAGES = [
  {
    slug: 'basketball-comeback-reset', eyebrow: 'The Comeback', h1: 'Coming Back To <span class="gold">Basketball?</span>', keyword: 'getting back into basketball',
    title: 'Getting Back Into Basketball — Built to Hoop',
    sub: 'Years off, first run back, legs gone by game two. The free 5-Day Reset starts rebuilding the base — <strong>legs, wind, ankles, first step</strong> — working toward the game feeling like yours again.',
    bullets: ['Built for the hooper coming back, not the one who never left', 'Five days, 10–20 minutes each — an on-ramp, not a tryout', 'Zero equipment for the first three days', 'Free to start — no card, no trial'],
    whyParas: [
      'Getting back into basketball as an adult is its own problem. You still know how to play — what quit on you is the body underneath it: the wind, the legs, the ankles that used to take a bad landing without a second thought. Jumping straight back into full runs is how comebacks end in week two.',
      'The free 5-Day Reset is the on-ramp: five short sessions that rebuild the base in order — movement first, then strength, then the spring. You can run it the same week you start playing again. It meets you where the layoff left you, and it is free because the first week back should not cost anything.',
    ],
    faq: [
      { q: 'I have not played in years. Is this too advanced?', a: 'No — the Reset is built as an on-ramp. The first three days are bodyweight only, and every session scales to where you actually are.' },
      { q: 'Can I do this while starting to play pickup again?', a: 'Yes. It is designed to run alongside your first weeks back, not instead of them.' },
      { q: 'What happens after the five days?', a: 'You will know whether the approach fits. BTH Stay Ready is the full month-by-month system if you want to keep building — no pressure either way.' },
    ],
  },
  {
    slug: 'basketball-knee-reset', eyebrow: 'For Cranky Knees', h1: 'Knees Complaining After <span class="gold">Basketball?</span>', keyword: 'knee pain playing basketball',
    title: 'Knee-Friendly Basketball Training — Built to Hoop',
    sub: 'Stairs the morning after. Sitting out the third game. Training built for hoopers whose knees are loud — <strong>strength and movement work that respects them</strong>. Start with five free days.',
    bullets: ['Training built around cranky knees, not through them', 'Strength and landing work hoopers actually need', 'Short sessions — 10 to 20 minutes a day', 'Free to start — no card, no trial'],
    whyParas: [
      'Most hoopers with loud knees get two options: stop playing, or keep playing and ice it after. BTH takes the third road — build the legs, hips and landing mechanics so the load your knees take every run has somewhere else to go. That is a training problem, and training is what BTH does.',
      `The free 5-Day Reset starts that work: movement quality first, then strength the joints can trust. ${TRAINING_NOT_TREATMENT}`,
    ],
    faq: [
      { q: 'Is this a medical program for knee pain?', a: 'No. BTH is basketball training, not treatment or rehab. It builds strength and movement quality for hoopers — if something is injured, see a professional first.' },
      { q: 'Can I train while my knees are cranky?', a: 'The Reset is built from low-impact days up, and every session scales. You choose the level your body can work with — nothing in it demands you push through anything.' },
      { q: 'What is the Knee Protection Track?', a: 'A focused add-on track inside BTH for hoopers who want dedicated knee-strength work after the Reset. The Reset comes first — it is free and it will tell you if the approach fits.' },
    ],
  },
  {
    slug: 'basketball-ankle-reset', eyebrow: 'Trust It Again', h1: 'Ankle Still On Your <span class="gold">Mind?</span>', keyword: 'scared to play basketball after ankle injury',
    title: 'Ankle-Confidence Basketball Training — Built to Hoop',
    sub: 'Walking is fine, jogging is fine — but the first hard cut is a question. Training that rebuilds <strong>the strength and the trust</strong>, five free days at a time.',
    bullets: ['Stability and strength work for hoopers, step by step', 'Built to rebuild confidence, not test it', 'First three days need zero equipment', 'Free to start — no card, no trial'],
    whyParas: [
      'Every hooper who has rolled an ankle knows the second recovery nobody talks about: the one in your head. The body says go and something else says careful. The way through is not waiting longer — it is giving that ankle work it can win: controlled strength and balance work that earns back trust one level at a time.',
      `The free 5-Day Reset is where that starts — foundational movement and strength you control the intensity of. ${TRAINING_NOT_TREATMENT}`,
    ],
    faq: [
      { q: 'Is this ankle rehab?', a: 'No. BTH is basketball training — strength, stability and movement work for hoopers. Rehab for an injury belongs with a professional; BTH is for building the base once you are cleared to train.' },
      { q: 'I am scared to cut hard again. Will this help?', a: 'Confidence tends to come back through stacked small wins — sessions where the ankle does its job and you notice. That is what the Reset and the Ankle Rebuild Track are built to do.' },
      { q: 'How do I know if I am ready to start?', a: 'If you are cleared for normal activity and training, the first days are low-intensity and scale to you. If you are not sure, ask the professional who saw the injury — then start.' },
    ],
  },
  {
    slug: 'basketball-recovery-reset', eyebrow: 'Sore Everywhere?', h1: 'Everything Hurts After <span class="gold">Pickup?</span>', keyword: 'everything hurts after playing basketball',
    title: 'Recover Like A Hooper — Built to Hoop',
    sub: 'Two days sore after every run is not a law of nature past 30 — it is a sign the base needs work. Five free days of <strong>training and recovery, built together</strong>.',
    bullets: ['For the hooper who is always a little banged up', 'Recovery built into the training, not bolted on', 'Mobility, strength and easy days in the right order', 'Free to start — no card, no trial'],
    whyParas: [
      'When everything hurts after basketball — knees, back, calves, all of it a little — the answer is almost never one magic stretch. It is the base: a body that has not trained between runs has no buffer, so every game spends more than it has. The fix is boring and it is built to work over time — build the buffer.',
      `The free 5-Day Reset is five days of exactly that: mobility, strength and recovery work sequenced so your next run costs less. ${TRAINING_NOT_TREATMENT}`,
    ],
    faq: [
      { q: 'Why am I sore for days after playing?', a: 'Usually because the only training your body gets IS the games. The Reset adds the between-run work that gives your body something to recover with, not just from.' },
      { q: 'Is this a recovery program or a training program?', a: 'Both, on purpose — recovery that ignores training does not hold, and training that ignores recovery is how you got here. The Reset sequences them together.' },
      { q: 'What if one specific joint is the real problem?', a: 'BTH has focused add-on tracks (knee, ankle, hip, recovery) for exactly that. Start with the free Reset — it will show you the approach before you spend anything.' },
    ],
  },
  {
    slug: 'basketball-explosiveness-reset', eyebrow: 'First Step, Second Wind', h1: 'Where Did The <span class="gold">Bounce</span> Go?', keyword: 'how to get my explosiveness back for basketball',
    title: 'Get Your First Step Back — Built to Hoop',
    sub: 'Nothing hurts — you are just slower off the floor than you used to be. Desk hips, untrained legs. <strong>Athleticism is not gone at 31. It is untrained.</strong> Five free days to start it back.',
    bullets: ['Hip mobility and leg drive, trained together', 'For the hooper losing his lift, not chasing a dunk', 'Runs alongside your normal pickup schedule', 'Free to start — no card, no trial'],
    whyParas: [
      'The first step does not vanish at 30 — it gets buried. Nine hours a day in a chair locks the hips that drive it, and legs that only get game minutes stop producing force. That is not age being undefeated; that is a body running on zero training input. Both of those are trainable.',
      'The free 5-Day Reset starts both: hip mobility work that unlocks what sitting took, and leg work that reminds your legs what producing force feels like. No overnight-inches promises — honest training that compounds. Day 5 is the Power Reset, where it comes together.',
    ],
    faq: [
      { q: 'Is this a vertical jump program?', a: 'No — BTH is a complete training system and jump work is one piece of it. If you want a dunk-in-30-days promise, that is a different corner of the internet. This is the base that real explosiveness is built on.' },
      { q: 'I sit at a desk all day. Is that really why I am slower?', a: 'It is a big part. Hip position and mobility drive the first step, and long sitting works directly against both. The Reset trains it directly.' },
      { q: 'How fast will I feel a difference?', a: 'Most guys feel the difference in how they move within the five days. The lift itself compounds over weeks of consistent work — honest answer, no shortcuts.' },
    ],
  },
  // BTH-GOAL-0042 KW-14 (a) — Ty's ruling 2026-08-14: the injury-intent terms
  // ("basketball after injury", "basketball conditioning after injury") get their OWN ad group and
  // their OWN page. They previously landed on basketball-comeback-reset, whose promise is
  // "gets you pickup-ready" — served to an injured searcher that reads as an implied
  // return-to-play claim, and compliance ruled the defect lives in the keyword-to-copy MATCH,
  // so no rewrite of the comeback page fixes it. This page is the match: it is explicitly for
  // hoopers ALREADY CLEARED to train, puts the medical decision with a professional, and carries
  // TRAINING_NOT_TREATMENT verbatim (which the comeback page does not).
  {
    slug: 'basketball-after-injury-reset', eyebrow: 'After Time Out', h1: 'Cleared To Train <span class="gold">Again?</span>', keyword: 'basketball conditioning after injury',
    title: 'Basketball Conditioning After Time Off — Built to Hoop',
    sub: 'Time out takes the base before it takes the skill — wind, legs, ankles. Once you have been cleared to train, the free 5-Day Reset rebuilds conditioning in order. <strong>This is training, not treatment.</strong>',
    bullets: ['For hoopers already cleared to train — not a rehab program', 'Rebuilds conditioning in order: movement, then strength, then spring', 'Five days, 10–20 minutes each — starts at the bottom on purpose', 'Free to start — no card, no trial'],
    whyParas: [
      'Time off the court takes the base before it takes the skill. The handle comes back inside a week; the wind, the legs and the ankles take a lot longer, and walking straight back into full runs is how one layoff turns into the next one. That gap is a conditioning problem — and conditioning is a training problem.',
      `The free 5-Day Reset is the on-ramp for exactly that: five short sessions that rebuild in order — movement quality first, then strength, then the spring. ${TRAINING_NOT_TREATMENT}`,
    ],
    faq: [
      { q: 'Is this a rehab or return-to-play program?', a: 'No. BTH is basketball training — not treatment, not rehab, not medical advice. It is built for hoopers who have already been cleared to train. If you are still working through an injury, see a professional first.' },
      { q: 'I have been cleared, but I am nowhere near game shape. Where do I start?', a: 'Here. The first three days are bodyweight only and every session scales — the Reset is built to start at the bottom, on purpose.' },
      { q: 'What happens after the five days?', a: 'You will know whether the approach fits. BTH Stay Ready is the full month-by-month system if you want to keep building — no pressure either way.' },
    ],
  },
];

const head = (p) => `<!DOCTYPE html>
<html lang="en" style="color-scheme: light;">
<head>
    <link rel="icon" type="image/svg+xml" href="../assets/favicon.svg">
    <link rel="icon" type="image/png" sizes="32x32" href="../assets/favicon-32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="../assets/favicon-16.png">
    <link rel="apple-touch-icon" sizes="180x180" href="../assets/apple-touch-icon.png">

<meta name="facebook-domain-verification" content="8j7jq4cgnwak31awpllczhuyqbxpq8" />
<!-- ─── BTH TRACKING ─── -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({"gtm.start":new Date().getTime(),event:"gtm.js"});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!="dataLayer"?"&l="+l:"";j.async=true;j.src="https://www.googletagmanager.com/gtm.js?id="+i+dl;f.parentNode.insertBefore(j,f);})(window,document,"script","dataLayer","GTM-T9SFFTB7");</script>
<!-- GA4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-YBE7PRPCLK"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config","G-YBE7PRPCLK");gtag("config","AW-18166013082");</script>
<!-- Meta Pixel -->
<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");fbq("init","1320146003572375");fbq("track","PageView");</script>
<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=1320146003572375&ev=PageView&noscript=1"/></noscript>
<!-- TikTok Pixel -->
<script>!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript";n.async=!0;n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};ttq.load("D7RNU1RC77U2TFGF3SO0");ttq.page();}(window,document,"ttq");</script>
<!-- ─── /BTH TRACKING ─── -->
<script src="../assets/bth-click-id.js" defer></script>
<script src="../assets/bth-tracking.js" defer></script>
<script src="../assets/bth-events.js" defer></script>
<script src="../assets/bth-form.js" defer></script>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<meta name="robots" content="noindex,follow">
<title>${p.title}</title>
<link rel="canonical" href="https://built-to-hoop.com/lp/${p.slug}.html">
<meta name="description" content="${p.sub.replace(/<[^>]+>/g, '')}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/bth-system.css">
<link rel="stylesheet" href="../assets/bth-form.css">
<style>
:root { color-scheme: light only; }
*,*::before,*::after { margin:0; padding:0; box-sizing:border-box; -webkit-text-size-adjust:100%; }
html { scroll-behavior:smooth; background:var(--white); }
body { background:var(--white); color:var(--black); font-family:var(--B); font-size:16px; line-height:1.6; overflow-x:hidden; -webkit-font-smoothing:antialiased; color-scheme:light; }
nav { position:fixed; top:0; left:0; right:0; z-index:100; height:62px; display:flex; align-items:center; justify-content:space-between; padding:0 52px; background:rgba(255,255,255,0.96); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); border-bottom:1px solid var(--border); }
@media (max-width:768px) { nav { padding:0 24px; } }
.nav-logo { font-family:var(--H); font-size:22px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:var(--black); text-decoration:none; display:inline-block; min-height:44px; line-height:44px; }
.nav-logo span { color:var(--gold-text); }
.nav-cta { font-family:var(--H); font-size:13px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--white); background:var(--black); padding:10px 24px; border-radius:2px; text-decoration:none; transition:all 0.18s; display:inline-flex; align-items:center; justify-content:center; min-height:44px; box-sizing:border-box; }
.nav-cta:hover { background:var(--gold); color:var(--black); }
.hero-split { min-height:88vh; padding:110px 52px 60px; display:grid; grid-template-columns:1.1fr 1fr; gap:56px; align-items:center; max-width:1260px; margin:0 auto; }
@media (max-width:900px) { .hero-split { grid-template-columns:1fr; padding:100px 24px 48px; gap:40px; min-height:auto; } .form-card { order:-1; margin-bottom:28px; } }
.hero-eyebrow { font-family:var(--B); font-size:11px; font-weight:600; letter-spacing:0.22em; text-transform:uppercase; color:var(--gold-text); margin-bottom:20px; display:flex; align-items:center; gap:12px; }
.hero-eyebrow::before { content:''; width:24px; height:2px; background:var(--gold); flex-shrink:0; }
.hero-title { font-family:var(--H); font-size:clamp(40px,6vw,76px); font-weight:700; line-height:0.95; letter-spacing:0.02em; text-transform:uppercase; color:var(--black); margin-bottom:24px; }
.gold { color:var(--gold-text); }
.hero-sub { font-size:17px; color:var(--muted); line-height:1.75; margin-bottom:28px; max-width:520px; }
.hero-sub strong { color:var(--black); font-weight:600; }
.bullets { list-style:none; padding:0; margin:0 0 12px; }
.bullets li { font-size:15px; color:var(--black); padding:10px 0 10px 30px; position:relative; line-height:1.55; border-bottom:1px solid var(--soft); }
.bullets li:last-child { border-bottom:none; }
.bullets li::before { content:'✓'; position:absolute; left:0; top:11px; color:var(--gold-text); font-weight:700; font-size:16px; }
.form-card { background:var(--cream); border:1px solid var(--border); border-radius:3px; padding:44px 36px; position:relative; box-shadow:0 1px 0 rgba(17,19,24,0.04); }
@media (max-width:560px) { .form-card { padding:32px 24px; } }
.form-card.free::before { content:'FREE'; position:absolute; top:-12px; left:28px; background:var(--gold); color:var(--black); font-family:var(--H); font-size:11px; font-weight:700; letter-spacing:0.18em; padding:5px 14px; border-radius:2px; }
.form-card.member::before { content:'THE MEMBERSHIP'; position:absolute; top:-12px; left:28px; background:var(--black); color:var(--gold); font-family:var(--H); font-size:11px; font-weight:700; letter-spacing:0.18em; padding:5px 14px; border-radius:2px; }
.form-h { font-family:var(--H); font-size:28px; font-weight:700; letter-spacing:0.02em; text-transform:uppercase; color:var(--black); line-height:1.05; margin-bottom:10px; }
.form-sub { font-size:14px; color:var(--muted); margin-bottom:24px; line-height:1.65; }
.ml-form-wrap input[type="email"], .ml-form-wrap input[type="text"] { width:100%; padding:15px 16px; font-family:var(--B); font-size:15px; border:1px solid var(--border); border-radius:2px; background:var(--white); color:var(--black); margin-bottom:12px; transition:border-color 0.18s; }
.ml-form-wrap input:focus { outline:none; border-color:var(--gold); }
.form-trust { font-size:12px; color:var(--muted); margin-top:14px; text-align:center; line-height:1.55; }
.price-row { display:flex; align-items:baseline; gap:6px; margin:6px 0 18px; }
.price-num { font-family:var(--H); font-size:64px; font-weight:700; color:var(--black); line-height:1; }
.price-per { font-family:var(--B); font-size:16px; color:var(--muted); }
.inside-list { list-style:none; margin:0 0 24px; }
.inside-list li { font-size:14px; color:var(--black); padding:9px 0 9px 28px; position:relative; border-bottom:1px solid var(--soft); line-height:1.5; }
.inside-list li:last-child { border-bottom:none; }
.inside-list li::before { content:'✓'; position:absolute; left:0; top:9px; color:var(--gold-text); font-weight:700; }
.join-btn { display:block; width:100%; text-align:center; font-family:var(--H); font-size:15px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--black); background:var(--gold); border:none; padding:16px; border-radius:2px; cursor:pointer; text-decoration:none; transition:all 0.18s; }
.join-btn:hover { background:var(--black); color:var(--white); }
.buy-note { font-size:13px; color:var(--muted); margin:14px 0 0; letter-spacing:0.02em; line-height:1.5; }
.value-strip { background:var(--cream); border-top:1px solid var(--border); border-bottom:1px solid var(--border); }
.value-strip-title { max-width:1200px; margin:0 auto; padding:44px 52px 0; font-family:var(--H); font-size:clamp(26px,3.6vw,36px); font-weight:700; letter-spacing:0.02em; text-transform:uppercase; color:var(--black); }
@media (max-width:800px) { .value-strip-title { padding:36px 24px 0; } }
.value-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; max-width:1200px; margin:0 auto; padding:28px 52px 56px; }
@media (max-width:800px) { .value-grid { grid-template-columns:1fr; padding:24px 24px 48px; } }
.value-card h3 { font-family:var(--H); font-size:17px; font-weight:700; letter-spacing:0.04em; text-transform:uppercase; color:var(--black); margin-bottom:8px; }
.value-card h3 span { color:var(--gold-text); margin-right:8px; }
.value-card p { font-size:14px; color:var(--muted); line-height:1.65; }
.lp-section { max-width:900px; margin:0 auto; padding:64px 52px; }
@media (max-width:800px) { .lp-section { padding:48px 24px; } }
.lp-eyebrow { font-family:var(--B); font-size:11px; font-weight:600; letter-spacing:0.22em; text-transform:uppercase; color:var(--gold-text); margin-bottom:16px; display:flex; align-items:center; gap:12px; }
.lp-eyebrow::before { content:''; width:24px; height:2px; background:var(--gold); flex-shrink:0; }
.lp-h2 { font-family:var(--H); font-size:clamp(28px,4vw,44px); font-weight:700; line-height:1.05; letter-spacing:0.02em; text-transform:uppercase; color:var(--black); margin-bottom:20px; }
.lp-body { font-size:16px; color:var(--muted); line-height:1.8; margin-bottom:16px; }
.lp-body:last-child { margin-bottom:0; }
.faq-wrap { display:flex; flex-direction:column; gap:0; margin-top:8px; }
.faq-item { padding:20px 0; border-bottom:1px solid var(--border); }
.faq-item:first-child { border-top:1px solid var(--border); }
.faq-q { font-family:var(--H); font-size:16px; font-weight:700; letter-spacing:0.01em; color:var(--black); margin-bottom:8px; }
.faq-a { font-size:14px; color:var(--muted); line-height:1.7; }
footer { padding:44px 52px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px; }
@media (max-width:768px) { footer { padding:36px 24px; } }
.foot-logo { font-family:var(--H); font-size:18px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:var(--black); text-decoration:none; display:inline-block; min-height:44px; line-height:44px; }
.foot-logo span { color:var(--gold-text); }
.foot-links { display:flex; gap:8px; flex-wrap:wrap; }
.foot-links a { font-size:13px; color:var(--muted); text-decoration:none; display:inline-flex; align-items:center; min-height:44px; padding:0 8px; }
.foot-links a:hover { color:var(--black); }
</style>
</head>`;

const formCardA = (p) => `<div class="form-card free" id="optin">
    <div class="form-h">Get The Free 5-Day Reset</div>
    <p class="form-sub">Drop your email. The first day lands in your inbox <strong>within 5 minutes</strong>.</p>
    <form class="bth-mail-form" action="https://bth-mail-os.tyrell-38b.workers.dev/api/subscribe" method="post" novalidate data-bth-redirect="/thank-you.html">
      <div class="bth-field">
        <input type="text" name="name" placeholder="First name" autocomplete="given-name">
      </div>
      <div class="bth-field">
        <input type="email" name="email" placeholder="Email address" required autocomplete="email" id="bth-email-lp-${p.slug}">
        <p class="bth-field-error-msg"></p>
      </div>
      <input type="hidden" name="source" value="free_reset">
      <input type="hidden" name="sequence" value="free-reset-to-rise">
      <input type="hidden" name="consent_version" value="bth-email-consent-v1">
      <input type="text" name="company" tabindex="-1" autocomplete="off" aria-hidden="true" class="bth-hp">
      <button type="submit" class="bth-btn-commit">
        <span class="bth-spinner"></span><span class="bth-btn-label" data-working-label="Sending&hellip;">Start the 5-Day Reset &rarr;</span>
      </button>
      <p class="bth-form-success" role="status">You're in &#9889;</p>
    </form>
    <p class="form-trust">No card, ever. No spam. No junk funnel. One email a day for 5 days, then a short weekly note. Unsubscribe anytime.</p>
  </div>`;

const offerCardB = () => `<div class="form-card member" id="join">
    <div class="form-h">BTH Stay Ready</div>
    <div class="price-row"><span class="price-num">$27</span><span class="price-per">/month</span></div>
    <ul class="inside-list">
      <li>Foundation Month — your first four weeks, structured</li>
      <li>The Strength Block</li>
      <li>All five add-on tracks included</li>
      <li>Train at home or in the gym</li>
      <li>Cancel anytime — no lock-in</li>
    </ul>
    <a class="join-btn" href="${STRIPE_MONTHLY}">Join Stay Ready &rarr;</a>
    <p class="buy-note">No lock-in — it's month to month. Cancel anytime with one email, no calls. (No refunds on a month already started.)</p>
    <p class="form-trust">Secure Stripe checkout.<br>Not sure yet? <a href="#free-start" style="color:var(--gold-text);">Start with the free 5-Day Reset &rarr;</a></p>
  </div>`;

// The B-page free-start capture block.
//
// WHY IT LIVES HERE: PR #89 (merged 2026-08-17) added this form by hand-editing the four generated
// B pages and never touched this generator. That made every B page one `node generate-lps.mjs` away
// from silently losing BTH's only working Campaign B email capture — and the loss would be
// invisible, because the pages would still build, still deploy, and still look right. Caught
// 2026-08-17 when the Strength Block rename regenerated the pages and `capture-truth` went from
// 4 capturing B pages to 0. Generated files are not a place to keep a fix.
//
// A B page sells the $27/mo membership, so the honest secondary ask is the free reset, not a
// discount. `bth-email-lp-${p.slug}` keeps the input id unique per page.
// Per-page copy from PR #89, recovered from origin/main and moved into config here so the generator
// reproduces it exactly instead of flattening all four pages to one shared heading. Each answers the
// specific objection its keyword implies: "best program" -> judge it yourself; "online" -> see how
// it runs; "training membership" -> try the training. Falls back to the neutral pair.
const FREE_START_COPY = {
  'basketball-membership': ['Not Ready To Pay Yet?', 'Take the free 5-Day Reset first. Five days of the actual system, no card, no trial. Decide on the membership after you have trained with it.'],
  'basketball-training-membership': ['Try The Training First', 'The free 5-Day Reset is a real piece of the membership, not a sample. Five sessions, one a day, then you know exactly what you would be paying for.'],
  'best-basketball-training-program': ['Judge It For Yourself', 'Every program calls itself the best. Take five days of ours free and decide with your own body instead of our sales page.'],
  'online-basketball-training-program': ['See How It Runs First', 'One session lands in your inbox each day for five days. No app to learn, no card. See how the training actually runs before you join.'],
};

const freeStartB = (p) => {
  const [h, sub] = FREE_START_COPY[p.slug]
    ?? ['Not Ready To Pay Yet?', 'Take the free 5-Day Reset first. Five days of the actual system, no card, no trial. Decide on the membership after you have trained with it.'];
  return `<section class="lp-section" id="free-start">
  <div class="form-card free" id="optin">
    <div class="form-h">${h}</div>
    <p class="form-sub">${sub}</p>
    <form class="bth-mail-form" action="https://bth-mail-os.tyrell-38b.workers.dev/api/subscribe" method="post" novalidate data-bth-redirect="/thank-you.html">
      <div class="bth-field">
        <input type="text" name="name" placeholder="First name" autocomplete="given-name">
      </div>
      <div class="bth-field">
        <input type="email" name="email" placeholder="Email address" required autocomplete="email" id="bth-email-lp-${p.slug}">
        <p class="bth-field-error-msg"></p>
      </div>
      <input type="hidden" name="source" value="free_reset">
      <input type="hidden" name="sequence" value="free-reset-to-rise">
      <input type="hidden" name="consent_version" value="bth-email-consent-v1">
      <input type="text" name="company" tabindex="-1" autocomplete="off" aria-hidden="true" class="bth-hp">
      <button type="submit" class="bth-btn-commit">
        <span class="bth-spinner"></span><span class="bth-btn-label" data-working-label="Sending&hellip;">Start The 5-Day Reset &rarr;</span>
      </button>
      <p class="bth-form-success" role="status">You're in &#9889;</p>
    </form>
    <p class="form-trust">No spam. No junk funnel. One email a day for 5 days, then a short weekly note. Unsubscribe anytime.</p>
  </div>
</section>`;
};

const valueStrip = (cards, title) => `<section class="value-strip"><h2 class="value-strip-title">${title}</h2><div class="value-grid">
${cards.map(([h, b]) => `  <div class="value-card"><h3><span>—</span>${h}</h3><p>${b}</p></div>`).join('\n')}
</div></section>`;

const whySection = (p) => `<section class="lp-section">
  <div class="lp-eyebrow">Why It Works</div>
  <h2 class="lp-h2">${p.h1}<br>Built As <span class="gold">One System.</span></h2>
${p.whyParas.map(t => `  <p class="lp-body">${t}</p>`).join('\n')}
</section>`;

const faqSection = (p) => `<section class="lp-section">
  <div class="lp-eyebrow">FAQ</div>
  <h2 class="lp-h2">Common <span class="gold">Questions.</span></h2>
  <div class="faq-wrap">
${p.faq.map(({ q, a }) => `    <div class="faq-item">\n      <h3 class="faq-q">${q}</h3>\n      <p class="faq-a">${a}</p>\n    </div>`).join('\n')}
  </div>
</section>`;

const A_VALUES = [
  ['Five Free Days', 'The 5-Day Reset is a real piece of the system, free. One focused protocol a day, 10–20 minutes.'],
  ['Built By A Hooper', 'Made by a player who still hoops — not a content farm. Every session exists because the game asks for it.'],
  ['No Gym Required', 'The first three days need zero equipment. Train in your living room, hotel room, or the gym.'],
];
const B_VALUES = [
  ['Everything Included', 'Foundation Month, the Strength Block and every add-on track — one membership, one price.'],
  ['Cancel Anytime', 'Monthly, self-serve, no lock-in. Stay because the training earns it.'],
  ['Built By A Hooper', 'Made by a player who still hoops. Direct, structured, honest training — no hype.'],
];

const page = (p, kind) => `${head(p)}
<body>
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-T9SFFTB7" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<nav>
  <a class="nav-logo" href="../index.html">Built <span>to</span> Hoop</a>
  <a class="nav-cta" href="${kind === 'A' ? '#optin' : '#join'}">${kind === 'A' ? 'Start Free' : 'Join — $27/Mo'}</a>
</nav>
<section class="hero-split">
  <div>
    <div class="hero-eyebrow">${p.eyebrow}</div>
    <h1 class="hero-title">${p.h1}</h1>
    <p class="hero-sub">${p.sub}</p>
    ${kind === 'A' ? `<ul class="bullets">\n${p.bullets.map(b => `      <li>${b}</li>`).join('\n')}\n    </ul>` : ''}
  </div>
  ${kind === 'A' ? formCardA(p) : offerCardB()}
</section>
${kind === 'B' ? freeStartB(p) + '\n' : ''}${whySection(p)}
${valueStrip(kind === 'A' ? A_VALUES : B_VALUES, kind === 'A' ? "What's Inside The System" : "What's Inside The Membership")}
${faqSection(p)}
<footer>
  <a class="foot-logo" href="../index.html">Built <span>to</span> Hoop</a>
  <div class="foot-links">
    <a href="../index.html">Home</a>
    <a href="../reset.html">Free Reset</a>
    <a href="../join.html">Join</a>
    <a href="../about.html">About</a>
    <a href="../manage.html">Manage Membership</a>
  </div>
</footer>
</body>
</html>
`;

mkdirSync(here, { recursive: true });
let n = 0;
for (const p of A_PAGES) { writeFileSync(join(here, `${p.slug}.html`), page(p, 'A')); n++; }
for (const p of B_PAGES) { writeFileSync(join(here, `${p.slug}.html`), page(p, 'B')); n++; }
for (const p of R_PAGES) { writeFileSync(join(here, `${p.slug}.html`), page(p, 'A')); n++; }
console.log(`${n} LPs written to lp/ (${A_PAGES.length} reset-funnel + ${B_PAGES.length} join-path + ${R_PAGES.length} reset-variant).`);
