// Reels lane for the Meta autoposter: one short vertical video, published as an Instagram Reel
// and as a Facebook Page Reel. Sits beside social/meta-publish.mjs (the photo-carousel lane) and
// imports three helpers from it; it does not change it.
//
// OFF BY DEFAULT. The default mode is "plan": it prints what it would post and sends no Graph
// write. A real post needs BOTH the explicit flag `--mode publish` AND META_AUTOPOST=on in the
// environment. No workflow runs this file yet (see social/REELS.md).
//
// Endpoints, checked against Meta's official docs on 2026-11-21:
//
// Instagram Reel - https://developers.facebook.com/docs/instagram-platform/content-publishing
//   and https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media
//   POST https://graph.facebook.com/{version}/{ig-id}/media
//        media_type=REELS, video_url (public), caption, share_to_feed, cover_url, trial_params
//   GET  https://graph.facebook.com/{version}/{container-id}?fields=status_code
//        EXPIRED | ERROR | FINISHED | IN_PROGRESS | PUBLISHED; Meta: once a minute, 5 minutes at most
//   POST https://graph.facebook.com/{version}/{ig-id}/media_publish   creation_id
//   GET  https://graph.facebook.com/{version}/{ig-id}/content_publishing_limit
//
// Facebook Page Reel - https://developers.facebook.com/docs/video-api/guides/reels-publishing
//   POST https://graph.facebook.com/{version}/{page-id}/video_reels   upload_phase=start -> video_id
//   POST https://rupload.facebook.com/video-upload/{version}/{video-id}
//        headers  Authorization: OAuth {page-token}   file_url: {public video URL}
//   GET  https://graph.facebook.com/{version}/{video-id}?fields=status
//   POST https://graph.facebook.com/{version}/{page-id}/video_reels
//        upload_phase=finish, video_id, video_state=PUBLISHED, description
//
// The token goes only to graph.facebook.com and rupload.facebook.com, never in a URL, and is
// redacted from every printed line.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { etDate, normalizeFirstLine, redact } from './meta-publish.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PLATFORMS = ['instagram', 'facebook'];
export const QUEUE_REL = 'social/reels';
const FB_URL = 'https://built-to-hoop.com/reset.html?utm_source=facebook&utm_medium=social&utm_campaign=autopost_reel';
const TRIAL_STRATEGIES = ['MANUAL', 'SS_PERFORMANCE'];

export const LIMITS = Object.freeze({
  captionChars: 2200, hashtags: 30, mentions: 20,
  videoBytes: 100 * 1024 * 1024, // GitHub's per-file limit; Instagram's own ceiling is 300 MB
  urlRetries: 10, urlRetryMs: 30000,
  igPolls: 5, igPollMs: 60000,
  fbPolls: 20, fbPollMs: 15000,
});

export function buildFbReelCaption(igCaption) {
  if (/\blink in bio\b/i.test(igCaption)) return igCaption.replace(/\blink in bio\b/gi, FB_URL);
  return `${igCaption.trimEnd()}\n\n${FB_URL}`;
}

function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

function localFile(dir, name) {
  if (typeof name !== 'string' || !name || path.basename(name) !== name || /[\\/]/.test(name)) {
    throw new Error('file names must stay inside the reel folder');
  }
  const filename = path.join(dir, name);
  if (!fs.existsSync(filename) || !fs.statSync(filename).isFile()) throw new Error(`not a file: ${name}`);
  if (path.dirname(fs.realpathSync(filename)) !== fs.realpathSync(dir)) throw new Error(`file outside reel folder: ${name}`);
  return filename;
}

function publicHttps(value, label) {
  let url;
  try { url = new URL(value); } catch { throw new Error(`${label} is not a URL`); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error(`${label} must be a plain public HTTPS URL without credentials, query or fragment`);
  }
  return url;
}

// Returns a validated record (captions included), or { valid: false, reason } without throwing.
export function validateReel(reel, dir) {
  try {
    if (!reel || reel.approved !== true) throw new Error('not approved');
    if (typeof reel.id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(reel.id) || path.basename(dir) !== reel.id) {
      throw new Error('id must match the folder and contain only letters, numbers, underscores or hyphens');
    }
    if (!validDate(reel.publish_on)) throw new Error('invalid publish_on date');
    if (!Array.isArray(reel.platforms) || !reel.platforms.length || reel.platforms.some(p => !PLATFORMS.includes(p))) {
      throw new Error('invalid platforms');
    }
    const hasFile = reel.video !== undefined;
    const hasUrl = reel.video_url !== undefined;
    if (hasFile === hasUrl) throw new Error('set exactly one of video (a file in the folder) or video_url');
    if (hasFile) {
      if (typeof reel.video !== 'string' || !/\.(mp4|mov)$/i.test(reel.video)) throw new Error('video must end in .mp4 or .mov');
      const size = fs.statSync(localFile(dir, reel.video)).size;
      if (!size) throw new Error('video file is empty');
      if (size > LIMITS.videoBytes) throw new Error('video file is over 100 MB; host it elsewhere and use video_url');
    } else {
      const url = publicHttps(reel.video_url, 'video_url');
      if (!/\.(mp4|mov)$/i.test(url.pathname)) throw new Error('video_url must end in .mp4 or .mov');
    }
    if (reel.cover !== undefined) {
      if (typeof reel.cover !== 'string' || !/\.jpe?g$/i.test(reel.cover)) throw new Error('cover must end in .jpg');
      localFile(dir, reel.cover);
    }
    if (reel.share_to_feed !== undefined && typeof reel.share_to_feed !== 'boolean') throw new Error('share_to_feed must be true or false');
    if (reel.trial !== undefined && !TRIAL_STRATEGIES.includes(reel.trial)) throw new Error('trial must be MANUAL or SS_PERFORMANCE');
    const caption = fs.readFileSync(localFile(dir, reel.caption_file), 'utf8');
    if (!caption.trim()) throw new Error('empty caption');
    if ([...caption].length > LIMITS.captionChars) throw new Error('caption exceeds 2200 characters');
    if ((caption.match(/#[\p{L}\p{N}_]+/gu) ?? []).length > LIMITS.hashtags) throw new Error('caption exceeds 30 hashtags');
    if ((caption.match(/(^|[^\p{L}\p{N}_.])@[\p{L}\p{N}_.]+/gu) ?? []).length > LIMITS.mentions) throw new Error('caption exceeds 20 mentions');
    const captionFb = reel.caption_fb_file
      ? fs.readFileSync(localFile(dir, reel.caption_fb_file), 'utf8') : buildFbReelCaption(caption);
    if (!captionFb.trim()) throw new Error('empty Facebook caption');
    if (!normalizeFirstLine(caption) || !normalizeFirstLine(captionFb)) throw new Error('caption first line has no letters or numbers');
    return { ...reel, dir, caption, captionFb, valid: true };
  } catch (error) {
    return { ...reel, dir, valid: false, reason: error.message };
  }
}

export function loadReelQueue(queueDir = path.join(ROOT, QUEUE_REL), log = () => {}) {
  if (!fs.existsSync(queueDir)) return [];
  return fs.readdirSync(queueDir, { withFileTypes: true }).filter(e => e.isDirectory()).map(entry => {
    const dir = path.join(queueDir, entry.name);
    let record;
    try { record = validateReel(JSON.parse(fs.readFileSync(path.join(dir, 'reel.json'), 'utf8')), dir); }
    catch (error) { record = { id: entry.name, dir, valid: false, reason: error.message }; }
    if (!record.valid) log(`invalid: ${entry.name}: ${record.reason}`);
    return record;
  });
}

function captionFor(reel, platform) { return platform === 'facebook' ? reel.captionFb : reel.caption; }

function wasPosted(reel, platform, live) {
  const first = normalizeFirstLine(captionFor(reel, platform));
  return (live[platform] ?? []).some(item => normalizeFirstLine(item.caption ?? item.description ?? '') === first);
}

export function pickDueReel(reels, today, live, platforms = PLATFORMS, bypassDate = false) {
  return reels.filter(reel => reel.valid !== false && (bypassDate || reel.publish_on <= today))
    .sort((a, b) => a.publish_on.localeCompare(b.publish_on) || a.id.localeCompare(b.id))
    .find(reel => platforms.some(p => reel.platforms.includes(p) && !wasPosted(reel, p, live)));
}

function parseArgs(argv) {
  const options = { mode: 'plan', platform: 'both' };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (['--mode', '--post', '--platform'].includes(arg) && argv[i + 1] && !argv[i + 1].startsWith('--')) options[arg.slice(2)] = argv[++i];
    else throw new Error(`invalid argument: ${arg}`);
  }
  if (!['check', 'plan', 'publish'].includes(options.mode)) throw new Error('--mode must be check, plan or publish');
  if (!['both', ...PLATFORMS].includes(options.platform)) throw new Error('--platform must be both, instagram or facebook');
  return options;
}

const phaseDone = value => ['complete', 'completed'].includes(String(value ?? '').toLowerCase());

// Throws on any state Meta reports as failed, so a broken upload is never "finished".
export function assertFbStatusHealthy(status) {
  const overall = String(status?.video_status ?? '').toLowerCase();
  if (['error', 'expired', 'upload_failed'].includes(overall)) throw new Error(`Facebook video ${overall}`);
  for (const name of ['uploading_phase', 'processing_phase', 'publishing_phase']) {
    const phase = status?.[name];
    if (String(phase?.status ?? '').toLowerCase() === 'error' || String(phase?.publish_status ?? '').toLowerCase() === 'error') {
      const detail = phase?.error?.message ?? phase?.errors?.[0]?.message ?? 'no detail';
      throw new Error(`Facebook ${name} error: ${detail}`);
    }
  }
}

export async function run({ argv = [], env = process.env, fetchImpl = globalThis.fetch,
  now = () => new Date(), log = console.log, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)) } = {}) {
  const token = env.META_PAGE_TOKEN || '';
  const print = message => log(redact(message, token));
  try {
    const options = parseArgs(argv);
    const armed = env.META_AUTOPOST === 'on';
    const publishing = options.mode === 'publish' && armed;
    const refused = options.mode === 'publish' && !armed;
    if (refused) print('REFUSED: --mode publish needs META_AUTOPOST=on. Plan only; nothing will be posted.');
    if (!token && (publishing || options.mode === 'check')) { print('UNVERIFIED: META_PAGE_TOKEN not set'); return 5; }

    const version = env.META_GRAPH_VERSION || 'v23.0';
    if (!/^v\d+\.\d+$/.test(version)) throw new Error('invalid META_GRAPH_VERSION');
    const graphBase = `https://graph.facebook.com/${version}`;
    let writes = 0;

    // retry=true only for calls that are safe to repeat (nothing is public yet).
    const graph = async (endpoint, fields, method = 'GET', retry = false) => {
      if (method !== 'GET' && !publishing) throw new Error('internal: Graph write attempted outside publish mode');
      const url = new URL(`${graphBase}/${endpoint}`);
      if (method === 'GET') url.search = new URLSearchParams(fields);
      for (let attempt = 0; ; attempt++) {
        const init = { method, signal: AbortSignal.timeout(30000) };
        if (method === 'GET') init.headers = { Authorization: `Bearer ${token}` };
        else {
          init.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
          const body = new URLSearchParams(fields);
          body.set('access_token', token);
          init.body = body.toString();
          writes++;
        }
        const response = await fetchImpl(url.href, init);
        let data;
        try { data = await response.json(); } catch { data = {}; }
        if (response.ok && !data.error) return data;
        const error = data.error ?? {};
        const transient = response.status >= 500 || error.is_transient === true || [1, 2, 4, 17, 341].includes(Number(error.code));
        if (retry && transient && attempt < 3) { await sleep([5000, 15000, 45000][attempt]); continue; }
        throw new Error(`Graph HTTP ${response.status} code=${error.code ?? 'unknown'} message=${error.message ?? 'invalid response'} fbtrace_id=${error.fbtrace_id ?? 'unknown'}`);
      }
    };
    const requireId = (data, key = 'id') => {
      if (!data[key] || !/^[A-Za-z0-9_]+$/.test(String(data[key]))) throw new Error(`Graph response missing ${key}`);
      return String(data[key]);
    };

    const requested = options.platform === 'both' ? PLATFORMS : [options.platform];
    const today = etDate(typeof now === 'function' ? now() : now);
    const failures = new Set();
    const live = {};
    let eligible = requested;
    let pageId;
    let igId;

    if (token) {
      const page = await graph('me', { fields: 'id,name,instagram_business_account{id,username}' });
      pageId = requireId(page);
      igId = page.instagram_business_account?.id;
      if (!igId) throw new Error('No Instagram professional account linked to the Facebook Page');
      if (options.mode === 'check') {
        print(`page: ${page.name} (${pageId})`);
        print(`instagram: ${page.instagram_business_account.username} (${igId})`);
        print(JSON.stringify(await graph(`${igId}/content_publishing_limit`, { fields: 'config,quota_usage' })));
        return 0;
      }
      eligible = [];
      for (const platform of requested) {
        try {
          const result = platform === 'instagram'
            ? await graph(`${igId}/media`, { fields: 'caption,timestamp,permalink,media_product_type', limit: '50' })
            : await graph(`${pageId}/video_reels`, { fields: 'id,description,created_time', limit: '50' });
          if (!Array.isArray(result.data) || result.data.some(item => !item || typeof item !== 'object')) {
            throw new Error('Graph response missing live reel list');
          }
          live[platform] = platform === 'instagram'
            ? result.data.filter(item => item.media_product_type === 'REELS') : result.data;
          const capped = live[platform].some(item => {
            const stamp = item.timestamp ?? item.created_time;
            if (!stamp || !Number.isFinite(Date.parse(stamp))) throw new Error(`invalid live timestamp on ${platform}`);
            return etDate(stamp) === today;
          });
          if (capped) print(`cap: a reel already went out today on ${platform}`);
          else eligible.push(platform);
        } catch (error) { failures.add(platform); print(`${platform}: failed: ${error.message}`); }
      }
    } else {
      print('plan: no META_PAGE_TOKEN, so the duplicate check and the daily cap were skipped (UNVERIFIED).');
    }

    const done = () => (failures.size ? 1 : refused ? 4 : 0);
    const reels = loadReelQueue(path.resolve(ROOT, env.REELS_QUEUE_DIR || QUEUE_REL), print).filter(reel => reel.valid);
    const reel = options.post
      ? reels.find(r => r.id === options.post)
      : pickDueReel(reels, today, live, eligible);
    if (options.post && !reel) throw new Error(`reel missing or invalid: ${options.post}`);
    if (!reel) { print('nothing due'); return done(); }
    for (const p of eligible.filter(p => reel.platforms.includes(p) && wasPosted(reel, p, live))) print(`${p}: already posted ${reel.id}`);
    const platforms = eligible.filter(p => reel.platforms.includes(p) && !wasPosted(reel, p, live));
    if (!platforms.length) { print('nothing due'); return done(); }

    const site = publicHttps(env.SITE_BASE || 'https://built-to-hoop.com', 'SITE_BASE');
    const folderUrl = `${site.href.replace(/\/$/, '')}/${QUEUE_REL}/${encodeURIComponent(reel.id)}`;
    const videoUrl = reel.video ? `${folderUrl}/${encodeURIComponent(reel.video)}` : publicHttps(reel.video_url, 'video_url').href;
    const coverUrl = reel.cover ? `${folderUrl}/${encodeURIComponent(reel.cover)}` : null;

    const probe = async (url, typePattern) => {
      try {
        const response = await fetchImpl(url, { method: 'GET', signal: AbortSignal.timeout(30000) });
        const type = response.headers.get('content-type') ?? '';
        await response.body?.cancel();
        return { status: response.status, content_type: type, ok: response.status === 200 && typePattern.test(type) };
      } catch (error) { return { status: 0, content_type: '', ok: false, error: error.name }; }
    };
    const VIDEO_TYPE = /^video\/(mp4|quicktime)(?:\s*;|$)/i;
    const IMAGE_TYPE = /^image\/jpeg(?:\s*;|$)/i;

    if (!publishing) {
      const wouldCall = [];
      if (platforms.includes('instagram')) wouldCall.push(
        `POST ${graphBase}/{ig-id}/media (media_type=REELS)`,
        `GET ${graphBase}/{container-id}?fields=status_code (up to ${LIMITS.igPolls} checks, ${LIMITS.igPollMs / 1000}s apart)`,
        `POST ${graphBase}/{ig-id}/media_publish`);
      if (platforms.includes('facebook')) wouldCall.push(
        `POST ${graphBase}/{page-id}/video_reels (upload_phase=start)`,
        `POST https://rupload.facebook.com/video-upload/${version}/{video-id} (file_url header)`,
        `GET ${graphBase}/{video-id}?fields=status (up to ${LIMITS.fbPolls} checks, ${LIMITS.fbPollMs / 1000}s apart)`,
        `POST ${graphBase}/{page-id}/video_reels (upload_phase=finish, video_state=PUBLISHED)`);
      print(JSON.stringify({
        mode: 'plan', graph_writes: writes, id: reel.id, platforms, video_url: videoUrl,
        video_check: await probe(videoUrl, VIDEO_TYPE), cover_url: coverUrl,
        share_to_feed: reel.share_to_feed ?? true, trial: reel.trial ?? null,
        caption: reel.caption, caption_facebook: reel.captionFb, would_call: wouldCall,
      }, null, 2));
      return done();
    }

    // Publish mode from here. Nothing is written until the public files answer 200.
    for (const [url, pattern, label] of [[videoUrl, VIDEO_TYPE, 'video'], ...(coverUrl ? [[coverUrl, IMAGE_TYPE, 'cover']] : [])]) {
      let ready = false;
      for (let attempt = 0; attempt <= LIMITS.urlRetries && !ready; attempt++) {
        if (attempt) await sleep(LIMITS.urlRetryMs);
        ready = (await probe(url, pattern)).ok;
      }
      if (!ready) throw new Error(`${label} unavailable after retries (needs HTTP 200): ${url}`);
    }

    for (const platform of platforms) {
      try {
        if (platform === 'instagram') {
          const quota = await graph(`${igId}/content_publishing_limit`, { fields: 'config,quota_usage' });
          const row = quota.data?.[0] ?? quota;
          if (Number.isFinite(row?.quota_usage) && Number.isFinite(row?.config?.quota_total) && row.quota_usage >= row.config.quota_total) {
            throw new Error('Instagram publishing limit reached for the last 24 hours');
          }
          const fields = { media_type: 'REELS', video_url: videoUrl, caption: reel.caption, share_to_feed: String(reel.share_to_feed ?? true) };
          if (coverUrl) fields.cover_url = coverUrl;
          if (reel.trial) fields.trial_params = JSON.stringify({ graduation_strategy: reel.trial });
          const container = requireId(await graph(`${igId}/media`, fields, 'POST', true));
          let finished = false;
          for (let attempt = 0; attempt < LIMITS.igPolls && !finished; attempt++) {
            await sleep(LIMITS.igPollMs);
            const { status_code: status } = await graph(container, { fields: 'status_code' });
            if (['ERROR', 'EXPIRED'].includes(status)) throw new Error(`Instagram container ${status}`);
            finished = status === 'FINISHED';
          }
          if (!finished) throw new Error('Instagram container timed out; nothing was published');
          const mediaId = requireId(await graph(`${igId}/media_publish`, { creation_id: container }, 'POST'));
          let permalink = '';
          try { permalink = (await graph(mediaId, { fields: 'permalink' })).permalink ?? ''; } catch { /* published; the link is a nicety */ }
          print(`instagram: published reel ${permalink || mediaId}`);
        } else {
          const videoId = requireId(await graph(`${pageId}/video_reels`, { upload_phase: 'start' }, 'POST', true), 'video_id');
          if (!/^\d+$/.test(videoId)) throw new Error('Facebook returned an unexpected video_id');
          writes++;
          const upload = await fetchImpl(`https://rupload.facebook.com/video-upload/${version}/${videoId}`, {
            method: 'POST', headers: { Authorization: `OAuth ${token}`, file_url: videoUrl }, signal: AbortSignal.timeout(120000),
          });
          let uploaded;
          try { uploaded = await upload.json(); } catch { uploaded = {}; }
          if (!upload.ok || uploaded.success !== true) {
            throw new Error(`Facebook upload HTTP ${upload.status} message=${uploaded.error?.message ?? uploaded.debug_info?.message ?? 'not accepted'}`);
          }
          let received = false;
          for (let attempt = 0; attempt < LIMITS.fbPolls && !received; attempt++) {
            if (attempt) await sleep(LIMITS.fbPollMs);
            const { status } = await graph(videoId, { fields: 'status' });
            assertFbStatusHealthy(status);
            received = phaseDone(status?.uploading_phase?.status);
          }
          if (!received) throw new Error('Facebook upload did not complete in time; nothing was published');
          const finish = await graph(`${pageId}/video_reels`,
            { upload_phase: 'finish', video_id: videoId, video_state: 'PUBLISHED', description: reel.captionFb }, 'POST');
          if (finish.success !== true) throw new Error('Facebook did not accept the publish request');
          let published = false;
          for (let attempt = 0; attempt < LIMITS.fbPolls && !published; attempt++) {
            await sleep(LIMITS.fbPollMs);
            const { status } = await graph(videoId, { fields: 'status' });
            assertFbStatusHealthy(status);
            published = phaseDone(status?.publishing_phase?.status)
              || String(status?.publishing_phase?.publish_status ?? '').toLowerCase() === 'published';
          }
          print(published ? `facebook: published reel ${videoId}`
            : `facebook: publish accepted for reel ${videoId}, still processing (UNVERIFIED - check the Page)`);
        }
      } catch (error) { failures.add(platform); print(`${platform}: failed: ${error.message}`); }
    }
    return done();
  } catch (error) { print(`failed: ${error.message}`); return 1; }
}

async function main() { process.exitCode = await run({ argv: process.argv.slice(2) }); }
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
