# EMAIL 1 — The Reminder

## MailerLite settings
- **Send delay from previous step:** 90 minutes (or 24h if using Option 1 "soft abandon")
- **Subject (A):** `you almost did it`
- **Subject (B):** `the tab is still open somewhere`
- **Preview text:** `90 seconds and you're in. promise.`
- **From name:** Ty — Built to Hoop
- **From email:** tyrell@built-to-hoop.com
- **Reply-to:** tyrell@built-to-hoop.com

---

## BODY (paste into MailerLite plain-text or rich-text email block)

Hey {$name|hooper},

You got to checkout and stopped.

That's fine. People do it 100 times a day for 100 reasons. Maybe the kid woke up. Maybe a meeting. Maybe you just wanted to think about it.

I'm not gonna pretend I know which one.

But here's the thing — you already did the hard part. You knew you were stiff. You knew the warmups weren't cutting it. You knew you couldn't keep playing through the same nag every Sunday.

You picked the program. You opened the checkout.

Last step.

**Tier 2: Rise — $57 one-time. 12 weeks. Yours forever.**

→ Finish your order: https://builttohoop.gumroad.com/l/groedz

If something broke — wrong card, page froze, whatever — just hit reply and tell me. I'll get you in.

— Ty, BTH
built-to-hoop.com

---

## Tier swap blocks (if using tag-based branching)

**If tag = `intent_tier1`:**
> Replace the offer line with:
> **Tier 1: Foundation — $19 one-time.**
> → Finish your order: https://builttohoop.gumroad.com/l/ecyzaa

**If tag = `intent_tier3`:**
> Replace the offer line with:
> **Tier 3: Stay Ready — $27/mo or $197/yr. Everything BTH does, all in.**
> → Finish your order: https://builttohoop.gumroad.com/l/thxqs

---

## Exit conditions (set on this step in MailerLite)
- Tag added: `buyer` → exit automation
- Tag added: `unsubscribed` → exit automation
