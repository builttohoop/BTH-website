// Token health, per-set campaign tags and the week view. The original publisher contract is pinned by
// .github/scripts/meta-publish.test.mjs; this file covers what was added on top of it.
// Run: node --test social/meta-publish-hardening.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { campaignFor, buildFbCaption, tokenHealth, planWeek, validatePost, pickDuePost, run } from './meta-publish.mjs';

const TOKEN = 'secret-test-token+123';
const BASE = 'https://built-to-hoop.com/reset.html?utm_source=facebook&utm_medium=social&utm_campaign=';
const NOW = new Date('2026-11-17T23:00:00Z');
const NOW_S = Math.floor(NOW.getTime() / 1000);
const DAY = 86400;
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });

function addPost(queue, id, publishOn, caption, slides = 3) {
  const dir = path.join(queue, id);
  fs.mkdirSync(dir);
  const names = Array.from({ length: slides }, (_, i) => `slide-${String(i + 1).padStart(2, '0')}.jpg`);
  for (const name of names) fs.writeFileSync(path.join(dir, name), Buffer.from([0xff, 0xd8, 0xff, 0xd9]));
  fs.writeFileSync(path.join(dir, 'caption.txt'), caption);
  const post = { id, title: `Title ${id}`, publish_on: publishOn, approved: true, platforms: ['instagram', 'facebook'], slides: names, caption_file: 'caption.txt' };
  fs.writeFileSync(path.join(dir, 'post.json'), JSON.stringify(post));
  return { dir, post };
}

function queueOf(t, posts) {
  const queue = fs.mkdtempSync(path.join(os.tmpdir(), 'bth-meta-harden-'));
  t.after(() => fs.rmSync(queue, { recursive: true, force: true }));
  for (const args of posts) addPost(queue, ...args);
  return queue;
}

const ONE = [['2026-11-13-set-128-the-run', '2026-11-17', 'Hook line for 128.\nFree 5-Day Reset, link in bio.\n']];

// debug: a debug_token `data` record, a Response, or undefined for "token never expires".
function mock({ debug, liveIg = [], liveFb = [], handler } = {}) {
  const calls = [];
  const fetchImpl = async (rawUrl, init = {}) => {
    const url = new URL(rawUrl);
    const method = init.method ?? 'GET';
    const body = new URLSearchParams(init.body);
    const endpoint = url.pathname.replace(/^\/v23\.0\//, '');
    const call = { url, method, body, endpoint };
    calls.push(call);
    assert.ok(!rawUrl.includes(TOKEN), 'the token must never be in a URL');
    assert.ok(!rawUrl.includes(encodeURIComponent(TOKEN)), 'the token must never be in a URL');
    if (url.hostname !== 'graph.facebook.com') return new Response('', { status: 200, headers: { 'content-type': 'image/jpeg' } });
    const override = handler?.(call);
    if (override) return override;
    if (endpoint === 'debug_token') {
      assert.equal(method, 'POST');
      assert.equal(url.search, '');
      assert.equal(body.get('method'), 'GET');
      assert.equal(body.get('input_token'), TOKEN);
      assert.equal(body.get('access_token'), TOKEN);
      return debug instanceof Response ? debug : json({ data: debug ?? { is_valid: true, expires_at: 0, type: 'PAGE' } });
    }
    if (endpoint === 'me') return json({ id: 'page', name: 'BTH', instagram_business_account: { id: 'ig', username: 'bth' } });
    if (endpoint === 'ig/content_publishing_limit') return json({ config: { quota_total: 100 }, quota_usage: 0 });
    if (endpoint === 'ig/media' && method === 'GET') return json({ data: liveIg });
    if (endpoint === 'page/posts') return json({ data: liveFb });
    if (endpoint === 'ig/media' && body.get('media_type') === 'CAROUSEL') return json({ id: 'container' });
    if (endpoint === 'ig/media') return json({ id: `child-${calls.length}` });
    if (endpoint === 'container') return json({ status_code: 'FINISHED' });
    if (endpoint === 'ig/media_publish') return json({ id: 'media' });
    if (endpoint === 'media') return json({ permalink: 'https://instagram.example/p/fixture' });
    if (endpoint === 'page/photos') return json({ id: `photo-${calls.length}` });
    if (endpoint === 'page/feed') return json({ id: 'page_post' });
    throw new Error(`unexpected request: ${method} ${endpoint}`);
  };
  return { fetchImpl, calls };
}

async function execute(t, { posts = ONE, argv = ['--mode', 'publish'], env = {}, preflight = true, token = TOKEN, ...settings } = {}) {
  const queue = queueOf(t, posts);
  const transport = mock(settings);
  const logs = [];
  const code = await run({ argv, env: { ...(token ? { 'META_PAGE_TOKEN': token } : {}), QUEUE_DIR: queue, ...env },
    fetchImpl: transport.fetchImpl, now: () => NOW, log: line => logs.push(line), sleep: async () => {}, preflight });
  const out = logs.join('\n');
  assert.ok(!out.includes(TOKEN) && !out.includes(TOKEN.slice(0, 12)), 'the token must never be printed');
  return { ...transport, code, logs, out, queue };
}

// ---- 1. token health -------------------------------------------------------

test('tokenHealth reads valid, no-expiry, expiring, expired and unusable records', () => {
  assert.deepEqual(tokenHealth({ is_valid: true, expires_at: 0 }, NOW), { state: 'valid', line: 'token: valid, no expiry date' });
  const far = tokenHealth({ is_valid: true, expires_at: NOW_S + 42 * DAY + 60 }, NOW);
  assert.equal(far.state, 'valid');
  assert.equal(far.line, 'token: valid, expires in 42 days (2026-12-29)');
  assert.equal(tokenHealth({ is_valid: true, expires_at: NOW_S + 7 * DAY + 60 }, NOW).state, 'valid');
  const soon = tokenHealth({ is_valid: true, expires_at: NOW_S + 7 * DAY - 60 }, NOW);
  assert.equal(soon.state, 'expiring');
  assert.match(soon.line, /^TOKEN EXPIRES IN 6 DAYS \(2026-11-24\)/);
  assert.match(tokenHealth({ is_valid: true, expires_at: NOW_S + DAY + 60 }, NOW).line, /^TOKEN EXPIRES IN 1 DAY \(/);
  assert.match(tokenHealth({ is_valid: true, expires_at: NOW_S + 3600 }, NOW).line, /^TOKEN EXPIRES IN LESS THAN 1 DAY \(/);
  for (const dead of [{ is_valid: false, expires_at: NOW_S - 60 }, { is_valid: false, expires_at: 0 }, { is_valid: true, expires_at: NOW_S - 1 }]) {
    const result = tokenHealth(dead, NOW);
    assert.equal(result.state, 'expired');
    assert.match(result.line, /^TOKEN EXPIRED: /);
  }
  for (const junk of [undefined, null, {}, { expires_at: 5 }, 'x']) assert.equal(tokenHealth(junk, NOW).state, 'unverified');
  for (const record of [far, soon]) assert.ok(!record.line.includes('\n'), 'status is one line');
});

test('preflight runs first in check, plan and publish, prints one status line and exits 0 when healthy', async t => {
  for (const mode of ['check', 'plan', 'publish']) {
    const r = await execute(t, { argv: ['--mode', mode], debug: { is_valid: true, expires_at: NOW_S + 60 * DAY + 60 } });
    assert.equal(r.code, 0, mode);
    assert.equal(r.calls[0].endpoint, 'debug_token');
    assert.equal(r.calls.filter(c => c.endpoint === 'debug_token').length, 1);
    assert.equal(r.logs[0], 'token: valid, expires in 60 days (2027-01-16)');
    assert.equal(r.logs.filter(line => /token/i.test(line)).length, 1);
  }
  const never = await execute(t, { argv: ['--mode', 'check'] });
  assert.equal(never.logs[0], 'token: valid, no expiry date');
});

test('expired token stops every mode before any other call, exits 1 and says so plainly', async t => {
  const answers = [
    json({ error: { code: 190, error_subcode: 463, message: `Session has expired ${TOKEN}`, fbtrace_id: 'x' } }, 400),
    json({ data: { is_valid: false, expires_at: NOW_S - DAY, error: { code: 190, message: 'expired' } } }),
  ];
  for (const mode of ['check', 'plan', 'plan-week', 'publish']) {
    for (const debug of answers) {
      const r = await execute(t, { argv: ['--mode', mode], debug: debug.clone() });
      assert.equal(r.code, 1, mode);
      assert.deepEqual(r.calls.map(c => c.endpoint), ['debug_token']);
      assert.equal(r.logs.length, 1);
      assert.match(r.logs[0], /^TOKEN EXPIRED: META_PAGE_TOKEN is expired or revoked\. Nothing can post/);
    }
  }
});

test('token under 7 days still does the work but exits non-zero with a loud line', async t => {
  const debug = { is_valid: true, expires_at: NOW_S + 3 * DAY + 60 };
  const publish = await execute(t, { debug });
  assert.equal(publish.code, 6);
  assert.match(publish.logs[0], /^TOKEN EXPIRES IN 3 DAYS \(2026-11-20\): the daily Instagram and Facebook post stops then\./);
  assert.ok(publish.logs.includes('facebook: published page_post'));
  assert.ok(publish.logs.some(line => line.startsWith('instagram: published')));
  for (const mode of ['check', 'plan', 'plan-week']) assert.equal((await execute(t, { argv: ['--mode', mode], debug })).code, 6, mode);
  // A real failure keeps its own code.
  const failed = await execute(t, { debug, handler: c => c.endpoint === 'page/photos' ? json({ error: { code: 100, message: 'no' } }, 400) : undefined });
  assert.equal(failed.code, 1);
});

test('health check that cannot run is UNVERIFIED: publish carries on, check exits 5', async t => {
  const debug = () => json({ error: { code: 100, message: 'app access token required', fbtrace_id: 'x' } }, 400);
  const publish = await execute(t, { debug: debug() });
  assert.equal(publish.code, 0);
  assert.match(publish.logs[0], /^token: UNVERIFIED, the health check could not run \(Graph HTTP 400 code=100/);
  assert.ok(publish.logs.includes('facebook: published page_post'));
  assert.equal((await execute(t, { argv: ['--mode', 'check'], debug: debug() })).code, 5);
  const empty = await execute(t, { argv: ['--mode', 'plan'], debug: json({ data: {} }) });
  assert.equal(empty.code, 0);
  assert.match(empty.logs[0], /^token: UNVERIFIED/);
});

test('GitHub Actions gets an annotation; an expired token found later is still named', async t => {
  const env = { GITHUB_ACTIONS: 'true' };
  const expired = await execute(t, { env, debug: { is_valid: false, expires_at: NOW_S - 60 } });
  assert.match(expired.logs[0], /^::error title=Meta token::TOKEN EXPIRED: /);
  const soon = await execute(t, { env, argv: ['--mode', 'plan'], debug: { is_valid: true, expires_at: NOW_S + 2 * DAY + 60 } });
  assert.match(soon.logs[0], /^::error title=Meta token::TOKEN EXPIRES IN 2 DAYS/);
  const healthy = await execute(t, { env, argv: ['--mode', 'plan'] });
  assert.equal(healthy.logs[0], 'token: valid, no expiry date');
  // Without the preflight (a library caller), a 190 on the first Graph read still ends with the plain line.
  const late = await execute(t, { preflight: false, handler: c => c.endpoint === 'me' ? json({ error: { code: 190, message: 'Session has expired' } }, 400) : undefined });
  assert.equal(late.code, 1);
  assert.match(late.logs.at(-1), /^TOKEN EXPIRED: /);
});

test('run() without preflight makes no debug_token call (the pinned Graph call order is unchanged)', async t => {
  const r = await execute(t, { preflight: false, argv: ['--mode', 'plan'] });
  assert.deepEqual(r.calls.map(c => c.endpoint), ['me', 'ig/media', 'page/posts']);
});

// ---- 2. per-post campaign --------------------------------------------------

test('campaignFor takes the set id from the folder id and falls back to autopost', () => {
  assert.equal(campaignFor('2026-11-13-set-128-the-thanksgiving-run-is-coming'), 'set-128');
  assert.equal(campaignFor('2026-08-27-set-055-round-every-corner'), 'set-055');
  assert.equal(campaignFor('SET-7'), 'set-7');
  assert.equal(campaignFor('test-post'), 'autopost');
  assert.equal(campaignFor('2026-01-01-reset-12-offset-3'), 'autopost');
  assert.equal(campaignFor(undefined), 'autopost');
});

test('buildFbCaption writes the campaign it is given, keeps source and medium, refuses unsafe values', () => {
  assert.equal(buildFbCaption('Reset, link in bio.', 'set-128'), `Reset, ${BASE}set-128.`);
  assert.equal(buildFbCaption('Reset today.\n', 'set-128'), `Reset today.\n\n${BASE}set-128`);
  assert.equal(buildFbCaption('Reset, link in bio.'), `Reset, ${BASE}autopost.`);
  assert.equal(buildFbCaption('Reset, link in bio.', 'x&utm_source=evil'), `Reset, ${BASE}autopost.`);
  const url = new URL(buildFbCaption('link in bio', 'set-128'));
  assert.deepEqual(Object.fromEntries(url.searchParams), { utm_source: 'facebook', utm_medium: 'social', utm_campaign: 'set-128' });
});

test('published Facebook caption carries utm_campaign=<set id>; the Instagram caption is untouched', async t => {
  const caption = ONE[0][2];
  const r = await execute(t);
  assert.equal(r.code, 0);
  assert.equal(r.calls.find(c => c.endpoint === 'page/feed').body.get('message'), `Hook line for 128.\nFree 5-Day Reset, ${BASE}set-128.\n`);
  assert.equal(r.calls.find(c => c.body.get('media_type') === 'CAROUSEL').body.get('caption'), caption);
  const plan = JSON.parse((await execute(t, { argv: ['--mode', 'plan'], preflight: false })).logs[0]);
  assert.equal(plan.caption, caption);
  assert.ok(plan.caption_facebook.includes('utm_campaign=set-128'));
  assert.ok(!plan.caption_facebook.includes('autopost'));
});

test('an explicit Facebook caption file is used as written', t => {
  const queue = queueOf(t, ONE);
  const dir = path.join(queue, ONE[0][0]);
  fs.writeFileSync(path.join(dir, 'facebook.txt'), 'Hand-written Facebook caption');
  const post = { ...JSON.parse(fs.readFileSync(path.join(dir, 'post.json'), 'utf8')), caption_fb_file: 'facebook.txt' };
  const record = validatePost(post, dir);
  assert.equal(record.captionFb, 'Hand-written Facebook caption');
  assert.equal(record.captionFbLegacy, undefined);
});

test('a post already on Facebook under the old autopost link is not posted twice', async t => {
  // One-paragraph caption: the link sits on the first line, which is the line the duplicate check reads.
  const posts = [['2026-08-27-set-055-round-every-corner', '2026-11-17', 'Tight turns win drives. Free 5-Day Reset, link in bio.\n#bth\n']];
  const oldLive = `Tight turns win drives. Free 5-Day Reset, ${BASE}autopost.\n#bth\n`;
  const newLive = `Tight turns win drives. Free 5-Day Reset, ${BASE}set-055.\n#bth\n`;
  for (const message of [oldLive, newLive]) {
    const r = await execute(t, { posts, argv: ['--mode', 'publish', '--platform', 'facebook'], liveFb: [{ message, created_time: '2026-11-10T12:00:00Z' }] });
    assert.equal(r.code, 0);
    assert.ok(!r.calls.some(c => c.endpoint === 'page/feed' || c.endpoint === 'page/photos'));
    assert.ok(r.logs.includes('nothing due'));
  }
  const queue = queueOf(t, posts);
  const record = validatePost(JSON.parse(fs.readFileSync(path.join(queue, posts[0][0], 'post.json'), 'utf8')), path.join(queue, posts[0][0]));
  assert.equal(pickDuePost([record], '2026-11-17', { facebook: [{ message: oldLive }] }, ['facebook']), undefined);
  assert.equal(pickDuePost([record], '2026-11-17', { facebook: [{ message: 'Something else' }] }, ['facebook']).id, record.id);
});

// ---- 3. plan-week ----------------------------------------------------------

const WEEK = [];
for (let i = 0; i < 9; i++) {
  const day = String(17 + i).padStart(2, '0');
  WEEK.push([`2026-11-01-set-${200 + i}-post`, `2026-11-${day}`, `Hook ${200 + i}.\nFree 5-Day Reset, link in bio.\n`, 2 + (i % 3)]);
}
const OLD = ['2026-10-01-set-150-old', '2026-11-10', 'Hook 150.\nFree 5-Day Reset, link in bio.\n', 7];

test('planWeek walks the queue one post a day in the order the daily run takes them', () => {
  const make = (id, date) => ({ id, publish_on: date, valid: true, platforms: ['instagram', 'facebook'], caption: id, captionFb: id, slides: ['a', 'b'] });
  const posts = [make('c', '2026-11-19'), make('a', '2026-11-10'), make('b', '2026-11-10'), make('gap', '2026-11-25'), { ...make('bad', '2026-11-11'), valid: false }];
  const live = { instagram: [], facebook: [] };
  assert.deepEqual(planWeek(posts, '2026-11-17', { live }).map(p => `${p.date} ${p.post.id}`),
    ['2026-11-17 a', '2026-11-18 b', '2026-11-19 c', '2026-11-25 gap']);
  // Today's slot is used: the walk starts tomorrow.
  assert.equal(planWeek(posts, '2026-11-17', { live, start: '2026-11-18' })[0].date, '2026-11-18');
  // Already live on both platforms drops out; live on one keeps the other.
  const partly = planWeek(posts, '2026-11-17', { live: { instagram: [{ caption: 'a' }, { caption: 'b' }], facebook: [{ message: 'a' }] } });
  assert.deepEqual(partly.map(p => `${p.post.id}:${p.platforms.join('+')}`), ['b:facebook', 'c:instagram+facebook', 'gap:instagram+facebook']);
  // No live check: the backlog cannot be judged, so only today onward is listed.
  assert.deepEqual(planWeek(posts, '2026-11-17').map(p => p.post.id), ['c', 'gap']);
  assert.equal(planWeek(Array.from({ length: 12 }, (_, i) => make(`p${String(i).padStart(2, '0')}`, '2026-11-17')), '2026-11-17', { live }).length, 7);
});

test('--mode plan-week prints 7 posts with dates, slide counts and both captions, and writes nothing', async t => {
  const r = await execute(t, { posts: [OLD, ...WEEK], argv: ['--mode', 'plan-week'],
    liveIg: [{ caption: 'Hook 150.', timestamp: '2026-11-10T12:00:00Z' }], liveFb: [{ message: 'Hook 150.', created_time: '2026-11-10T12:00:00Z' }] });
  assert.equal(r.code, 0);
  assert.deepEqual(r.calls.map(c => `${c.method} ${c.endpoint}`), ['POST debug_token', 'GET me', 'GET ig/media', 'GET page/posts']);
  const lines = r.out.split('\n');
  assert.equal(lines[1], 'plan-week: next 7 queued posts from 2026-11-17 (New York date). Read-only: nothing was posted or changed.');
  assert.equal(lines[2], 'live check: done on instagram and facebook; posts already live are left out');
  const heads = lines.filter(line => line.startsWith('--- '));
  assert.equal(heads.length, 7);
  assert.equal(heads[0], '--- 1 of 7 | expected 2026-11-17 (Tue) | queued for 2026-11-17 | set-200 | 2 slides | instagram + facebook');
  assert.equal(heads[1], '--- 2 of 7 | expected 2026-11-18 (Wed) | queued for 2026-11-18 | set-201 | 3 slides | instagram + facebook');
  assert.equal(heads[6], '--- 7 of 7 | expected 2026-11-23 (Mon) | queued for 2026-11-23 | set-206 | 2 slides | instagram + facebook');
  assert.ok(!r.out.includes('set-150'), 'a post already live is left out');
  assert.ok(!r.out.includes('set-207'), 'only seven are listed');
  const first = lines.indexOf('id: 2026-11-01-set-200-post');
  assert.deepEqual(lines.slice(first, first + 7), ['id: 2026-11-01-set-200-post', 'title: Title 2026-11-01-set-200-post',
    'Instagram caption:', 'Hook 200.', 'Free 5-Day Reset, link in bio.', 'Facebook caption:', 'Hook 200.']);
  assert.equal(lines[first + 7], `Free 5-Day Reset, ${BASE}set-200.`);
});

test('plan-week shows an unposted backlog first and starts tomorrow when today already posted', async t => {
  const backlog = await execute(t, { posts: [OLD, ...WEEK], argv: ['--mode', 'plan-week'] });
  const heads = backlog.out.split('\n').filter(line => line.startsWith('--- '));
  assert.equal(heads[0], '--- 1 of 7 | expected 2026-11-17 (Tue) | queued for 2026-11-10 | set-150 | 7 slides | instagram + facebook');
  assert.match(heads[1], /expected 2026-11-18 \(Wed\) \| queued for 2026-11-17 \| set-200/);
  const posted = await execute(t, { posts: WEEK, argv: ['--mode', 'plan-week'],
    liveIg: [{ caption: 'Other', timestamp: '2026-11-17T20:00:00Z' }], liveFb: [{ message: 'Other', created_time: '2026-11-17T20:00:00Z' }] });
  assert.match(posted.out.split('\n').find(line => line.startsWith('--- 1 ')), /expected 2026-11-18 \(Wed\) \| queued for 2026-11-17 \| set-200/);
  const fbOnly = await execute(t, { posts: WEEK, argv: ['--mode', 'plan-week', '--platform', 'facebook'] });
  assert.deepEqual(fbOnly.calls.map(c => c.endpoint), ['debug_token', 'me', 'page/posts']);
  assert.match(fbOnly.out, /\| set-200 \| 2 slides \| facebook\n/);
});

test('plan-week works with no token: local queue only, no network, says the live check was skipped', async t => {
  const queue = queueOf(t, [OLD, ...WEEK]);
  const logs = [];
  const code = await run({ argv: ['--mode', 'plan-week'], env: { QUEUE_DIR: queue }, fetchImpl: () => assert.fail('unexpected fetch'),
    now: () => NOW, log: line => logs.push(line), preflight: true });
  assert.equal(code, 0);
  const out = logs.join('\n');
  assert.match(out, /live check: skipped \(META_PAGE_TOKEN not set\)/);
  assert.equal(out.split('\n').filter(line => line.startsWith('--- ')).length, 7);
  assert.ok(!out.includes('set-150'));
  // Every other mode still refuses to run without the token.
  for (const argv of [[], ['--mode', 'plan'], ['--mode', 'bogus']]) {
    const lines = [];
    assert.equal(await run({ argv, env: {}, fetchImpl: () => assert.fail('unexpected fetch'), log: line => lines.push(line), preflight: true }), 5);
    assert.deepEqual(lines, ['UNVERIFIED: META_PAGE_TOKEN not set']);
  }
});

test('plan-week reports an unreadable platform and an empty queue', async t => {
  const broken = await execute(t, { posts: WEEK, argv: ['--mode', 'plan-week'],
    handler: c => c.method === 'GET' && c.endpoint === 'ig/media' ? json({ error: { code: 10, message: 'cannot read' } }, 400) : undefined });
  assert.equal(broken.code, 1);
  assert.match(broken.out, /live check: incomplete \(instagram could not be read\)/);
  assert.ok(!broken.calls.some(c => c.method === 'POST' && c.endpoint !== 'debug_token'));
  const empty = await execute(t, { posts: [], argv: ['--mode', 'plan-week'] });
  assert.equal(empty.code, 0);
  assert.match(empty.out, /plan-week: next 0 queued posts/);
  assert.ok(empty.logs.at(-1).endsWith('nothing queued'));
});

test('a post older than the newest 50 live posts still counts as posted', async t => {
  const filler = Array.from({ length: 50 }, (_, i) => ({ caption: `Other post ${i}.`, message: `Other post ${i}.`,
    timestamp: '2026-11-10T12:00:00+0000', created_time: '2026-11-10T12:00:00+0000' }));
  const old = { caption: 'Hook line for 128.\nmore', message: 'Hook line for 128.\nmore',
    timestamp: '2026-09-01T12:00:00+0000', created_time: '2026-09-01T12:00:00+0000' };
  const result = await execute(t, { handler: c => {
    if (c.method !== 'GET' || !['ig/media', 'page/posts'].includes(c.endpoint)) return undefined;
    if (c.url.searchParams.get('after') === 'c1') return json({ data: [old] });
    // Graph echoes the token into `next`; the publisher must drop it before following the link.
    const next = new URL(`https://graph.facebook.com/v23.0/${c.endpoint}?limit=50&after=c1`);
    next.searchParams.set('access_token', 'fixture');
    return json({ data: filler, paging: { next: next.href } });
  } });
  assert.equal(result.code, 0);
  assert.ok(result.logs.at(-1).endsWith('nothing due'));
  assert.ok(!result.calls.some(c => c.method === 'POST' && c.endpoint !== 'debug_token'));
  assert.ok(result.calls.filter(c => c.method === 'GET').every(c => !c.url.searchParams.has('access_token')));
});

test('the real queue: every set gets its own campaign and the week view renders', () => {
  const queue = path.resolve(import.meta.dirname, 'queue');
  const seen = new Map();
  for (const entry of fs.readdirSync(queue, { withFileTypes: true }).filter(e => e.isDirectory())) {
    const record = validatePost(JSON.parse(fs.readFileSync(path.join(queue, entry.name, 'post.json'), 'utf8')), path.join(queue, entry.name));
    assert.equal(record.valid, true, `${entry.name}: ${record.reason}`);
    const campaign = campaignFor(record.id);
    assert.match(campaign, /^set-\d+$/, entry.name);
    assert.ok(!seen.has(campaign), `${campaign} used by ${seen.get(campaign)} and ${entry.name}`);
    seen.set(campaign, entry.name);
    assert.ok(record.captionFb.includes(`utm_source=facebook&utm_medium=social&utm_campaign=${campaign}`), entry.name);
    assert.ok(!/utm_/.test(record.caption), `${entry.name}: Instagram caption must stay as approved`);
  }
  assert.ok(seen.size > 0);
});
