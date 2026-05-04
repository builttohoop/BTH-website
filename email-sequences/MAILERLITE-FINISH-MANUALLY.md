# Finish the Abandoned Checkout sequence in MailerLite

You've already got this in MailerLite as a draft: **Abandoned Checkout - Soft (post-Reset)**

What's done:
- ✅ Trigger: Subscriber joins "Free Reset Subscribers"
- ✅ Email 1 metadata (subject, preheader, sender)

What's left: drop in Delay + Condition steps before each email, paste the bodies, repeat for Emails 2 & 3.

The MailerLite drag-and-drop wasn't responding well to remote automation, but it works fine when you do it yourself. Should take ~15 min start to finish.

---

## Step 1 — Add the 7-day Delay before Email 1

Why 7 days: your existing "5 day reset" automation runs first. We give it 2 days of breathing room before the abandoned-checkout sequence starts.

1. In the canvas, click the **+** between the trigger and Email 1.
2. The "Drag a step here" dropzone appears. From the left sidebar (Rules & actions tab), drag **Delay** onto it.
3. Click the new Delay step → set to **7 days** → Save.

## Step 2 — Add a Condition before Email 1 (skip buyers)

So buyers don't get reminder emails after they buy.

1. Click the **+** between Delay and Email 1.
2. Drag **Condition** onto the dropzone.
3. Configure: `Has tag` → `buyer` → if **YES** route to "Exit flow", if **NO** continue to Email 1.
4. Save.

You'll need a `buyer` tag in your account. Create it: Subscribers → Tags → New tag → name it `buyer`.

(Later, when you wire Gumroad → MailerLite via Zapier, the webhook tags every buyer with `buyer`.)

## Step 3 — Design Email 1's body

1. Click Email 1 on the canvas → in the right panel, click **Design email**.
2. Choose **Drag & drop editor** (or Rich-text — easier for this).
3. Paste the body from `email-sequences/mailerlite-paste-blocks/email-1-the-reminder.md` (the section starting with "Hey {$name|hooper},").
4. Make sure links are real links (not just text):
   - Tier 2 CTA: `https://builttohoop.gumroad.com/l/groedz`
5. Save.

## Step 4 — Add Email 2 (Objection Handler)

1. Click **+** below Email 1 → drag **Send email**.
2. Right panel:
   - **Email name:** `Email 2 — The Objection Handler`
   - **Subject:** `the 3 reasons people don't pull the trigger`
   - **Sender name:** `Ty — Built to Hoop`
   - **Sender email:** `tyrell@built-to-hoop.com`
   - **Preheader:** `if it's one of these, I have an answer.`
3. Save metadata.
4. Click **+** between Email 1 and Email 2 → drag **Delay** → set to **24 hours** → Save.
5. Click **+** between that Delay and Email 2 → drag **Condition** → Has tag `buyer`? YES → Exit, NO → continue.
6. Click Email 2 → Design email → paste body from `email-2-the-objection-handler.md` → Save.

## Step 5 — Add Email 3 (Final Call)

Same pattern as Step 4 but:
- **Email name:** `Email 3 — The Final Call`
- **Subject:** `last one from me on this`
- **Preheader:** `no follow-up after this. promise.`
- **Delay before:** **48 hours**
- **Body:** from `email-3-the-final-call.md`

## Step 6 — Final flow should look like this

```
Trigger: Joins "Free Reset Subscribers"
   ↓
Delay: 7 days
   ↓
Condition: tag=buyer? → YES → Exit
   ↓ NO
Email 1: "you almost did it"
   ↓
Delay: 24 hours
   ↓
Condition: tag=buyer? → YES → Exit
   ↓ NO
Email 2: "the 3 reasons..."
   ↓
Delay: 48 hours
   ↓
Condition: tag=buyer? → YES → Exit
   ↓ NO
Email 3: "last one from me on this"
   ↓
Exit flow
```

## Step 7 — Save as draft. DO NOT activate yet.

You need two things working before you flip Activate:

1. **`buyer` tag exists** AND something is applying it. Easiest path: Zapier zap from Gumroad "New Sale" → MailerLite "Add tag = buyer". 5-minute zap.
2. **Test send** — run the Test button at the top. Check Email 1 lands in your inbox without rendering issues.

When both work → click **Activate** in the top right.

---

## A/B testing later

Free plan doesn't allow native A/B in automations (you saw "Upgrade to use" on A/B test step). Workaround: after 2 weeks of data, if open rates on Email 1 are below 40%, swap the subject line to the variant `the tab is still open somewhere` and re-measure.

## Tier swap variants

Default flow assumes Tier 2 ($57) abandon. If you want tier-specific flows later, clone this automation 2 more times and swap:
- Tier 1 link: `https://builttohoop.gumroad.com/l/ecyzaa`
- Tier 3 link: `https://builttohoop.gumroad.com/l/thxqs`

Trigger them on tag `abandon_tier1` / `abandon_tier3` instead of group join.
