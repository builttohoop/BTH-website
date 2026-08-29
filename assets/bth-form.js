/* BTH owned form handler — the Tier-1 commit flow: press -> working -> success.
 *
 * Wires every `.bth-mail-form` on the page to the live Mail OS endpoint.
 * Replaces the retired legacy `.ml-embedded` widget JS — no external script needed.
 * Spec: BTH/design-system/templates/bth-forms-cta-spec.md section 3.
 *
 * Behavior:
 *   - submit -> preventDefault -> client-side email check (error state if invalid)
 *   - fetch(action, {method:'POST', body:new FormData(form)})
 *   - button runs press(scale)->working(spinner)->success(checkmark) per the spec states
 *   - on success: redirect to /thank-you.html. A REAL contact write (worker says
 *     created/queued) also sets sessionStorage "bth_lead" — thank-you.html fires the
 *     Lead pixels only when that flag is present, so honeypot-dropped submits and
 *     direct thank-you loads never count as conversions (ghost-conversion fix, 2026-07-23)
 *   - 429 -> inline "too many attempts" message, button re-enabled
 *   - other non-ok / network error -> inline fallback message with the support email
 *   - honeypot ("company") is left untouched here; validation/limiting is server-side
 *
 * Domain typo guard (approval #74a, 2026-08-27): a submit whose domain is a near-miss
 * of a major consumer domain (Levenshtein <= 2, e.g. "gmali.com") is HELD with a
 * one-tap "Did you mean @gmail.com?" fix. Real domains are allowlisted and an
 * explicit "No, keep what I typed" lets any address through — a wrong block would
 * lose a real lead the same way the typo loses one. Evidence: contacts 89 + 91,
 * the first 2 hard bounces in BTH's lifetime, both paid Google clicks (2026-08-23/24).
 * Exposed as window.BTHTypo so join.html's checkout capture can reuse the check.
 */
(function () {
  "use strict";

  function setFieldError(input, msgEl, message) {
    if (input) input.classList.add("bth-field-error");
    if (msgEl) {
      msgEl.textContent = message;
      msgEl.classList.add("is-visible");
    }
  }

  function clearFieldError(input, msgEl) {
    if (input) input.classList.remove("bth-field-error");
    if (msgEl) msgEl.classList.remove("is-visible");
  }

  function isValidEmail(value) {
    // Deliberately simple — server is the real validator. This only catches the
    // obvious "forgot the domain" case the spec calls out (e.g. "name@gmail").
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || "");
  }

  // ---- Domain typo guard (approval #74a) -------------------------------------
  // The ~15 major consumer domains a typo gets corrected TOWARD.
  var MAJOR_DOMAINS = [
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com",
    "aol.com", "live.com", "msn.com", "comcast.net", "att.net",
    "verizon.net", "ymail.com", "googlemail.com", "protonmail.com", "me.com"
  ];
  // Real domains that sit within edit distance 2 of a major one (mail.com is one
  // keystroke from gmail.com) — never flag these. Includes every major domain.
  var KNOWN_OK_DOMAINS = MAJOR_DOMAINS.concat([
    "mail.com", "aim.com", "mac.com", "gmx.com", "gmx.net", "proton.me", "pm.me",
    "zoho.com", "hey.com", "duck.com", "yandex.com", "hive.com", "mail.ru",
    "sbcglobal.net", "bellsouth.net", "cox.net", "charter.net", "earthlink.net",
    "yahoo.co.uk", "hotmail.co.uk", "outlook.co.uk", "live.co.uk",
    "hotmail.fr", "yahoo.fr", "yahoo.ca", "rocketmail.com", "web.de"
  ]);

  // Plain two-row Levenshtein — domains are short, so this is microseconds.
  function editDistance(a, b) {
    if (a === b) return 0;
    var prev = [], cur = [], i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur[0] = i;
      for (j = 1; j <= b.length; j++) {
        cur[j] = Math.min(
          prev[j] + 1,
          cur[j - 1] + 1,
          prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1)
        );
      }
      var swap = prev; prev = cur; cur = swap;
    }
    return prev[b.length];
  }

  // Returns {domain, suggestion, fixed} when the typed domain looks like a typo of
  // a major consumer domain, else null. `fixed` is the full corrected address.
  function suggestTypoFix(value) {
    var email = String(value || "").trim().toLowerCase();
    var at = email.lastIndexOf("@");
    if (at < 1) return null;
    var local = email.slice(0, at);
    var domain = email.slice(at + 1);
    if (!domain || domain.indexOf(".") === -1) return null;
    if (KNOWN_OK_DOMAINS.indexOf(domain) !== -1) return null;
    var best = null, bestDist = 3;
    for (var i = 0; i < MAJOR_DOMAINS.length; i++) {
      var d = editDistance(domain, MAJOR_DOMAINS[i]);
      if (d < bestDist) { bestDist = d; best = MAJOR_DOMAINS[i]; }
    }
    if (!best || bestDist > 2) return null;
    return { domain: domain, suggestion: best, fixed: local + "@" + best };
  }

  // No-PII beacon (#74a): domains only, never the local part. Counts how often the
  // guard fires so the fix's own hit rate is measurable. Silently skipped on pages
  // without bth-events.js, and the worker ignores it until the allowlist deploys.
  function trackTypoEvent(action, sug) {
    try {
      if (window.BTHEvents && window.BTHEvents.track) {
        window.BTHEvents.track("email_typo_suggested", {
          action: action, bad_domain: sug.domain, suggested_domain: sug.suggestion
        });
      }
    } catch (e) {}
  }

  // Renders the hold prompt into the form's error slot: one-tap fix, explicit
  // keep-what-I-typed escape. Built with DOM nodes, not innerHTML — the typed
  // address goes into textContent so nothing a user types can inject markup.
  function showTypoPrompt(form, emailInput, msgEl, sug, onKeep) {
    if (!msgEl) return;
    if (emailInput) emailInput.classList.add("bth-field-error");
    msgEl.textContent = "";
    var q = document.createElement("span");
    q.textContent = "Did you mean ";
    var b = document.createElement("strong");
    b.textContent = sug.fixed;
    q.appendChild(b);
    q.appendChild(document.createTextNode("?"));
    var fixBtn = document.createElement("button");
    fixBtn.type = "button";
    fixBtn.className = "bth-typo-fix";
    fixBtn.textContent = "Yes — fix it";
    var keepBtn = document.createElement("button");
    keepBtn.type = "button";
    keepBtn.className = "bth-typo-keep";
    keepBtn.textContent = "No, keep what I typed";
    fixBtn.addEventListener("click", function () {
      if (emailInput) emailInput.value = sug.fixed;
      trackTypoEvent("accepted", sug);
      clearFieldError(emailInput, msgEl);
      if (onKeep) onKeep(true);
    });
    keepBtn.addEventListener("click", function () {
      form.dataset.bthTypoAck = String(emailInput ? emailInput.value : "").trim().toLowerCase();
      trackTypoEvent("overridden", sug);
      clearFieldError(emailInput, msgEl);
      if (onKeep) onKeep(false);
    });
    msgEl.appendChild(q);
    msgEl.appendChild(fixBtn);
    msgEl.appendChild(keepBtn);
    msgEl.classList.add("is-visible");
  }
  // ---- /Domain typo guard ----------------------------------------------------

  function wireForm(form) {
    if (form.dataset.bthWired === "1") return;
    form.dataset.bthWired = "1";

    var emailInput = form.querySelector('input[type="email"]');
    var errorMsg = form.querySelector(".bth-field-error-msg");
    var btn = form.querySelector(".bth-btn-commit");
    var successEl = form.querySelector(".bth-form-success");
    var redirectUrl = form.dataset.bthRedirect || "/thank-you.html";

    // One "shown" beacon per typed value, however many times blur/submit re-prompt.
    function maybeTrackShown(sug) {
      var v = String(emailInput ? emailInput.value : "").trim().toLowerCase();
      if (form.dataset.bthTypoShownFor === v) return;
      form.dataset.bthTypoShownFor = v;
      trackTypoEvent("shown", sug);
    }

    if (emailInput) {
      emailInput.addEventListener("input", function () {
        clearFieldError(emailInput, errorMsg);
      });
      // Early catch (#74a): surface the typo prompt the moment they leave the
      // field, before the CTA press. Non-blocking here — submit enforces it.
      emailInput.addEventListener("blur", function () {
        var v = emailInput.value;
        if (!isValidEmail(v)) return;
        var sug = suggestTypoFix(v);
        if (!sug || form.dataset.bthTypoAck === String(v).trim().toLowerCase()) return;
        maybeTrackShown(sug);
        showTypoPrompt(form, emailInput, errorMsg, sug, null);
      });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (emailInput && !isValidEmail(emailInput.value)) {
        setFieldError(emailInput, errorMsg, "Add the rest of the email (e.g. .com).");
        emailInput.focus();
        return;
      }

      // Typo hold (#74a): a near-miss of a major domain (gmali.com) stops here
      // until it's fixed with one tap or explicitly kept. Either choice resumes
      // the submit automatically — no second CTA press needed.
      var typoSug = emailInput ? suggestTypoFix(emailInput.value) : null;
      if (typoSug && form.dataset.bthTypoAck !== String(emailInput.value).trim().toLowerCase()) {
        maybeTrackShown(typoSug);
        showTypoPrompt(form, emailInput, errorMsg, typoSug, function () {
          if (form.requestSubmit) form.requestSubmit();
          else form.dispatchEvent(new Event("submit", { cancelable: true }));
        });
        return;
      }
      clearFieldError(emailInput, errorMsg);

      if (btn) {
        btn.disabled = true;
        btn.classList.add("is-working");
      }

      // BTH-GOAL-0054: stash the signup answer for thank-you.html, which renders its
      // Day-1 line on it. Shared here (was inline on reset.html only) so the answer
      // survives the redirect from EVERY form now that every form asks the question.
      try {
        var picked = form.querySelector('input[name="segment"]:checked');
        if (picked && picked.value) window.sessionStorage.setItem("bth_seg", picked.value);
      } catch (e) {}
      var formData = new FormData(form);

      fetch(form.action, { method: "POST", body: formData })
        .then(function (res) {
          if (res.ok) {
            // The worker answers 200 ok:true even for submits it silently drops
            // (honeypot-tripped bots/autofill), so a Lead is only real when the
            // body says a contact was written: `created` (new worker field) or
            // queued > 0 (fallback for the currently-deployed worker). The
            // success UI + redirect run either way — camouflage stays intact.
            return res.json().catch(function () { return {}; }).then(function (data) {
              var realLead = (typeof data.created === "boolean")
                ? data.created
                : (Number(data.queued) > 0);
              if (realLead) {
                try { window.sessionStorage.setItem("bth_lead", "1"); } catch (e) {}
              }
              // BTH-GOAL-0054: the worker's signed, non-PII lead token — the identity
              // assets/bth-events.js attaches to first-party funnel beacons (Day-1
              // view, offer view, checkout start). localStorage on purpose: the
              // funnel spans days, sessionStorage dies with the tab.
              if (data.lead_ref) {
                try { window.localStorage.setItem("bth_lead_ref", String(data.lead_ref)); } catch (e) {}
              }
              if (btn) {
                btn.classList.remove("is-working");
                btn.classList.add("is-success");
              }
              if (successEl) successEl.classList.add("is-visible");
              window.setTimeout(function () {
                window.location.href = redirectUrl;
              }, 500);
            });
          }
          if (btn) {
            btn.disabled = false;
            btn.classList.remove("is-working");
          }
          if (res.status === 429) {
            setFieldError(emailInput, errorMsg, "Too many attempts — wait a minute and try again.");
          } else {
            setFieldError(emailInput, errorMsg, "Something broke. Email tyrell@built-to-hoop.com and I'll get you in.");
          }
        })
        .catch(function () {
          if (btn) {
            btn.disabled = false;
            btn.classList.remove("is-working");
          }
          setFieldError(emailInput, errorMsg, "Network hiccup — try again, or email tyrell@built-to-hoop.com.");
        });
    });
  }

  function wireAll() {
    var forms = document.querySelectorAll(".bth-mail-form");
    for (var i = 0; i < forms.length; i++) wireForm(forms[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireAll);
  } else {
    wireAll();
  }

  // The checkout capture on join.html (approval #70a) runs the same typo check on
  // its own field — one guard, every email entry point.
  window.BTHTypo = { suggest: suggestTypoFix };
})();
