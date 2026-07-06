/* BTH unified conversion tracking
 *
 * Fires identical events to GA4, Meta Pixel, and TikTok Pixel.
 * Also pushes to dataLayer so GTM can pick them up if tags are configured there.
 *
 * Events:
 *   ViewContent      — on tier/addon/knee/mobility/bounce page load
 *   Lead             — on MailerLite email form submit, OR the owned .bth-mail-form
 *                      submit (BTH-GOAL-0027 — the owned Mail OS signup form)
 *   InitiateCheckout — on any Gumroad CTA link click, OR any element carrying
 *                      data-bth-checkout (owned/off-Gumroad CTAs, e.g. coaching)
 *
 * PageView fires automatically from each pixel's base code in <head>.
 * Purchase is tracked server-side via the payment webhook.
 */
(function () {
  "use strict";

  window.dataLayer = window.dataLayer || [];

  var PRODUCT_MAP = {
    // Clean Gumroad slugs — the current live buy-links (e.g. tier-3.html uses /l/stay-ready).
    "stay-ready":        { name: "BTH Stay Ready ($27/mo)",        value: 27,    currency: "USD" },
    "bth-rise":          { name: "BTH Rise (12-Week Program)",     value: 97,    currency: "USD" },
    "bth-foundation":    { name: "BTH Foundation",                 value: 31.99, currency: "USD" },
    "hip-reset":         { name: "Hip Reset Track",                value: 41.99, currency: "USD" },
    "knee-protection":   { name: "Knee Protection Track",          value: 41.99, currency: "USD" },
    "ankle-rebuild":     { name: "Ankle Rebuild Track",            value: 41.99, currency: "USD" },
    "skill-builder":     { name: "Skill Track",                    value: 41.99, currency: "USD" },
    "recovery-system":   { name: "Recovery Track",                 value: 41.99, currency: "USD" },
    "bth-injury-bundle": { name: "Injury Bundle",                  value: 79.99, currency: "USD" },
    // Old random slugs kept as aliases (legacy links / redirects still resolve to value).
    "thxqs":  { name: "BTH Stay Ready ($27/mo)",    value: 27,    currency: "USD" },
    "groedz": { name: "BTH Rise (12-Week Program)", value: 97,    currency: "USD" },
    "ecyzaa": { name: "BTH Foundation",             value: 31.99, currency: "USD" },
    "dwcyc":  { name: "Hip Reset Track",            value: 41.99, currency: "USD" },
    "novpg":  { name: "Knee Protection Track",      value: 41.99, currency: "USD" },
    "mtqyvi": { name: "Ankle Rebuild Track",        value: 41.99, currency: "USD" },
    "axona":  { name: "Skill Track",                value: 41.99, currency: "USD" },
    "xbxhqc": { name: "Recovery Track",             value: 41.99, currency: "USD" },
    "esgvfq": { name: "Injury Bundle",              value: 79.99, currency: "USD" },
  };

  function fire(eventName, props) {
    props = props || {};

    // GA4
    try {
      if (window.gtag) window.gtag("event", eventName, props);
    } catch (e) {}

    // Meta Pixel
    try {
      if (window.fbq) window.fbq("track", eventName, props);
    } catch (e) {}

    // TikTok Pixel
    try {
      if (window.ttq) window.ttq.track(eventName, props);
    } catch (e) {}

    // GTM dataLayer (for any tags configured in the container)
    try {
      window.dataLayer.push({
        event:                "bth_" + eventName.toLowerCase().replace(/\s+/g, "_"),
        bth_event_name:       eventName,
        bth_content_id:       props.content_id       || null,
        bth_content_name:     props.content_name     || null,
        bth_content_type:     props.content_type     || null,
        bth_content_category: props.content_category || null,
        bth_value:            props.value            || null,
        bth_currency:         props.currency         || "USD",
      });
    } catch (e) {}
  }

  function slugFromHref(href) {
    var m = /gumroad\.com\/l\/([^?#\/]+)/i.exec(href || "");
    return m ? m[1] : null;
  }

  function productProps(slug) {
    var p = PRODUCT_MAP[slug];
    if (p) {
      return {
        content_id:   slug,
        content_name: p.name,
        content_type: "product",
        value:        p.value,
        currency:     p.currency,
      };
    }
    if (slug) {
      console.warn("[BTH] Unknown Gumroad slug:", slug, "— add it to PRODUCT_MAP in bth-tracking.js");
    }
    return { content_id: slug || "unknown", content_type: "product" };
  }

  // ViewContent — fires on product/info pages
  function fireViewContent() {
    var path = (window.location.pathname || "").toLowerCase();
    if (/\/(tier-[123]|addons|knee|mobility|bounce)(\.html|\/?$)/.test(path)) {
      var slug = (path.match(/\/([^\/]+?)(\.html)?$/) || [])[1] || "unknown";
      fire("ViewContent", {
        content_id:   slug,
        content_type: "product_group",
      });
    }
  }

  // InitiateCheckout — fires on any Gumroad link click
  function bindCheckoutClicks() {
    document.addEventListener("click", function (e) {
      var a = e.target && e.target.closest && e.target.closest("a[href*='gumroad.com/l/']");
      if (!a) return;
      if (a.dataset.bthFired === "1") return;
      a.dataset.bthFired = "1";
      fire("InitiateCheckout", productProps(slugFromHref(a.href)));
      setTimeout(function () { delete a.dataset.bthFired; }, 2000);
    }, true);
  }

  // InitiateCheckout — fires on any owned/off-Gumroad CTA carrying data-bth-checkout.
  // Reads content from data attributes so it works without a Gumroad slug (coaching,
  // and any future owned Mail OS checkout). Attributes:
  //   data-bth-checkout            (presence = bind)
  //   data-bth-id / -name / -value / -currency
  function bindDataCheckoutClicks() {
    document.addEventListener("click", function (e) {
      var a = e.target && e.target.closest && e.target.closest("[data-bth-checkout]");
      if (!a) return;
      if (a.dataset.bthFired === "1") return;
      a.dataset.bthFired = "1";
      var val = parseFloat(a.getAttribute("data-bth-value"));
      fire("InitiateCheckout", {
        content_id:   a.getAttribute("data-bth-id")   || "unknown",
        content_name: a.getAttribute("data-bth-name") || null,
        content_type: "product",
        value:        isNaN(val) ? null : val,
        currency:     a.getAttribute("data-bth-currency") || "USD",
      });
      setTimeout(function () { delete a.dataset.bthFired; }, 2000);
    }, true);
  }

  // Lead — fires on MailerLite form submit (legacy, kept during the parallel window)
  // OR the owned Mail OS form submit (.bth-mail-form — the BTH-GOAL-0027 replacement).
  function bindEmailSubmits() {
    document.addEventListener("submit", function (e) {
      var f = e.target;
      if (!f || !f.matches) return;
      var isML = (f.action && /mailerlite\.com/i.test(f.action)) ||
                 (f.className && /ml-block-form|ml-form-embedSubmitLoad|ml-subscribe-form/i.test(f.className));
      var isOwned = f.className && /\bbth-mail-form\b/.test(f.className);
      if (!isML && !isOwned) return;
      fire("Lead", { content_name: "email_signup", content_category: "newsletter" });
    }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      fireViewContent();
      bindCheckoutClicks();
      bindDataCheckoutClicks();
      bindEmailSubmits();
    });
  } else {
    fireViewContent();
    bindCheckoutClicks();
    bindDataCheckoutClicks();
    bindEmailSubmits();
  }
})();
