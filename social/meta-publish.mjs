import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLATFORMS = ['instagram', 'facebook'];
const MODES = ['check', 'plan', 'plan-week', 'publish'];
const FB_URL_BASE = 'https://built-to-hoop.com/reset.html?utm_source=facebook&utm_medium=social&utm_campaign=';
const DEFAULT_CAMPAIGN = 'autopost';
const TOKEN_WARN_DAYS = 7;
const TOKEN_FIX = 'Replace the META_PAGE_TOKEN repository secret (steps in social/README.md).';
const TOKEN_EXPIRED = `TOKEN EXPIRED: META_PAGE_TOKEN is expired or revoked. Nothing can post to Instagram or Facebook until it is replaced. ${TOKEN_FIX}`;

// The set id ("set-128") is the campaign, so a lead can be traced to the post that sent it.
export function campaignFor(id = '') {
  return /(?:^|[-_])(set-\d+)(?=$|[-_])/i.exec(String(id))?.[1].toLowerCase() ?? DEFAULT_CAMPAIGN;
}

function addDays(date, days) {
  const next = new Date(`${date}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

// Reads a Graph debug_token record. Returns { state, days, line }; the line never holds token material.
export function tokenHealth(data, now = new Date()) {
  if (!data || typeof data !== 'object' || typeof data.is_valid !== 'boolean') {
    return { state: 'unverified', line: 'token: UNVERIFIED, the health check returned no usable answer' };
  }
  const expires = Number(data.expires_at) || 0;
  const seconds = expires - Math.floor(new Date(now).getTime() / 1000);
  if (!data.is_valid || (expires > 0 && seconds <= 0)) return { state: 'expired', line: TOKEN_EXPIRED };
  if (expires === 0) return { state: 'valid', line: 'token: valid, no expiry date' };
  const days = Math.floor(seconds / 86400);
  const date = new Date(expires * 1000).toISOString().slice(0, 10);
  if (days < TOKEN_WARN_DAYS) {
    const left = days < 1 ? 'LESS THAN 1 DAY' : `${days} DAY${days === 1 ? '' : 'S'}`;
    return { state: 'expiring', days, line: `TOKEN EXPIRES IN ${left} (${date}): the daily Instagram and Facebook post stops then. ${TOKEN_FIX}` };
  }
  return { state: 'valid', days, line: `token: valid, expires in ${days} days (${date})` };
}

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

export function buildFbCaption(igCaption, campaign = DEFAULT_CAMPAIGN) {
  const url = `${FB_URL_BASE}${/^[a-z0-9-]+$/.test(campaign) ? campaign : DEFAULT_CAMPAIGN}`;
  if (/\blink in bio\b/i.test(igCaption)) {
    return igCaption.replace(/\blink in bio\b/gi, url);
  }
  return `${igCaption.trimEnd()}\n\n${url}`;
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
      ? fs.readFileSync(localFile(dir, post.caption_fb_file), 'utf8') : buildFbCaption(caption, campaignFor(post.id));
    if (!captionFb.trim()) throw new Error('empty Facebook caption');
    if (!normalizeFirstLine(caption) || !normalizeFirstLine(captionFb)) throw new Error('caption first line has no letters or numbers');
    // Posts that went out before per-set tagging carry the old constant campaign; keep matching them.
    const captionFbLegacy = post.caption_fb_file ? undefined : buildFbCaption(caption);
    return { ...post, dir, caption, captionFb, captionFbLegacy, valid: true };
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

function captionFor(post, platform) { return platform === 'facebook' ? post.captionFb ?? buildFbCaption(post.caption, campaignFor(post.id)) : post.caption; }
function wasPosted(post, platform, livePosted) {
  const firsts = new Set([normalizeFirstLine(captionFor(post, platform))]);
  if (platform === 'facebook' && post.captionFbLegacy) firsts.add(normalizeFirstLine(post.captionFbLegacy));
  const live = livePosted[platform] ?? [];
  return live.some(item => firsts.has(normalizeFirstLine(typeof item === 'string' ? item : item.caption ?? item.message)));
}

// The next `count` posts in the order the daily run takes them. `live` null = no live check was possible,
// so only posts dated today or later are listed (an older one may already be out).
export function planWeek(posts, today, { live = null, platforms = PLATFORMS, start = today, count = 7 } = {}) {
  const left = post => platforms.filter(p => post.platforms.includes(p) && !(live && wasPosted(post, p, live)));
  const remaining = posts.filter(post => post.valid !== false && (live ? true : post.publish_on >= today))
    .sort((a, b) => a.publish_on.localeCompare(b.publish_on) || a.id.localeCompare(b.id))
    .map(post => ({ post, platforms: left(post) })).filter(item => item.platforms.length);
  const plan = [];
  let day = start;
  for (const item of remaining.slice(0, count)) {
    if (item.post.publish_on > day) day = item.post.publish_on;
    plan.push({ date: day, ...item });
    day = addDays(day, 1);
  }
  return plan;
}

export function formatWeek(plan, today, note) {
  const lines = [`plan-week: next ${plan.length} queued post${plan.length === 1 ? '' : 's'} from ${today} (New York date). Read-only: nothing was posted or changed.`, `live check: ${note}`];
  plan.forEach(({ date, post, platforms }, i) => {
    const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
    lines.push('', `--- ${i + 1} of ${plan.length} | expected ${date} (${weekday}) | queued for ${post.publish_on} | ${campaignFor(post.id)} | ${post.slides.length} slides | ${platforms.join(' + ')}`,
      `id: ${post.id}`, `title: ${post.title ?? ''}`, 'Instagram caption:', post.caption.trimEnd(), 'Facebook caption:', post.captionFb.trimEnd());
  });
  if (!plan.length) lines.push('', 'nothing queued');
  return lines.join('\n');
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
  if (!MODES.includes(options.mode) || !['both', ...PLATFORMS].includes(options.platform)) throw new Error('invalid mode or platform');
  return options;
}

export async function run({ argv = [], env = process.env, fetchImpl = globalThis.fetch,
  now = () => new Date(), log = console.log, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)),
  // The command line turns the token health check on (see main); a caller of run() opts in.
  preflight = false } = {}) {
  const token = env.META_PAGE_TOKEN;
  const print = message => log(redact(message, token));
  const clock = () => (typeof now === 'function' ? now() : now);
  const queuePosts = () => loadQueue(path.resolve(ROOT, env.QUEUE_DIR || 'social/queue'), print).filter(post => post.valid);
  if (!token) {
    let offline = null;
    try { offline = parseArgs(argv); } catch { /* reported as UNVERIFIED below */ }
    if (offline?.mode !== 'plan-week') { print('UNVERIFIED: META_PAGE_TOKEN not set'); return 5; }
    // The week view reads only the local queue, so it works with no token at all.
    const today = etDate(clock());
    const platforms = offline.platform === 'both' ? PLATFORMS : [offline.platform];
    print(formatWeek(planWeek(queuePosts(), today, { platforms }), today,
      'skipped (META_PAGE_TOKEN not set), so posts dated before today are not shown and nothing was compared with what is already live'));
    return 0;
  }
  let expiring = false;
  const done = code => code || (expiring ? 6 : 0);
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
        const failure = new Error(`Graph HTTP ${response.status} code=${error.code ?? 'unknown'} message=${error.message ?? 'invalid response'} fbtrace_id=${error.fbtrace_id ?? 'unknown'}`);
        failure.code = Number(error.code);
        throw failure;
      }
    };
    let unverified = false;
    if (preflight) {
      // debug_token wants the token as a parameter. A POST carrying method=GET keeps it out of the URL.
      let health;
      const inspect = new URLSearchParams({ method: 'GET' });
      inspect.set('input_token', token);
      try { health = tokenHealth((await graph('debug_token', inspect, 'POST')).data, clock()); }
      catch (error) {
        health = error.code === 190 ? { state: 'expired', line: TOKEN_EXPIRED }
          : { state: 'unverified', line: `token: UNVERIFIED, the health check could not run (${error.message})` };
      }
      const level = { expired: 'error', expiring: 'error', unverified: 'warning' }[health.state];
      print(`${env.GITHUB_ACTIONS === 'true' && level ? `::${level} title=Meta token::` : ''}${health.line}`);
      if (health.state === 'expired') return 1;
      expiring = health.state === 'expiring';
      unverified = health.state === 'unverified';
    }
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
      return done(unverified ? 5 : 0);
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
    const today = etDate(clock());
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
    const posts = queuePosts();
    if (options.mode === 'plan-week') {
      const checked = requested.filter(p => !failures.has(p));
      // A platform that already posted today takes its next post tomorrow.
      const start = checked.some(p => !eligible.includes(p)) ? addDays(today, 1) : today;
      print(formatWeek(planWeek(posts, today, { live, platforms: requested, start }), today, failures.size
        ? `incomplete (${[...failures].join(', ')} could not be read), so posts already live there may still be listed`
        : `done on ${checked.join(' and ')}; posts already live are left out`));
      return done(failures.size ? 1 : 0);
    }
    const post = options.post ? posts.find(p => p.id === options.post) : pickDuePost(posts, today, live, eligible);
    if (options.post && !post) throw new Error(`post missing or invalid: ${options.post}`);
    if (!post) { print('nothing due'); return done(failures.size ? 1 : 0); }
    const platforms = eligible.filter(p => post.platforms.includes(p) && !wasPosted(post, p, live));
    for (const p of eligible.filter(p => post.platforms.includes(p) && wasPosted(post, p, live))) print(`${p}: already posted ${post.id}`);
    if (!platforms.length) { print('nothing due'); return done(failures.size ? 1 : 0); }
    const site = new URL(env.SITE_BASE || 'https://built-to-hoop.com');
    if (site.protocol !== 'https:' || site.username || site.password || site.search || site.hash) throw new Error('SITE_BASE must be an HTTPS URL without credentials, query or fragment');
    const urls = post.slides.map(slide => `${site.href.replace(/\/$/, '')}/social/queue/${encodeURIComponent(post.id)}/${encodeURIComponent(slide)}`);
    if (options.mode === 'plan' || options.dry) {
      print(JSON.stringify({ id: post.id, platforms, slides: urls, caption: post.caption, caption_facebook: post.captionFb }, null, 2));
      return done(failures.size ? 1 : 0);
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
    return done(failures.size ? 1 : 0);
  } catch (error) {
    print(`failed: ${error.message}`);
    if (error.code === 190) print(`${env.GITHUB_ACTIONS === 'true' ? '::error title=Meta token::' : ''}${TOKEN_EXPIRED}`);
    return 1;
  }
}

async function main() { process.exitCode = await run({ argv: process.argv.slice(2), preflight: true }); }
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
