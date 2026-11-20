import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const QUEUE = path.join(ROOT, 'social/queue');
const require = createRequire(import.meta.url);

function dateValue(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '') || !Number.isFinite(Date.parse(value))
    || new Date(value).toISOString().slice(0, 10) !== value) throw new Error('date must be a valid YYYY-MM-DD');
  return value;
}

function packageFile(pkg, name) {
  if (typeof name !== 'string' || !name) throw new Error('missing package file name');
  const filename = fs.realpathSync(path.resolve(pkg, name));
  const relative = path.relative(fs.realpathSync(pkg), filename);
  if (relative.startsWith('..') || path.isAbsolute(relative) || !fs.statSync(filename).isFile()) throw new Error('file outside package');
  return filename;
}

async function sync(pkg, publishOn, Jimp) {
  const manifest = JSON.parse(fs.readFileSync(path.join(pkg, 'manifest.json'), 'utf8'));
  if (manifest.mission_qa_status !== 'pass' || manifest.review_status !== 'ready_for_publisher') throw new Error(`package not approved: ${pkg}`);
  if (!/^[a-zA-Z0-9_-]+$/.test(manifest.id ?? '')) throw new Error('invalid package id');
  const destination = path.join(QUEUE, manifest.id);
  if (fs.existsSync(destination)) throw new Error(`destination already exists: ${destination}`);
  if (!Array.isArray(manifest.slide_order) || manifest.slide_order.length < 2 || manifest.slide_order.length > 10) throw new Error('requires 2-10 slides');
  // A package built for a 9:16 TikTok week ships its own 4:5 set in instagram/; use it, never squash the tall slides.
  const ig = manifest.instagram && typeof manifest.instagram.slides_dir === 'string' ? manifest.instagram : null;
  const caption = fs.readFileSync(packageFile(pkg, (ig && ig.caption_file) || manifest.caption_file));
  if (!caption.toString('utf8').trim() || [...caption.toString('utf8')].length > 2200) throw new Error('caption must contain 1-2200 characters');
  // Complete image conversion before creating the destination so failed reads leave no partial post.
  const images = [];
  for (const name of manifest.slide_order) {
    // TikTok packages keep slides in slides/; older ones keep them at the top level.
    const rel = ig ? path.join(ig.slides_dir, name) : fs.existsSync(path.resolve(pkg, name)) ? name : path.join('slides', name);
    const image = await Jimp.read(packageFile(pkg, rel));
    if (Math.abs(image.bitmap.width / image.bitmap.height - 0.8) > 0.01) throw new Error(`slide is not 4:5: ${rel} in ${pkg}`);
    image.resize(1080, 1350).quality(88);
    images.push(await image.getBufferAsync(Jimp.MIME_JPEG || 'image/jpeg'));
  }
  fs.mkdirSync(QUEUE, { recursive: true });
  fs.mkdirSync(destination); // Exclusive: never overwrite an existing package.
  const slides = images.map((_, i) => `slide-${String(i + 1).padStart(2, '0')}.jpg`);
  for (let i = 0; i < images.length; i++) fs.writeFileSync(path.join(destination, slides[i]), images[i]);
  fs.writeFileSync(path.join(destination, 'caption.txt'), caption);
  // Approval is written last; an interrupted conversion cannot create an approved partial post.
  fs.writeFileSync(path.join(destination, 'post.json'), `${JSON.stringify({
    id: manifest.id, title: manifest.title, publish_on: publishOn, approved: true,
    platforms: ['instagram', 'facebook'], slides, caption_file: 'caption.txt', source: `tiktok-carousel-queue/${path.basename(path.dirname(pkg))}/${path.basename(pkg)}`,
  }, null, 2)}\n`);
  console.log(`synced: ${manifest.id} (${publishOn})`);
}

export async function main(argv = process.argv.slice(2)) {
  if (process.env.CI) throw new Error('sync runs locally only');
  const options = {};
  for (let i = 0; i < argv.length; i++) {
    if (!['--from', '--publish-on', '--jimp', '--all-scheduled', '--start'].includes(argv[i]) || !argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error('invalid arguments');
    options[argv[i].slice(2)] = argv[++i];
  }
  if (Boolean(options.from) === Boolean(options['all-scheduled'])) throw new Error('choose --from or --all-scheduled');
  if (options.from ? (!options['publish-on'] || options.start) : (!options.start || options['publish-on'])) throw new Error('provide --publish-on for --from, or --start for --all-scheduled');
  const start = dateValue(options['publish-on'] || options.start);
  const loaded = require(options.jimp || 'C:/Users/built/BTH/02-app/bth-app-native/node_modules/jimp-compact');
  const Jimp = loaded.default || loaded;
  if (options.from) return sync(path.resolve(options.from), start, Jimp);
  const scheduled = path.resolve(options['all-scheduled'], 'scheduled');
  const folders = fs.readdirSync(scheduled, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name).sort();
  let offset = 0;
  for (const folder of folders) {
    const pkg = path.join(scheduled, folder);
    const manifest = JSON.parse(fs.readFileSync(path.join(pkg, 'manifest.json'), 'utf8'));
    if (!/^[a-zA-Z0-9_-]+$/.test(manifest.id ?? '')) throw new Error('invalid package id');
    if (fs.existsSync(path.join(QUEUE, manifest.id))) { console.log(`skip: ${manifest.id} already queued`); continue; }
    const date = new Date(`${start}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + offset);
    await sync(pkg, date.toISOString().slice(0, 10), Jimp);
    offset++;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { await main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
