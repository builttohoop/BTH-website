# BTH Google Tag Manager Setup Guide

**GTM Container:** GTM-T9SFFTB7  
**GA4 Measurement ID:** G-P72FN3GQ7G  
**Meta Pixel ID:** 1728040128369123  
**TikTok Pixel ID:** D7RNU1RC77U2TFGF3SO0

The website HTML now loads only the GTM container snippet. GA4, Meta Pixel, and TikTok
are NOT loaded directly in the HTML anymore — you configure them as GTM Tags below.
`bth-tracking.js` pushes custom dataLayer events; your GTM Tags fire off those events.

---

## Step 1 — Create the GA4 Tag

In GTM: **Tags → New**

| Field | Value |
|-------|-------|
| Name | `GA4 — Google Tag` |
| Tag Type | **Google Tag** |
| Tag ID | `G-P72FN3GQ7G` |
| Trigger | **All Pages** |

Save. This replaces the direct GA4 script that was removed from the HTML.

---

## Step 2 — Create the Meta Pixel Base Tag

In GTM: **Tags → New**

| Field | Value |
|-------|-------|
| Name | `Meta Pixel — Base / PageView` |
| Tag Type | **Custom HTML** |
| Trigger | **All Pages** |

**HTML to paste:**
```html
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1728040128369123');
fbq('track', 'PageView');
</script>
<noscript>
<img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=1728040128369123&ev=PageView&noscript=1"/>
</noscript>
```

Save.

---

## Step 3 — Create the TikTok Pixel Base Tag

In GTM: **Tags → New**

| Field | Value |
|-------|-------|
| Name | `TikTok Pixel — Base / PageView` |
| Tag Type | **Custom HTML** |
| Trigger | **All Pages** |

**HTML to paste:**
```html
<script>
!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
ttq.methods=["page","track","identify","instances","debug","on","off","once",
"ready","alias","group","enableCookie","disableCookie","holdConsent",
"revokeConsent","grantConsent"],
ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(
Array.prototype.slice.call(arguments,0)))}};
for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)
ttq.setAndDefer(e,ttq.methods[n]);return e};
ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",
o=n&&n.partner;ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;
ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};
n=document.createElement("script");n.type="text/javascript";n.async=!0;
n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];
e.parentNode.insertBefore(n,e)};
ttq.load('D7RNU1RC77U2TFGF3SO0');
ttq.page();}(window,document,'ttq');
</script>
```

Save.

---

## Step 4 — Create Custom Event Triggers

These triggers listen for events pushed by `bth-tracking.js` via `dataLayer.push()`.

### Trigger A — ViewContent pages

In GTM: **Triggers → New**

| Field | Value |
|-------|-------|
| Name | `BTH — View Content` |
| Trigger Type | **Custom Event** |
| Event Name | `bth_view_content` |
| Fires on | All Custom Events |

### Trigger B — Lead (email signup)

| Name | `BTH — Lead` |
| Trigger Type | **Custom Event** |
| Event Name | `bth_lead` |

### Trigger C — Initiate Checkout (Gumroad click)

| Name | `BTH — Initiate Checkout` |
| Trigger Type | **Custom Event** |
| Event Name | `bth_initiate_checkout` |

---

## Step 5 — Create ViewContent Event Tags

### Meta — ViewContent

**Tags → New**

| Field | Value |
|-------|-------|
| Name | `Meta Pixel — ViewContent` |
| Tag Type | **Custom HTML** |
| Trigger | `BTH — View Content` |

```html
<script>
fbq('track', 'ViewContent', {
  content_id:   '{{DLV - bth_content_id}}',
  content_name: '{{DLV - bth_content_name}}',
  content_type: 'product'
});
</script>
```

> **Before you save:** create the Data Layer Variable first (see Step 6 below), then come back and save this tag.

### TikTok — ViewContent

| Name | `TikTok Pixel — ViewContent` |
| Tag Type | **Custom HTML** |
| Trigger | `BTH — View Content` |

```html
<script>
ttq.track('ViewContent', {
  content_id:   '{{DLV - bth_content_id}}',
  content_name: '{{DLV - bth_content_name}}'
});
</script>
```

### GA4 — ViewContent

| Name | `GA4 — view_content` |
| Tag Type | **GA4 Event** |
| Configuration Tag | `GA4 — Google Tag` |
| Event Name | `view_content` |
| Trigger | `BTH — View Content` |

Add Event Parameters:
- `content_id` → `{{DLV - bth_content_id}}`
- `content_name` → `{{DLV - bth_content_name}}`

---

## Step 6 — Create Data Layer Variables

For each variable below: **Variables → User-Defined Variables → New → Data Layer Variable**

| Variable Name (in GTM) | Data Layer Variable Name |
|------------------------|--------------------------|
| `DLV - bth_content_id` | `bth_content_id` |
| `DLV - bth_content_name` | `bth_content_name` |
| `DLV - bth_value` | `bth_value` |
| `DLV - bth_currency` | `bth_currency` |

---

## Step 7 — Create Lead Event Tags

### Meta — Lead

| Name | `Meta Pixel — Lead` |
| Tag Type | **Custom HTML** |
| Trigger | `BTH — Lead` |

```html
<script>fbq('track', 'Lead');</script>
```

### TikTok — Lead

| Name | `TikTok Pixel — SubmitForm` |
| Trigger | `BTH — Lead` |

```html
<script>ttq.track('SubmitForm');</script>
```

### GA4 — Lead

| Name | `GA4 — generate_lead` |
| Tag Type | **GA4 Event** |
| Event Name | `generate_lead` |
| Trigger | `BTH — Lead` |

---

## Step 8 — Create InitiateCheckout Event Tags

### Meta — InitiateCheckout

| Name | `Meta Pixel — InitiateCheckout` |
| Trigger | `BTH — Initiate Checkout` |

```html
<script>
fbq('track', 'InitiateCheckout', {
  content_id:   '{{DLV - bth_content_id}}',
  content_name: '{{DLV - bth_content_name}}',
  value:        '{{DLV - bth_value}}',
  currency:     '{{DLV - bth_currency}}'
});
</script>
```

### TikTok — InitiateCheckout

| Name | `TikTok Pixel — InitiateCheckout` |
| Trigger | `BTH — Initiate Checkout` |

```html
<script>
ttq.track('InitiateCheckout', {
  content_id:   '{{DLV - bth_content_id}}',
  content_name: '{{DLV - bth_content_name}}',
  value:        '{{DLV - bth_value}}',
  currency:     '{{DLV - bth_currency}}'
});
</script>
```

### GA4 — InitiateCheckout

| Name | `GA4 — begin_checkout` |
| Tag Type | **GA4 Event** |
| Event Name | `begin_checkout` |
| Trigger | `BTH — Initiate Checkout` |

Event Parameters:
- `content_id` → `{{DLV - bth_content_id}}`
- `value` → `{{DLV - bth_value}}`
- `currency` → `{{DLV - bth_currency}}`

---

## Step 9 — PUBLISH the Container

Click **Submit** in the top-right of GTM → add a version name like `"Initial tracking setup"` → **Publish**.

Until you publish, none of the tags are live.

---

## Step 10 — Test Everything

### GTM Preview Mode
1. In GTM click **Preview**
2. Enter `https://built-to-hoop.com`
3. Walk through: homepage → tier-1 page → click a Gumroad button → submit email form
4. In the GTM debugger panel, verify these events appear:
   - `gtm.js` on every page
   - `bth_view_content` on tier-1/tier-2/tier-3/addons pages
   - `bth_initiate_checkout` when you click a Gumroad button
   - `bth_lead` when you submit the email form

### Meta Events Manager → Test Events
1. Go to Meta Business Suite → Events Manager → your pixel → Test Events
2. Enter your site URL — it will show PageView, ViewContent, etc. as you browse

### TikTok Events → Test Events
In TikTok Ads Manager → Tools → Events → click your pixel → Test Events

### GA4 Realtime
In GA4 → Reports → Realtime — you should see yourself as an active user and the custom events appear.

---

## Step 11 — Build Retargeting Audiences

Once the tags are live and collecting data for ~48 hours:

### Meta Audiences (Meta Ads Manager → Audiences → Create → Website)

| Audience | Rule | Lookback |
|----------|------|----------|
| All Site Visitors | All website traffic | 30 days |
| Product Page Viewers | Event = ViewContent | 30 days |
| Checkout Starters | Event = InitiateCheckout | 30 days |
| Email Leads | Event = Lead | 60 days |
| Buyers (exclude) | Event = Purchase | 180 days |

### TikTok Audiences (TikTok Ads → Assets → Audiences → Website Traffic)

Same rules as Meta above.

### Google Ads Audiences (Google Ads → Tools → Audience Manager → Website Visitors)

Import the same segments from GA4 via the GA4-Google Ads link.

---

## Weekly Tracking Checklist

| Metric | Where to check |
|--------|---------------|
| Page visits | GA4 → Reports → Engagement → Pages |
| Email signups (leads) | MailerLite → Subscribers + GA4 Events |
| Checkout clicks | GA4 → Events → `bth_initiate_checkout` |
| Ad cost per lead | Meta Ads Manager / TikTok Ads Manager |
| Retargeting audience size | Meta Audiences (needs ~100 people to run) |

---

## Event Reference

| dataLayer event | Meta event | TikTok event | GA4 event |
|-----------------|------------|--------------|-----------|
| (All Pages) | `PageView` | `page()` | automatic |
| `bth_view_content` | `ViewContent` | `ViewContent` | `view_content` |
| `bth_lead` | `Lead` | `SubmitForm` | `generate_lead` |
| `bth_initiate_checkout` | `InitiateCheckout` | `InitiateCheckout` | `begin_checkout` |
| (Gumroad webhook) | `Purchase` | `CompletePayment` | `purchase` |

> **Purchase tracking note:** Gumroad handles the checkout, so you cannot fire a Purchase
> event from your website page. Set up Gumroad's Zapier integration to fire a server-side
> Conversion API event to Meta and TikTok after a confirmed sale.
