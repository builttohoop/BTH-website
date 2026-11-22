# Meta insights reader

`social/meta-insights.mjs` reads how the carousels posted by `social/meta-publish.mjs` performed on
Instagram and the Facebook Page. It is read-only: every request is a `GET`. It never posts, edits,
deletes or comments, and it writes no file.

## Run it

```sh
node social/meta-insights.mjs --dry-run
node social/meta-insights.mjs
node social/meta-insights.mjs --format md
node social/meta-insights.mjs --limit 14 --platform instagram --format md
node --test social/meta-insights.test.mjs
```

- `--dry-run` sends nothing and needs no token. It prints each request it would make, with the
  token shown as `[REDACTED]`.
- A real run needs the Page token in the `META_PAGE_TOKEN` environment variable, the same one the
  publisher uses. The token travels only in the `Authorization` header. It is never put in a URL,
  never printed, and never written to disk. Do not paste it into a chat or a file.
- `--limit` is the number of most recent posts per platform (default 30, maximum 100).
- `--format json` (default) prints one JSON report to stdout. `--format md` prints a table.
- Notes and errors go to stderr, so `> report.json 2> report.err` keeps the JSON clean.
- Optional: `META_GRAPH_VERSION` (default `v23.0`) and `QUEUE_DIR` (default `social/queue`).

Exit codes: `0` report printed, `1` a platform or the token failed, `3` bad arguments,
`5` no token (printed as `UNVERIFIED`).

## What the columns mean

| Column | Instagram | Facebook Page |
|---|---|---|
| Views | `views` | `post_media_view` |
| Reach | `reach` | `post_total_media_view_unique` |
| Likes | `likes` (falls back to the media `like_count`) | `post_reactions_like_total` |
| Comments | `comments` (falls back to `comments_count`) | n/a (no documented count) |
| Saves | `saved` | n/a (no such Page metric) |
| Shares | `shares` | the post's `shares.count` |
| Profile visits | `profile_visits` | n/a |
| Link clicks | `profile_activity`, action `bio_link_clicked` | `post_clicks_by_type`, key `link clicks` |

The JSON also carries `clicks_all` (Facebook `post_clicks`, every click type), `permalink`,
`post_id`, `queue_id` and `match`.

- `UNVERIFIED` means Graph refused that metric for that post. The run carries on, and the reason is
  listed under `notes`. A metric refused three posts in a row is not requested again in that run.
- `n/a` means the platform does not offer it, or Meta has no data yet. Insights can lag 48 hours.
- Metric names were checked against Meta's docs on 2026-11-21; the sources are in the comment at the
  top of `meta-insights.mjs`. `impressions`, `plays`, `video_views`, `post_impressions` and
  `post_impressions_unique` are gone and are not requested.
- Meta says Page insights exist only for Pages with 100 or more likes. Below that, expect the
  Facebook insight cells to read `UNVERIFIED` or `n/a`.

## How a post is matched to its set

Each live post is matched to a `social/queue/<id>/post.json` folder by the first line of its
caption, normalized the same way the publisher's duplicate check does it. A second, looser key
ignores the Reset link and the words "link in bio", so the Facebook copy of a caption still matches.
The `set` value is the `set-NNN` part of the folder name. A post made by hand shows as `unmapped`.
Two folders with the same first line show as `ambiguous` rather than a guess.

## Token permissions

Page access token with: `pages_show_list`, `pages_read_engagement`, `read_insights`,
`instagram_basic`, `instagram_manage_insights`. Meta adds `ads_read` or `ads_management` when the
Page role comes through Business Manager. No publish permission is used.

## Feeding the carousel performance reports

The content team's hook learnings live in `BTH/04-content/carousels/` (`learnings.json`,
`HOOK-DOCTRINE.md`) and are keyed by set number, the same `set-NNN` this report prints. One way to
use it each week:

1. Run `--format md` and save the table next to that week's build notes, for example
   `BTH/04-content/carousels/perf/meta-YYYY-MM-DD.md`.
2. Sort by saves and shares per reach, not raw views: reach depends on the day, saves and shares
   show which hook shape earned the stop.
3. Compare the same set's TikTok result before calling a hook shape a winner. One platform is one
   reading.
4. Leads still come from D1, never from this table. Link clicks here are taps, not signups.
