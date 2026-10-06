#!/usr/bin/env node
// Check the shared tracking source first; never maintain a second hardcoded ID list.
// Currently bth-tracking.js forwards events and leaves initialization to page heads.
import { readFileSync, readdirSync } from 'node:fs';

if (process.argv.includes('--help')) {
  console.log('Usage: node .github/scripts/check-tracking-ids.mjs\nRun from the repository root. Checks assets/bth-tracking.js, welcome.html, thank-you.html, join.html, index.html and lp/**/*.html for distinct GA4, Google Ads, GTM and Meta init IDs. More than one ID per family fails; comments are included.');
  process.exit(0);
}

const SOURCE = 'assets/bth-tracking.js';
const families = [
  { name: 'GA4', pattern: /G-[A-Z0-9]+/g },
  { name: 'Google Ads', pattern: /AW-[0-9]+/g },
  { name: 'GTM', pattern: /GTM-[A-Z0-9]+/g },
  { name: 'Meta', pattern: /\bfbq\s*\(\s*(['"])init\1\s*,\s*(['"])([0-9]+)\2\s*\)/g, group: 3 },
].map((family) => ({ ...family, ids: new Map() }));

function htmlFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = `${dir}/${entry.name}`;
    if (entry.isDirectory()) files.push(...htmlFiles(file));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(file);
  }
  return files;
}

function scan(file) {
  const text = readFileSync(file, 'utf8');
  for (const family of families) {
    for (const match of text.matchAll(family.pattern)) {
      const id = match[family.group ?? 0];
      const location = `${file}:${text.slice(0, match.index).split('\n').length}`;
      if (!family.ids.has(id)) family.ids.set(id, new Set());
      family.ids.get(id).add(location);
    }
  }
}

try {
  // IDs in SOURCE participate in the same set, so any page disagreement fails.
  scan(SOURCE);
  const files = ['welcome.html', 'thank-you.html', 'join.html', 'index.html', ...htmlFiles('lp')];
  for (const file of files) scan(file);
  for (const family of families) {
    if (family.ids.size > 1) {
      console.error(`FAIL: ${family.name} has ${family.ids.size} distinct IDs.`);
      for (const [id, locations] of family.ids) {
        for (const location of locations) console.error(`  ${location} ${id}`);
      }
      process.exitCode = 1;
    } else {
      console.log(`PASS: ${family.name} ID set: ${[...family.ids.keys()].join(', ') || '(none found)'}`);
    }
  }
} catch (error) {
  console.error(`FAIL: tracking ID check could not complete: ${error.message}`);
  process.exitCode = 1;
}
