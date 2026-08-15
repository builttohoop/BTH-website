/* BTH first-party funnel events (BTH-GOAL-0054).
 *
 * Reports the funnel milestones the email pipeline can't see — Day-1 views on
 * thank-you.html, offer views, checkout starts — to the owned Mail OS worker
 * (POST /api/events), so the Motherboard's funnel reads from BTH's own data
 * instead of depending on GA4/GTM.
 *
 * Identity: the signed lead token subscribe() returned (localStorage
 * "bth_lead_ref", non-PII — an id + HMAC, never an email), with a random
 * anonymous id as fallback. Delivery: sendBeacon with a text/plain JSON blob
 * (a CORS "simple request" — no preflight, survives page unload), falling back
 * to fetch(keepalive). The worker dedupes repeat views per identity per day, so
 * refresh spam never inflates the funnel.
 *
 * Usage on a page (after this script):
 *   BTHEvents.track("reset_day_viewed", { day: 1 });
 *   BTHEvents.track("offer_viewed");
 *   <a href="https://buy.stripe.com/..."> clicks auto-fire "checkout_started".
 *
 * Every page including this script also auto-fires "page_viewed" on load, which
 * is what makes site traffic BTH's own data — the weekly funnel audit reads
 * page-level volume straight out of D1 instead of waiting on a GA4 export.
 * Opt a page out with <script src="assets/bth-events.js" data-bth-no-pageview>.
 */
(function () {
  "use strict";

  var ENDPOINT = "https://bth-mail-os.tyrell-38b.workers.dev/api/events";

  // Captured here, at top-level execution, where document.currentScript is still
  // valid — inside a DOMContentLoaded callback it is always null.
  var SELF = document.currentScript
    || (function () {
      var tags = document.querySelectorAll('script[src*="bth-events.js"]');
      return tags.length ? tags[tags.length - 1] : null;
    })();

  function leadRef() {
    try { return window.localStorage.getItem("bth_lead_ref") || ""; } catch (e) { return ""; }
  }

  function anonId() {
    try {
      var id = window.localStorage.getItem("bth_anon_id");
      if (!id) {
        id = "a-" + Math.random().toString(36).slice(2, 10) + "-" + Date.now().toString(36);
        window.localStorage.setItem("bth_anon_id", id);
      }
      return id;
    } catch (e) { return ""; }
  }

  // The real GA4 client id from the first-party _ga cookie (same read
  // bth-click-id.js does — kept inline so this file stands alone).
  function gaClientId() {
    try {
      var m = document.cookie.match(/(?:^|;\s*)_ga=GA\d+\.\d+\.(\d+\.\d+)/);
      return m ? m[1] : "";
    } catch (e) { return ""; }
  }

  function eventId() {
    return "e-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  function send(payload) {
    var body = JSON.stringify(payload);
    try {
      if (navigator.sendBeacon) {
        var blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
        if (navigator.sendBeacon(ENDPOINT, blob)) return;
      }
    } catch (e) {}
    try {
      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: body,
        keepalive: true
      }).catch(function () {});
    } catch (e) {}
  }

  function track(type, extra) {
    var payload = {
      type: String(type || ""),
      event_id: eventId(),
      lead_ref: leadRef(),
      anon_id: anonId(),
      ga_client_id: gaClientId(),
      url: String(window.location.href || "").split("#")[0],
      referrer: String(document.referrer || "")
    };
    if (extra) {
      for (var k in extra) {
        if (Object.prototype.hasOwnProperty.call(extra, k)) payload[k] = extra[k];
      }
    }
    send(payload);
  }

  // Checkout starts: every hosted-checkout link click, matching the binder set
  // bth-tracking.js uses for InitiateCheckout — this one just also lands in D1.
  function wireCheckoutClicks() {
    document.addEventListener("click", function (event) {
      var el = event.target && event.target.closest
        ? event.target.closest('a[href*="buy.stripe.com"], a[href*="gumroad.com/l/"], [data-bth-checkout]')
        : null;
      if (el) track("checkout_started");
    }, true);
  }

  // Page views: the owned replacement for a GA4 traffic export. The worker
  // already accepts "page_viewed" and dedupes to first-per-identity-per-day, so
  // a refresh never inflates the number. Fired once per load, after the checkout
  // wiring, so a click during a slow load still registers.
  function firePageView() {
    if (SELF && SELF.hasAttribute("data-bth-no-pageview")) return;
    track("page_viewed", { title: String(document.title || "").slice(0, 200) });
  }

  function start() {
    wireCheckoutClicks();
    firePageView();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

  window.BTHEvents = { track: track };
})();
