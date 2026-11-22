# Meta Reels publisher (built, switched off)

`social/meta-reels.mjs` publishes one short vertical video as an Instagram Reel and as a Facebook Page
Reel. It sits beside the photo-carousel lane (`social/meta-publish.mjs`) and uses the same Page, the
same credential and the same on/off variable. It does not change the carousel lane.

**Nothing runs it yet.** There is no workflow for it and no reel in the queue. Until the owner adds a
workflow, the only way it runs is by hand.

## Two locks

1. The default mode is `plan`. It prints the reel it would post, the public video URL, both captions
   and the Graph calls it would make. It sends no Graph write.
2. A real post needs **both** `--mode publish` on the command line **and** `META_AUTOPOST=on` in the
   environment. `--mode publish` without the variable prints `REFUSED`, shows the plan and exits 4.
   The variable without the flag only plans.

| Mode | Graph reads | Graph writes | Needs the credential |
|---|---|---|---|
| `plan` (default) | Page, recent reels (skipped without a credential) | none | no |
| `check` | Page, Instagram publishing limit | none | yes |
| `publish` + `META_AUTOPOST=on` | as plan, plus status polls | yes | yes |

```sh
node social/meta-reels.mjs
node social/meta-reels.mjs --mode check
node social/meta-reels.mjs --mode plan --post <id> --platform instagram
node social/meta-reels.mjs --mode publish
node --test social/meta-reels.test.mjs
```

Exit codes: 0 done or nothing due, 1 a platform failed, 4 publish refused, 5 no credential.

## How to queue a reel

Make a folder `social/reels/<id>/` (letters, numbers, hyphens, underscores) holding:

- `reel.mp4` - the video (or host it elsewhere and use `video_url`)
- `caption.txt` - the Instagram caption
- `reel.json`:

```json
{
  "id": "2026-12-01-reel-001-example",
  "title": "Working title",
  "publish_on": "2026-12-01",
  "approved": true,
  "platforms": ["instagram", "facebook"],
  "video": "reel.mp4",
  "caption_file": "caption.txt"
}
```

Optional fields:

| Field | Meaning |
|---|---|
| `video_url` | Use instead of `video`. A plain public `https://` URL ending in `.mp4` or `.mov`, no query string. |
| `cover` | A `.jpg` in the folder, sent as `cover_url`. Without it Instagram uses the first frame. |
| `caption_fb_file` | A separate Facebook caption. Without it, "link in bio" becomes the Reset URL (`utm_campaign=autopost_reel`), or the URL is appended. |
| `share_to_feed` | `true` (default) or `false` (Reels tab only). |
| `trial` | `MANUAL` or `SS_PERFORMANCE`: publishes an Instagram trial reel, shown to non-followers only. |

Then merge the folder to `main` so GitHub Pages serves the video at
`https://built-to-hoop.com/social/reels/<id>/reel.mp4`, and run `plan`. The plan's `video_check` shows
whether that URL answers 200.

The oldest approved reel whose `publish_on` is today or earlier (New York date) goes first. `--post <id>`
picks one reel and ignores its date. It does not ignore the daily cap or the duplicate check.

## Guards

- **One reel per platform per New York day.** Read from the live accounts, not from a local record.
  Carousels do not use up the reel slot.
- **No duplicates.** A reel whose first caption line already heads a live reel on that platform is skipped.
- **The video must answer HTTP 200** with a `video/mp4` or `video/quicktime` content type before any
  write (10 retries, 30 seconds apart, to cover a Pages deploy). Same for a cover.
- **Platforms are independent.** Instagram failing does not stop Facebook, and the reverse.
- **Bounded polling.** Instagram: 5 status checks, 60 seconds apart (Meta's stated ceiling). Facebook:
  up to 20 checks, 15 seconds apart, before and after the publish call. A timeout before the publish
  call posts nothing on that platform.
- **Fail closed.** If the live reel list cannot be read, that platform is skipped. The two publish calls
  (`media_publish`, `upload_phase=finish`) are never replayed after an error.
- **Credential handling.** Read from `META_PAGE_TOKEN`, sent only to `graph.facebook.com` and
  `rupload.facebook.com`, never placed in a URL, removed from every printed line.

## Permissions the Page credential needs

From the two Meta pages below. Standard Access is enough for an account the app owner manages.

| Platform | Permissions |
|---|---|
| Instagram Reel | `instagram_basic`, `instagram_content_publish`, `pages_read_engagement` (plus `ads_management` and `ads_read` if the Page role comes through Business Manager) |
| Facebook Page Reel | `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, from a person who can do the `CREATE_CONTENT` task on the Page |

## Limits

| Limit | Instagram Reel | Facebook Page Reel |
|---|---|---|
| API posts per rolling 24 hours | 100 (the same page says 50 in its carousel section) | 30 |
| Duration | 3 seconds to 15 minutes | 3 to 90 seconds |
| Aspect ratio | 9:16 recommended | 9:16 |
| Resolution | 1920 pixels wide at most | 1080x1920 recommended, 540x960 minimum |
| Frame rate | 23 to 60 fps | 24 to 60 fps |
| Format | MP4 or MOV, H.264 or HEVC, AAC audio up to 48 kHz, moov atom at the front | MP4 recommended, H.264 or H.265, AAC |
| File size | 300 MB | not stated |
| Caption | 2,200 characters, 30 hashtags, 20 mentions | not stated |

To post one file to both, keep it 9:16, 1080x1920, 3 to 90 seconds, 24 to 60 fps, H.264 with AAC.
This script enforces 100 MB on a file kept in the repo (GitHub's per-file limit), plus the caption limits.
It cannot measure duration, shape or codec: Meta rejects a bad file during processing and the run
reports that platform as failed.

Facebook fetches a hosted video with its own crawler (`facebookexternalhit/1.1`), so the host's
`robots.txt` must allow it. This site's `robots.txt` allows every agent.

## Endpoints (Meta docs fetched 2026-11-21)

Sources:

- https://developers.facebook.com/docs/instagram-platform/content-publishing
- https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media
- https://developers.facebook.com/docs/video-api/guides/reels-publishing

`{version}` is `META_GRAPH_VERSION`, default `v23.0` to match the carousel lane. Meta's examples on
those pages show `v27.0`.

Instagram Reel:

1. `GET https://graph.facebook.com/{version}/{ig-id}/content_publishing_limit`
2. `POST https://graph.facebook.com/{version}/{ig-id}/media` with `media_type=REELS`, `video_url`,
   `caption`, `share_to_feed`, optional `cover_url`, optional `trial_params={"graduation_strategy":"..."}`
3. `GET https://graph.facebook.com/{version}/{container-id}?fields=status_code` until `FINISHED`
   (other values: `IN_PROGRESS`, `PUBLISHED`, `ERROR`, `EXPIRED`)
4. `POST https://graph.facebook.com/{version}/{ig-id}/media_publish` with `creation_id`

Facebook Page Reel:

1. `POST https://graph.facebook.com/{version}/{page-id}/video_reels` with `upload_phase=start`,
   returns `video_id`
2. `POST https://rupload.facebook.com/video-upload/{version}/{video-id}` with headers
   `Authorization: OAuth {page credential}` and `file_url: {public video URL}`, returns `{"success": true}`
3. `GET https://graph.facebook.com/{version}/{video-id}?fields=status` until the upload phase is complete
4. `POST https://graph.facebook.com/{version}/{page-id}/video_reels` with `upload_phase=finish`,
   `video_id`, `video_state=PUBLISHED`, `description`
5. `GET https://graph.facebook.com/{version}/{video-id}?fields=status` until the publishing phase is complete

Read-only calls used for the guards: `GET /me?fields=id,name,instagram_business_account{id,username}`,
`GET /{ig-id}/media?fields=caption,timestamp,permalink,media_product_type`,
`GET /{page-id}/video_reels?fields=id,description,created_time`.

## Unverified

- **No live call has ever been made.** Every test uses a mocked `fetch`. The first real run is the proof.
- **`GET /{page-id}/video_reels` and its fields** (`description`, `created_time`) are not spelled out on
  the pages fetched. The Facebook cap and duplicate check depend on that read. If Graph refuses it, the
  Facebook side is skipped and nothing posts there.
- **Form-encoded bodies.** Meta's Facebook Reels examples send JSON. This script sends form fields with
  the credential in the body, as the carousel lane does. Graph normally takes both; not proven for
  `video_reels`.
- **Status wording.** Meta's page shows both `complete` and `completed` for a phase. Both are accepted.
- **Facebook confirmation.** If the publishing phase has not completed within 5 minutes of the publish
  call, the run prints `still processing (UNVERIFIED - check the Page)` and does not claim it published.
- **Whether the current credential carries the permissions above** was not inspected.
- **GitHub Pages as a video host.** That Pages serves `.mp4` as `video/mp4` to Meta's fetchers at reel
  sizes is not tested. `video_url` on another host is the fallback, and that host must allow Meta's crawler.
- **Trial reels and `cover_url`** are passed as documented and have not been tried on this account.
- **Licensed music** cannot be added through the API. The audio is whatever is in the file.
- **These tests are not in CI.** `ci.yml` is a locked path. The step to add is in the pull request.
