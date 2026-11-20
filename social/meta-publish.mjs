import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLATFORMS = ['instagram', 'facebook'];
const FB_URL = 'https://built-to-hoop.com/reset.html?utm_source=facebook&utm_medium=social&utm_campaign=autopost';

export function etDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(now));
  const get = type => parts.find(p => p.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function normalizeFirstLine(text = '') {
  return String(text).split(/\r?\n/).find(line => line.trim())?.toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim() ?? '';
}

export function redact(text, token = '') {
  let result = String(text);
  for (const value of [token, encodeURIComponent(token), new URLSearchParams({ t: token }).toString().slice(2)]) {
    if (value) result = result.split(value).join('[REDACTED]');
  }
  return result.replace(/access_token\s*=\s*[^&\s"'<>]+/gi, 'access_token=[REDACTED]');
}

export function buildFbCaption(igCaption) {
  if (/\blink in bio\b/i.test(igCaption)) {
    return igCaption.replace(/\blink in bio\b/gi, FB_URL);
  }
  return `${igCaption.trimEnd()}\n\n${FB_URL}`;
}

function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

function localFile(dir, name) {
  if (typeof name !== 'string' || !name || path.basename(name) !== name || /[\\/]/.test(name)) {
    throw new Error('file names must stay inside the post folder');
  }
  const filename = path.join(dir, name);
  if (!fs.statSync(filename).isFile()) throw new Error(`not a file: ${name}`);
  const realDir = fs.realpathSync(dir);
  if (path.dirname(fs.realpathSync(filename)) !== realDir) throw new Error(`file outside post folder: ${name}`);
  return filename;
}

// Returns a validated record (including captions), or a reason without throwing.
export function validatePost(post, dir) {
  try {
    if (!post || post.approved !== true) throw new Error('not approved');
    if (typeof post.id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(post.id) || path.basename(dir) !== post.id) {
      throw new Error('id must match the folder and contain only letters, numbers, underscores or hyphens');
    }
    if (!validDate(post.publish_on)) throw new Error('invalid publish_on date');
    if (!Array.isArray(post.platforms) || !post.platforms.length || post.platforms.some(p => !PLATFORMS.includes(p))) {
      throw new Error('invalid platforms');
    }
    if (!Array.isArray(post.slides) || post.slides.length < 2 || post.slides.length > 10) throw new Error('requires 2-10 slides');
    for (const slide of post.slides) {
      if (typeof slide !== 'string' || !/\.jpg$/i.test(slide)) throw new Error('slides must end in .jpg');
      localFile(dir, slide);
    }
    const caption = fs.readFileSync(localFile(dir, post.caption_file), 'utf8');
    if (!caption.trim()) throw new Error('empty caption');
    if ([...caption].length > 2200) throw new Error('Instagram caption exceeds 2200 characters');
    const captionFb = post.caption_fb_file
      ? fs.readFileSync(localFile(dir, post.caption_fb_file), 'utf8') : buildFbCaption(caption);
    if (!captionFb.trim()) throw new Error('empty Facebook caption');
    if (!normalizeFirstLine(caption) || !normalizeFirstLine(captionFb)) throw new Error('caption first line has no letters or numbers');
    return { ...post, dir, caption, captionFb, valid: true };
  } catch (error) {
    return { ...post, dir, valid: false, reason: error.message };
  }
}

export function loadQueue(queueDir = path.join(ROOT, 'social/queue'), log = () => {}) {
  if (!fs.existsSync(queueDir)) return [];
  return fs.readdirSync(queueDir, { withFileTypes: true }).filter(e => e.isDirectory()).map(entry => {
    const dir = path.join(queueDir, entry.name);
    let record;
    try { record = validatePost(JSON.parse(fs.readFileSync(path.join(dir, 'post.json'), 'utf8')), dir); }
    catch (error) { record = { id: entry.name, dir, valid: false, reason: error.message }; }
    if (!record.valid) log(`invalid: ${entry.name}: ${record.reason}`);
    return record;
  });
}

function captionFor(post, platform) { return platform === 'facebook' ? post.captionFb ?? buildFbCaption(post.caption) : post.caption; }
function wasPosted(post, platform, livePosted) {
  const first = normalizeFirstLine(captionFor(post, platform));
  const live = livePosted[platform] ?? [];
  return live.some(item => normalizeFirstLine(typeof item === 'string' ? item : item.caption ?? item.message) === first);
}

export function pickDuePost(posts, today, livePosted, requested = PLATFORMS) {
  return posts.filter(post => post.valid !== false && post.publish_on <= today)
    .sort((a, b) => a.publish_on.localeCompare(b.publish_on) || a.id.localeCompare(b.id))
    .find(post => requested.some(p => post.platforms.includes(p) && !wasPosted(post, p, livePosted)));
}

function parseArgs(argv) {
  const options = { mode: 'plan', platform: 'both', dry: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry') options.dry = true;
    else if (['--mode', '--post', '--platform'].includes(arg) && argv[i + 1] && !argv[i + 1].startsWith('--')) options[arg.slice(2)] = argv[++i];
    else throw new Error(`invalid argument: ${arg}`);
  }
  if (!['check', 'plan', 'publish'].includes(options.mode) || !['both', ...PLATFORMS].includes(options.platform)) throw new Error('invalid mode or platform');
  return options;
}

export async function run({ argv = [], env = process.env, fetchImpl = globalThis.fetch,
  now = () => new Date(), log = console.log, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)) } = {}) {
  const token = env.META_PAGE_TOKEN;
  const print = message => log(redact(message, token));
  if (!token) { print('UNVERIFIED: META_PAGE_TOKEN not set'); return 5; }
  try {
    const options = parseArgs(argv);
    const version = env.META_GRAPH_VERSION || 'v23.0';
    if (!/^v\d+\.\d+$/.test(version)) throw new Error('invalid META_GRAPH_VERSION');
    const graphBase = `https://graph.facebook.com/${version}`;
    const graph = async (endpoint, fields, method = 'GET') => {
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
        }
        // Network exceptions have uncertain write outcomes: do not blindly replay them.
        const response = await fetchImpl(url.href, init);
        let data;
        try { data = await response.json(); } catch { data = {}; }
        if (response.ok && !data.error) return data;
        const error = data.error ?? {};
        const transient = response.status >= 500 || error.is_transient === true || [1, 2, 4, 17, 341].includes(Number(error.code));
        if (method === 'POST' && transient && attempt < 3) {
          await sleep([5000, 15000, 45000][attempt]);
          continue;
        }
        throw new Error(`Graph HTTP ${response.status} code=${error.code ?? 'unknown'} message=${error.message ?? 'invalid response'} fbtrace_id=${error.fbtrace_id ?? 'unknown'}`);
      }
    };
    const requireId = data => {
      if (!data.id) throw new Error('Graph response missing id');
      return data.id;
    };
    const page = await graph('me', { fields: 'id,name,instagram_business_account{id,username}' });
    const pageId = requireId(page);
    const igId = page.instagram_business_account?.id;
    if (!igId) throw new Error('No Instagram professional account linked to the Facebook Page');
    if (options.mode === 'check') {
      print(`page: ${page.name} (${pageId})`);
      print(`instagram: ${page.instagram_business_account.username} (${igId})`);
      print(JSON.stringify(await graph(`${igId}/content_publishing_limit`, { fields: 'config,quota_usage' })));
      return 0;
    }
    const requested = options.platform === 'both' ? PLATFORMS : [options.platform];
    const live = {};
    const failures = new Set();
    for (const platform of requested) {
      try {
        const result = platform === 'instagram'
          ? await graph(`${igId}/media`, { fields: 'caption,timestamp,permalink', limit: '50' })
          : await graph(`${pageId}/posts`, { fields: 'message,created_time,permalink_url', limit: '50' });
        if (!Array.isArray(result.data)) throw new Error('Graph response missing live post list');
        live[platform] = result.data;
      } catch (error) { failures.add(platform); print(`${platform}: failed: ${error.message}`); }
    }
    const today = etDate(typeof now === 'function' ? now() : now);
    const eligible = [];
    for (const platform of requested.filter(p => !failures.has(p))) {
      try {
        if (live[platform].some(item => !item || typeof item !== 'object')) throw new Error('invalid live post record');
        const capped = !options.post && live[platform].some(item => {
          const stamp = item.timestamp ?? item.created_time;
          if (!stamp || !Number.isFinite(Date.parse(stamp))) throw new Error(`invalid live timestamp on ${platform}`);
          return etDate(stamp) === today;
        });
        if (capped) print(`cap: already posted today on ${platform}`);
        else eligible.push(platform);
      } catch (error) { failures.add(platform); print(`${platform}: failed: ${error.message}`); }
    }
    const posts = loadQueue(path.resolve(ROOT, env.QUEUE_DIR || 'social/queue'), print).filter(post => post.valid);
    const post = options.post ? posts.find(p => p.id === options.post) : pickDuePost(posts, today, live, eligible);
    if (options.post && !post) throw new Error(`post missing or invalid: ${options.post}`);
    if (!post) { print('nothing due'); return failures.size ? 1 : 0; }
    const platforms = eligible.filter(p => post.platforms.includes(p) && !wasPosted(post, p, live));
    for (const p of eligible.filter(p => post.platforms.includes(p) && wasPosted(post, p, live))) print(`${p}: already posted ${post.id}`);
    if (!platforms.length) { print('nothing due'); return failures.size ? 1 : 0; }
    const site = new URL(env.SITE_BASE || 'https://built-to-hoop.com');
    if (site.protocol !== 'https:' || site.username || site.password || site.search || site.hash) throw new Error('SITE_BASE must be an HTTPS URL without credentials, query or fragment');
    const urls = post.slides.map(slide => `${site.href.replace(/\/$/, '')}/social/queue/${encodeURIComponent(post.id)}/${encodeURIComponent(slide)}`);
    if (options.mode === 'plan' || options.dry) {
      print(JSON.stringify({ id: post.id, platforms, slides: urls, caption: post.caption, caption_facebook: post.captionFb }, null, 2));
      return failures.size ? 1 : 0;
    }
    for (const url of urls) {
      let ready = false;
      for (let attempt = 0; attempt <= 20; attempt++) {
        try {
          const response = await fetchImpl(url, { method: 'GET', signal: AbortSignal.timeout(30000) });
          ready = response.status === 200 && /^image\/jpeg(?:\s*;|$)/i.test(response.headers.get('content-type') ?? '');
          await response.body?.cancel();
        } catch { ready = false; }
        if (ready) break;
        if (attempt < 20) await sleep(30000);
      }
      if (!ready) throw new Error(`slide unavailable after retries: ${url}`);
    }
    for (const platform of platforms) {
      try {
        if (platform === 'instagram') {
          const children = [];
          for (const url of urls) children.push(requireId(await graph(`${igId}/media`, { image_url: url, is_carousel_item: 'true' }, 'POST')));
          const container = requireId(await graph(`${igId}/media`, { media_type: 'CAROUSEL', children: children.join(','), caption: post.caption }, 'POST'));
          let finished = false;
          for (let attempt = 0; attempt <= 60; attempt++) {
            const { status_code: status } = await graph(container, { fields: 'status_code' });
            if (status === 'FINISHED') { finished = true; break; }
            if (['ERROR', 'EXPIRED'].includes(status)) throw new Error(`Instagram container ${status}`);
            if (attempt < 60) await sleep(5000);
          }
          if (!finished) throw new Error('Instagram container timed out');
          const mediaId = requireId(await graph(`${igId}/media_publish`, { creation_id: container }, 'POST'));
          const media = await graph(mediaId, { fields: 'permalink' });
          if (!media.permalink) throw new Error(`published ${mediaId}, permalink unavailable`);
          print(`instagram: published ${media.permalink}`);
        } else {
          const fields = { message: post.captionFb };
          for (let i = 0; i < urls.length; i++) {
            const id = requireId(await graph(`${pageId}/photos`, { url: urls[i], published: 'false' }, 'POST'));
            fields[`attached_media[${i}]`] = JSON.stringify({ media_fbid: id });
          }
          print(`facebook: published ${requireId(await graph(`${pageId}/feed`, fields, 'POST'))}`);
        }
      } catch (error) { failures.add(platform); print(`${platform}: failed: ${error.message}`); }
    }
    return failures.size ? 1 : 0;
  } catch (error) { print(`failed: ${error.message}`); return 1; }
}

async function main() { process.exitCode = await run({ argv: process.argv.slice(2) }); }
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
