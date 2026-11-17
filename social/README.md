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

Optional: `caption_fb_file` supplies a separate Facebook caption; `source` records the source package. Otherwise Facebook replaces “link in bio” with the Reset URL, or appends that URL. Sync produces 1080×1350 JPEGs at quality 88 and copies the original caption exactly.

```sh
node social/meta-publish.mjs --mode check
node social/meta-publish.mjs --mode plan
node social/meta-publish.mjs --mode publish
node social/meta-publish.mjs --mode publish --post example --platform instagram --dry
node social/sync-from-tiktok.mjs --from <package-dir> --publish-on 2026-11-18
node social/sync-from-tiktok.mjs --all-scheduled <tiktok-queue-dir> --start 2026-11-18
```

Sync runs locally, requires approved TikTok packages, and refuses existing destinations. Use `--jimp <path>` to select an existing jimp-compact installation. No install is needed in CI.

Set the repository variable `META_AUTOPOST` to `on` to enable the schedule. Any other value disables scheduled publishing. Manual workflow runs remain available, defaulting to `plan`. An explicit `--post` bypasses the date and daily cap but still checks duplicates. `--dry` performs the plan without writes.

Tokens live only in the `META_PAGE_TOKEN` repository secret. Every mode requires the Page token. Optional environment settings: `META_GRAPH_VERSION` (default `v23.0`), `SITE_BASE` (default `https://built-to-hoop.com`), and `QUEUE_DIR` (default `social/queue`, resolved from the repository root). Deploy queued images to Pages before publishing; the publisher checks each public JPEG before any Graph write.

Run the local mocked checks with `node --test .github/scripts/meta-publish.test.mjs`.
