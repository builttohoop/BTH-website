// Mocked tests for social/meta-reels.mjs. No network: every request goes to the fake fetch below.
// Run: node --test social/meta-reels.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { run, validateReel, loadReelQueue, pickDueReel, buildFbReelCaption, assertFbStatusHealthy, LIMITS } from './meta-reels.mjs';

const FAKE = ['fixture', 'page', 'credential', '123+abc'].join('-');
const NOW = new Date('2026-11-21T20:00:00Z'); // 15:00 in New York, same ET day
const VIDEO = 'https://built-to-hoop.com/social/reels/test-reel/reel.mp4';
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
const video = (status = 200, type = 'video/mp4') => new Response('', { status, headers: { 'content-type': type } });

function fixture(t, overrides = {}) {
  const queue = fs.mkdtempSync(path.join(os.tmpdir(), 'bth-reels-test-'));
  t.after(() => fs.rmSync(queue, { recursive: true, force: true }));
  const dir = path.join(queue, 'test-reel');
  fs.mkdirSync(dir);
  const reel = { id: 'test-reel', title: 'Fixture', publish_on: '2026-11-21', approved: true,
    platforms: ['instagram', 'facebook'], video: 'reel.mp4', caption_file: 'caption.txt', ...overrides };
  for (const key of Object.keys(reel)) if (reel[key] === undefined) delete reel[key];
  fs.writeFileSync(path.join(dir, 'reel.mp4'), Buffer.from([0, 0, 0, 24]));
  fs.writeFileSync(path.join(dir, 'cover.jpg'), Buffer.from([0xff, 0xd8, 0xff, 0xd9]));
  fs.writeFileSync(path.join(dir, 'caption.txt'), 'One clear hook line.\nFree 5-Day Reset, link in bio.\n#builttohoop\n');
  const save = () => fs.writeFileSync(path.join(dir, 'reel.json'), JSON.stringify(reel));
  save();
  return { queue, dir, reel, save };
}

// A fake Graph + rupload + site. `handler` can override any single response.
function mock({ liveIg = [], liveFb = [], handler } = {}) {
  const calls = [];
  const fetchImpl = async (rawUrl, init = {}) => {
    const url = new URL(rawUrl);
    const method = init.method ?? 'GET';
    const body = new URLSearchParams(init.body);
    const endpoint = url.pathname.replace(/^\/v23\.0\//, '');
    const call = { url, method, body, endpoint, init, host: url.hostname };
    calls.push(call);
    assert.ok(!rawUrl.includes(FAKE), 'credential must never be in a URL');
    const override = handler?.(call, calls);
    if (override) return override;
    if (url.hostname === 'rupload.facebook.com') {
      assert.equal(init.headers.Authorization, `OAuth ${FAKE}`);
      return json({ success: true });
    }
    if (url.hostname !== 'graph.facebook.com') {
      assert.equal(init.headers?.Authorization, undefined, 'credential must not go to the video host');
      return video();
    }
    if (method === 'GET') assert.equal(init.headers.Authorization, `Bearer ${FAKE}`);
    else { assert.equal(body.get('access_token'), FAKE); assert.equal(url.search, ''); }
    if (endpoint === 'me') return json({ id: 'page', name: 'BTH', instagram_business_account: { id: 'ig', username: 'bth' } });
    if (endpoint === 'ig/content_publishing_limit') return json({ data: [{ config: { quota_total: 100 }, quota_usage: 1 }] });
    if (endpoint === 'ig/media' && method === 'GET') return json({ data: liveIg });
    if (endpoint === 'page/video_reels' && method === 'GET') return json({ data: liveFb });
    if (endpoint === 'ig/media' && method === 'POST') return json({ id: 'container' });
    if (endpoint === 'container') return json({ status_code: 'FINISHED' });
    if (endpoint === 'ig/media_publish') return json({ id: 'media' });
    if (endpoint === 'media') return json({ permalink: 'https://instagram.example/reel/fixture' });
    if (endpoint === 'page/video_reels' && body.get('upload_phase') === 'start') return json({ video_id: '777', upload_url: 'https://rupload.facebook.com/video-upload/v23.0/777' });
    if (endpoint === 'page/video_reels' && body.get('upload_phase') === 'finish') return json({ success: true });
    if (endpoint === '777') {
      const finished = calls.some(c => c.body.get('upload_phase') === 'finish');
      return json({ status: { video_status: finished ? 'ready' : 'upload_complete', uploading_phase: { status: 'complete' },
        processing_phase: { status: finished ? 'complete' : 'not_started' },
        publishing_phase: { status: finished ? 'complete' : 'not_started', publish_status: finished ? 'published' : 'draft' } } });
    }
    throw new Error(`unexpected request: ${method} ${url.hostname} ${endpoint}`);
  };
  return { calls, fetchImpl };
}

async function go(t, { argv = [], env = {}, fx, ...mockOptions } = {}) {
  const f = fx ?? fixture(t);
  const m = mock(mockOptions);
  const lines = [];
  const sleeps = [];
  const code = await run({ argv, fetchImpl: m.fetchImpl, now: () => NOW, log: line => lines.push(line), sleep: async ms => { sleeps.push(ms); },
    env: { 'META_PAGE_TOKEN': FAKE, REELS_QUEUE_DIR: f.queue, ...env } });
  const writes = m.calls.filter(c => c.method !== 'GET');
  return { code, lines, out: lines.join('\n'), calls: m.calls, writes, sleeps, ...f };
}
const PUBLISH = { argv: ['--mode', 'publish'], env: { META_AUTOPOST: 'on' } };

test('default mode is plan: prints the reel and sends no write', async t => {
  const r = await go(t);
  assert.equal(r.code, 0);
  assert.equal(r.writes.length, 0);
  const plan = JSON.parse(r.out.slice(r.out.indexOf('{')));
  assert.equal(plan.mode, 'plan');
  assert.equal(plan.graph_writes, 0);
  assert.equal(plan.video_url, VIDEO);
  assert.deepEqual(plan.platforms, ['instagram', 'facebook']);
  assert.equal(plan.video_check.ok, true);
  assert.match(plan.caption_facebook, /utm_campaign=autopost_reel/);
  assert.ok(plan.would_call.some(line => line.includes('media_type=REELS')));
  assert.ok(plan.would_call.some(line => line.includes('rupload.facebook.com')));
});

test('--mode publish without META_AUTOPOST=on is refused: exit 4, no write', async t => {
  for (const env of [{}, { META_AUTOPOST: 'off' }, { META_AUTOPOST: 'ON' }, { META_AUTOPOST: 'true' }]) {
    const r = await go(t, { argv: ['--mode', 'publish'], env });
    assert.equal(r.code, 4);
    assert.equal(r.writes.length, 0);
    assert.match(r.out, /REFUSED/);
  }
});

test('META_AUTOPOST=on without the flag still only plans', async t => {
  const r = await go(t, { env: { META_AUTOPOST: 'on' } });
  assert.equal(r.code, 0);
  assert.equal(r.writes.length, 0);
});

test('plan works with no credential and says the live checks were skipped', async t => {
  const r = await go(t, { env: { META_PAGE_TOKEN: '' } });
  assert.equal(r.code, 0);
  assert.match(r.out, /UNVERIFIED/);
  assert.ok(r.calls.every(c => c.host === 'built-to-hoop.com'));
});

test('publish and check without a credential exit 5', async t => {
  assert.equal((await go(t, { ...PUBLISH, env: { META_AUTOPOST: 'on', META_PAGE_TOKEN: '' } })).code, 5);
  assert.equal((await go(t, { argv: ['--mode', 'check'], env: { META_PAGE_TOKEN: '' } })).code, 5);
});

test('publish posts one Instagram Reel and one Facebook Reel with the documented calls', async t => {
  const r = await go(t, PUBLISH);
  assert.equal(r.code, 0, r.out);
  const create = r.writes.find(c => c.endpoint === 'ig/media');
  assert.equal(create.body.get('media_type'), 'REELS');
  assert.equal(create.body.get('video_url'), VIDEO);
  assert.equal(create.body.get('share_to_feed'), 'true');
  assert.match(create.body.get('caption'), /^One clear hook line\./);
  assert.equal(r.writes.find(c => c.endpoint === 'ig/media_publish').body.get('creation_id'), 'container');
  const upload = r.calls.find(c => c.host === 'rupload.facebook.com');
  assert.equal(upload.url.pathname, '/video-upload/v23.0/777');
  assert.equal(upload.init.headers.file_url, VIDEO);
  const finish = r.writes.find(c => c.body.get('upload_phase') === 'finish');
  assert.equal(finish.body.get('video_id'), '777');
  assert.equal(finish.body.get('video_state'), 'PUBLISHED');
  assert.match(finish.body.get('description'), /reset\.html\?utm_source=facebook/);
  assert.match(r.out, /instagram: published reel https:\/\/instagram\.example/);
  assert.match(r.out, /facebook: published reel 777/);
  assert.equal(r.writes.filter(c => c.endpoint === 'ig/media_publish').length, 1);
  assert.equal(r.writes.filter(c => c.body.get('upload_phase') === 'finish').length, 1);
  // The video is checked before the first write.
  assert.ok(r.calls.findIndex(c => c.host === 'built-to-hoop.com') < r.calls.findIndex(c => c.method !== 'GET'));
  assert.ok(!r.out.includes(FAKE));
});

test('cover and trial settings reach the Instagram container', async t => {
  const fx = fixture(t, { cover: 'cover.jpg', trial: 'MANUAL', share_to_feed: false });
  const r = await go(t, { ...PUBLISH, fx, handler: c => (c.url.pathname.endsWith('cover.jpg') ? video(200, 'image/jpeg') : undefined) });
  assert.equal(r.code, 0, r.out);
  const create = r.writes.find(c => c.endpoint === 'ig/media');
  assert.equal(create.body.get('cover_url'), 'https://built-to-hoop.com/social/reels/test-reel/cover.jpg');
  assert.deepEqual(JSON.parse(create.body.get('trial_params')), { graduation_strategy: 'MANUAL' });
  assert.equal(create.body.get('share_to_feed'), 'false');
});

test('a video URL that is not 200 stops the run before any write', async t => {
  for (const response of [() => video(404), () => video(200, 'text/html'), () => video(206)]) {
    const r = await go(t, { ...PUBLISH, handler: c => (c.host === 'built-to-hoop.com' ? response() : undefined) });
    assert.equal(r.code, 1);
    assert.equal(r.writes.length, 0);
    assert.match(r.out, /video unavailable after retries/);
    assert.equal(r.calls.filter(c => c.host === 'built-to-hoop.com').length, LIMITS.urlRetries + 1);
  }
});

test('one reel per platform per ET day: a platform that already posted today is skipped', async t => {
  const r = await go(t, { ...PUBLISH, liveIg: [{ caption: 'Earlier reel', timestamp: '2026-11-21T14:00:00+0000', media_product_type: 'REELS' }] });
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /cap: a reel already went out today on instagram/);
  assert.equal(r.writes.filter(c => c.endpoint.startsWith('ig/')).length, 0);
  assert.match(r.out, /facebook: published reel 777/);
});

test('--post does not bypass the daily cap', async t => {
  const r = await go(t, { argv: ['--mode', 'publish', '--post', 'test-reel'], env: { META_AUTOPOST: 'on' },
    liveIg: [{ caption: 'x', timestamp: '2026-11-21T14:00:00+0000', media_product_type: 'REELS' }],
    liveFb: [{ description: 'y', created_time: '2026-11-21T15:00:00+0000' }] });
  assert.equal(r.writes.length, 0);
  assert.match(r.out, /nothing due/);
});

test('a carousel posted today does not use up the reel slot, and yesterday (ET) does not count', async t => {
  const r = await go(t, { ...PUBLISH, liveIg: [
    { caption: 'Carousel', timestamp: '2026-11-21T14:00:00+0000', media_product_type: 'FEED' },
    { caption: 'Old reel', timestamp: '2026-11-21T03:30:00+0000', media_product_type: 'REELS' }] }); // 22:30 ET on the 20th
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /instagram: published reel/);
});

test('a reel already live (same first caption line) is not posted twice', async t => {
  const r = await go(t, { ...PUBLISH,
    liveIg: [{ caption: 'ONE clear hook line!\nmore', timestamp: '2026-11-10T14:00:00+0000', media_product_type: 'REELS' }],
    liveFb: [{ description: 'One clear hook line.\nmore', created_time: '2026-11-10T14:00:00+0000' }] });
  assert.equal(r.code, 0);
  assert.equal(r.writes.length, 0);
  assert.match(r.out, /nothing due/);
  const half = await go(t, { ...PUBLISH,
    liveIg: [{ caption: 'One clear hook line.', timestamp: '2026-11-10T14:00:00+0000', media_product_type: 'REELS' }] });
  assert.match(half.out, /instagram: already posted test-reel/);
  assert.equal(half.writes.filter(c => c.endpoint.startsWith('ig/')).length, 0);
  assert.match(half.out, /facebook: published reel 777/);
});

test('Instagram failing does not stop Facebook', async t => {
  const r = await go(t, { ...PUBLISH, handler: c => (c.endpoint === 'container' ? json({ status_code: 'ERROR' }) : undefined) });
  assert.equal(r.code, 1);
  assert.match(r.out, /instagram: failed: Instagram container ERROR/);
  assert.match(r.out, /facebook: published reel 777/);
  assert.equal(r.writes.filter(c => c.endpoint === 'ig/media_publish').length, 0);
});

test('Facebook failing does not stop Instagram, and a refused upload is never finished', async t => {
  const r = await go(t, { ...PUBLISH, handler: c => (c.host === 'rupload.facebook.com' ? json({ success: false }, 400) : undefined) });
  assert.equal(r.code, 1);
  assert.match(r.out, /instagram: published reel/);
  assert.match(r.out, /facebook: failed: Facebook upload HTTP 400/);
  assert.equal(r.writes.filter(c => c.body.get('upload_phase') === 'finish').length, 0);
});

test('the Instagram status poll is bounded and a timeout publishes nothing', async t => {
  const r = await go(t, { ...PUBLISH, argv: ['--mode', 'publish', '--platform', 'instagram'],
    handler: c => (c.endpoint === 'container' ? json({ status_code: 'IN_PROGRESS' }) : undefined) });
  assert.equal(r.code, 1);
  assert.equal(r.calls.filter(c => c.endpoint === 'container').length, LIMITS.igPolls);
  assert.equal(r.sleeps.filter(ms => ms === LIMITS.igPollMs).length, LIMITS.igPolls);
  assert.equal(r.writes.filter(c => c.endpoint === 'ig/media_publish').length, 0);
  assert.match(r.out, /timed out; nothing was published/);
});

test('the Facebook polls are bounded; a slow publish is reported as UNVERIFIED, not as published', async t => {
  const stuck = { status: { video_status: 'processing', uploading_phase: { status: 'complete' }, processing_phase: { status: 'in_progress' }, publishing_phase: { status: 'not_started' } } };
  const r = await go(t, { ...PUBLISH, argv: ['--mode', 'publish', '--platform', 'facebook'],
    handler: c => (c.endpoint === '777' ? json(stuck) : undefined) });
  assert.equal(r.code, 0);
  assert.equal(r.calls.filter(c => c.endpoint === '777').length, 1 + LIMITS.fbPolls);
  assert.match(r.out, /still processing \(UNVERIFIED/);
  assert.doesNotMatch(r.out, /facebook: published reel/);
});

test('a Facebook upload that never completes is not finished', async t => {
  const waiting = { status: { video_status: 'uploading', uploading_phase: { status: 'in_progress' } } };
  const r = await go(t, { ...PUBLISH, argv: ['--mode', 'publish', '--platform', 'facebook'],
    handler: c => (c.endpoint === '777' ? json(waiting) : undefined) });
  assert.equal(r.code, 1);
  assert.equal(r.calls.filter(c => c.endpoint === '777').length, LIMITS.fbPolls);
  assert.equal(r.writes.filter(c => c.body.get('upload_phase') === 'finish').length, 0);
});

test('media_publish and the Facebook finish call are never replayed on a server error', async t => {
  const r = await go(t, { ...PUBLISH, handler: c => ((c.endpoint === 'ig/media_publish' || c.body.get('upload_phase') === 'finish')
    ? json({ error: { code: 2, message: 'temporary', is_transient: true } }, 500) : undefined) });
  assert.equal(r.code, 1);
  assert.equal(r.writes.filter(c => c.endpoint === 'ig/media_publish').length, 1);
  assert.equal(r.writes.filter(c => c.body.get('upload_phase') === 'finish').length, 1);
});

test('a full Instagram quota blocks the Instagram reel only', async t => {
  const r = await go(t, { ...PUBLISH, handler: c => (c.endpoint === 'ig/content_publishing_limit'
    ? json({ data: [{ config: { quota_total: 100 }, quota_usage: 100 }] }) : undefined) });
  assert.equal(r.code, 1);
  assert.equal(r.writes.filter(c => c.endpoint.startsWith('ig/')).length, 0);
  assert.match(r.out, /facebook: published reel 777/);
});

test('the credential never appears in output, even when Graph echoes it back', async t => {
  const r = await go(t, { ...PUBLISH, handler: c => (c.endpoint === 'ig/media' && c.method === 'POST'
    ? json({ error: { code: 100, message: `bad access_token=${FAKE} and ${FAKE}` } }, 400) : undefined) });
  assert.equal(r.code, 1);
  assert.ok(!r.out.includes(FAKE));
  assert.match(r.out, /\[REDACTED\]/);
});

test('a live list that cannot be read fails that platform closed', async t => {
  const r = await go(t, { ...PUBLISH, handler: c => (c.endpoint === 'page/video_reels' && c.method === 'GET'
    ? json({ error: { code: 10, message: 'no permission' } }, 403) : undefined) });
  assert.equal(r.code, 1);
  assert.equal(r.writes.filter(c => c.endpoint === 'page/video_reels').length, 0);
  assert.match(r.out, /instagram: published reel/);
});

test('nothing due: future date, unapproved, or empty queue', async t => {
  for (const overrides of [{ publish_on: '2026-11-22' }, { approved: false }]) {
    const r = await go(t, { ...PUBLISH, fx: fixture(t, overrides) });
    assert.equal(r.code, 0);
    assert.equal(r.writes.length, 0);
    assert.match(r.out, /nothing due/);
  }
  const r = await go(t, { ...PUBLISH, env: { META_AUTOPOST: 'on', REELS_QUEUE_DIR: path.join(os.tmpdir(), 'bth-reels-missing-dir') } });
  assert.match(r.out, /nothing due/);
});

test('check mode reads and never writes', async t => {
  const r = await go(t, { argv: ['--mode', 'check'], env: { META_AUTOPOST: 'on' } });
  assert.equal(r.code, 0);
  assert.equal(r.writes.length, 0);
  assert.match(r.out, /instagram: bth \(ig\)/);
});

test('invalid arguments and settings fail without a request', async t => {
  for (const [argv, env] of [[['--mode', 'post'], {}], [['--publish'], {}], [['--platform', 'tiktok'], {}], [[], { META_GRAPH_VERSION: 'v23' }]]) {
    const r = await go(t, { argv, env });
    assert.equal(r.code, 1);
    assert.equal(r.writes.length, 0);
  }
  const r = await go(t, { env: { SITE_BASE: 'http://built-to-hoop.com' } });
  assert.equal(r.code, 1);
});

test('validateReel rejects what Meta or the host would reject', t => {
  const { dir, reel } = fixture(t);
  const reason = overrides => validateReel({ ...reel, ...overrides }, dir).reason;
  assert.equal(validateReel(reel, dir).valid, true);
  assert.match(reason({ approved: 'true' }), /not approved/);
  assert.match(reason({ id: 'other' }), /id must match/);
  assert.match(reason({ publish_on: '2026-02-30' }), /invalid publish_on/);
  assert.match(reason({ platforms: ['tiktok'] }), /invalid platforms/);
  assert.match(reason({ video: undefined }), /exactly one of/);
  assert.match(reason({ video_url: 'https://cdn.example/reel.mp4' }), /exactly one of/);
  assert.match(reason({ video: '../reel.mp4' }), /inside the reel folder/);
  assert.match(reason({ video: 'caption.txt' }), /\.mp4 or \.mov/);
  assert.match(reason({ video: 'missing.mp4' }), /not a file/);
  assert.match(reason({ video: undefined, video_url: 'http://cdn.example/reel.mp4' }), /plain public HTTPS/);
  assert.match(reason({ video: undefined, video_url: 'https://cdn.example/reel.mp4?sig=abc' }), /plain public HTTPS/);
  assert.match(reason({ video: undefined, video_url: 'https://cdn.example/reel.webm' }), /\.mp4 or \.mov/);
  assert.equal(validateReel({ ...reel, video: undefined, video_url: 'https://cdn.example/reel.mp4' }, dir).valid, true);
  assert.match(reason({ cover: 'cover.png' }), /cover must end in \.jpg/);
  assert.match(reason({ trial: 'AUTO' }), /trial must be/);
  assert.match(reason({ share_to_feed: 'yes' }), /share_to_feed/);
  fs.writeFileSync(path.join(dir, 'caption.txt'), `Hook\n${'#tag '.repeat(31)}`);
  assert.match(reason({}), /30 hashtags/);
  fs.writeFileSync(path.join(dir, 'caption.txt'), `Hook\n${'@name '.repeat(21)}`);
  assert.match(reason({}), /20 mentions/);
  fs.writeFileSync(path.join(dir, 'caption.txt'), 'x'.repeat(2201));
  assert.match(reason({}), /2200 characters/);
  fs.writeFileSync(path.join(dir, 'reel.mp4'), '');
  fs.writeFileSync(path.join(dir, 'caption.txt'), 'Hook');
  assert.match(reason({}), /video file is empty/);
});

test('an external video_url is used as is', async t => {
  const fx = fixture(t, { video: undefined, video_url: 'https://cdn.example/clips/reel.mp4' });
  const r = await go(t, { ...PUBLISH, fx });
  assert.equal(r.code, 0, r.out);
  assert.equal(r.writes.find(c => c.endpoint === 'ig/media').body.get('video_url'), 'https://cdn.example/clips/reel.mp4');
  assert.equal(r.calls.find(c => c.host === 'rupload.facebook.com').init.headers.file_url, 'https://cdn.example/clips/reel.mp4');
});

test('helpers: queue loading, due order, Facebook caption, status guard', t => {
  const { queue } = fixture(t);
  fs.mkdirSync(path.join(queue, 'broken'));
  const notes = [];
  const loaded = loadReelQueue(queue, line => notes.push(line));
  assert.equal(loaded.filter(r => r.valid).length, 1);
  assert.match(notes.join('\n'), /invalid: broken/);
  const a = { id: 'a', publish_on: '2026-11-20', platforms: ['instagram'], caption: 'A', captionFb: 'A' };
  const b = { id: 'b', publish_on: '2026-11-19', platforms: ['instagram'], caption: 'B', captionFb: 'B' };
  assert.equal(pickDueReel([a, b], '2026-11-21', {}).id, 'b');
  assert.equal(pickDueReel([a, b], '2026-11-21', { instagram: [{ caption: 'b' }] }).id, 'a');
  assert.equal(pickDueReel([a, b], '2026-11-18', {}), undefined);
  assert.match(buildFbReelCaption('Hook\nReset, link in bio.'), /Reset, https:\/\/built-to-hoop\.com\/reset\.html/);
  assert.match(buildFbReelCaption('Hook only'), /Hook only\n\nhttps:\/\/built-to-hoop\.com\/reset\.html/);
  assert.throws(() => assertFbStatusHealthy({ video_status: 'upload_failed' }), /upload_failed/);
  assert.throws(() => assertFbStatusHealthy({ processing_phase: { status: 'error', error: { message: 'bad codec' } } }), /bad codec/);
  assert.doesNotThrow(() => assertFbStatusHealthy({ video_status: 'processing', uploading_phase: { status: 'complete' } }));
});
