# BTH Email Sequence — Free Reset → Stay Ready

> **Canonical source of truth = `generate-html-emails.mjs`** (run it to rebuild the 8 HTML files).
> The Mail OS seed is built from those files by `automations/bth-mail-os/scripts/seed-free-reset.mjs`.
> Do **not** hand-edit the HTML files — edit the generator and regenerate. The old generate→darkify
> two-step is retired (the generator now emits dark-first, link-only HTML directly).

8 emails. Goal: deliver the free 5-Day Reset, then convert subscribers into **Stay Ready** members ($27/mo).
From: `Ty — Built to Hoop` · Reply-to `tyrell@built-to-hoop.com`.

## Locked rules
- **LINK-ONLY reset.** Emails never list exercises. Each reset-day email carries exactly ONE gold CTA
  that links to that day's real reset PDF. The workout lives in the PDF, not the email.
- **Dark-first** premium black/gold (`automations/bth-mail-os/BTH-EMAIL-STYLE.md`) — survives Gmail/iOS dark mode.
- **Stay Ready = $27/mo** membership (locked taxonomy). No "BTH Rise" in the funnel, no RISE10 discount, no hype.
- **Checkout on the website:** membership CTAs point to `built-to-hoop.com/join` (the `CHECKOUT_URL`
  constant) — never a Gumroad link. `/join` routes to whatever processor is live (one place to flip at cutover).

## The 8 steps (slug `free-reset-to-rise`)

| # | Delay | Subject | Job | Reset link |
|---|---|---|---|---|
| 0 | 0 | your reset starts now | Deliver Day 1, seed Stay Ready | Day 1 — Hip Reset |
| 1 | 24h | your hips are lying to you | Education / trust | — |
| 2 | 48h | the cycle every hooper is stuck in | Story + deliver Day 2 | Day 2 — Ankle Reset |
| 3 | 72h | what Foundation Month actually looks like | Membership reveal + deliver Day 3 | Day 3 — Movement Control |
| 4 | 96h | the guy who almost stopped playing at 27 | Social proof + deliver Day 4 | Day 4 — Strength That Moves |
| 5 | 120h | 5 days done. here's the move. | Hard offer + deliver Day 5 | Day 5 — Power Reset |
| 6 | 144h | The reset's done. Keep the body that earned it. | Urgency close | — |
| 7 | 216h | still thinking about it? | Re-engage non-buyers | — |

## The real 5-Day Reset (restored from Drive `_v2`, 2026-05-31)
Built by `reset-pdfs/generate.mjs` → `reset-pdfs/output/`. The earlier delivered set had drifted
(Days 3/4/5 had the wrong titles + moves); this is the canonical program:

| Day | Title | File |
|---|---|---|
| 1 | Hip Reset | `BTH-Reset-Day-01-Hip-Reset.pdf` |
| 2 | Ankle Reset | `BTH-Reset-Day-02-Ankle-Reset.pdf` |
| 3 | Movement Control | `BTH-Reset-Day-03-Movement-Control.pdf` |
| 4 | Strength That Moves | `BTH-Reset-Day-04-Strength-That-Moves.pdf` |
| 5 | Power Reset | `BTH-Reset-Day-05-Power-Reset.pdf` |

## Deploy gate
The corrected emails (live in Mail OS D1) link to the **new** PDF filenames. Those PDFs exist locally but
the LIVE site still serves the old set until **Ty deploys** `reset-pdfs/output/`. Deploy the site + cut the
funnel over from MailerLite together so links resolve. Until then MailerLite stays the live nurture.
