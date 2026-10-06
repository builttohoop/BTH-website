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
 *     created/queued) fires the Lead pixels HERE, on the submitting page, before the
 *     redirect — so honeypot-dropped submits and direct thank-you loads never count
 *     as conversions (ghost-conversion fix, 2026-07-23). Moved off thank-you.html
 *     2026-10-06: TikTok's in-app browser opens the redirect in a different browser
 *     with no sessionStorage, so the old flag-gated fire there missed every TikTok
 *     opt-in (0 of 5, contacts 94/96/99/102/131; every other opt-in fired, 35 of 35)
 *   - the worker also sends that Lead to Meta server-side (Conversions API) and
 *     returns its `event_id`; the fbq Lead passes it as eventID so Meta keeps one.
 *     The pixel's _fbp/_fbc ride along in the POST so the server event matches
 *     (2026-10-06)
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

  // ---- Lead conversion -------------------------------------------------------
  // Fires the Lead pixels (GA4, Meta, TikTok) plus the GTM "bth_lead" push, then
  // calls done() exactly once: when GA4 confirms the hit (event_callback), or on
  // the fallback timer if gtag.js is blocked or slow, so a blocked tag can never
  // hold the redirect. Every pixel call is guarded: one failing tag never stops
  // the others or the redirect.
  var LEAD_PROPS = { content_name: "free_reset_optin", content_category: "lead_magnet" };

  // eventId: the id of the Lead the worker sent to Meta server-side (Conversions API),
  // returned as `event_id`. Passing it as the pixel's eventID lets Meta dedupe the two
  // into one Lead. No id (older worker, or no server Lead sent) = the plain call.
  function fireLead(done, eventId) {
    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      done();
    }
    var metaOpts = (typeof eventId === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(eventId))
      ? { eventID: eventId }
      : null;
    try {
      if (window.fbq) {
        if (metaOpts) window.fbq("track", "Lead", LEAD_PROPS, metaOpts);
        else window.fbq("track", "Lead", LEAD_PROPS);
      }
    } catch (e) {}
    try { if (window.ttq) window.ttq.track("Lead", LEAD_PROPS); } catch (e) {}
    try {
      (window.dataLayer = window.dataLayer || []).push({
        event: "bth_lead",
        bth_event_name: "Lead",
        bth_content_name: LEAD_PROPS.content_name,
        bth_content_category: LEAD_PROPS.content_category
      });
    } catch (e) {}
    var waitForGa = false;
    try {
      if (typeof window.gtag === "function") {
        window.gtag("event", "Lead", {
          content_name: LEAD_PROPS.content_name,
          content_category: LEAD_PROPS.content_category,
          transport_type: "beacon",
          event_callback: finish,
          event_timeout: 1500
        });
        waitForGa = true;
      }
    } catch (e) {}
    // event_timeout only runs once gtag.js has loaded; this covers a blocked gtag.js.
    window.setTimeout(finish, waitForGa ? 1600 : 0);
  }

  // Meta browser ids for that server-side Lead: the pixel's own first-party _fbp/_fbc
  // cookies, so Meta can match the server event to the browser. When _fbc is missing
  // (pixel blocked or not loaded yet) but the landing URL still carries ?fbclid=, build
  // it the way the pixel does. The worker re-validates both and drops anything malformed.
  var META_BROWSER_ID = /^fb\.\d\.\d{10,16}\.[A-Za-z0-9_.-]{1,450}$/;

  function metaCookie(name) {
    try {
      var parts = document.cookie ? document.cookie.split(";") : [];
      for (var i = 0; i < parts.length; i++) {
        var part = parts[i].replace(/^\s+/, "");
        if (part.indexOf(name + "=") !== 0) continue;
        var value = decodeURIComponent(part.slice(name.length + 1));
        return META_BROWSER_ID.test(value) ? value : "";
      }
    } catch (e) {}
    return "";
  }

  function fbcFromUrl() {
    try {
      var id = new URLSearchParams(window.location.search).get("fbclid");
      if (id && /^[A-Za-z0-9_-]{1,450}$/.test(id)) return "fb.1." + Date.now() + "." + id;
    } catch (e) {}
    return "";
  }
  // ---- /Lead conversion ------------------------------------------------------

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
      var fbp = metaCookie("_fbp");
      var fbc = metaCookie("_fbc") || fbcFromUrl();
      if (fbp) formData.set("fbp", fbp);
      if (fbc) formData.set("fbc", fbc);

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
              // Redirect once both are true: the success state has shown for 500ms,
              // and (on a real lead) the Lead pixels have gone out.
              var left = false;
              var pending = realLead ? 2 : 1;
              function go() {
                if (--pending > 0 || left) return;
                left = true;
                window.location.href = redirectUrl;
              }
              window.setTimeout(go, 500);
              if (realLead) fireLead(go, data.event_id);
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
