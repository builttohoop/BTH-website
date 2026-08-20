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

> **Rewritten 2026-08-18 — warmth-before-price pass.** Live D1 read (sequence_id=1): 277 delivered /
> 66 opens (24%) / 10 clicks (3.6%), 7 weeks, $0 revenue. Old E0 named the price before Day 1's workout
> was even done; old E3 ran a full membership teardown at the funnel's single highest-open slot (54%)
> and produced zero clicks — it pitched the same offer E5 pitches, with no buy link, so by Day 5 the
> pitch had already been "spent." Fix: price/name now first appear (soft, no $) in E4, full reveal
> (name + $27/mo + Month 1/2 breakdown) moves to E5 — the first email with an actual join link. E1 and
> E3 each ask a reply-only micro-commitment (no product ask); E4/E5/E6 read back whatever the reader
> told Ty on Day 3. E3's old teardown content merged into E5 instead of being duplicated. Sequence
> length (8 emails / 9 days) intentionally unchanged — 25 lifetime signups isn't enough volume to A/B a
> longer version; revisit past ~100 signups. E0-E3 still carry zero join/checkout links by design
> (BRAND_RULES: "Days 0-4 soft seed, Day 5 hard offer"); E4 carries one low-key text link only, for a
> reader who's already sold and doesn't want to wait.

| # | Delay | Subject | Job | Reset link |
|---|---|---|---|---|
| 0 | 0 | your reset starts now | Deliver Day 1. No price, no membership name — credibility + a vague forward-tease only. | Day 1 — Hip Reset |
| 1 | 24h | your hips are lying to you | Education / trust + a reply-only micro-commitment ask (no product ask). | — |
| 2 | 48h | the cycle every hooper is stuck in | Story + deliver Day 2. Still no price/name specifics. | Day 2 — Ankle Reset |
| 3 | 72h | day 3: what's actually different? | Checkpoint / felt-result read-back + reply ask. No pitch, no price, no join link (was "what Foundation Month actually looks like" — the old membership-reveal slot; see rewrite note above). | Day 3 — Movement Control |
| 4 | 96h | the guy who almost stopped playing at 27 | Social proof + deliver Day 4. FIRST soft name-drop ("Stay Ready") — still no price — plus one low-key join link for an already-sold reader. | Day 4 — Strength That Moves |
| 5 | 120h | 5 days done. here's the move. | FULL offer: name + $27/mo + Month 1 (Foundation, bound to the membership) / Month 2+ (Strength Block) breakdown + deliver Day 5. First email built to convert. | Day 5 — Power Reset |
| 6 | 144h | The reset's done. Keep the body that earned it. | Urgency close, references Day 3 replies. | — |
| 7 | 216h | still thinking about it? | Re-engage non-buyers, real question, no discount. | — |

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
