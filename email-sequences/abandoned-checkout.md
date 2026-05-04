# Abandoned Checkout Sequence — BTH

**Total emails:** 3
**Window:** 72 hours after checkout abandon
**Goal:** Recover the buyer without sounding desperate or sales-y. BTH voice = direct, hooper-to-hooper, no fitness-influencer fluff.

---

## How to wire this up (MailerLite or whatever you use)

You need 3 things:
1. **Trigger:** Visitor lands on a Gumroad checkout page but doesn't complete purchase within X minutes.
2. **Identifier:** You need their email — easiest path is to require email *before* the Gumroad checkout (use the homepage / reset opt-in to capture first, then redirect to Gumroad).
3. **Stop condition:** Auto-stop the sequence the moment they purchase ANY BTH product (so buyers don't get "still thinking about BTH?" emails).

If you can't track Gumroad-specific abandoned carts, run this sequence on **anyone who clicks a tier CTA but doesn't buy within 24h** — that's still 80% as effective.

---

## Tagging logic (recommended)

Tag the subscriber with what they almost bought:
- `abandon_tier1` — saw $19 Foundation, didn't buy
- `abandon_tier2` — saw $57 Rise, didn't buy
- `abandon_tier3` — saw $27/mo or $197/yr Stay Ready, didn't buy
- `abandon_addon_<slug>` — saw a specific add-on

Each email below has tier-specific swap blocks marked `[TIER SWAP]`. Default copy is for Tier 2 ($57 Rise) since it's the most common abandon point. Swap the offer line and CTA based on the tag.

---

# EMAIL 1 — The Reminder
**Send:** 90 minutes after abandon
**Subject options (A/B test):**
- A: `you almost did it`
- B: `the tab is still open somewhere`
- C: `1 step left`
**Preview text:** `90 seconds and you're in. promise.`

---

Hey [first_name|hooper],

You got to checkout and stopped.

That's fine. People do it 100 times a day for 100 reasons. Maybe the kid woke up. Maybe a meeting. Maybe you just wanted to think about it.

I'm not gonna pretend I know which one.

But here's the thing — **you already did the hard part.** You knew you were stiff. You knew the warmups weren't cutting it. You knew you couldn't keep playing through the same nag every Sunday.

You picked the program. You opened the checkout.

Last step.

[TIER SWAP — Tier 2]
**Tier 2: Rise — $57 one-time. 12 weeks. Yours forever.**
→ [Finish your order](https://builttohoop.gumroad.com/l/groedz)

[TIER SWAP — Tier 1]
**Tier 1: Foundation — $19 one-time.**
→ [Finish your order](https://builttohoop.gumroad.com/l/ecyzaa)

[TIER SWAP — Tier 3]
**Tier 3: Stay Ready — $27/mo or $197/yr. Everything BTH does, all in.**
→ [Finish your order](https://builttohoop.gumroad.com/l/thxqs)

If something broke — wrong card, page froze, whatever — just hit reply and tell me. I'll get you in.

— Ty, BTH
built-to-hoop.com

---

# EMAIL 2 — The Objection Handler
**Send:** 24 hours after abandon (only if Email 1 didn't convert)
**Subject options (A/B test):**
- A: `the 3 reasons people don't pull the trigger`
- B: `quick — is it the price, the time, or the "later"?`
- C: `let me kill the doubt`
**Preview text:** `if it's one of these, I have an answer.`

---

Hey [first_name|hooper],

You didn't finish checkout yesterday. I'm not gonna chase. But I want to put three things on the table because I've watched enough hoopers stall on this page to know what's usually going on.

**1. "It's $57 — I'll do it next paycheck."**

Cool. But know this: every week you wait, you keep training the same way that put you here. Stiffness compounds. So does compensation. The hip you ignored at 28 is the knee surgery at 33. I'm not selling fear — I'm selling a 12-week program that costs less than ONE physical therapy copay.

If $57 is the issue right now, drop down to **[Tier 1: Foundation — $19](https://builttohoop.gumroad.com/l/ecyzaa).** Same system. Smaller commitment. You can upgrade anytime — I'll credit what you paid.

**2. "I don't have time."**

The program is built around hoopers who already have lives. Sessions are 30–45 minutes. You can run it 3x a week. You can stack it on your existing lifts. If you can find time to play pickup, you can find time to keep your body able to keep playing pickup.

The math: 45 min × 3x/week = 2.25 hours. That's less than one Sunday run.

**3. "I'll start when [the season ends / I'm less busy / I feel better]."**

Translation: never. You know this.

You'll feel better *because* you start. Not before.

→ [Finish what you started](https://builttohoop.gumroad.com/l/groedz)

If none of these are it, hit reply. Tell me what's actually in the way. I'll either fix it or tell you straight up the program isn't for you. Either way you walk away with an answer.

— Ty

---

# EMAIL 3 — The Final Call
**Send:** 72 hours after abandon (only if 1 and 2 didn't convert)
**Subject options (A/B test):**
- A: `last one from me on this`
- B: `closing this loop`
- C: `quick check — should I take you off this list?`
**Preview text:** `no follow-up after this. promise.`

---

Hey [first_name|hooper],

This is the last email I'll send you about Tier 2. I don't run "10 emails over 14 days" sequences. I'm not trying to wear you down.

Three days ago you almost bought BTH. I assume something pulled you away. That's life.

Two paths from here:

**Path A — you're still in.**
[Finish the order](https://builttohoop.gumroad.com/l/groedz). Takes 90 seconds. You get instant access.

**Path B — it's not the right fit, or not the right time.**
That's also fine. Reply with a single word — "out" — and I'll move you out of this sequence. You'll still get the weekly note (one short email a week, no pitches) so you stay close to BTH for whenever you're ready.

No hard feelings either way. The only thing I won't do is keep nudging if it's not landing.

The reason BTH exists: someone (me) needed it and couldn't find it. So I built it. If it's the right thing for you, I want you in. If not, I'd rather you keep your inbox clean.

Your move.

— Ty
built-to-hoop.com

P.S. If money is the real block — not the excuse, the actual block — reply and tell me. I keep a small number of free seats for hoopers in real situations. No essay needed. No proof. Just ask.

---

# A/B test plan (week 1)

| Email | Test | Variant A | Variant B | Winner = ship to all |
|-------|------|-----------|-----------|--|
| Email 1 | Subject | `you almost did it` | `the tab is still open somewhere` | Higher open rate after 200 sends |
| Email 2 | Subject | `the 3 reasons people don't pull the trigger` | `quick — is it the price, the time, or the "later"?` | Higher click rate after 200 sends |
| Email 3 | Send time | 72h post-abandon | 96h post-abandon | Higher purchase rate |

# Performance benchmarks (industry baseline for fitness/coaching)

- Email 1 open rate: 50–60% target
- Email 1 click rate: 8–12%
- Sequence recovery rate: 8–15% of abandons → buyers
- Unsubscribe rate per email: <0.5% acceptable

If your numbers are way below these, the issue is usually one of:
1. List health (lots of dead emails) — clean the list
2. Subject lines not opening — A/B harder
3. The actual checkout page is the leak, not the email — re-test the buyer flow

# Variants for Tier 1 and Tier 3

If a subscriber abandons Tier 1 ($19), use the same structure but change Email 2's "It's $57" objection to:
> "I'll wait for the bigger one." → No. Tier 1 IS the program for what you described. Adding more later doesn't help if you don't fix the foundation now.

If they abandon Tier 3 (membership), Email 2's "It's $57" block becomes:
> "$27/mo feels recurring." → It is. But it's also less than a single chiropractor visit, and you get the entire library — including any program I add over the next year. If you'd rather one-time, [Tier 2](https://builttohoop.gumroad.com/l/groedz) is the move.
