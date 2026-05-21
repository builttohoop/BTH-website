# BTH Google Ads — Cowork Agent Handoff
_Last updated by Claude Code session. Pick up exactly where Ty left off._

---

## YOUR JOB
Open Google Ads in the browser (ads.google.com), navigate to the correct screens, and input every field from this document. All copy, URLs, keywords, and settings are pre-written below — your job is to find the right fields on screen and paste them in exactly.

Ty is logged into Google Ads. Use the browser tools to navigate and fill in forms.

---

## CURRENT STATUS

| Item | Status |
|---|---|
| GA4 linked to Google Ads | Unknown — verify first |
| Auto-tagging ON | Unknown — verify first |
| BTH Lead conversion | Unknown — verify first |
| BTH Initiate Checkout conversion | Unknown — verify first |
| Campaign 1 — Knee Pain | **STARTED, NOT FINISHED** |
| Campaign 2 — Adult Basketball Training | Not started |
| Extensions (sitelinks, callouts) | Not started |

---

## STEP 0 — VERIFY SETUP BEFORE TOUCHING CAMPAIGNS

Before building anything, confirm these are done. Navigate to:
**Wrench/Tools icon → Measurement → Conversions**

Check if these two conversion actions exist:
- `BTH Lead`
- `BTH Initiate Checkout`

If either is missing, create them:

### BTH Lead (Website conversion)
- Conversions → + New → Website
- Category: `Lead`
- Conversion name: `BTH Lead`
- Value: Don't assign a value
- Count: `One`
- Click-through window: `30 days`
- Attribution: `Data-driven` (or Last click)
- URL contains: `thank-you`

### BTH Initiate Checkout (Import from GA4)
- Conversions → + New → Import → Google Analytics 4
- Find event: `InitiateCheckout`
- Name: `BTH Initiate Checkout`
- Category: `Purchase`
- Value: `19`
- Count: `Every`

### Also verify: Auto-tagging
- Wrench → Settings → Account settings → Auto-tagging → must be checked ON

---

## STEP 1 — FINISH CAMPAIGN 1 (KNEE PAIN)

Campaign 1 was started but not completed. Navigate to it:
**Campaigns → All campaigns → BTH — Search — Knee Pain**

### Verify these campaign-level settings are correct:
| Field | Should be |
|---|---|
| Campaign name | `BTH — Search — Knee Pain` |
| Campaign type | Search |
| Networks | Display Network OFF · Search Partners OFF |
| Location | United States |
| Language | English |
| Bidding | Maximize conversions |
| Daily budget | $10 |

### Add campaign-level negative keywords:
Go to: Campaign → Keywords → Negative keywords → + Add
Add these (one per line):
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

### Ad Group 1A — "Knee Pain Basketball"
Check if this ad group exists. If not, create it inside Campaign 1.

**Keywords** (phrase and exact match — enter each one):
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
Note: quotes = phrase match, brackets = exact match

**Ad group negative keywords:**
```
surgery
doctor
medical
cortisone
injection
specialist
MRI
```

**Responsive Search Ad inside Ad Group 1A:**

Final URL:
```
https://built-to-hoop.com/knee.html?utm_source=google&utm_medium=cpc&utm_campaign=knee_pain&utm_content=patellar_v1
```

Headlines (enter all 15 — PIN headline 1 to position 1, PIN headline 2 to position 2):
```
Headline 1:  Knee Pain on the Court?          [PIN POSITION 1]
Headline 2:  Built for Basketball Players     [PIN POSITION 2]
Headline 3:  Fix Patellar Tendon Pain
Headline 4:  $19 Knee Protection Protocol
Headline 5:  Stop Resting. Start Rebuilding.
Headline 6:  3-Phase Tendon Rebuild System
Headline 7:  Play Without the Knee Ache
Headline 8:  Adult Hoopers — Knee Protocol
Headline 9:  Works Around Your Pickup Schedule
Headline 10: Hooper-Built. Not Generic PT.
Headline 11: Instant Digital Delivery
Headline 12: Instant Digital Download
Headline 13: Fix the Pain. Keep Playing.
Headline 14: Resting It Isn't Working
Headline 15: Built Around Pickup Basketball
```

Descriptions (enter all 4):
```
D1: Patellar tendon pain doesn't go away with rest alone. Build load tolerance — the 3-phase protocol built for pickup players.
D2: BTH Knee Protection Track: isometrics → heavy slow resistance → dynamic loading. $19. Instant download. Built for pickup players.
D3: Your knee pain isn't a rest problem — it's a load tolerance problem. Fix it with a system built for adult hoopers.
D4: The BTH protocol rebalances VMO strength, fixes ankle-hip mechanics, and builds the tendon to handle pickup demands. $19.
```

---

### Ad Group 1B — "Knee Recovery Keywords"
Create a second ad group inside Campaign 1. Name it: `Knee Recovery Keywords`

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

**Responsive Search Ad inside Ad Group 1B:**

Final URL:
```
https://built-to-hoop.com/knee.html?utm_source=google&utm_medium=cpc&utm_campaign=knee_pain&utm_content=vmo_v1
```

Headlines (enter all 10 — PIN headline 1 to position 1, PIN headline 2 to position 2):
```
Headline 1:  Weak Quads Causing Knee Pain?    [PIN POSITION 1]
Headline 2:  The BTH Knee Fix — $19           [PIN POSITION 2]
Headline 3:  VMO + Patellar Tendon Protocol
Headline 4:  Rebalance. Rebuild. Keep Playing.
Headline 5:  Not Generic PT. Built for Hoopers.
Headline 6:  Jump Without the Ache
Headline 7:  Adult Basketball Knee Protocol
Headline 8:  Load Tolerance, Not Just Rest
Headline 9:  Instant Digital Download
Headline 10: Instant Download
```

Descriptions (enter both):
```
D1: VMO imbalance and poor quad tracking are behind most patellar pain. Fix the root cause — $19 hooper-specific protocol.
D2: Stop guessing which exercises help. Get the 3-phase system built for basketball: tendon rebuild + VMO balance + landing mechanics.
```

---

## STEP 2 — BUILD CAMPAIGN 2 (ADULT BASKETBALL TRAINING)

Create a new campaign. Navigate to: **Campaigns → + New Campaign**

### Campaign settings:
| Field | Enter this |
|---|---|
| Goal | Sales (or Leads) |
| Campaign type | Search |
| Campaign name | `BTH — Search — Adult Basketball Training` |
| Networks | Display Network OFF · Search Partners OFF |
| Location | United States |
| Language | English |
| Bidding | Maximize conversions |
| Daily budget | `$10` |

Add same campaign-level negative keywords as Campaign 1:
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

### Ad Group 2A — "Adult Hooper Training"

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

**Ad group negative keywords:**
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

**Responsive Search Ad inside Ad Group 2A:**

Final URL:
```
https://built-to-hoop.com/tier-1.html?utm_source=google&utm_medium=cpc&utm_campaign=adult_bball_training&utm_content=foundation_v1
```

Headlines (enter all 15 — PIN headline 1 to position 1, PIN headline 2 to position 2):
```
Headline 1:  Train for Pickup Basketball      [PIN POSITION 1]
Headline 2:  Built to Hoop — $19 Program      [PIN POSITION 2]
Headline 3:  6-Week Hooper Training Program
Headline 4:  For Adult Pickup Players 30+
Headline 5:  Train AND Play. Not One or the Other.
Headline 6:  The Pickup-First Training System
Headline 7:  Fix the Pain. Build the Base.
Headline 8:  3-Day Program Around Your Schedule
Headline 9:  Keep Playing — Stop Starting Over
Headline 10: Built by a Hooper. For Hoopers.
Headline 11: Works at Planet Fitness Level Gym
Headline 12: $19 One-Time. Keep Forever.
Headline 13: Instant Digital Delivery
Headline 14: Instant Digital Download
Headline 15: Phases 1 + 2 of the BTH Method
```

Descriptions (enter all 4):
```
D1: The training system built around pickup — not against it. 3-day schedule, progressive loading, readiness framework. $19. Keep forever.
D2: You train to play. Not the other way around. BTH Foundation: 6 weeks, 3 phases, built so you can train and still make the run. $19.
D3: Fix the stiffness, rebuild the base, stop the cycle of pain and starting over. The structured program adult hoopers have been missing.
D4: 6 weeks. 3 days/week. Works at any gym. Built for guys 28–50 who want to keep playing and stop getting hurt. Instant download. $19.
```

---

### Ad Group 2B — "Back to Basketball"
Create second ad group inside Campaign 2. Name it: `Back to Basketball`

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

**Responsive Search Ad inside Ad Group 2B:**

Final URL:
```
https://built-to-hoop.com/tier-1.html?utm_source=google&utm_medium=cpc&utm_campaign=adult_bball_training&utm_content=return_v1
```

Headlines (enter all 8 — PIN headline 1 to position 1, PIN headline 2 to position 2):
```
Headline 1: Getting Back Into Basketball?     [PIN POSITION 1]
Headline 2: The System That Gets You Back     [PIN POSITION 2]
Headline 3: For Guys Who Haven't Stopped Caring
Headline 4: 6 Weeks Back to Full Speed
Headline 5: Fix the Body. Get Back to the Court.
Headline 6: Pickup-Ready in 6 Weeks — $19
Headline 7: Built for the Comeback
Headline 8: Not Just Fitness. Court-Ready Fitness.
```

Descriptions (enter both):
```
D1: BTH Foundation gets you from "out of it" to pickup-ready in 6 weeks. 3 days/week, built around your schedule. $19.
D2: The return-to-pickup program for adult hoopers. Fix stiffness, build strength, know exactly when your body is ready to go. $19.
```

---

## STEP 3 — ADD EXTENSIONS TO BOTH CAMPAIGNS

Do this for Campaign 1 AND Campaign 2. Navigate to each campaign → Ads & extensions → Extensions.

### Sitelinks (add all 4 to each campaign):
| Sitelink text | Final URL |
|---|---|
| Free 5-Day Reset | `https://built-to-hoop.com/reset.html` |
| BTH Foundation $19 | `https://built-to-hoop.com/tier-1.html` |
| Full Library — $27/mo | `https://built-to-hoop.com/tier-3.html` |
| About Built to Hoop | `https://built-to-hoop.com/about.html` |

### Callouts (add all 5 to each campaign):
```
Instant Digital Download
No Subscription Required
Built for Adult Hoopers
Works at Any Gym
Pickup-First Training System
```

### Structured Snippet (add to each campaign):
- Header type: `Programs`
- Values: `Foundation, Rise, Stay Ready, Hip Reset, Knee Protection, Ankle Rebuild, Recovery System`

---

## STEP 4 — FINAL CHECK BEFORE ENABLING

Before setting campaigns live, verify:
- [ ] Campaign 1 has 2 ad groups (1A and 1B), each with 1 RSA and keywords
- [ ] Campaign 2 has 2 ad groups (2A and 2B), each with 1 RSA and keywords
- [ ] Both campaigns have negative keywords at campaign level
- [ ] Both campaigns have sitelinks, callouts, structured snippets
- [ ] Both campaigns set to $10/day, Maximize Conversions, Search only
- [ ] All Final URLs contain UTM parameters (check that they weren't stripped)

Set both campaigns to **Enabled** / **Active** when everything is verified.

---

## IMPORTANT: DO NOT BUILD YET
Campaigns 3–6 (Bounce, Hip, Ankle, Brand) are documented in GOOGLE-ADS-LAUNCH.md but should NOT be built until Week 2 after Campaign 1 and 2 data comes in.

---

## KEY REFERENCE
- Site: https://built-to-hoop.com
- GA4: G-P72FN3GQ7G
- Full campaign specs: GOOGLE-ADS-LAUNCH.md in this repo
- Landing pages confirmed live: knee.html, tier-1.html, tier-2.html, tier-3.html, addons.html, bounce.html, mobility.html, reset.html, about.html
