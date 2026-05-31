# Free Reset PDFs — Ready for MailerLite

**5 branded workout PDFs are built and committed.**
Path: `reset-pdfs/output/`

| File | Day |
|------|-----|
| BTH-Reset-Day-01-Hip-Release.pdf | Day 1 — Hip Release |
| BTH-Reset-Day-02-Ankle-Reset.pdf | Day 2 — Ankle Reset |
| BTH-Reset-Day-03-Knee-Quad-Reset.pdf | Day 3 — Knee + Quad Reset |
| BTH-Reset-Day-04-Core-Movement-Quality.pdf | Day 4 — Core + Movement Quality |
| BTH-Reset-Day-05-Power-Reset.pdf | Day 5 — Power Reset |

Each is a single Letter-size page: BTH black nav bar, gold hero band with day number, exercise cards with coaching cues, and a dark note footer.

---

## How to deliver them in MailerLite

**Option A — File attachment (simplest)**
In each email's MailerLite editor, attach the corresponding PDF directly to the email.
MailerLite supports attachments on Standard plan and above.

**Option B — Hosted link (better deliverability)**
Upload each PDF somewhere permanent:
- Google Drive > Get Shareable Link
- Your BTH hosting (GitHub Pages serves files — PDFs at `/reset-pdfs/output/BTH-Reset-Day-01-Hip-Release.pdf` are already live at `https://built-to-hoop.com/reset-pdfs/output/BTH-Reset-Day-01-Hip-Release.pdf`)

Then add a button or link in each email: **"Download Today's Workout Guide →"**

**GitHub Pages route (already done):**
Since the PDFs are committed to the repo they are live right now at:
```
https://built-to-hoop.com/reset-pdfs/output/BTH-Reset-Day-01-Hip-Release.pdf
https://built-to-hoop.com/reset-pdfs/output/BTH-Reset-Day-02-Ankle-Reset.pdf
https://built-to-hoop.com/reset-pdfs/output/BTH-Reset-Day-03-Knee-Quad-Reset.pdf
https://built-to-hoop.com/reset-pdfs/output/BTH-Reset-Day-04-Core-Movement-Quality.pdf
https://built-to-hoop.com/reset-pdfs/output/BTH-Reset-Day-05-Power-Reset.pdf
```

Add one link button per email, pointing to the matching URL. That's it.

---

## What each PDF contains

- BTH branding: black/cream/gold, Oswald headlines, DM Sans body
- Day number + workout title in the gold hero band
- 3 exercises each with name, sets/reps, and full coaching cues
- A coaching note from Ty at the bottom
- BTH logo top and bottom

---

## If you want to regenerate / tweak

Open `reset-pdfs/generate.mjs` — all content and styling is in that one file.
Run `node generate.mjs` from the `reset-pdfs/` folder to rebuild all 5.
