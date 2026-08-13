/* BTH owned form handler — the Tier-1 commit flow: press -> working -> success.
 *
 * Wires every `.bth-mail-form` on the page to the live Mail OS endpoint.
 * Replaces the MailerLite `.ml-embedded` widget JS — no external script needed.
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

  function wireForm(form) {
    if (form.dataset.bthWired === "1") return;
    form.dataset.bthWired = "1";

    var emailInput = form.querySelector('input[type="email"]');
    var errorMsg = form.querySelector(".bth-field-error-msg");
    var btn = form.querySelector(".bth-btn-commit");
    var successEl = form.querySelector(".bth-form-success");
    var redirectUrl = form.dataset.bthRedirect || "/thank-you.html";

    if (emailInput) {
      emailInput.addEventListener("input", function () {
        clearFieldError(emailInput, errorMsg);
      });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (emailInput && !isValidEmail(emailInput.value)) {
        setFieldError(emailInput, errorMsg, "Add the rest of the email (e.g. .com).");
        emailInput.focus();
        return;
      }
      clearFieldError(emailInput, errorMsg);

      if (btn) {
        btn.disabled = true;
        btn.classList.add("is-working");
      }

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
})();
