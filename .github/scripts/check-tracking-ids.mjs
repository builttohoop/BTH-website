#!/usr/bin/env node
// Check the shared tracking source first; never maintain a second hardcoded ID list.
// Currently bth-tracking.js forwards events and leaves initialization to page heads.
// Every tracked *.html in the repo is scanned (09-archive and node_modules excluded), so a
// wrong or missing pixel on any page fails, not only on a hand-kept list (review of #184).
import { readFileSync, readdirSync } from 'node:fs';

if (process.argv.includes('--help')) {
  console.log('Usage: node .github/scripts/check-tracking-ids.mjs\nRun from the repository root. Checks assets/bth-tracking.js and every *.html outside 09-archive/ and node_modules/ for distinct GA4, Google Ads, GTM and Meta init IDs. Exactly one ID per family passes; zero (a deleted tag) or more than one (drift) fails; comments are included.');
  process.exit(0);
}

const SOURCE = 'assets/bth-tracking.js';
const EXCLUDED_DIRS = new Set(['.git', '.github', 'node_modules', '09-archive']);
// A family may carry several patterns; every match lands in the same ID set.
// (?<![\w-]) keeps `hero-G-ABCDEF1`-style class names out of the GA4/Ads/GTM sets.
const families = [
  { name: 'GA4', patterns: [/(?<![\w-])G-[A-Z0-9]{6,}\b/g] },
  { name: 'Google Ads', patterns: [/(?<![\w-])AW-[0-9]+\b/g] },
  { name: 'GTM', patterns: [/(?<![\w-])GTM-[A-Z0-9]+\b/g] },
  {
    name: 'Meta',
    patterns: [
      // fbq('init', '<id>') with or without a trailing advanced-matching object.
      /\bfbq\s*\(\s*(['"])init\1\s*,\s*(['"])([0-9]+)\2\s*[,)]/g,
      // the <noscript> pixel: https://www.facebook.com/tr?id=<id>&ev=PageView
      /facebook\.com\/tr\?id=([0-9]+)/g,
    ],
    group: [3, 1],
  },
].map((family) => ({ ...family, ids: new Map() }));

function htmlFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.has(entry.name)) files.push(...htmlFiles(dir === '.' ? entry.name : `${dir}/${entry.name}`));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(dir === '.' ? entry.name : `${dir}/${entry.name}`);
    }
  }
  return files;
}

function scan(file) {
  const text = readFileSync(file, 'utf8');
  for (const family of families) {
    family.patterns.forEach((pattern, index) => {
      const group = Array.isArray(family.group) ? family.group[index] : (family.group ?? 0);
      for (const match of text.matchAll(pattern)) {
        const id = match[group];
        const location = `${file}:${text.slice(0, match.index).split('\n').length}`;
        if (!family.ids.has(id)) family.ids.set(id, new Set());
        family.ids.get(id).add(location);
      }
    });
  }
}

try {
  // IDs in SOURCE participate in the same set, so any page disagreement fails.
  scan(SOURCE);
  const files = htmlFiles('.');
  if (files.length === 0) throw new Error('no HTML pages found from the repository root');
  for (const file of files) scan(file);
  console.log(`scanned ${files.length} HTML pages + ${SOURCE}`);
  for (const family of families) {
    if (family.ids.size === 1) {
      console.log(`PASS: ${family.name} ID set: ${[...family.ids.keys()].join(', ')}`);
    } else if (family.ids.size === 0) {
      console.error(`FAIL: ${family.name} has 0 IDs - the tag is missing from every page (a vacuous pass is refused).`);
      process.exitCode = 1;
    } else {
      console.error(`FAIL: ${family.name} has ${family.ids.size} distinct IDs.`);
      for (const [id, locations] of family.ids) {
        for (const location of locations) console.error(`  ${location} ${id}`);
      }
      process.exitCode = 1;
    }
  }
} catch (error) {
  console.error(`FAIL: tracking ID check could not complete: ${error.message}`);
  process.exitCode = 1;
}
