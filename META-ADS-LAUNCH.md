# BTH Meta Ads — Campaign Launch File
_Execution-ready. Copy every field exactly as written into Meta Ads Manager._
_Pixel: 1728040128369123 · Domain: built-to-hoop.com_

---

## SETUP CHECKLIST (do before creating any campaigns)

- [ ] Meta Pixel 1728040128369123 verified on all pages (ad_readiness_test.py confirms this)
- [ ] Domain verified in Business Manager → Brand Safety → Domains
- [ ] thank-you.html set as MailerLite form redirect URL
- [ ] Conversion events configured in Events Manager:
  - `Lead` → thank-you.html page view (URL contains "thank-you")
  - `InitiateCheckout` → bth-tracking.js click event
  - `ViewContent` → bth-tracking.js page load on tier/addon pages
- [ ] Custom Audiences built (see Section A)
- [ ] UTM parameters ready (see Section B)

---

## SECTION A — CUSTOM AUDIENCES (build these first)

### Audience 1: Website Visitors — All (180 days)
- Source: Website
- Include: All website visitors
- Retention: 180 days
- Name: `BTH — All Visitors 180d`

### Audience 2: Product Page Visitors (30 days)
- Source: Website
- Include: People who visited URLs containing `tier-1`, `tier-2`, `tier-3`, `addons`
- Retention: 30 days
- Name: `BTH — Product Pages 30d`

### Audience 3: Reset Page Visitors (30 days)
- Source: Website
- Include: People who visited URL containing `reset.html`
- Retention: 30 days
- Name: `BTH — Reset Page 30d`

### Audience 4: Leads (thank-you page visitors)
- Source: Website
- Include: People who visited URL containing `thank-you`
- Retention: 180 days
- Name: `BTH — Confirmed Leads 180d`

### Audience 5: Lookalike — Leads (2%)
- Source: BTH — Confirmed Leads 180d
- Size: 2%
- Location: United States
- Name: `BTH — LAL Leads 2% US`

### Audience 6: Lookalike — Product Visitors (2%)
- Source: BTH — Product Pages 30d
- Size: 2%
- Location: United States
- Name: `BTH — LAL Product Visitors 2% US`

---

## SECTION B — UTM STRUCTURE

All Meta ads use this UTM format:

```
utm_source=meta
utm_medium=paid_social
utm_campaign={campaign_name}
utm_content={ad_name}
```

**Campaign name examples:**
- `cold_free_reset_lead_gen`
- `retarget_visitors_tier1`
- `retarget_leads_tier1`
- `cold_tier1_direct`

---

## CAMPAIGN 1 — FREE RESET LEAD GEN (Cold Traffic)
**Objective:** Leads  
**Budget:** $20/day (start here — lowest risk)  
**Attribution:** 7-day click, 1-day view  
**Goal:** Get confirmed email opt-ins at $3–8 CPL

### Campaign Settings
- Campaign name: `BTH — Cold — Free Reset Lead Gen`
- Buying type: Auction
- Campaign Budget Optimization: ON
- Budget: $20/day

---

### Ad Set 1A — Basketball Interest Broad
- Name: `Cold — Basketball Interest — Broad`
- Conversion event: `Lead` (thank-you.html)
- Location: United States
- Age: 28–55
- Gender: Men
- Interests:
  - Basketball
  - NBA
  - Recreational basketball
  - Pickup basketball (if available)
  - Sports & Fitness (broad)
- Exclude: BTH — Confirmed Leads 180d
- Placements: Automatic (let Meta optimize)
- Budget: $10/day (CBO distributes)

---

### Ad Set 1B — Lookalike Leads
- Name: `Cold — LAL Leads 2% — Free Reset`
- Conversion event: `Lead` (thank-you.html)
- Location: United States
- Age: 25–55
- Gender: Men
- Audience: BTH — LAL Leads 2% US
- Exclude: BTH — Confirmed Leads 180d
- Budget: $10/day (CBO distributes)

---

### AD 1 — "Body Feels Broken" (Video/Static Image)
**Ad name:** `Cold_FreeReset_BodyBroken_v1`
**Format:** Single image or short video (6–15 sec)
**Destination URL:** `https://built-to-hoop.com/reset.html?utm_source=meta&utm_medium=paid_social&utm_campaign=cold_free_reset_lead_gen&utm_content=cold_freeset_bodybroken_v1`

**Headline (27 chars max):**
```
Your Body's Not Done Yet.
```

**Primary Text:**
```
You wake up and the hips are stiff. The knees ache on stairs. You played hard last week and you're still paying for it.

That's not age. That's a body that's never had a system built around it.

The BTH 5-Day Reset is free. Takes 10 minutes a day. You'll feel the difference by Day 3.

No gym. No equipment. No email spam.

Just the 5 moves that fix the stiffness and get you back to playing without paying for it for a week.
```

**Call to Action:** Get Quote → (or "Sign Up")
**Description (20 chars):**
```
Free. 5 days. No card.
```

---

### AD 2 — "Still Playing at 35+" Hook
**Ad name:** `Cold_FreeReset_35Plus_v1`
**Format:** Single image or carousel
**Destination URL:** `https://built-to-hoop.com/reset.html?utm_source=meta&utm_medium=paid_social&utm_campaign=cold_free_reset_lead_gen&utm_content=cold_freeset_35plus_v1`

**Headline:**
```
Still Playing at 35+? Read This.
```

**Primary Text:**
```
Most guys stop playing in their 30s because the recovery stops working.

Not because they got slow. Because they never had a system that worked WITH their body instead of against it.

The 5-Day Reset is the starting point. It's free. It's 10 minutes a day. It's built specifically for adult hoopers who aren't ready to stop.

Day 1 hits your hips.
Day 2 rebuilds your ankles.
Day 5 you play again and it actually feels different.

Grab it. It costs nothing.
```

**Call to Action:** Sign Up
**Description:**
```
Free 5-Day email series. No card.
```

---

### AD 3 — "Pickup Test" Pain Angle
**Ad name:** `Cold_FreeReset_PickupTest_v1`
**Format:** Single image

**Headline:**
```
When's the Last Time You Played?
```

**Primary Text:**
```
Quick test.

Think about the last time you laced up for pickup.

Did your hips feel locked when you first got out there? Did your knees start talking to you after 3 hard runs? Did you feel it for 2 days after?

That's not normal. That's your body telling you it needs a system.

The BTH 5-Day Reset fixes the stiffness that's keeping you from playing the way you want to.

Free. 5 days. 10 minutes a day. Your inbox.
```

**Call to Action:** Sign Up

---

## CAMPAIGN 2 — RETARGETING: VISITORS → TIER 1
**Objective:** Sales  
**Budget:** $15/day  
**Goal:** Convert product page visitors to Tier 1 purchase

### Campaign Settings
- Campaign name: `BTH — Retarget — Visitors → Tier 1`
- Objective: Sales (Purchase or InitiateCheckout event)
- Budget: $15/day CBO

---

### Ad Set 2A — Product Page Visitors
- Name: `Retarget — Product Pages 30d — Tier 1`
- Audience: BTH — Product Pages 30d
- Exclude: BTH — Confirmed Leads 180d (they're already in, treat separately)
- Location: United States
- Age: 25–55
- Budget: $15/day CBO

---

### AD 4 — "You Already Know" Retarget
**Ad name:** `Retarget_Tier1_YouAlreadyKnow_v1`
**Destination URL:** `https://built-to-hoop.com/tier-1.html?utm_source=meta&utm_medium=paid_social&utm_campaign=retarget_visitors_tier1&utm_content=retarget_tier1_youalreadyknow_v1`

**Headline:**
```
$31.99. The System You Keep Putting Off.
```

**Primary Text:**
```
You looked at it.

You know what's wrong. The hips are stiff. The body doesn't bounce back the way it used to. The cycle of training, getting hurt, stopping, and starting over keeps repeating.

BTH Foundation is the structured way out.

6 weeks. 3 days a week. Built around your pickup schedule so you can train AND play.

$31.99. One-time. Keep it forever.

7-day refund if it's not for you. No questions.
```

**Call to Action:** Shop Now
**Description:**
```
$31.99 one-time. 7-day refund guarantee.
```

---

### AD 5 — "The Cycle Ends" Retarget
**Ad name:** `Retarget_Tier1_TheCycleEnds_v1`
**Destination URL:** `https://built-to-hoop.com/tier-1.html?utm_source=meta&utm_medium=paid_social&utm_campaign=retarget_visitors_tier1&utm_content=retarget_tier1_cycleends_v1`

**Headline:**
```
Built for Pickup Players. Not the Gym.
```

**Primary Text:**
```
Every other training program assumes you train to train.

BTH Foundation assumes you train to PLAY.

That's the difference. The 3-day structure is built around your pickup schedule. The readiness framework tells you exactly when to train legs and when to back off. The recovery layer keeps you ready week over week.

$31.99. The foundation you should've had two years ago.
```

**Call to Action:** Shop Now

---

## CAMPAIGN 3 — RETARGETING: LEADS → TIER 1
**Objective:** Sales  
**Budget:** $10/day  
**Goal:** Convert confirmed email leads to first purchase

### Campaign Settings
- Campaign name: `BTH — Retarget — Leads → Tier 1`
- Budget: $10/day CBO

### Ad Set 3A
- Name: `Retarget — Confirmed Leads — Tier 1 Upgrade`
- Audience: BTH — Confirmed Leads 180d
- Location: United States
- Budget: $10/day

---

### AD 6 — "You're In — Next Step" Post-Lead Retarget
**Ad name:** `Retarget_Leads_NextStep_v1`
**Destination URL:** `https://built-to-hoop.com/tier-1.html?utm_source=meta&utm_medium=paid_social&utm_campaign=retarget_leads_tier1&utm_content=retarget_leads_nextstep_v1`

**Headline:**
```
The Reset Works. Now Build on It.
```

**Primary Text:**
```
You grabbed the Free Reset. You've felt what the BTH approach does.

The 5-Day Reset fixes the stiffness. BTH Foundation makes sure it doesn't come back.

6 weeks. 3 days a week. $31.99.

This is the next step.
```

**Call to Action:** Shop Now

---

## CAMPAIGN 4 — COLD TRAFFIC: TIER 1 DIRECT
**Objective:** Sales  
**Budget:** $15/day (start after Campaigns 1–3 have data)  
**Goal:** Direct cold sale to Tier 1 — test when leads are proven profitable

### Campaign Settings
- Campaign name: `BTH — Cold — Tier 1 Direct`
- Budget: $15/day CBO

### Ad Set 4A — LAL Product Visitors
- Audience: BTH — LAL Product Visitors 2% US
- Age: 28–55
- Gender: Men
- Exclude: BTH — Confirmed Leads, BTH — Product Pages 30d
- Budget: $15/day

---

### AD 7 — "$31.99 and You Never Start Over Again"
**Ad name:** `Cold_Tier1_NeverStartOver_v1`
**Destination URL:** `https://built-to-hoop.com/tier-1.html?utm_source=meta&utm_medium=paid_social&utm_campaign=cold_tier1_direct&utm_content=cold_tier1_neverstartover_v1`

**Headline:**
```
Stop Starting Over. $31.99 Fixes That.
```

**Primary Text:**
```
The cycle goes like this.

You get inspired. You train. The run shows up. The training stops. You try to come back. Something starts hurting. You back off. You start over.

That cycle doesn't end until you have a system.

BTH Foundation is built around pickup. Not against it. 3 days a week. 6 weeks. Progressive. The readiness framework so you always know when to push and when to back off.

$31.99 one-time. Instant download.

7-day refund. No questions.
```

**Call to Action:** Shop Now

---

## CAMPAIGN 5 — INJURY ANGLE: KNEE PAIN (Cold)
**Objective:** Leads (warm to Free Reset) or Sales  
**Budget:** $10/day  
**Goal:** Capture knee pain searchers on Facebook/Instagram

### Ad Set 5A — Knee Pain Audience
- Interests: Knee pain, Knee injury, Physical therapy, Sports injuries, Orthopedics
- Age: 30–55
- Gender: Men
- Location: United States

---

### AD 8 — Knee Pain Hook
**Ad name:** `Cold_KneeTrack_PainHook_v1`
**Destination URL:** `https://built-to-hoop.com/knee.html?utm_source=meta&utm_medium=paid_social&utm_campaign=cold_injury_knee&utm_content=cold_kneetrack_painhook_v1`

**Headline:**
```
Patellar Tendon Pain? This Fixes It.
```

**Primary Text:**
```
You rest it. It gets better. You play. It comes back.

That's not a rest problem. That's a load tolerance problem.

Your patellar tendon isn't conditioned to handle pickup. You need to build it up, not just let it calm down.

The BTH Knee Protection Track is a 3-phase protocol built specifically for hoopers: isometrics → heavy slow resistance → dynamic loading.

$41.99. Targeted. Built to run alongside your pickup schedule.
```

**Call to Action:** Shop Now

---

## SECTION C — CREATIVE SPECS

### Image Ads
- Size: 1080×1080 (feed) + 1080×1920 (Stories/Reels)
- Text overlay: 20% rule (keep minimal)
- Brand colors: Black (#111318), Gold (#E6A800), Cream (#F3EFE7)
- Font: Oswald (display), DM Sans (body)

### Video Ads (recommended for cold traffic)
- Length: 6–15 sec for awareness, 30–60 sec for conversion
- Hook in first 2 seconds — text overlay "30s in: [problem statement]"
- Captions on — 80% of video watched without sound
- End card: logo + CTA text

### Recommended creative angles to test:
1. **Before/After feel** — "Before BTH: stiff every morning. After: played 3 runs back to back."
2. **Pickup B-roll** — Gym pickup footage, slow-mo cuts, defensive slides
3. **Founder talking-head** — Direct to camera, short story, authentic
4. **Text-on-screen** — Fast-cut problem statements with BTH solution

---

## SECTION D — TESTING SCHEDULE (First 30 Days)

### Days 1–7: Spend $20/day max
- Launch Campaign 1 only (Free Reset Lead Gen)
- Run Ads 1, 2, 3 simultaneously
- Goal: Get 20+ leads, identify lowest CPL ad

### Days 8–14: Add retargeting
- Launch Campaigns 2 and 3
- Kill any Ad Set with CPL > $12 after 7 days and 1,000+ impressions
- Scale winning ad to $30/day if CPL < $6

### Days 15–21: Optimize
- Scale the winning lead gen ad set to $40/day
- Identify any Tier 1 purchases from retargeting (track via InitiateCheckout)
- Test one new creative angle against current winner

### Days 22–30: Cold to purchase test
- If leads are converting from email at >5% purchase rate, launch Campaign 4 (Cold Tier 1 Direct)
- Start with $15/day, evaluate after 3 days

---

## SECTION E — KEY METRICS & THRESHOLDS

| Metric | Target | Kill threshold |
|--------|--------|----------------|
| CPL (cost per lead) | < $6 | > $12 after 3+ days |
| CTR (link click) | > 1.5% | < 0.5% after 1,000 imp |
| Landing page CVR (opt-in) | > 15% | < 8% |
| Retarget to purchase CVR | > 3% | < 1% after 50+ clicks |
| Email → purchase rate | > 5% (30-day) | < 2% after 60 days |

---

## NOTES
- Do NOT run Tier 2 ($97) or Tier 3 ($27/mo) to cold traffic until Tier 1 is proven
- Free Reset → Tier 1 is the proven funnel entry — protect CPL obsessively
- All ads go to the website first — never direct to Gumroad from cold traffic
- Check Meta Events Manager after Day 3 to confirm Lead events are firing
