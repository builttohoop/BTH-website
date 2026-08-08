/* BTH click-id capture (BTH-GOAL-0019 — the Google Ads payer pipe, website half).
 *
 * 1. On any page load: if the URL carries gclid / utm_term / utm_campaign (Google Ads
 *    auto-tagging + our tagged final URLs), store them in localStorage for 90 days
 *    (Google's max click-conversion window).
 * 2. On every page with an owned .bth-mail-form: inject the stored values as hidden
 *    inputs so /api/subscribe receives them (Mail OS stores them on the contact —
 *    D1 columns land with the mail-os half of this pipe).
 * 3. On any owned Stripe Payment Link click: append the click id as
 *    client_reference_id ("g_<gclid>") so the Stripe webhook can join payer → click
 *    even when the buyer never opted in to email first (the /join direct path).
 *
 * No-op when nothing was ever captured. Never blocks a form or a checkout click.
 */
(function () {
  "use strict";
  var KEY = "bth_click", DAYS = 90;
  var rec = null;

  try {
    var p = new URLSearchParams(window.location.search);
    if (p.get("gclid") || p.get("utm_term") || p.get("utm_campaign") || p.get("utm_source")) {
      rec = {
        gclid: p.get("gclid") || "",
        utm_term: p.get("utm_term") || "",
        utm_campaign: p.get("utm_campaign") || "",
        utm_source: p.get("utm_source") || "",
        utm_medium: p.get("utm_medium") || "",
        ts: Date.now()
      };
      localStorage.setItem(KEY, JSON.stringify(rec));
    } else {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        rec = JSON.parse(raw);
        if (!rec || !rec.ts || Date.now() - rec.ts > DAYS * 864e5) {
          localStorage.removeItem(KEY);
          rec = null;
        }
      }
    }
  } catch (e) { rec = null; }

  if (!rec) return;

  function setHidden(form, name, value) {
    if (!value) return;
    var input = form.querySelector('input[name="' + name + '"]');
    if (!input) {
      input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      form.appendChild(input);
    }
    input.value = value;
  }

  function wire() {
    // BTH-GOAL-0053 D6: UTM attribution is last-touch with a 30-day lookback, so
    // UTM fields stop forwarding after 30 days. The gclid keeps the full 90-day
    // record window — it feeds the Stripe payer pipe, not the UTM lookback.
    var utmFresh = rec.ts && (Date.now() - rec.ts) <= 30 * 864e5;
    var forms = document.querySelectorAll(".bth-mail-form");
    for (var i = 0; i < forms.length; i++) {
      setHidden(forms[i], "gclid", rec.gclid);
      if (utmFresh) {
        setHidden(forms[i], "utm_term", rec.utm_term);
        setHidden(forms[i], "utm_campaign", rec.utm_campaign);
        setHidden(forms[i], "utm_source", rec.utm_source);
        setHidden(forms[i], "utm_medium", rec.utm_medium);
      }
    }
    if (rec.gclid) {
      document.addEventListener("click", function (e) {
        var a = e.target && e.target.closest && e.target.closest("a[href*='buy.stripe.com']");
        if (!a) return;
        try {
          var u = new URL(a.href);
          if (!u.searchParams.get("client_reference_id")) {
            var cref = ("g_" + rec.gclid).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 200);
            u.searchParams.set("client_reference_id", cref);
            a.href = u.toString();
          }
        } catch (err) {}
      }, true);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
})();
