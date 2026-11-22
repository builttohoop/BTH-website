// Read-only performance reader for the carousels social/meta-publish.mjs posts.
// It only sends GET requests. It never publishes, edits, deletes or comments.
//
// Metric names were checked against Meta's official docs on 2026-11-21:
//
// Instagram media insights - GET /{ig-media-id}/insights?metric=...
//   https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights
//   FEED media (a carousel album is FEED media): views, reach, likes, comments, saved, shares,
//   profile_visits, profile_activity (breakdown=action_type; "bio_link_clicked" is the link tap).
//   REELS media: views, reach, likes, comments, saved, shares (no profile metrics).
//   Left out on purpose: impressions ("For media created after July 2, 2024, this metric is
//   deprecated"); plays and video_views (no longer on the page). The period is always lifetime.
//   "Insights data is not available for any media within an Instagram Media album" - so this
//   reads the album itself, never its child slides. Data can lag up to 48 hours.
//   like_count and comments_count on the media object are the fallback for likes and comments:
//   https://developers.facebook.com/docs/instagram-platform/reference/instagram-media
//
// Facebook Page post insights - GET /{page-post-id}/insights?metric=...
//   https://developers.facebook.com/docs/graph-api/reference/insights
//   https://developers.facebook.com/docs/platforminsights/page/deprecated-metrics
//   post_media_view (replaced post_impressions, removed 2025-11-15), post_total_media_view_unique
//   (replaced post_impressions_unique, removed 2025-06-15), post_reactions_like_total, post_clicks,
//   post_clicks_by_type. Shares come from the post's own `shares.count` field:
//   https://developers.facebook.com/docs/graph-api/reference/page-post/
//   Not confirmed on those pages, so NOT requested: a Page post comment count (the comments edge
//   documents no total), saves (no such Page metric), and the key names inside
//   post_clicks_by_type ("link clicks" is read if present, otherwise the cell stays empty).
//   Meta says Page insights exist only for Pages with 100 or more likes.
//
// Any metric Graph refuses is shown as UNVERIFIED for that cell; the run carries on.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { etDate, normalizeFirstLine, redact } from './meta-publish.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLATFORMS = ['instagram', 'facebook'];
export const UNVERIFIED = 'UNVERIFIED';

export const IG_FEED_METRICS = ['views', 'reach', 'likes', 'comments', 'saved', 'shares', 'profile_visits'];
export const IG_REELS_METRICS = ['views', 'reach', 'likes', 'comments', 'saved', 'shares'];
export const IG_PROFILE_METRIC = 'profile_activity';
export const FB_POST_METRICS = ['post_media_view', 'post_total_media_view_unique', 'post_reactions_like_total', 'post_clicks', 'post_clicks_by_type'];

const IG_LIST_FIELDS = 'id,caption,timestamp,permalink,media_type,media_product_type,like_count,comments_count';
const FB_LIST_FIELDS = 'id,message,created_time,permalink_url,shares';
const PAGE_FIELDS = 'id,name,instagram_business_account{id,username}';
const COLUMNS = ['views', 'reach', 'likes', 'comments', 'saves', 'shares', 'profile_visits', 'link_clicks'];

// The publisher's duplicate key is the normalized first caption line. The Facebook caption can
// carry the Reset URL where Instagram says "link in bio", so a second, looser key drops both.
export function captionKeys(text) {
  const first = String(text ?? '').split(/\r?\n/).find(line => line.trim()) ?? '';
  const loose = first.replace(/https?:\/\/\S+/gi, ' ').replace(/\blink in bio\b/gi, ' ');
  return [...new Set([normalizeFirstLine(first), normalizeFirstLine(loose)].filter(Boolean))];
}

function readInside(dir, name) {
  if (typeof name !== 'string' || !name || path.basename(name) !== name) return '';
  try { return fs.readFileSync(path.join(dir, name), 'utf8'); } catch { return ''; }
}

export function loadSetIndex(queueDir = path.join(ROOT, 'social/queue')) {
  if (!fs.existsSync(queueDir)) return [];
  const entries = [];
  for (const entry of fs.readdirSync(queueDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(queueDir, entry.name);
    let post;
    try { post = JSON.parse(fs.readFileSync(path.join(dir, 'post.json'), 'utf8')); } catch { continue; }
    const keys = new Set();
    for (const file of [post.caption_file, post.caption_fb_file]) {
      for (const key of captionKeys(readInside(dir, file))) keys.add(key);
    }
    if (!keys.size) continue;
    entries.push({ queue_id: entry.name, set: entry.name.match(/set-\d+/)?.[0] ?? entry.name,
      title: typeof post.title === 'string' ? post.title : '', keys: [...keys] });
  }
  return entries;
}

// Strict key first, loose key second. Two sets sharing a key is reported, never guessed.
export function mapToSet(text, index) {
  for (const key of captionKeys(text)) {
    const hits = index.filter(entry => entry.keys.includes(key));
    if (hits.length === 1) return { set: hits[0].set, queue_id: hits[0].queue_id, match: 'caption-first-line' };
    if (hits.length > 1) return { set: null, queue_id: null, match: 'ambiguous' };
  }
  return { set: null, queue_id: null, match: 'unmapped' };
}

function parseArgs(argv) {
  const options = { limit: 30, format: 'json', platform: 'both', dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = argv[i + 1];
    if (arg === '--dry-run') options.dryRun = true;
    else if (['--limit', '--format', '--platform'].includes(arg) && value && !value.startsWith('--')) { options[arg.slice(2)] = value; i++; }
    else throw new Error(`invalid argument: ${arg}`);
  }
  options.limit = Number(options.limit);
  if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 100) throw new Error('--limit must be a whole number from 1 to 100');
  if (!['json', 'md'].includes(options.format)) throw new Error('--format must be json or md');
  if (!['both', ...PLATFORMS].includes(options.platform)) throw new Error('--platform must be both, instagram or facebook');
  return options;
}

function metricValue(item) {
  if (!item) return null;
  const value = item.values?.[0]?.value ?? item.total_value?.value;
  return value === undefined ? null : value;
}

function count(value) { return typeof value === 'number' && Number.isFinite(value) ? value : null; }

// One request for every metric. If Graph refuses it, each metric is asked for alone, so a single
// renamed or unsupported metric costs one cell, not the row. A metric that fails three posts in a
// row is no longer requested.
async function readMetrics(graph, id, metrics, state, note, extra = {}) {
  const out = {};
  const active = metrics.filter(metric => !state.dead.has(metric));
  for (const metric of metrics) if (!active.includes(metric)) out[metric] = UNVERIFIED;
  if (!active.length) return out;
  const fail = (metric, error) => {
    out[metric] = UNVERIFIED;
    note(`${metric}: ${error.message}`);
    state.fails.set(metric, (state.fails.get(metric) ?? 0) + 1);
    if (state.fails.get(metric) >= 3) { state.dead.add(metric); note(`${metric}: refused 3 times in a row, not requested again this run`); }
  };
  const take = (data, wanted) => {
    for (const metric of wanted) {
      out[metric] = (Array.isArray(data.data) ? data.data : []).find(item => item?.name === metric) ?? null;
      state.fails.set(metric, 0);
    }
  };
  try { take(await graph(`${id}/insights`, { metric: active.join(','), ...extra }), active); return out; }
  catch (error) {
    if (error.fatal) throw error;
    if (active.length === 1) { fail(active[0], error); return out; }
  }
  for (const metric of active) {
    try { take(await graph(`${id}/insights`, { metric, ...extra }), [metric]); }
    catch (error) { if (error.fatal) throw error; fail(metric, error); }
  }
  return out;
}

function pick(metrics, name, fallback = null) {
  const item = metrics[name];
  if (item === UNVERIFIED) return count(fallback) ?? UNVERIFIED;
  return count(metricValue(item)) ?? count(fallback);
}

function bioLinkClicks(item) {
  if (item === UNVERIFIED) return UNVERIFIED;
  if (!item) return null;
  const results = item.total_value?.breakdowns?.[0]?.results;
  if (!Array.isArray(results)) return null;
  const hit = results.find(result => String(result?.dimension_values?.[0]).toLowerCase() === 'bio_link_clicked');
  return count(hit?.value) ?? 0;
}

function linkClicks(item) {
  if (item === UNVERIFIED) return UNVERIFIED;
  const value = metricValue(item);
  return value && typeof value === 'object' ? count(value['link clicks']) : null;
}

function cell(value) { return value === null || value === undefined ? 'n/a' : String(value); }

export function toMarkdown(report) {
  const lines = [
    `# Meta carousel performance (last ${report.limit} per platform)`,
    '',
    `Generated ${report.generated_at}, Graph ${report.graph_version}. Dates are America/New_York. Insights can lag up to 48 hours.`,
    'UNVERIFIED = Graph refused that metric. n/a = not offered for that platform or no data yet.',
    '',
    '| Set | Date | Platform | Views | Reach | Likes | Comments | Saves | Shares | Profile visits | Link clicks |',
    '|---|---|---|---|---|---|---|---|---|---|---|',
  ];
  for (const row of report.posts) {
    lines.push(`| ${[row.set ?? row.match, row.date, row.platform, ...COLUMNS.map(column => cell(row[column]))].join(' | ')} |`);
  }
  if (!report.posts.length) lines.push('| (no posts read) | | | | | | | | | | |');
  if (report.notes.length) lines.push('', 'Notes:', ...report.notes.map(line => `- ${line}`));
  return lines.join('\n');
}

export function dryRunPlan({ version, limit, platforms }) {
  const base = `https://graph.facebook.com/${version}`;
  const auth = 'header Authorization: Bearer [REDACTED]';
  const query = fields => new URLSearchParams(fields).toString();
  const lines = [`GET ${base}/me?${query({ fields: PAGE_FIELDS })}  (${auth})`];
  let total = 1;
  if (platforms.includes('instagram')) {
    lines.push(`GET ${base}/{ig-id}/media?${query({ fields: IG_LIST_FIELDS, limit: String(limit) })}  (${auth})`);
    lines.push(`GET ${base}/{ig-media-id}/insights?${query({ metric: IG_FEED_METRICS.join(',') })}  (${auth}; up to ${limit} times)`);
    lines.push(`GET ${base}/{ig-media-id}/insights?${query({ metric: IG_PROFILE_METRIC, breakdown: 'action_type' })}  (${auth}; up to ${limit} times)`);
    total += 1 + limit * 2;
  }
  if (platforms.includes('facebook')) {
    lines.push(`GET ${base}/{page-id}/posts?${query({ fields: FB_LIST_FIELDS, limit: String(limit) })}  (${auth})`);
    lines.push(`GET ${base}/{page-post-id}/insights?${query({ metric: FB_POST_METRICS.join(',') })}  (${auth}; up to ${limit} times)`);
    total += 1 + limit;
  }
  lines.push(`requests when every metric is accepted: ${total}. A refused request is retried one metric at a time.`);
  return lines;
}

export async function run({ argv = [], env = process.env, fetchImpl = globalThis.fetch,
  now = () => new Date(), out = console.log, err = console.error } = {}) {
  const token = env.META_PAGE_TOKEN;
  const clean = message => redact(message, token);
  const print = message => out(clean(message));
  const warn = message => err(clean(message));
  let options;
  try { options = parseArgs(argv); } catch (error) { warn(`usage: ${error.message}`); return 3; }
  const version = env.META_GRAPH_VERSION || 'v23.0';
  if (!/^v\d+\.\d+$/.test(version)) { warn('usage: invalid META_GRAPH_VERSION'); return 3; }
  const platforms = options.platform === 'both' ? PLATFORMS : [options.platform];
  if (options.dryRun) {
    print(`DRY RUN: nothing was sent. META_PAGE_TOKEN is ${token ? 'set' : 'not set'}; it is never printed.`);
    for (const line of dryRunPlan({ version, limit: options.limit, platforms })) print(line);
    return 0;
  }
  if (!token) { warn('UNVERIFIED: META_PAGE_TOKEN not set'); return 5; }

  const graph = async (endpoint, fields) => {
    const url = new URL(`https://graph.facebook.com/${version}/${endpoint}`);
    url.search = new URLSearchParams(fields);
    let response;
    // The message never carries the request URL, and the token only ever travels in the header.
    try { response = await fetchImpl(url.href, { method: 'GET', headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(30000) }); }
    catch (error) { throw new Error(`Graph request failed before a response (${error?.name ?? 'network error'})`); }
    let data;
    try { data = await response.json(); } catch { data = {}; }
    if (response.ok && data && !data.error) return data;
    const detail = data?.error ?? {};
    const failure = new Error(`Graph HTTP ${response.status} code=${detail.code ?? 'unknown'} message=${detail.message ?? 'invalid response'} fbtrace_id=${detail.fbtrace_id ?? 'unknown'}`);
    failure.fatal = Number(detail.code) === 190 || response.status === 401;
    throw failure;
  };

  const notes = [];
  const noteFor = platform => message => {
    const line = clean(`${platform}: ${message}`);
    if (!notes.includes(line)) notes.push(line);
  };
  const posts = [];
  let failed = false;
  try {
    const page = await graph('me', { fields: PAGE_FIELDS });
    if (!page.id) throw new Error('Graph response missing the Page id');
    const index = loadSetIndex(path.resolve(ROOT, env.QUEUE_DIR || 'social/queue'));
    for (const platform of platforms) {
      const note = noteFor(platform);
      const state = { dead: new Set(), fails: new Map() };
      try {
        if (platform === 'instagram') {
          const igId = page.instagram_business_account?.id;
          if (!igId) throw new Error('no Instagram professional account linked to the Facebook Page');
          const list = await graph(`${igId}/media`, { fields: IG_LIST_FIELDS, limit: String(options.limit) });
          if (!Array.isArray(list.data)) throw new Error('Graph response missing the media list');
          for (const media of list.data.slice(0, options.limit)) {
            const reel = media.media_product_type === 'REELS';
            const metrics = await readMetrics(graph, media.id, reel ? IG_REELS_METRICS : IG_FEED_METRICS, state, note);
            const profile = reel ? {} : await readMetrics(graph, media.id, [IG_PROFILE_METRIC], state, note, { breakdown: 'action_type' });
            posts.push({ ...mapToSet(media.caption, index), platform, date: media.timestamp ? etDate(media.timestamp) : null,
              post_id: media.id, permalink: media.permalink ?? null, media_type: media.media_type ?? null,
              views: pick(metrics, 'views'), reach: pick(metrics, 'reach'),
              likes: pick(metrics, 'likes', media.like_count), comments: pick(metrics, 'comments', media.comments_count),
              saves: pick(metrics, 'saved'), shares: pick(metrics, 'shares'),
              profile_visits: reel ? null : pick(metrics, 'profile_visits'),
              link_clicks: reel ? null : bioLinkClicks(profile[IG_PROFILE_METRIC]), clicks_all: null });
          }
        } else {
          const list = await graph(`${page.id}/posts`, { fields: FB_LIST_FIELDS, limit: String(options.limit) });
          if (!Array.isArray(list.data)) throw new Error('Graph response missing the post list');
          for (const item of list.data.slice(0, options.limit)) {
            const metrics = await readMetrics(graph, item.id, FB_POST_METRICS, state, note);
            posts.push({ ...mapToSet(item.message, index), platform, date: item.created_time ? etDate(item.created_time) : null,
              post_id: item.id, permalink: item.permalink_url ?? null, media_type: null,
              views: pick(metrics, 'post_media_view'), reach: pick(metrics, 'post_total_media_view_unique'),
              likes: pick(metrics, 'post_reactions_like_total'), comments: null, saves: null,
              shares: count(item.shares?.count) ?? 0, profile_visits: null,
              link_clicks: linkClicks(metrics.post_clicks_by_type), clicks_all: pick(metrics, 'post_clicks') });
          }
        }
      } catch (error) {
        if (error.fatal) throw error;
        failed = true;
        note(`failed: ${error.message}`);
      }
    }
  } catch (error) {
    warn(`failed: ${error.message}`);
    return 1;
  }
  posts.sort((a, b) => String(b.date).localeCompare(String(a.date)) || a.platform.localeCompare(b.platform));
  const unverified = posts.reduce((sum, row) => sum + COLUMNS.filter(column => row[column] === UNVERIFIED).length, 0);
  const report = { generated_at: new Date(typeof now === 'function' ? now() : now).toISOString(), graph_version: version,
    limit: options.limit, platforms, count: posts.length, unverified_cells: unverified, posts, notes };
  print(options.format === 'md' ? toMarkdown(report) : JSON.stringify(report, null, 2));
  for (const line of notes) warn(line);
  if (unverified) warn(`UNVERIFIED cells: ${unverified}`);
  return failed ? 1 : 0;
}

async function main() { process.exitCode = await run({ argv: process.argv.slice(2) }); }
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
