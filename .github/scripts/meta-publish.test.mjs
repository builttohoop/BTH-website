import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { etDate, normalizeFirstLine, validatePost, pickDuePost, buildFbCaption, redact, loadQueue, run } from '../../social/meta-publish.mjs';

const TOKEN = 'secret-test-token+123';
const FB_URL = 'https://built-to-hoop.com/reset.html?utm_source=facebook&utm_medium=social&utm_campaign=autopost';
const NOW = new Date('2026-11-17T23:00:00Z');
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });

function fixture(t) {
  const queue = fs.mkdtempSync(path.join(os.tmpdir(), 'bth-meta-test-'));
  t.after(() => fs.rmSync(queue, { recursive: true, force: true }));
  const dir = path.join(queue, 'test-post');
  fs.mkdirSync(dir);
  const post = { id: 'test-post', title: 'Fixture', publish_on: '2026-11-17', approved: true,
    platforms: ['instagram', 'facebook'], slides: ['slide-01.jpg', 'slide-02.jpg', 'slide-03.jpg'], caption_file: 'caption.txt' };
  for (const slide of post.slides) fs.writeFileSync(path.join(dir, slide), Buffer.from([0xff, 0xd8, 0xff, 0xd9]));
  fs.writeFileSync(path.join(dir, 'caption.txt'), 'A clear first line.\nGet the reset, link in bio.\n');
  const save = () => fs.writeFileSync(path.join(dir, 'post.json'), JSON.stringify(post));
  save();
  return { queue, dir, post, save };
}

function mock({ liveIg = [], liveFb = [], handler } = {}) {
  const calls = [];
  const fetchImpl = async (rawUrl, init = {}) => {
    const url = new URL(rawUrl);
    const method = init.method ?? 'GET';
    const body = new URLSearchParams(init.body);
    const endpoint = url.pathname.replace(/^\/v23\.0\//, '');
    const call = { url, method, body, endpoint, init };
    calls.push(call);
    assert.ok(!rawUrl.includes(TOKEN));
    if (url.hostname !== 'graph.facebook.com') {
      assert.equal(init.headers?.Authorization, undefined);
      return handler?.(call, calls) ?? new Response('', { status: 200, headers: { 'content-type': 'image/jpeg' } });
    }
    if (method === 'GET') assert.equal(init.headers.Authorization, `Bearer ${TOKEN}`);
    else {
      assert.equal(body.get('access_token'), TOKEN);
      assert.equal(init.headers['Content-Type'], 'application/x-www-form-urlencoded');
      assert.equal(url.search, '');
    }
    const override = handler?.(call, calls);
    if (override) return override;
    if (endpoint === 'me') return json({ id: 'page', name: 'BTH', instagram_business_account: { id: 'ig', username: 'bth' } });
    if (endpoint === 'ig/content_publishing_limit') return json({ config: { quota_total: 100 }, quota_usage: 0 });
    if (endpoint === 'ig/media' && method === 'GET') return json({ data: liveIg });
    if (endpoint === 'page/posts') return json({ data: liveFb });
    if (endpoint === 'ig/media' && body.get('media_type') === 'CAROUSEL') return json({ id: 'container' });
    if (endpoint === 'ig/media' && method === 'POST') return json({ id: `child-${calls.filter(c => c.body.has('image_url')).length}` });
    if (endpoint === 'container') return json({ status_code: 'FINISHED' });
    if (endpoint === 'ig/media_publish') return json({ id: 'media' });
    if (endpoint === 'media') return json({ permalink: 'https://instagram.example/p/fixture' });
    if (endpoint === 'page/photos') return json({ id: `photo-${calls.filter(c => c.endpoint === 'page/photos').length}` });
    if (endpoint === 'page/feed') return json({ id: 'page_post' });
    throw new Error(`unexpected request: ${method} ${endpoint}`);
  };
  return { fetchImpl, calls };
}

async function execute(t, settings = {}) {
  const f = fixture(t);
  settings.prepare?.(f);
  const transport = mock(settings);
  const logs = [];
  const sleeps = [];
  const code = await run({ argv: settings.argv ?? ['--mode', 'publish'],
    env: { 'META_PAGE_TOKEN': TOKEN, QUEUE_DIR: f.queue, ...settings.env },
    fetchImpl: transport.fetchImpl, now: () => NOW, log: line => logs.push(line), sleep: async ms => { sleeps.push(ms); } });
  assert.ok(!logs.join('\n').includes(TOKEN));
  return { ...transport, ...f, code, logs, sleeps };
}

test('etDate uses New York across UTC midnight and daylight saving', () => {
  assert.equal(etDate('2026-11-18T00:00:00Z'), '2026-11-17');
  assert.equal(etDate('2026-11-18T05:00:00Z'), '2026-11-18');
  assert.equal(etDate('2026-07-18T03:59:59Z'), '2026-07-17');
  assert.equal(etDate('2026-07-18T04:00:00Z'), '2026-07-18');
});

test('normalizeFirstLine skips blank lines and strips punctuation and emoji', () => {
  assert.equal(normalizeFirstLine('\n  READY,   to HOOP?! 🏀\nSecond line'), 'ready to hoop');
  assert.equal(normalizeFirstLine(''), '');
  assert.equal(normalizeFirstLine('Crème: déjà vu!'), 'crème déjà vu');
});

test('validatePost accepts approved post and rejects invalid inputs', t => {
  const { dir, post } = fixture(t);
  assert.equal(validatePost(post, dir).valid, true);
  const bad = [
    [{ approved: false }, /not approved/],
    [{ slides: ['slide-01.jpg'] }, /2-10/],
    [{ slides: Array(11).fill('slide-01.jpg') }, /2-10/],
    [{ slides: ['slide-01.jpg', 'missing.jpg'] }, /ENOENT/],
    [{ slides: ['slide-01.jpg', 'slide-02.png'] }, /\.jpg/],
    [{ caption_file: 'missing.txt' }, /ENOENT/],
    [{ caption_file: '../caption.txt' }, /inside/],
    [{ publish_on: '2026-02-30' }, /date/],
    [{ id: '../escape' }, /id/],
  ];
  for (const [changes, reason] of bad) {
    const result = validatePost({ ...post, ...changes }, dir);
    assert.equal(result.valid, false);
    assert.match(result.reason, reason);
  }
  fs.writeFileSync(path.join(dir, 'caption.txt'), ' ');
  assert.match(validatePost(post, dir).reason, /empty/);
  fs.writeFileSync(path.join(dir, 'caption.txt'), 'a'.repeat(2201));
  assert.match(validatePost(post, dir).reason, /2200/);
});

test('loadQueue lists malformed and unapproved posts and tolerates missing queue', t => {
  const f = fixture(t);
  const logs = [];
  f.post.approved = false; f.save();
  assert.equal(loadQueue(f.queue, line => logs.push(line))[0].valid, false);
  assert.match(logs[0], /not approved/);
  fs.writeFileSync(path.join(f.dir, 'post.json'), '{');
  assert.equal(loadQueue(f.queue)[0].valid, false);
  assert.deepEqual(loadQueue(path.join(f.queue, 'absent')), []);
});

test('pickDuePost orders dates then ids, skips future/invalid and dedupes per platform', () => {
  const make = (id, date = '2026-11-17') => ({ id, publish_on: date, valid: true, platforms: ['instagram', 'facebook'], caption: id, captionFb: id });
  const posts = [make('z'), make('a'), make('old', '2026-11-16'), make('future', '2026-11-18')];
  assert.equal(pickDuePost(posts, '2026-11-17', {}).id, 'old');
  const live = { instagram: [{ caption: 'old!' }], facebook: [] };
  assert.equal(pickDuePost(posts, '2026-11-17', live).id, 'old');
  live.facebook.push({ message: 'OLD' });
  assert.equal(pickDuePost(posts, '2026-11-17', live).id, 'a');
  assert.equal(pickDuePost([make('future', '2026-11-18')], '2026-11-17', {}), undefined);
  assert.equal(pickDuePost([{ ...make('bad'), valid: false }], '2026-11-17', {}), undefined);
});

test('buildFbCaption replaces the phrase with punctuation preserved or appends URL', () => {
  assert.equal(buildFbCaption('Reset, LINK IN BIO.'), `Reset, ${FB_URL}.`);
  assert.equal(buildFbCaption('Reset. link in bio'), `Reset. ${FB_URL}`);
  assert.equal(buildFbCaption('Reset today.\n'), `Reset today.\n\n${FB_URL}`);
});

test('redact removes literal and encoded tokens and access_token parameters', () => {
  assert.equal(redact(`error ${TOKEN} access_token=placeholder x=1`, TOKEN), 'error [REDACTED] access_token=[REDACTED] x=1');
  assert.ok(!redact(encodeURIComponent(TOKEN), TOKEN).includes('123'));
  assert.match(redact('ACCESS_TOKEN=placeholder '), /REDACTED/);
});

test('full three-slide publish follows exact ordered Graph flow with secure token transport', async t => {
  const { calls, code, logs } = await execute(t);
  assert.equal(code, 0);
  assert.deepEqual(calls.map(c => `${c.method} ${c.endpoint}`), [
    'GET me', 'GET ig/media', 'GET page/posts',
    'GET /social/queue/test-post/slide-01.jpg', 'GET /social/queue/test-post/slide-02.jpg', 'GET /social/queue/test-post/slide-03.jpg',
    'POST ig/media', 'POST ig/media', 'POST ig/media', 'POST ig/media',
    'GET container', 'POST ig/media_publish', 'GET media',
    'POST page/photos', 'POST page/photos', 'POST page/photos', 'POST page/feed',
  ]);
  const childCalls = calls.filter(c => c.body.has('image_url'));
  childCalls.forEach((c, i) => {
    assert.equal(c.body.get('is_carousel_item'), 'true');
    assert.ok(c.body.get('image_url').endsWith(`slide-0${i + 1}.jpg`));
  });
  const parent = calls.find(c => c.body.get('media_type') === 'CAROUSEL');
  assert.equal(parent.body.get('children'), 'child-1,child-2,child-3');
  assert.equal(parent.body.get('caption'), 'A clear first line.\nGet the reset, link in bio.\n');
  assert.equal(calls.find(c => c.endpoint === 'ig/media_publish').body.get('creation_id'), 'container');
  const feed = calls.find(c => c.endpoint === 'page/feed');
  assert.equal(feed.body.get('message'), `A clear first line.\nGet the reset, ${FB_URL}.\n`);
  for (let i = 0; i < 3; i++) assert.deepEqual(JSON.parse(feed.body.get(`attached_media[${i}]`)), { media_fbid: `photo-${i + 1}` });
  assert.ok(logs.includes('instagram: published https://instagram.example/p/fixture'));
  assert.ok(logs.includes('facebook: published page_post'));
});

test('dedupe skips both platforms without writes or public image requests', async t => {
  const result = await execute(t, {
    liveIg: [{ caption: 'A CLEAR first line!', timestamp: '2026-11-16T12:00:00Z' }],
    liveFb: [{ message: 'A clear first line.', created_time: '2026-11-16T12:00:00Z' }],
  });
  assert.equal(result.code, 0);
  assert.equal(result.calls.length, 3);
  assert.ok(result.logs.includes('nothing due'));
});

test('per-platform dedupe still publishes the missing platform', async t => {
  const r = await execute(t, { liveIg: [{ caption: 'A clear first line.', timestamp: '2026-11-16T12:00:00Z' }] });
  assert.equal(r.code, 0);
  assert.ok(!r.calls.some(c => c.method === 'POST' && c.endpoint.startsWith('ig/')));
  assert.ok(r.calls.some(c => c.endpoint === 'page/feed'));
});

test('daily cap skips each platform based on New York date', async t => {
  const r = await execute(t, { liveIg: [{ caption: 'Other', timestamp: '2026-11-18T00:00:00Z' }],
    liveFb: [{ message: 'Other', created_time: '2026-11-17T15:00:00-0500' }] });
  assert.equal(r.code, 0);
  assert.equal(r.calls.length, 3);
  assert.ok(r.logs.includes('cap: already posted today on instagram'));
  assert.ok(r.logs.includes('cap: already posted today on facebook'));
});

test('Instagram cap permits Facebook and explicit post bypasses date and cap', async t => {
  const liveIg = [{ caption: 'Other', timestamp: '2026-11-17T19:00:00Z' }];
  const capped = await execute(t, { liveIg });
  assert.equal(capped.code, 0);
  assert.ok(capped.calls.some(c => c.endpoint === 'page/feed'));
  const explicit = await execute(t, { liveIg, argv: ['--mode', 'publish', '--post', 'test-post'],
    prepare: f => { f.post.publish_on = '2099-01-01'; f.save(); } });
  assert.equal(explicit.code, 0);
  assert.ok(explicit.calls.some(c => c.endpoint === 'ig/media_publish'));
});

test('Instagram failure still publishes Facebook and redacts error output', async t => {
  const r = await execute(t, { handler: c => c.method === 'POST' && c.endpoint === 'ig/media'
    ? json({ error: { code: 190, message: `${TOKEN} access_token=placeholder leaked`, fbtrace_id: 'trace' } }, 400) : undefined });
  assert.equal(r.code, 1);
  assert.ok(r.calls.some(c => c.endpoint === 'page/feed'));
  assert.ok(r.logs.some(line => /code=190.*fbtrace_id=trace/.test(line)));
  assert.ok(!r.logs.join('').includes('another'));
});

test('failed Instagram live read blocks its writes while Facebook proceeds', async t => {
  const r = await execute(t, { handler: c => c.method === 'GET' && c.endpoint === 'ig/media'
    ? json({ error: { code: 190, message: 'cannot read' } }, 400) : undefined });
  assert.equal(r.code, 1);
  assert.ok(!r.calls.some(c => c.endpoint === 'ig/media_publish'));
  assert.ok(r.calls.some(c => c.endpoint === 'page/feed'));
});

test('missing token exits 5 without fetch', async () => {
  const logs = [];
  const code = await run({ env: {}, fetchImpl: () => assert.fail('unexpected fetch'), log: line => logs.push(line) });
  assert.equal(code, 5);
  assert.deepEqual(logs, ['UNVERIFIED: META_PAGE_TOKEN not set']);
});

test('plan and publish --dry discover and dedupe but do not write or check images', async t => {
  for (const argv of [['--mode', 'plan'], ['--mode', 'publish', '--dry']]) {
    const r = await execute(t, { argv });
    assert.equal(r.code, 0);
    assert.equal(r.calls.length, 3);
    const plan = JSON.parse(r.logs[0]);
    assert.equal(plan.id, 'test-post');
    assert.equal(plan.slides.length, 3);
    assert.ok(plan.caption_facebook.includes(FB_URL));
  }
});

test('check discovers accounts and prints publishing quota; no linked IG fails', async t => {
  const r = await execute(t, { argv: ['--mode', 'check'] });
  assert.equal(r.code, 0);
  assert.deepEqual(r.calls.map(c => c.endpoint), ['me', 'ig/content_publishing_limit']);
  const missing = await execute(t, { handler: c => c.endpoint === 'me' ? json({ id: 'page', name: 'BTH' }) : undefined });
  assert.equal(missing.code, 1);
  assert.match(missing.logs.join(''), /No Instagram professional account linked/);
});

test('Graph POST retries transient errors three times with 5/15/45s backoff', async t => {
  let tries = 0;
  const r = await execute(t, { handler: c => {
    if (c.endpoint === 'ig/media' && c.method === 'POST' && tries++ < 3) return json({ error: { code: 4, message: 'rate limited' } }, 400);
  } });
  assert.equal(r.code, 0);
  assert.deepEqual(r.sleeps, [5000, 15000, 45000]);
});

test('exhausted transient POST retries fail platform, Facebook still publishes', async t => {
  const r = await execute(t, { handler: c => c.endpoint === 'ig/media' && c.method === 'POST' ? json({}, 503) : undefined });
  assert.equal(r.code, 1);
  assert.deepEqual(r.sleeps, [5000, 15000, 45000]);
  assert.ok(r.calls.some(c => c.endpoint === 'page/feed'));
});

test('public image check retries Pages lag and blocks all writes on wrong MIME', async t => {
  let tries = 0;
  const lag = await execute(t, { handler: c => c.url.hostname !== 'graph.facebook.com' && tries++ === 0
    ? new Response('', { status: 404 }) : undefined });
  assert.equal(lag.code, 0);
  assert.deepEqual(lag.sleeps, [30000]);
  const bad = await execute(t, { handler: c => c.url.hostname !== 'graph.facebook.com'
    ? new Response('', { headers: { 'content-type': 'text/html' } }) : undefined });
  assert.equal(bad.code, 1);
  assert.equal(bad.sleeps.length, 20);
  assert.ok(!bad.calls.some(c => c.method === 'POST'));
  assert.match(bad.logs.join(''), /slide unavailable.*slide-01\.jpg/);
});

test('Instagram polls until finished and handles terminal status and timeout', async t => {
  let polls = 0;
  const wait = await execute(t, { handler: c => c.endpoint === 'container' && polls++ === 0 ? json({ status_code: 'IN_PROGRESS' }) : undefined });
  assert.equal(wait.code, 0);
  assert.deepEqual(wait.sleeps, [5000]);
  for (const status of ['ERROR', 'EXPIRED', 'IN_PROGRESS']) {
    const r = await execute(t, { handler: c => c.endpoint === 'container' ? json({ status_code: status }) : undefined });
    assert.equal(r.code, 1);
    assert.ok(!r.calls.some(c => c.endpoint === 'ig/media_publish'));
    assert.ok(r.calls.some(c => c.endpoint === 'page/feed'));
    if (status === 'IN_PROGRESS') assert.equal(r.sleeps.length, 60);
  }
});

test('explicit Facebook caption and platform flag are honored', async t => {
  const r = await execute(t, { argv: ['--mode', 'publish', '--platform', 'facebook'], prepare: f => {
    fs.writeFileSync(path.join(f.dir, 'facebook.txt'), 'Separate Facebook caption');
    f.post.caption_fb_file = 'facebook.txt'; f.save();
  } });
  assert.equal(r.code, 0);
  assert.ok(!r.calls.some(c => c.endpoint.startsWith('ig/')));
  assert.equal(r.calls.find(c => c.endpoint === 'page/feed').body.get('message'), 'Separate Facebook caption');
});

test('malformed Instagram live timestamps do not stop Facebook', async t => {
  const r = await execute(t, { liveIg: [{ caption: 'Other', timestamp: 'invalid' }] });
  assert.equal(r.code, 1);
  assert.ok(!r.calls.some(c => c.endpoint === 'ig/media_publish'));
  assert.ok(r.calls.some(c => c.endpoint === 'page/feed'));
});

test('Facebook failure returns 1 after Instagram succeeds', async t => {
  const r = await execute(t, { handler: c => c.endpoint === 'page/photos'
    ? json({ error: { code: 190, message: 'permission denied', fbtrace_id: 'fb-trace' } }, 400) : undefined });
  assert.equal(r.code, 1);
  assert.ok(r.logs.some(line => line.startsWith('instagram: published')));
  assert.ok(r.logs.some(line => /facebook: failed:.*code=190/.test(line)));
  assert.equal(r.calls.filter(c => c.endpoint === 'page/photos').length, 1);
});

test('explicit deduped post remains skipped even though it bypasses daily cap', async t => {
  const r = await execute(t, { argv: ['--mode', 'publish', '--post', 'test-post'],
    liveIg: [{ caption: 'A clear first line.', timestamp: '2026-11-17T19:00:00Z' }],
    liveFb: [{ message: 'A clear first line.', created_time: '2026-11-17T19:00:00Z' }] });
  assert.equal(r.code, 0);
  assert.equal(r.calls.length, 3);
  assert.ok(r.logs.includes('nothing due'));
});
