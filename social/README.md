# Meta carousel publisher

Publishes one approved JPEG carousel per day to the BTH Instagram professional account and Facebook Page. Images come from this site's public `social/queue/` folders. Scheduled runs check each platform's live posts for duplicates and today's posting cap in America/New_York.

Each `social/queue/<id>/` folder contains 2–10 `slide-01.jpg` style files, a non-empty `caption.txt`, and `post.json`:

```json
{
  "id": "example",
  "title": "Carousel title",
  "publish_on": "2026-11-18",
  "approved": true,
  "platforms": ["instagram", "facebook"],
  "slides": ["slide-01.jpg", "slide-02.jpg"],
  "caption_file": "caption.txt"
}
```

Optional: `caption_fb_file` supplies a separate Facebook caption; `source` records the source package. Otherwise Facebook replaces “link in bio” with the Reset URL, or appends that URL. The URL is tagged `utm_source=facebook&utm_medium=social&utm_campaign=<set id>`, where the set id (`set-128`) is read from the folder id; a folder with no set id gets `autopost`. Instagram captions are posted exactly as approved. Sync produces 1080×1350 JPEGs at quality 88 and copies the original caption exactly.

```sh
node social/meta-publish.mjs --mode check
node social/meta-publish.mjs --mode plan
node social/meta-publish.mjs --mode plan-week
node social/meta-publish.mjs --mode publish
node social/meta-publish.mjs --mode publish --post example --platform instagram --dry
node social/sync-from-tiktok.mjs --from <package-dir> --publish-on 2026-11-18
node social/sync-from-tiktok.mjs --all-scheduled <tiktok-queue-dir> --start 2026-11-18
```

Sync runs locally, requires approved TikTok packages, and refuses existing destinations. Use `--jimp <path>` to select an existing jimp-compact installation. No install is needed in CI.

Set the repository variable `META_AUTOPOST` to `on` to enable the schedule. Any other value disables scheduled publishing. Manual workflow runs remain available, defaulting to `plan`. An explicit `--post` bypasses the date and daily cap but still checks duplicates. `--dry` performs the plan without writes.

Tokens live only in the `META_PAGE_TOKEN` repository secret. Every mode except `plan-week` requires the Page token. Optional environment settings: `META_GRAPH_VERSION` (default `v23.0`), `SITE_BASE` (default `https://built-to-hoop.com`), and `QUEUE_DIR` (default `social/queue`, resolved from the repository root). Deploy queued images to Pages before publishing; the publisher checks each public JPEG before any Graph write.

## Week view

`--mode plan-week` prints the next 7 queued posts in the order the daily run takes them: expected date, set id, slide count, platforms and both captions. It is read-only. With `META_PAGE_TOKEN` set it leaves out posts already live and starts tomorrow if today already posted. With no token it still runs from the local queue, lists posts dated today or later, and says the live check was skipped. The workflow's manual `mode` menu does not offer it yet (the workflow file is a locked path), so run it locally.

## Token health

Every command-line run starts by asking Graph `debug_token` about the Page token and prints one line. The token itself is never printed, and it travels in the request body, never in a URL.

| Line | Meaning | Exit |
|---|---|---|
| `token: valid, no expiry date` | Long-lived Page token. Nothing to do. | 0 |
| `token: valid, expires in N days (date)` | 7 days or more left. | 0 |
| `TOKEN EXPIRES IN N DAYS (date): ...` | Under 7 days. The run still does its work, then fails on purpose so the Actions run turns red. | 6 |
| `TOKEN EXPIRED: ...` | Expired or revoked. The run stops before anything else. | 1 |
| `token: UNVERIFIED, ...` | The health check itself could not run. Publishing carries on; `check` exits 5. | 0 or 5 |

In GitHub Actions the failing lines are also written as run annotations. To replace the token: create a Page token that does not expire (system user token, then `GET {page-id}?fields=access_token`), confirm "Expires: Never" at `https://developers.facebook.com/tools/debug/accesstoken/`, then run `gh secret set META_PAGE_TOKEN --repo builttohoop/BTH-website` (it prompts for the value). Prove it with a manual workflow run in `check` mode.

## Tests

```sh
node --test .github/scripts/meta-publish.test.mjs
node --test social/meta-publish-hardening.test.mjs
```

The first pins the original publisher contract. The second covers token health, per-set campaign tags and the week view. All Graph calls are mocked.
