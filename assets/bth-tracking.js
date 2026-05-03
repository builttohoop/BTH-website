/* BTH unified conversion tracking — fires identical events to TikTok, Meta, GA4.
 *
 * Triggers:
 *   - PageView                  → handled by base pixel snippets in <head>
 *   - ViewContent               → on tier-1/tier-2/tier-3/addons/knee/mobility/bounce page load
 *   - InitiateCheckout          → on click of any Gumroad CTA link
 *   - Lead                      → on MailerLite email form submit
 *   - Purchase                  → fires server-side from Gumroad webhook (not here)
 *
 * Safe to load on every page. Idempotent — guards prevent double-firing.
 */
(function () {
  "use strict";

  // ---------- helpers ----------
  function fire(event, props) {
    props = props || {};
    try { if (window.fbq)     window.fbq("track", event, props); } catch (e) {}
    try { if (window.ttq)     window.ttq.track(event, props);    } catch (e) {}
    try { if (window.gtag)    window.gtag("event", event, props);} catch (e) {}
    try { if (window.dataLayer) window.dataLayer.push({ event: "bth_" + event, ...props }); } catch (e) {}
  }

  function getProductFromHref(href) {
    var m = /gumroad\.com\/l\/([^?#\/]+)/i.exec(href || "");
    return m ? m[1] : null;
  }

  // Map Gumroad slugs to readable product names + price (for richer event data).
  // Keep in sync with the offer ladder.
  var PRODUCT_MAP = {
    // Tier 1 — Reset
    "groedz_t1": { name: "Tier 1 Reset",          value: 19,    currency: "USD" },
    // Tier 2 — Rise
    "groedz":    { name: "Tier 2 Rise",            value: 57,    currency: "USD" },
    // Tier 3 — Run (subscription)
    "groedz_t3": { name: "Tier 3 Run",             value: 27,    currency: "USD" },
    // Mini-tracks
    "novpg":     { name: "Knee Protection Track",  value: 19,    currency: "USD" },
    "dwcyc":     { name: "Hip Reset Track",        value: 19,    currency: "USD" },
    // Add-ons (placeholder values; update when slugs are finalized)
  };

  function productProps(slug) {
    var p = PRODUCT_MAP[slug];
    if (p) {
      return {
        content_id: slug,
        content_name: p.name,
        content_type: "product",
        value: p.value,
        currency: p.currency,
      };
    }
    return { content_id: slug || "unknown", content_type: "product" };
  }

  // ---------- ViewContent on key pages ----------
  function fireViewContentIfRelevant() {
    var path = (window.location.pathname || "").toLowerCase();
    // Match: /tier-1, /tier-2, /tier-3, /addons, /knee, /mobility, /bounce
    if (/\/(tier-[123]|addons|knee|mobility|bounce)(\.html|\/?$)/.test(path)) {
      var pageSlug = (path.match(/\/([^\/]+?)(\.html)?$/) || [])[1] || "unknown";
      fire("ViewContent", {
        content_id: pageSlug,
        content_type: "product_group",
      });
    }
  }

  // ---------- InitiateCheckout on Gumroad CTA clicks ----------
  function bindCheckoutClicks() {
    document.addEventListener("click", function (e) {
      var a = e.target && e.target.closest && e.target.closest("a[href*='gumroad.com/l/']");
      if (!a) return;
      if (a.dataset.bthFired === "1") return; // dedupe
      a.dataset.bthFired = "1";
      var slug = getProductFromHref(a.href);
      fire("InitiateCheckout", productProps(slug));
      // Reset dedupe after 2s so a second genuine click still tracks
      setTimeout(function () { delete a.dataset.bthFired; }, 2000);
    }, true);
  }

  // ---------- Lead on email form submit ----------
  function bindEmailSubmits() {
    document.addEventListener("submit", function (e) {
      var f = e.target;
      if (!f || !f.matches) return;
      // MailerLite forms have action containing assets.mailerlite.com OR class ml-block-form
      var isML = (f.action && /mailerlite\.com/i.test(f.action)) ||
                 (f.className && /ml-block-form|ml-form-embedSubmitLoad|ml-subscribe-form/i.test(f.className));
      if (!isML) return;
      fire("Lead", { content_name: "email_signup", content_category: "newsletter" });
    }, true);
  }

  // ---------- boot ----------
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      fireViewContentIfRelevant();
      bindCheckoutClicks();
      bindEmailSubmits();
    });
  } else {
    fireViewContentIfRelevant();
    bindCheckoutClicks();
    bindEmailSubmits();
  }
})();
