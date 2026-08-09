/* BTH click-id + browser-id capture (BTH-GOAL-0019 — the Google Ads payer pipe, website half).
 *
 * 1. On any page load: if the URL carries gclid / utm_term / utm_campaign (Google Ads
 *    auto-tagging + our tagged final URLs), store them in localStorage for 90 days
 *    (Google's max click-conversion window).
 * 2. On every page load, read the REAL GA4 client_id out of the first-party _ga cookie.
 * 3. On every page with an owned .bth-mail-form: inject the stored values as hidden
 *    inputs so /api/subscribe receives them (Mail OS stores them on the contact —
 *    D1 columns land with the mail-os half of this pipe).
 * 4. On any owned Stripe Payment Link click: append client_reference_id so the Stripe
 *    webhook can join payer → click → browser session.
 *
 * WHY THE BROWSER ID MATTERS (2026-08-09 root-cause fix). Ty ruled that the Stripe
 * link keeps its hosted confirmation page, so buyers never return to built-to-hoop.com.
 * There is no post-purchase page of ours, so no client-side purchase tag can ever fire:
 * Mail OS's server-side Measurement Protocol event is the ONLY purchase signal BTH will
 * ever have. That event used to be sent with a client_id derived from the buyer's email,
 * which no browser ever had — GA4 filed every sale against a ghost user with no session
 * and no click, so Ads could never attribute a sale. Sending the real _ga value is what
 * lets GA4 join the purchase to the session that carried the click.
 *
 * The _ga cookie is written per-domain, not per-property, so this one value is correct
 * for every GA4 property on built-to-hoop.com.
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

  /* The GA4 client_id lives in the _ga cookie as "GA1.<depth>.<cid1>.<cid2>", and the
   * client_id itself is "<cid1>.<cid2>". Read it fresh every time rather than caching:
   * gtag writes the cookie asynchronously, so on a first-ever pageview it may not exist
   * yet when this script runs, but it always exists by the time someone clicks Buy. */
  function gaClientId() {
    try {
      var m = document.cookie.match(/(?:^|;\s*)_ga=([^;]+)/);
      if (!m) return "";
      var parts = decodeURIComponent(m[1]).split(".");
      if (parts.length < 4) return "";
      var a = parts[parts.length - 2], b = parts[parts.length - 1];
      if (!/^\d{1,20}$/.test(a) || !/^\d{1,20}$/.test(b)) return "";
      return a + "." + b;
    } catch (err) { return ""; }
  }

  /* Stripe allows [A-Za-z0-9_-] in client_reference_id, max 200 chars — so the dot in
   * the client_id is encoded as "x". The cid half is digits-only by construction, which
   * makes the first "_g_" after it an unambiguous separator even though a gclid can
   * itself contain "_g_". If the pair would overflow 200 chars the cid is dropped, never
   * the gclid: the gclid is the offline-conversion upload key and cannot be re-derived,
   * while a missing cid only costs us this one sale's session join. */
  function clientReference(cid, gclid) {
    var g = String(gclid || "").replace(/[^A-Za-z0-9_-]/g, "");
    var c = cid ? "c_" + cid.replace(".", "x") : "";
    var ref = "";
    if (c && g) ref = c + "_g_" + g;
    else if (c) ref = c;
    else if (g) ref = "g_" + g;
    if (ref.length > 200) ref = g ? ("g_" + g).slice(0, 200) : "";
    return ref;
  }

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

  function stampForms() {
    var forms = document.querySelectorAll(".bth-mail-form");
    if (!forms.length) return;
    // BTH-GOAL-0053 D6: UTM attribution is last-touch with a 30-day lookback, so
    // UTM fields stop forwarding after 30 days. The gclid keeps the full 90-day
    // record window — it feeds the Stripe payer pipe, not the UTM lookback.
    var utmFresh = rec && rec.ts && (Date.now() - rec.ts) <= 30 * 864e5;
    var cid = gaClientId();
    for (var i = 0; i < forms.length; i++) {
      setHidden(forms[i], "ga_client_id", cid);
      if (!rec) continue;
      setHidden(forms[i], "gclid", rec.gclid);
      if (utmFresh) {
        setHidden(forms[i], "utm_term", rec.utm_term);
        setHidden(forms[i], "utm_campaign", rec.utm_campaign);
        setHidden(forms[i], "utm_source", rec.utm_source);
        setHidden(forms[i], "utm_medium", rec.utm_medium);
      }
    }
  }

  function wire() {
    stampForms();
    // Re-stamp as the cookie lands. gtag sets _ga within the first moments of a
    // first-ever visit, but "moments" can be after DOMContentLoaded, and a lead who
    // types fast would otherwise submit without a browser id.
    [400, 1500, 4000].forEach(function (ms) { setTimeout(stampForms, ms); });
    document.addEventListener("submit", function (e) {
      var f = e.target;
      if (f && f.classList && f.classList.contains("bth-mail-form")) {
        setHidden(f, "ga_client_id", gaClientId());
      }
    }, true);

    document.addEventListener("click", function (e) {
      var a = e.target && e.target.closest && e.target.closest("a[href*='buy.stripe.com']");
      if (!a) return;
      try {
        var u = new URL(a.href);
        if (u.searchParams.get("client_reference_id")) return;
        // Read at click time, not at wire time: by now the cookie is always present.
        var ref = clientReference(gaClientId(), rec && rec.gclid);
        if (!ref) return;
        u.searchParams.set("client_reference_id", ref);
        a.href = u.toString();
      } catch (err) {}
    }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
})();
