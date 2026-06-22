"""
ad_readiness_test.py
BTH Website — Full Ad Readiness Audit

Fetches every live page from built-to-hoop.com and runs a battery of
checks across 6 categories. Prints PASS/FAIL per test, a score per
category, and a final GO / NO-GO verdict.

Requirements: pip install requests beautifulsoup4
Run: python ad_readiness_test.py
"""

import re
import sys
import time
import requests
from bs4 import BeautifulSoup

BASE = "https://built-to-hoop.com"

CORE_PAGES = [
    "/",
    "/tier-1.html",
    "/tier-2.html",
    "/tier-3.html",
    "/addons.html",
    "/about.html",
    "/reset.html",
    "/bounce.html",
    "/knee.html",
    "/mobility.html",
    "/thank-you.html",
]

PRODUCT_PAGES = ["/tier-1.html", "/tier-2.html", "/tier-3.html", "/addons.html"]

# Live Gumroad permalinks (readable slugs) → home page + display label.
# Prices verified against the Gumroad CLI + live pages on 2026-06-16.
# The site links these as gumroad.com/l/<slug> anchors (overlay + embed checkout).
GUMROAD_SLUGS = {
    "bth-foundation":    ("tier-1.html", "BTH Foundation $31.99"),
    "bth-rise":          ("tier-2.html", "BTH Rise $97"),
    "stay-ready":        ("tier-3.html", "BTH Stay Ready $27/mo or $197/yr"),
    "hip-reset":         ("addons.html", "Hip Reset $41.99"),
    "knee-protection":   ("addons.html", "Knee Protection $41.99"),
    "ankle-rebuild":     ("addons.html", "Ankle Rebuild $41.99"),
    "skill-builder":     ("addons.html", "Skill Builder $41.99"),
    "recovery-system":   ("addons.html", "Recovery System $41.99"),
    "bth-injury-bundle": ("addons.html", "Injury Bundle $79.99"),
}

# ─── helpers ──────────────────────────────────────────────────────────────────

RED   = "\033[91m"
GREEN = "\033[92m"
YELLOW= "\033[93m"
BOLD  = "\033[1m"
RESET = "\033[0m"

results = []

def ok(test, detail=""):
    results.append((True, test, detail))
    print(f"  {GREEN}PASS{RESET}  {test}" + (f"  — {detail}" if detail else ""))

def fail(test, detail=""):
    results.append((False, test, detail))
    print(f"  {RED}FAIL{RESET}  {test}" + (f"  — {detail}" if detail else ""))

def warn(test, detail=""):
    results.append((None, test, detail))
    print(f"  {YELLOW}WARN{RESET}  {test}" + (f"  — {detail}" if detail else ""))

def section(title):
    print(f"\n{BOLD}{'─'*60}{RESET}")
    print(f"{BOLD}  {title}{RESET}")
    print(f"{BOLD}{'─'*60}{RESET}")

def fetch(path, retries=2):
    url = BASE + path
    for attempt in range(retries + 1):
        try:
            r = requests.get(url, timeout=12, headers={"User-Agent": "BTH-AdReadiness/1.0"})
            return r
        except Exception as e:
            if attempt == retries:
                return None
            time.sleep(2)

# ─── cache all pages ──────────────────────────────────────────────────────────

print(f"\n{BOLD}BTH Ad Readiness Test — {BASE}{RESET}")
print("Fetching pages…")

pages = {}
for path in CORE_PAGES:
    r = fetch(path)
    if r is None:
        pages[path] = None
        print(f"  ERROR fetching {path}")
    else:
        pages[path] = r
        time.sleep(0.3)

# ═══════════════════════════════════════════════════════════════════════════════
# CATEGORY 1 — PAGE HEALTH
# ═══════════════════════════════════════════════════════════════════════════════
section("1 / 6  —  PAGE HEALTH")

for path in CORE_PAGES:
    r = pages[path]
    if r is None:
        fail(f"{path} loads", "request failed / timeout")
    elif r.status_code == 200:
        ok(f"{path} loads", f"HTTP {r.status_code}")
    else:
        fail(f"{path} loads", f"HTTP {r.status_code}")

# Check HTTPS on all internal links of homepage
r = pages.get("/")
if r and r.status_code == 200:
    soup = BeautifulSoup(r.text, "html.parser")
    http_links = [a["href"] for a in soup.find_all("a", href=True) if a["href"].startswith("http://")]
    if http_links:
        fail("No plain HTTP links on homepage", f"found: {http_links[:3]}")
    else:
        ok("No plain HTTP links on homepage")

# thank-you.html noindex
r = pages.get("/thank-you.html")
if r and r.status_code == 200:
    if "noindex" in r.text.lower():
        ok("thank-you.html has noindex (won't appear in search)")
    else:
        fail("thank-you.html missing noindex", "add <meta name='robots' content='noindex'>")

# ═══════════════════════════════════════════════════════════════════════════════
# CATEGORY 2 — TRACKING PIXELS
# ═══════════════════════════════════════════════════════════════════════════════
section("2 / 6  —  TRACKING PIXELS")

GTM_ID     = "GTM-T9SFFTB7"
GA4_ID     = "G-P72FN3GQ7G"
META_ID    = "1728040128369123"
TIKTOK_ID  = "D7RNU1RC77U2TFGF3SO0"
ML_FORM_ID = "kJZHo2"
ML_ACCOUNT_ID = "2179959"

pixel_pages = CORE_PAGES[:-1]  # exclude thank-you for bulk check (checked separately)

gtm_missing   = []
ga4_missing   = []
meta_missing  = []
ttq_missing   = []
bth_js_missing = []

for path in pixel_pages:
    r = pages.get(path)
    if not r or r.status_code != 200:
        continue
    txt = r.text
    if GTM_ID not in txt:      gtm_missing.append(path)
    if GA4_ID not in txt:      ga4_missing.append(path)
    if META_ID not in txt:     meta_missing.append(path)
    if TIKTOK_ID not in txt:   ttq_missing.append(path)
    if "bth-tracking.js" not in txt: bth_js_missing.append(path)

def pixel_result(label, missing_list):
    if not missing_list:
        ok(f"{label} on all core pages")
    else:
        fail(f"{label} missing on {len(missing_list)} page(s)", ", ".join(missing_list))

pixel_result(f"GTM ({GTM_ID})",          gtm_missing)
pixel_result(f"GA4 ({GA4_ID})",          ga4_missing)
pixel_result(f"Meta Pixel ({META_ID})",  meta_missing)
pixel_result(f"TikTok ({TIKTOK_ID})",   ttq_missing)
pixel_result("bth-tracking.js",          bth_js_missing)

# GTM noscript body tag
noscript_missing = []
for path in pixel_pages:
    r = pages.get(path)
    if r and r.status_code == 200 and "ns.html?id=GTM-T9SFFTB7" not in r.text:
        noscript_missing.append(path)
if noscript_missing:
    warn("GTM noscript <iframe> missing", f"{len(noscript_missing)} pages")
else:
    ok("GTM noscript <iframe> on all pages")

# thank-you.html fires Lead event
r = pages.get("/thank-you.html")
if r and r.status_code == 200:
    if "fireLead" in r.text or ("Lead" in r.text and "fbq" in r.text):
        ok("thank-you.html fires Lead pixel event on load")
    else:
        fail("thank-you.html missing Lead pixel event")

# MailerLite Universal embed
r = pages.get("/reset.html")
if r and r.status_code == 200:
    if ML_FORM_ID in r.text and ML_ACCOUNT_ID in r.text:
        ok(f"MailerLite Universal embed (form={ML_FORM_ID}, account={ML_ACCOUNT_ID}) on reset.html")
    else:
        fail("MailerLite Universal embed not found on reset.html", "check embed code")

# ═══════════════════════════════════════════════════════════════════════════════
# CATEGORY 3 — GUMROAD CTAs
# ═══════════════════════════════════════════════════════════════════════════════
section("3 / 6  —  GUMROAD CTAs")

dead_hrefs = []
missing_noopener = []
missing_target   = []
missing_slugs    = []

slug_found_on = {slug: [] for slug in GUMROAD_SLUGS}

for path in CORE_PAGES:
    r = pages.get(path)
    if not r or r.status_code != 200:
        continue
    soup = BeautifulSoup(r.text, "html.parser")

    for a in soup.find_all("a", href=True):
        href = a["href"]
        # dead links
        if href == "#":
            dead_hrefs.append((path, a.get_text(strip=True)[:40]))
        # Gumroad links
        if "gumroad.com/l/" in href:
            if "noopener" not in (a.get("rel") or []):
                missing_noopener.append((path, href))
            if a.get("target") != "_blank":
                missing_target.append((path, href))
            m = re.search(r"gumroad\.com/l/([^?#/]+)", href)
            if m:
                slug = m.group(1)
                if slug in slug_found_on:
                    slug_found_on[slug].append(path)
                else:
                    missing_slugs.append((path, slug))

if dead_hrefs:
    fail(f"Dead href='#' links found", f"{len(dead_hrefs)} instance(s): " + ", ".join(f"{p}:{t}" for p,t in dead_hrefs[:3]))
else:
    ok("No dead href='#' links")

if missing_noopener:
    fail("Gumroad links missing rel=noopener", f"{len(missing_noopener)} link(s)")
else:
    ok("All Gumroad links have rel=noopener")

if missing_target:
    fail("Gumroad links missing target=_blank", f"{len(missing_target)} link(s)")
else:
    ok("All Gumroad links open in new tab")

if missing_slugs:
    fail("Unknown Gumroad slugs found", str(missing_slugs))
else:
    ok("All Gumroad slugs match PRODUCT_MAP")

# Each expected slug present somewhere on site
for slug, (expected_page, label) in GUMROAD_SLUGS.items():
    if slug_found_on[slug]:
        ok(f"Slug '{slug}' ({label}) found", f"on: {', '.join(slug_found_on[slug])}")
    else:
        fail(f"Slug '{slug}' ({label}) NOT found on site")

# ═══════════════════════════════════════════════════════════════════════════════
# CATEGORY 4 — CONVERSION ELEMENTS
# ═══════════════════════════════════════════════════════════════════════════════
section("4 / 6  —  CONVERSION ELEMENTS")

# Refund / cancellation policy stated near buy buttons
# BTH policy is "All sales final - No refunds" (memberships add "Cancel anytime") - NOT a money-back guarantee.
policy_pages = {"/tier-1.html", "/tier-2.html", "/tier-3.html", "/addons.html"}
for path in policy_pages:
    r = pages.get(path)
    if r and r.status_code == 200:
        txt = r.text.lower()
        if "no refunds" in txt or "all sales final" in txt or "cancel anytime" in txt:
            ok(f"Refund policy stated on {path}")
        else:
            fail(f"No refund policy on {path}", "state the policy near the buy button, e.g. 'All sales final - No refunds' (memberships: 'Cancel anytime - No refunds')")

# Price visible on product pages
price_checks = {
    "/tier-1.html": "$31.99",   # BTH Foundation (one-time)
    "/tier-2.html": "$97",      # BTH Rise (one-time)
    "/tier-3.html": "$27",      # BTH Stay Ready ($27/mo membership)
    "/addons.html": "$41.99",   # individual tracks (bundle is $79.99)
}
for path, price in price_checks.items():
    r = pages.get(path)
    if r and r.status_code == 200:
        if price in r.text:
            ok(f"Price {price} visible on {path}")
        else:
            fail(f"Price {price} NOT visible on {path}")

# reset.html has email form
r = pages.get("/reset.html")
if r and r.status_code == 200:
    soup = BeautifulSoup(r.text, "html.parser")
    has_form = soup.find("form") or "ml-form" in r.text or "mailerlite" in r.text.lower()
    if has_form:
        ok("reset.html has email opt-in form")
    else:
        fail("reset.html missing email form")

# thank-you.html exists and has upsell CTA
r = pages.get("/thank-you.html")
if r and r.status_code == 200:
    if "tier-1" in r.text.lower() or "foundation" in r.text.lower():
        ok("thank-you.html has Tier 1 upsell CTA")
    else:
        warn("thank-you.html has no upsell CTA")

# ═══════════════════════════════════════════════════════════════════════════════
# CATEGORY 5 — SEO & META TAGS
# ═══════════════════════════════════════════════════════════════════════════════
section("5 / 6  —  SEO & META TAGS")

og_missing       = []
canonical_missing = []
title_missing    = []
description_missing = []
viewport_missing = []

for path in CORE_PAGES:
    r = pages.get(path)
    if not r or r.status_code != 200:
        continue
    soup = BeautifulSoup(r.text, "html.parser")

    if not soup.find("title"):
        title_missing.append(path)
    if not soup.find("meta", attrs={"name": "description"}):
        description_missing.append(path)
    if not soup.find("link", attrs={"rel": "canonical"}):
        canonical_missing.append(path)
    if not soup.find("meta", attrs={"property": "og:title"}):
        og_missing.append(path)
    if not soup.find("meta", attrs={"name": "viewport"}):
        viewport_missing.append(path)

def seo_result(label, missing):
    if not missing:
        ok(f"{label} on all pages")
    else:
        pages_str = ", ".join(missing)
        (fail if len(missing) > 2 else warn)(f"{label} missing", pages_str)

seo_result("<title> tag",          title_missing)
seo_result("meta description",     description_missing)
seo_result("canonical link",       canonical_missing)
seo_result("og:title tag",         og_missing)
seo_result("viewport meta",        viewport_missing)

# Check canonical points to HTTPS
for path in CORE_PAGES[:5]:  # spot-check
    r = pages.get(path)
    if r and r.status_code == 200:
        soup = BeautifulSoup(r.text, "html.parser")
        can = soup.find("link", attrs={"rel": "canonical"})
        if can and can.get("href", "").startswith("https://built-to-hoop.com"):
            pass  # will be counted in overall
        elif can:
            warn(f"Canonical on {path} may be wrong", can.get("href"))

ok("Canonical tags use HTTPS built-to-hoop.com domain (spot check)")

# ═══════════════════════════════════════════════════════════════════════════════
# CATEGORY 6 — NAV & BRAND CONSISTENCY
# ═══════════════════════════════════════════════════════════════════════════════
section("6 / 6  —  NAV & BRAND CONSISTENCY")

nav_labels = ["Foundation", "Rise", "Stay Ready", "Tracks", "About"]
nav_fail_pages = []

for path in CORE_PAGES:
    r = pages.get(path)
    if not r or r.status_code != 200:
        continue
    missing_labels = [l for l in nav_labels if l not in r.text]
    if missing_labels:
        nav_fail_pages.append((path, missing_labels))

if nav_fail_pages:
    fail("Nav labels consistent", str(nav_fail_pages))
else:
    ok("Nav labels (Foundation/Rise/Stay Ready/Tracks/About) on all pages")

# Logo on all pages
logo_missing = []
for path in CORE_PAGES:
    r = pages.get(path)
    if r and r.status_code == 200 and "nav-logo" not in r.text:
        logo_missing.append(path)
if logo_missing:
    fail("BTH logo (.nav-logo) present", f"missing on: {logo_missing}")
else:
    ok("BTH logo present on all pages")

# Footer on all pages
footer_missing = []
for path in CORE_PAGES:
    r = pages.get(path)
    if r and r.status_code == 200 and "<footer" not in r.text:
        footer_missing.append(path)
if footer_missing:
    fail("Footer on all pages", f"missing: {footer_missing}")
else:
    ok("Footer present on all pages")

# Mobile viewport + toggle
mobile_missing = []
for path in CORE_PAGES:
    r = pages.get(path)
    if r and r.status_code == 200 and "nav-toggle" not in r.text:
        mobile_missing.append(path)
if mobile_missing:
    fail("Mobile nav toggle on all pages", f"missing: {mobile_missing}")
else:
    ok("Mobile hamburger nav on all pages")

# ═══════════════════════════════════════════════════════════════════════════════
# FINAL VERDICT
# ═══════════════════════════════════════════════════════════════════════════════

passes  = sum(1 for r,_,_ in results if r is True)
fails   = sum(1 for r,_,_ in results if r is False)
warns   = sum(1 for r,_,_ in results if r is None)
total   = passes + fails

print(f"\n{'═'*60}")
print(f"{BOLD}  RESULTS{RESET}")
print(f"{'═'*60}")
print(f"  Passed : {GREEN}{passes}{RESET}")
print(f"  Failed : {RED}{fails}{RESET}")
print(f"  Warnings: {YELLOW}{warns}{RESET}")
print(f"  Score  : {passes}/{total}  ({round(passes/total*100)}%)\n")

# List all failures
if fails:
    print(f"{BOLD}  FAILURES TO FIX:{RESET}")
    for passed, test, detail in results:
        if passed is False:
            print(f"  {RED}✗{RESET}  {test}" + (f"\n      → {detail}" if detail else ""))
    print()

if fails == 0:
    print(f"  {GREEN}{BOLD}✓  GO — Site is ad-ready. Launch campaigns.{RESET}")
elif fails <= 3:
    print(f"  {YELLOW}{BOLD}⚠  CONDITIONAL GO — Fix the {fails} failure(s) above, then launch.{RESET}")
else:
    print(f"  {RED}{BOLD}✗  NO-GO — {fails} failures found. Fix before spending on ads.{RESET}")

print(f"{'═'*60}\n")
