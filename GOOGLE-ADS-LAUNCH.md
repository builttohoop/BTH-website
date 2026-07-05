# BTH Google Search Ads — Campaign Launch File
_Execution-ready. Copy every field exactly into Google Ads (ads.google.com)._
_Conversion tracking: GA4 G-YBE7PRPCLK linked to Google Ads_

---

## ✅ PRE-VERIFIED (site audit confirmed — no action needed)

- GA4 `G-YBE7PRPCLK` firing on all pages
- Meta Pixel `1728040128369123` firing on all pages
- TikTok Pixel `D7RNU1RC77U2TFGF3SO0` firing on all pages
- GTM `GTM-T9SFFTB7` noscript on all pages
- All landing page URLs live (200 OK): `/knee.html`, `/tier-1.html`, `/tier-2.html`, `/tier-3.html`, `/addons.html`, `/bounce.html`, `/mobility.html`, `/reset.html`, `/about.html`
- `thank-you.html` fires Lead pixel on load — conversion tracking confirmed
- All Gumroad CTAs wired with correct slugs + `rel=noopener` + new tab
- Refund policy updated site-wide: **All sales final · No refunds**

---

## 🚀 QUICK START — DO THESE IN ORDER

**Step 1 — Google Ads account setup (one-time, ~15 min)**
1. Go to [ads.google.com](https://ads.google.com) → Settings → Linked accounts → Link GA4 `G-YBE7PRPCLK`
2. Enable auto-tagging: Settings → Account settings → Auto-tagging → ON
3. Confirm billing is active

**Step 2 — Create conversion actions (~10 min)**
1. Tools → Conversions → New conversion action → Website
2. `BTH Lead` — URL contains `thank-you` — value: $0 (lead, not sale)
3. `BTH Initiate Checkout` — Import from GA4 → select `InitiateCheckout` event

**Step 3 — Add shared negative keywords (~5 min)**
See SHARED NEGATIVE KEYWORDS section below — add these at the account level before creating any campaigns.

**Step 4 — Launch Week 1 campaigns only**
Build Campaign 1 (Knee Pain) and Campaign 2 (Adult Training). $20/day total. Do NOT build Campaigns 3–6 yet.

**Step 5 — Add extensions to both campaigns**
See EXTENSIONS section — sitelinks, callouts, structured snippets.

---

## SETUP CHECKLIST (before creating campaigns)

- [ ] GA4 (G-YBE7PRPCLK) linked to Google Ads account
- [ ] Conversion actions created in Google Ads:
  - `BTH Lead` — triggered when someone lands on /thank-you.html
  - `BTH Initiate Checkout` — triggered on Gumroad link clicks (via GA4 event import)
- [ ] Google Ads conversion tag fired on thank-you.html (or import GA4 goals)
- [ ] UTM auto-tagging enabled in Google Ads settings
- [ ] Billing and payment method confirmed

---

## ACCOUNT STRUCTURE OVERVIEW

```
Account: Built to Hoop
├── Campaign 1: Knee Pain [Search]         $10/day
├── Campaign 2: Adult Basketball Training  $10/day
├── Campaign 3: Bounce & Explosiveness     $8/day
├── Campaign 4: Hip & Mobility Pain        $8/day
├── Campaign 5: Ankle & Recovery           $5/day
└── Campaign 6: Brand [Search]             $3/day
                                     Total: $44/day
```

Start with Campaigns 1 and 2 only ($20/day). Add the rest after 14 days of data.

---

## SHARED SETTINGS (apply to all campaigns unless noted)

- Network: Search Network ONLY (uncheck Display, uncheck Search Partners to start)
- Location: United States
- Language: English
- Bidding: Maximize Conversions (switch to Target CPA once you have 15+ conversions)
- Ad rotation: Optimize (prefer best performing)
- Ad schedule: All day (optimize later based on data)

---

## SHARED NEGATIVE KEYWORDS (add to all campaigns)

```
free
youtube
reddit
women
girls
female
nba player
college basketball
high school basketball
professional
kids
youth
training program free
workout free
```

---

## CAMPAIGN 1 — KNEE PAIN
**Daily budget:** $10  
**Goal:** Drive to `/knee.html` or `/addons.html` → sell Knee Protection Track ($41.99)

### Campaign Settings
- Campaign name: `BTH — Search — Knee Pain`
- Goal: Sales (Initiate Checkout) or Leads
- Bidding: Maximize Conversions
- Location: United States

---

### Ad Group 1A: Knee Pain Basketball
**Keywords (broad match modifier / phrase):**
```
"knee pain playing basketball"
"basketball knee pain"
"patellar tendon basketball player"
"knee pain pickup basketball"
"jumper's knee"
"patellar tendinopathy treatment"
"knee pain when playing sports"
"knee hurts after basketball"
"basketball knee problems"
[knee pain basketball player]
[patellar tendon pain]
[jumpers knee treatment]
```

**Negative keywords (ad group level):**
```
surgery
doctor
medical
cortisone
injection
specialist
MRI
```

---

### Ad 1 — Patellar Tendon Angle
**Responsive Search Ad**

**Headlines (pin the first 2 in positions 1 and 2):**
```
1. Knee Pain on the Court? [PIN pos 1]
2. Built for Basketball Players [PIN pos 2]
3. Fix Patellar Tendon Pain
4. Knee Protection — $41.99
5. Stop Resting. Start Rebuilding.
6. 3-Phase Tendon Rebuild System
7. Play Without the Knee Ache
8. Adult Hoopers — Knee Protocol
9. Works Around Your Pickup Schedule
10. Hooper-Built. Not Generic PT.
11. Instant Digital Delivery
12. Instant Digital Download
13. Fix the Pain. Keep Playing.
14. Resting It Isn't Working
15. Built Around Pickup Basketball
```

**Descriptions:**
```
D1: Patellar tendon pain doesn't go away with rest alone. Build load tolerance — the 3-phase protocol built for pickup players.
D2: BTH Knee Protection Track: isometrics → heavy slow resistance → dynamic loading. $41.99. Instant download. Built for pickup players.
D3: Your knee pain isn't a rest problem — it's a load tolerance problem. Fix it with a system built for adult hoopers.
D4: The BTH protocol rebalances VMO strength, fixes ankle-hip mechanics, and builds the tendon to handle pickup demands. $41.99.
```

**Final URL:** `https://built-to-hoop.com/knee.html?utm_source=google&utm_medium=cpc&utm_campaign=knee_pain&utm_content=patellar_v1`

---

### Ad Group 1B: Knee Recovery Keywords
**Keywords:**
```
"knee recovery basketball"
"how to fix knee pain from basketball"
"knee strengthening exercises basketball"
"quad strengthening for knee pain"
"VMO exercises for knee pain"
[knee pain relief basketball]
[strengthen knees for basketball]
```

**Ad 2 — VMO/Recovery Angle**

**Headlines:**
```
1. Weak Quads Causing Knee Pain? [PIN pos 1]
2. The BTH Knee Fix — $41.99 [PIN pos 2]
3. VMO + Patellar Tendon Protocol
4. Rebalance. Rebuild. Keep Playing.
5. Not Generic PT. Built for Hoopers.
6. Jump Without the Ache
7. Adult Basketball Knee Protocol
8. Load Tolerance, Not Just Rest
9. Instant Digital Download
10. Instant Download
```

**Descriptions:**
```
D1: VMO imbalance and poor quad tracking are behind most patellar pain. Fix the root cause — $41.99 hooper-specific protocol.
D2: Stop guessing which exercises help. Get the 3-phase system built for basketball: tendon rebuild + VMO balance + landing mechanics.
```

**Final URL:** `https://built-to-hoop.com/knee.html?utm_source=google&utm_medium=cpc&utm_campaign=knee_pain&utm_content=vmo_v1`

---

## CAMPAIGN 2 — ADULT BASKETBALL TRAINING
**Daily budget:** $10  
**Goal:** Drive to `/tier-1.html` → sell BTH Foundation ($31.99) or Free Reset opt-in

### Campaign Settings
- Campaign name: `BTH — Search — Adult Basketball Training`
- Location: United States

---

### Ad Group 2A: Adult Hooper Training
**Keywords:**
```
"basketball training for adults"
"adult pickup basketball training"
"basketball workout for adults over 30"
"basketball fitness program"
"how to train for pickup basketball"
"adult basketball player workout"
"basketball conditioning program"
[basketball training adults]
[adult basketball workout program]
[training for pickup basketball]
[over 30 basketball training]
[basketball strength program]
```

**Negative keywords (ad group level):**
```
children
kids
youth
high school
college
AAU
team
coaching
drills for kids
```

---

### Ad 3 — Foundation Program Angle
**Headlines:**
```
1. Train for Pickup Basketball [PIN pos 1]
2. Built to Hoop — $31.99 Program [PIN pos 2]
3. 6-Week Hooper Training Program
4. For Adult Pickup Players 30+
5. Train AND Play. Not One or the Other.
6. The Pickup-First Training System
7. Fix the Pain. Build the Base.
8. 3-Day Program Around Your Schedule
9. Keep Playing — Stop Starting Over
10. Built by a Hooper. For Hoopers.
11. Works at Planet Fitness Level Gym
12. $31.99 One-Time. Keep Forever.
13. Instant Digital Delivery
14. Instant Digital Download
15. Phases 1 + 2 of the BTH Method
```

**Descriptions:**
```
D1: The training system built around pickup — not against it. 3-day schedule, progressive loading, readiness framework. $31.99. Keep forever.
D2: You train to play. Not the other way around. BTH Foundation: 6 weeks, 3 phases, built so you can train and still make the run. $31.99.
D3: Fix the stiffness, rebuild the base, stop the cycle of pain and starting over. The structured program adult hoopers have been missing.
D4: 6 weeks. 3 days/week. Works at any gym. Built for guys 28–50 who want to keep playing and stop getting hurt. Instant download. $31.99.
```

**Final URL:** `https://built-to-hoop.com/tier-1.html?utm_source=google&utm_medium=cpc&utm_campaign=adult_bball_training&utm_content=foundation_v1`

---

### Ad Group 2B: Back to Basketball
**Keywords:**
```
"how to get back into basketball shape"
"getting back into basketball"
"returning to basketball after injury"
"basketball training after 30"
"pickup basketball fitness"
"how to play basketball without getting hurt"
[get back into basketball shape]
[return to basketball]
[basketball fitness over 30]
```

**Ad 4 — Return to Pickup Angle**

**Headlines:**
```
1. Getting Back Into Basketball? [PIN pos 1]
2. The System That Gets You Back [PIN pos 2]
3. For Guys Who Haven't Stopped Caring
4. 6 Weeks Back to Full Speed
5. Fix the Body. Get Back to the Court.
6. Pickup-Ready in 6 Weeks
7. Built for the Comeback
8. Not Just Fitness. Court-Ready Fitness.
```

**Descriptions:**
```
D1: BTH Foundation gets you from "out of it" to pickup-ready in 6 weeks. 3 days/week, built around your schedule. $31.99.
D2: The return-to-pickup program for adult hoopers. Fix stiffness, build strength, know exactly when your body is ready to go. $31.99.
```

**Final URL:** `https://built-to-hoop.com/tier-1.html?utm_source=google&utm_medium=cpc&utm_campaign=adult_bball_training&utm_content=return_v1`

---

## CAMPAIGN 3 — BOUNCE & EXPLOSIVENESS
**Daily budget:** $8  
**Goal:** Drive to `/bounce.html` → sell Tier 1 or Tier 2

### Campaign Settings
- Campaign name: `BTH — Search — Bounce & Explosiveness`

---

### Ad Group 3A: Lost Bounce
**Keywords:**
```
"how to get your bounce back basketball"
"lost explosiveness basketball"
"how to jump higher for basketball"
"plyometric training for basketball"
"increase vertical jump basketball"
"basketball explosiveness training"
"get faster in basketball"
[how to get bounce back basketball]
[basketball explosiveness program]
[vertical jump training basketball]
[speed and agility basketball]
```

---

### Ad 5 — Bounce Protocol
**Headlines:**
```
1. Lost Your Bounce? Here's Why. [PIN pos 1]
2. BTH Bounce Protocol — Fix It [PIN pos 2]
3. Not Age. Not Genetics. It's Fixable.
4. Convert Strength to Spring
5. The Elastic Training System
6. Pickup Explosiveness Program
7. Get Your First Step Back
8. Stop Being the Slow Version of You
9. Plyometric Protocol for Hoopers
10. Built Around the Court, Not the Gym
```

**Descriptions:**
```
D1: Losing your bounce after 30 isn't inevitable — it's a training gap. The BTH program converts gym strength into court-ready explosiveness.
D2: Most hoopers train strength but skip elastic output. BTH teaches your legs to RELEASE the strength you've built. This is the difference.
```

**Final URL:** `https://built-to-hoop.com/bounce.html?utm_source=google&utm_medium=cpc&utm_campaign=bounce_explosiveness&utm_content=bounce_v1`

---

## CAMPAIGN 4 — HIP & MOBILITY PAIN
**Daily budget:** $8  
**Goal:** Drive to `/mobility.html` → sell Hip Reset Track or Tier 1

### Ad Group 4A: Hip Pain Basketball
**Keywords:**
```
"hip pain playing basketball"
"tight hips basketball player"
"hip flexor pain basketball"
"hip mobility for basketball"
"hip tightness after basketball"
"hip flexor stretches basketball"
[hip pain basketball]
[tight hips from basketball]
[hip mobility basketball player]
[hip flexor tightness basketball]
```

---

### Ad 6 — Hip Reset
**Headlines:**
```
1. Tight Hips Ruining Your Game? [PIN pos 1]
2. BTH Hip Reset — $41.99 [PIN pos 2]
3. Fix Hip Pain From Pickup
4. Hip Flexor Reset for Hoopers
5. Hips Locked After Sitting All Day?
6. 5-Component Hip Rebuild
7. Deep Squat. Defensive Stance. Fixed.
8. The Hip Protocol for Adult Players
```

**Descriptions:**
```
D1: Locked hips = back pain, knee tracking issues, limited defensive stance. The BTH Hip Reset fixes the source, not the symptom. $41.99.
D2: Full hip capsule, flexor, and rotator protocol. Pickup-specific prep included. Rebuild the hip health that pickup is eating up. $41.99.
```

**Final URL:** `https://built-to-hoop.com/mobility.html?utm_source=google&utm_medium=cpc&utm_campaign=hip_mobility&utm_content=hip_reset_v1`

---

## CAMPAIGN 5 — ANKLE & RECOVERY
**Daily budget:** $5  
**Goal:** Drive to `/addons.html` → sell Ankle Rebuild Track

### Ad Group 5A: Ankle Sprains Basketball
**Keywords:**
```
"chronic ankle sprains basketball"
"ankle instability basketball"
"how to strengthen ankles for basketball"
"ankle rehab basketball"
"keep rolling ankle basketball"
"ankle stability training"
[weak ankles basketball]
[ankle sprain basketball player]
[ankle strengthening basketball]
```

**Ad 7 — Ankle Rebuild**
**Headlines:**
```
1. Keep Rolling the Same Ankle? [PIN pos 1]
2. BTH Ankle Rebuild — $41.99 [PIN pos 2]
3. 3-Phase Stability Protocol
4. Stop Bracing. Start Rebuilding.
5. Proprioception Training for Hoopers
6. Built for Guards + Wings
7. Stable Landings. Confident Cuts.
```

**Descriptions:**
```
D1: Chronic ankle sprains mean your nervous system doesn't trust the joint. The BTH 3-phase rebuild fixes that. $41.99, for pickup players.
D2: Phase 1: mobility. Phase 2: stability. Phase 3: loaded strength. The full ankle rebuild basketball players actually need.
```

**Final URL:** `https://built-to-hoop.com/addons.html?utm_source=google&utm_medium=cpc&utm_campaign=ankle_recovery&utm_content=ankle_rebuild_v1`

---

## CAMPAIGN 6 — BRAND
**Daily budget:** $3  
**Goal:** Protect brand terms, capture direct searchers

### Keywords:
```
[built to hoop]
[BTH foundation program]
[builttohoop]
"built to hoop basketball"
```

**Ad 8 — Brand**
**Headlines:**
```
1. Built to Hoop — Official Site [PIN pos 1]
2. Hooper Training Programs — Live [PIN pos 2]
3. Foundation · Rise · Stay Ready
4. $31.99 to Start. Keep Playing.
```

**Descriptions:**
```
D1: The training system built for adult pickup players. Free 5-Day Reset available. Foundation, Rise, and Stay Ready programs live now.
D2: BTH Foundation $31.99. BTH Rise $97. Tier 3 $27/mo. Free Reset. Built for hoopers who aren't ready to stop playing.
```

**Final URL:** `https://built-to-hoop.com/?utm_source=google&utm_medium=cpc&utm_campaign=brand&utm_content=brand_v1`

---

## EXTENSIONS (add to all campaigns)

### Sitelinks
```
Free 5-Day Reset → https://built-to-hoop.com/reset.html
BTH Foundation $31.99 → https://built-to-hoop.com/tier-1.html
Full Library — $27/mo → https://built-to-hoop.com/tier-3.html
About Built to Hoop → https://built-to-hoop.com/about.html
```

### Callouts (add to all campaigns)
```
Instant Digital Download
No Subscription Required
Built for Adult Hoopers
Works at Any Gym
Pickup-First Training System
```

### Structured Snippets
- Header: Programs
- Values: Foundation, Rise, Stay Ready, Hip Reset, Knee Protection, Ankle Rebuild, Recovery System

---

## KEY METRICS & BID TARGETS

| Campaign | Target CPA | Kill if | Scale if |
|----------|-----------|---------|----------|
| Knee Pain | $8 (lead) or $20 (sale) | CPA > $35 after 15 conv | CPA < $12, ROAS > 1.5x |
| Adult Training | $8 (lead) or $20 (sale) | CPA > $35 after 15 conv | CPA < $15, ROAS > 1.5x |
| Bounce | $10 (lead) | CPA > $30 | CTR > 3%, CVR > 5% |
| Hip/Mobility | $8 (lead) | CPA > $30 | CPA < $12 |
| Ankle | $10 (lead) | CTR < 1% | CTR > 2.5% |
| Brand | $5 max | Never kill | Keep at $3/day |

---

## LAUNCH SEQUENCE

**Week 1:** Campaign 1 (Knee Pain) + Campaign 2 (Adult Training) only — $20/day total
**Week 2:** Evaluate CPL. Add Campaign 3 or 4 based on which angle converts best on Meta
**Week 3:** Add remaining campaigns if Week 1–2 data is positive
**Week 4:** Switch winning ad sets to Target CPA bidding (needs 15+ conversions)

---

## LANDING PAGE MATCH

| Campaign | Landing Page | Conversion Goal |
|----------|-------------|-----------------|
| Knee Pain | /knee.html | Gumroad click (Knee Track $41.99) |
| Adult Training | /tier-1.html | Gumroad click (Foundation $31.99) |
| Bounce | /bounce.html | Gumroad click (Tier 1 or 2) |
| Hip/Mobility | /mobility.html | Gumroad click (Hip Reset $41.99) |
| Ankle | /addons.html | Gumroad click (Ankle Track $41.99) |
| Brand | /index.html | Any conversion |
