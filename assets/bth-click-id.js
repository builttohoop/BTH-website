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
 *    webhook can join payer → click → browser session — and, since BTH-GOAL-0057
 *    Deliverable 7, the signed lead token too, so an ABANDONED checkout has a person
 *    attached to it (see "WHY THE LEAD TOKEN MATTERS" below).
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
 * WHY THE LEAD TOKEN MATTERS (BTH-GOAL-0057 D7, Ty ruling R3 2026-09-15). Mail OS has
 * shipped an abandoned-checkout recovery email since 2026-08-18 (sequence 30) and it has
 * never sent once: 24 abandons → 24 anonymous rows → 0 emails. Stripe's
 * checkout.session.expired carries an email only if the person typed one into Stripe and
 * then stopped, which nobody does — and client_reference_id carried no identity at all,
 * because this function encoded only the GA client id and the gclid and then BAILED OUT
 * when both were missing. That bail is exactly organic and direct traffic. So a lead who
 * had already given BTH their email ten times still arrived at the expired webhook as an
 * anonymous row.
 *
 * "bth_lead_ref" is the signed, non-PII lead token Mail OS returns from /api/subscribe
 * ("<contact_id>.<HMAC>", BTH-GOAL-0054) — the same token the funnel beacons in
 * bth-events.js already carry. Stamping it here is what gives that shipped recovery
 * machine somebody to reach. It is never trusted on its face: the worker re-verifies the
 * HMAC (verifyLeadToken) before it touches a contact, so a hand-typed or edited
 * client_reference_id resolves to nobody.
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

  /* The signed lead token Mail OS handed back at signup. Read fresh at click time, not at
   * wire time: join.html's #70a email field POSTs /api/subscribe on blur and writes this
   * key when the response lands, which can be well after DOMContentLoaded. */
  function leadRef() {
    try { return window.localStorage.getItem("bth_lead_ref") || ""; } catch (err) { return ""; }
  }

  /* Stripe allows [A-Za-z0-9_-] in client_reference_id, max 200 chars — so the dot in
   * the client_id is encoded as "x". The cid half is digits-only by construction, which
   * makes the first "_g_" after it an unambiguous separator even though a gclid can
   * itself contain "_g_".
   *
   * Shapes, in the order this function emits them:
   *   l_<id>x<sig>[_c_<cid1>x<cid2>][_g_<gclid>]   — with a lead token (BTH-GOAL-0057 D7)
   *   c_<cid1>x<cid2>[_g_<gclid>]                  — no lead token; byte-identical to what
   *   g_<gclid>                                      has shipped since BTH-GOAL-0019
   *
   * The lead segment is only ever emitted for a token of the exact shape
   * <digits>.<43 base64url chars>. Stripe's alphabet IS the base64url alphabet, so no
   * character is left over to act as a delimiter and a signature may itself contain "_c_"
   * or "_g_" — the fixed 43-char width (b64url of HMAC-SHA256, padding stripped) is what
   * makes the segment self-terminating for the worker's parser. A token of any other shape
   * is skipped rather than guessed at: it would not verify on the worker anyway.
   *
   * Overflow at 200 chars drops the cid first, then the lead token, and never the gclid —
   * the gclid is the offline-conversion upload key and cannot be re-derived, while the lead
   * token is also carried independently on every checkout_started beacon. In practice the
   * ceiling is unreachable: the lead segment is ~49 chars and the cid ~23, so a gclid would
   * have to run past ~125 characters before anything is dropped at all.
   *
   * The two markers around this function are load-bearing: .github/scripts/
   * check-client-reference.mjs slices the REAL function out of this file between them and
   * runs it, so the shapes CI asserts are the shapes the site actually emits — not a copy
   * that can drift. Do not remove or reword them. */
  /* [unit:clientReference] */
  function clientReference(cid, gclid, lead) {
    var g = String(gclid || "").replace(/[^A-Za-z0-9_-]/g, "");
    var c = cid ? "c_" + cid.replace(".", "x") : "";
    var lm = /^(\d{1,12})\.([A-Za-z0-9_-]{43})$/.exec(String(lead || ""));
    var l = lm ? "l_" + lm[1] + "x" + lm[2] : "";

    function build(withLead, withCid) {
      var parts = [];
      if (withLead && l) parts.push(l);
      if (withCid && c) parts.push(c);
      if (g) parts.push("g_" + g);
      return parts.join("_");
    }

    var ref = build(true, true);
    if (ref.length > 200) ref = build(true, false);
    if (ref.length > 200) ref = build(false, false);
    if (ref.length > 200) ref = g ? ("g_" + g).slice(0, 200) : "";
    return ref;
  }
  /* [/unit:clientReference] */

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
      // The page the signup actually happened on. Stamped BEFORE the !rec guard
      // so it lands for EVERY visitor — organic and direct included, not just the
      // ad clicks that leave a stored click record. Mail OS has read
      // body.signup_url since 2026-07-05; the column shipped with migration 0001.
      setHidden(forms[i], "signup_url", window.location.pathname);
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
        // BTH-GOAL-0057 D7: the lead token joins the read, so this no longer bails out
        // merely because cid and gclid are both absent — which was the case for every
        // organic and direct visitor, i.e. for every abandoned checkout BTH has recorded.
        // It still bails when there is genuinely nothing to encode (no lead token, no
        // browser id, no gclid): an empty client_reference_id is worse than no parameter.
        var ref = clientReference(gaClientId(), rec && rec.gclid, leadRef());
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
