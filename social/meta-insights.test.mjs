import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { captionKeys, loadSetIndex, mapToSet, toMarkdown, dryRunPlan, run, UNVERIFIED,
  IG_FEED_METRICS, FB_POST_METRICS } from './meta-insights.mjs';

// A made-up value, assembled at run time. Every request is answered by the mock below.
const FAKE = ['unit', 'test', 'value', '0123456789'].join('+');
const NOW = new Date('2026-11-21T15:00:00Z');
const FB_URL = 'https://built-to-hoop.com/reset.html?utm_source=facebook&utm_medium=social&utm_campaign=autopost';
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
const metric = (name, value) => ({ name, period: 'lifetime', values: [{ value }], id: `x/insights/${name}/lifetime` });
const invalid = name => json({ error: { code: 100, message: `(#100) The value must be a valid insights metric: ${name}`, fbtrace_id: 'trace' } }, 400);

function queue(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bth-insights-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const add = (id, caption) => {
    fs.mkdirSync(path.join(dir, id));
    fs.writeFileSync(path.join(dir, id, 'caption.txt'), caption);
    fs.writeFileSync(path.join(dir, id, 'post.json'), JSON.stringify({ id, title: id, caption_file: 'caption.txt' }));
  };
  add('2026-11-20-set-132-ill-get-in-shape-in-january', "I'll get in shape in January. That's the lie.\nBody copy. Free 5-Day Reset, link in bio.\n#bth\n");
  add('2026-08-27-set-055-round-every-corner', 'If your drives drift wide, it is the angle. Free 5-Day Reset, link in bio.\n#bth\n');
  return dir;
}

const IG_VALUES = { views: 900, reach: 610, likes: 41, comments: 5, saved: 12, shares: 7, profile_visits: 9 };
const FB_VALUES = { post_media_view: 300, post_total_media_view_unique: 220, post_reactions_like_total: 8,
  post_clicks: 14, post_clicks_by_type: { 'other clicks': 9, 'photo view': 2, 'link clicks': 3 } };

function mock({ handler, igMedia, fbPosts } = {}) {
  const calls = [];
  const fetchImpl = async (rawUrl, init = {}) => {
    const url = new URL(rawUrl);
    const endpoint = decodeURIComponent(url.pathname.replace(/^\/v23\.0\//, ''));
    const call = { url, endpoint, init, metrics: (url.searchParams.get('metric') ?? '').split(',').filter(Boolean) };
    calls.push(call);
    assert.equal(url.hostname, 'graph.facebook.com');
    assert.equal(init.method, 'GET');
    assert.equal(init.body, undefined);
    assert.ok(!rawUrl.includes(FAKE) && !rawUrl.includes(encodeURIComponent(FAKE)), 'the token must never be in a URL');
    assert.ok(!url.searchParams.has('access_token'));
    assert.equal(init.headers.Authorization, `Bearer ${FAKE}`);
    const override = handler?.(call, calls);
    if (override) return override;
    if (endpoint === 'me') return json({ id: 'page', name: 'BTH', instagram_business_account: { id: 'ig', username: 'bth' } });
    if (endpoint === 'ig/media') return json({ data: igMedia ?? [
      { id: 'm1', caption: "I'll get in shape in January. That's the lie.\nBody copy.", timestamp: '2026-11-20T15:00:00+0000',
        permalink: 'https://instagram.example/p/m1', media_type: 'CAROUSEL_ALBUM', media_product_type: 'FEED', like_count: 40, comments_count: 4 },
    ] });
    if (endpoint === 'page/posts') return json({ data: fbPosts ?? [
      { id: 'page_1', message: `If your drives drift wide, it is the angle. Free 5-Day Reset, ${FB_URL}.\n#bth`,
        created_time: '2026-11-19T15:00:00+0000', permalink_url: 'https://facebook.example/page_1', shares: { count: 2 } },
    ] });
    if (endpoint === 'm1/insights' || endpoint === 'm2/insights') {
      if (url.searchParams.get('breakdown') === 'action_type') {
        return json({ data: [{ name: 'profile_activity', period: 'lifetime', values: [{ value: 4 }],
          total_value: { value: 4, breakdowns: [{ dimension_keys: ['action_type'], results: [
            { dimension_values: ['email'], value: 1 }, { dimension_values: ['bio_link_clicked'], value: 3 }] }] } }] });
      }
      return json({ data: call.metrics.map(name => metric(name, IG_VALUES[name])) });
    }
    if (endpoint === 'page_1/insights') return json({ data: call.metrics.map(name => metric(name, FB_VALUES[name])) });
    throw new Error(`unexpected request: ${endpoint}`);
  };
  return { fetchImpl, calls };
}

async function execute(t, settings = {}) {
  const transport = mock(settings);
  const stdout = [];
  const stderr = [];
  const code = await run({ argv: settings.argv ?? [], env: { 'META_PAGE_TOKEN': FAKE, QUEUE_DIR: queue(t), ...settings.env },
    fetchImpl: transport.fetchImpl, now: () => NOW, out: line => stdout.push(line), err: line => stderr.push(line) });
  const all = [...stdout, ...stderr].join('\n');
  assert.ok(!all.includes(FAKE) && !all.includes(encodeURIComponent(FAKE)), 'the token must never be printed');
  return { ...transport, code, stdout, stderr, all };
}

test('caption keys: strict first line plus a loose key without the link wording', () => {
  assert.deepEqual(captionKeys('\n  Hello, World!  \nsecond'), ['hello world']);
  const ig = captionKeys('Drives drift wide. Free 5-Day Reset, link in bio.');
  const fb = captionKeys(`Drives drift wide. Free 5-Day Reset, ${FB_URL}.`);
  assert.notEqual(ig[0], fb[0]);
  assert.equal(ig[1], fb[1]);
  assert.deepEqual(captionKeys(''), []);
});

test('caption-to-set mapping: first line, Facebook link variant, unmapped and ambiguous', t => {
  const dir = queue(t);
  const index = loadSetIndex(dir);
  assert.equal(index.length, 2);
  assert.deepEqual(mapToSet("I'LL GET IN SHAPE IN JANUARY — that's the lie!\nanything else", index),
    { set: 'set-132', queue_id: '2026-11-20-set-132-ill-get-in-shape-in-january', match: 'caption-first-line' });
  assert.equal(mapToSet(`If your drives drift wide, it is the angle. Free 5-Day Reset, ${FB_URL}.`, index).set, 'set-055');
  // A later campaign value on the same link (the open hardening PR) still maps.
  assert.equal(mapToSet(`If your drives drift wide, it is the angle. Free 5-Day Reset, ${FB_URL.replace('autopost', 'set-055')}.`, index).set, 'set-055');
  assert.deepEqual(mapToSet('A post made by hand in the app', index), { set: null, queue_id: null, match: 'unmapped' });
  assert.deepEqual(mapToSet(undefined, index), { set: null, queue_id: null, match: 'unmapped' });
  fs.mkdirSync(path.join(dir, '2026-12-01-set-900-copy'));
  fs.writeFileSync(path.join(dir, '2026-12-01-set-900-copy', 'caption.txt'), "I'll get in shape in January. That's the lie.\n");
  fs.writeFileSync(path.join(dir, '2026-12-01-set-900-copy', 'post.json'), JSON.stringify({ caption_file: 'caption.txt' }));
  assert.equal(mapToSet("I'll get in shape in January. That's the lie.", loadSetIndex(dir)).match, 'ambiguous');
});

test('set index skips broken folders and never reads outside a post folder', t => {
  const dir = queue(t);
  fs.mkdirSync(path.join(dir, 'broken'));
  fs.writeFileSync(path.join(dir, 'broken', 'post.json'), '{not json');
  fs.mkdirSync(path.join(dir, 'escape'));
  fs.writeFileSync(path.join(dir, 'escape', 'post.json'), JSON.stringify({ caption_file: '../2026-08-27-set-055-round-every-corner/caption.txt' }));
  assert.deepEqual(loadSetIndex(dir).map(entry => entry.set).sort(), ['set-055', 'set-132']);
  assert.deepEqual(loadSetIndex(path.join(dir, 'missing')), []);
});

test('json report: both platforms, mapped to sets, only documented metrics requested', async t => {
  const r = await execute(t);
  assert.equal(r.code, 0);
  const report = JSON.parse(r.stdout.join('\n'));
  assert.equal(report.count, 2);
  assert.equal(report.unverified_cells, 0);
  const [ig, fb] = report.posts;
  assert.deepEqual({ set: ig.set, date: ig.date, platform: ig.platform, views: ig.views, reach: ig.reach, likes: ig.likes,
    comments: ig.comments, saves: ig.saves, shares: ig.shares, profile_visits: ig.profile_visits, link_clicks: ig.link_clicks },
  { set: 'set-132', date: '2026-11-20', platform: 'instagram', views: 900, reach: 610, likes: 41, comments: 5, saves: 12, shares: 7, profile_visits: 9, link_clicks: 3 });
  assert.deepEqual({ set: fb.set, date: fb.date, platform: fb.platform, views: fb.views, reach: fb.reach, likes: fb.likes,
    comments: fb.comments, saves: fb.saves, shares: fb.shares, profile_visits: fb.profile_visits, link_clicks: fb.link_clicks, clicks_all: fb.clicks_all },
  { set: 'set-055', date: '2026-11-19', platform: 'facebook', views: 300, reach: 220, likes: 8, comments: null, saves: null, shares: 2, profile_visits: null, link_clicks: 3, clicks_all: 14 });
  const asked = new Set(r.calls.flatMap(call => call.metrics));
  for (const gone of ['impressions', 'plays', 'video_views', 'post_impressions', 'post_impressions_unique', 'engagement']) assert.ok(!asked.has(gone), gone);
  assert.deepEqual(r.calls.find(call => call.endpoint === 'm1/insights').metrics, IG_FEED_METRICS);
  assert.deepEqual(r.calls.find(call => call.endpoint === 'page_1/insights').metrics, FB_POST_METRICS);
  assert.equal(r.calls.length, 6);
  assert.equal(r.calls.find(call => call.endpoint === 'ig/media').url.searchParams.get('limit'), '30');
});

test('unknown metric degrades to UNVERIFIED for that column and the run finishes', async t => {
  const r = await execute(t, { handler: call => (call.endpoint === 'm1/insights' && call.metrics.includes('views') ? invalid('views') : undefined) });
  assert.equal(r.code, 0);
  const report = JSON.parse(r.stdout.join('\n'));
  const ig = report.posts.find(row => row.platform === 'instagram');
  assert.equal(ig.views, UNVERIFIED);
  assert.deepEqual([ig.reach, ig.likes, ig.saves, ig.shares, ig.profile_visits, ig.link_clicks], [610, 41, 12, 7, 9, 3]);
  assert.equal(report.unverified_cells, 1);
  assert.ok(report.notes.some(line => line.startsWith('instagram: views: Graph HTTP 400 code=100')));
  assert.match(r.stderr.join('\n'), /UNVERIFIED cells: 1/);
});

test('a refused likes metric falls back to the media like_count; a refused Page metric is UNVERIFIED', async t => {
  const r = await execute(t, { argv: ['--format', 'md'], handler: call => {
    if (call.metrics.includes('likes')) return invalid('likes');
    if (call.metrics.includes('post_media_view')) return invalid('post_media_view');
    return undefined;
  } });
  assert.equal(r.code, 0);
  const table = r.stdout.join('\n');
  assert.match(table, /\| Set \| Date \| Platform \| Views \| Reach \| Likes \| Comments \| Saves \| Shares \| Profile visits \| Link clicks \|/);
  assert.match(table, /\| set-132 \| 2026-11-20 \| instagram \| 900 \| 610 \| 40 \| 5 \| 12 \| 7 \| 9 \| 3 \|/);
  assert.match(table, /\| set-055 \| 2026-11-19 \| facebook \| UNVERIFIED \| 220 \| 8 \| n\/a \| n\/a \| 2 \| n\/a \| 3 \|/);
});

test('a metric refused three posts in a row is not requested again', async t => {
  const media = n => ({ id: n <= 2 ? `m${n}` : 'm1', caption: 'By hand', timestamp: '2026-11-20T15:00:00+0000', media_product_type: 'FEED' });
  const r = await execute(t, { argv: ['--platform', 'instagram'], igMedia: [1, 2, 3, 4, 5].map(media),
    handler: call => (call.metrics.includes('views') ? invalid('views') : undefined) });
  assert.equal(r.code, 0);
  const report = JSON.parse(r.stdout.join('\n'));
  assert.deepEqual(report.posts.map(row => row.views), Array(5).fill(UNVERIFIED));
  assert.deepEqual(report.posts.map(row => row.set), Array(5).fill(null));
  assert.equal(r.calls.filter(call => call.metrics.includes('views')).length, 6);
  assert.ok(report.notes.some(line => /views: refused 3 times in a row/.test(line)));
});

test('reels skip the profile metrics; missing insight data reads as n/a, not zero', async t => {
  const r = await execute(t, { argv: ['--platform', 'instagram'],
    igMedia: [{ id: 'm2', caption: 'A reel', timestamp: '2026-11-18T15:00:00+0000', media_product_type: 'REELS' }],
    handler: call => (call.endpoint === 'm2/insights' ? json({ data: [metric('views', 50)] }) : undefined) });
  const [row] = JSON.parse(r.stdout.join('\n')).posts;
  assert.deepEqual([row.views, row.reach, row.likes, row.profile_visits, row.link_clicks], [50, null, null, null, null]);
  assert.ok(!r.calls.some(call => call.metrics.includes('profile_visits') || call.metrics.includes('profile_activity')));
});

test('token never appears in any output, even when Graph echoes it back', async t => {
  const echo = () => json({ error: { code: 100, message: `bad request access_token=${FAKE} and ${encodeURIComponent(FAKE)} ${FAKE}`, fbtrace_id: 'trace' } }, 400);
  for (const argv of [[], ['--format', 'md']]) {
    const r = await execute(t, { argv, handler: call => (call.endpoint.endsWith("/insights") ? echo() : undefined) });
    assert.equal(r.code, 0);
    assert.match(r.all, /\[REDACTED\]/);
    assert.match(r.all, /UNVERIFIED/);
  }
  const expired = await execute(t, { handler: call => (call.endpoint === 'me'
    ? json({ error: { code: 190, message: `Session has expired for ${FAKE}`, fbtrace_id: 'trace' } }, 400) : undefined) });
  assert.equal(expired.code, 1);
  assert.equal(expired.stdout.length, 0);
  assert.match(expired.stderr.join('\n'), /failed: Graph HTTP 400 code=190/);
  assert.ok(!expired.all.includes('graph.facebook.com'), 'a Graph error must not print the request URL');
  const thrown = await execute(t, { handler: call => { if (call.endpoint === 'me') throw new TypeError(`fetch failed ${call.url.href} ${FAKE}`); } });
  assert.equal(thrown.code, 1);
  assert.ok(!thrown.all.includes('graph.facebook.com'));
});

test('an expired token part-way through stops the run instead of filling the table with UNVERIFIED', async t => {
  const r = await execute(t, { handler: call => (call.endpoint.endsWith('/insights')
    ? json({ error: { code: 190, message: 'Session has expired', fbtrace_id: 'trace' } }, 400) : undefined) });
  assert.equal(r.code, 1);
  assert.equal(r.stdout.length, 0);
  assert.equal(r.calls.length, 3);
});

test('one platform failing still reports the other and exits 1', async t => {
  const r = await execute(t, { handler: call => (call.endpoint === 'page/posts'
    ? json({ error: { code: 10, message: '(#10) permission denied', fbtrace_id: 'trace' } }, 403) : undefined) });
  assert.equal(r.code, 1);
  const report = JSON.parse(r.stdout.join('\n'));
  assert.deepEqual(report.posts.map(row => row.platform), ['instagram']);
  assert.ok(report.notes.some(line => line.startsWith('facebook: failed: Graph HTTP 403 code=10')));
});

test('dry run sends nothing and prints the requests with the token redacted', async t => {
  const r = await execute(t, { argv: ['--dry-run', '--limit', '5'] });
  assert.equal(r.code, 0);
  assert.equal(r.calls.length, 0);
  assert.match(r.stdout[0], /DRY RUN: nothing was sent\. META_PAGE_TOKEN is set/);
  assert.equal(r.stdout.filter(line => line.startsWith('GET https://graph.facebook.com/v23.0/')).length, 6);
  assert.ok(r.stdout.filter(line => line.startsWith('GET ')).every(line => line.includes('Bearer [REDACTED]')));
  assert.match(r.all, /metric=views%2Creach%2Clikes%2Ccomments%2Csaved%2Cshares%2Cprofile_visits/);
  assert.match(r.all, /requests when every metric is accepted: 18\./);
  const noToken = [];
  assert.equal(await run({ argv: ['--dry-run', '--platform', 'facebook'], env: {}, fetchImpl: () => { throw new Error('no network in a dry run'); },
    out: line => noToken.push(line), err: line => noToken.push(line) }), 0);
  assert.match(noToken[0], /META_PAGE_TOKEN is not set/);
  assert.equal(dryRunPlan({ version: 'v23.0', limit: 30, platforms: ['instagram', 'facebook'] }).length, 7);
});

test('no token: UNVERIFIED and exit 5 without a request; bad arguments exit 3', async () => {
  const lines = [];
  const off = () => { throw new Error('no network expected'); };
  assert.equal(await run({ env: {}, fetchImpl: off, out: l => lines.push(l), err: l => lines.push(l) }), 5);
  assert.deepEqual(lines, ['UNVERIFIED: META_PAGE_TOKEN not set']);
  for (const argv of [['--limit', '0'], ['--limit', '101'], ['--format', 'csv'], ['--platform', 'tiktok'], ['--publish']]) {
    assert.equal(await run({ argv, env: { 'META_PAGE_TOKEN': FAKE }, fetchImpl: off, out: () => {}, err: () => {} }), 3);
  }
  assert.equal(await run({ env: { 'META_PAGE_TOKEN': FAKE, META_GRAPH_VERSION: 'latest' }, fetchImpl: off, out: () => {}, err: () => {} }), 3);
});

test('markdown table handles an empty report', () => {
  const table = toMarkdown({ limit: 30, generated_at: NOW.toISOString(), graph_version: 'v23.0', posts: [], notes: [] });
  assert.match(table, /\(no posts read\)/);
});
