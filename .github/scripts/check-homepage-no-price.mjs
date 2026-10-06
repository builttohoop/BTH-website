#!/usr/bin/env node
// Approval #81a: the homepage must contain zero literal dollar-digit pairs.
import { readFileSync } from 'node:fs';

if (process.argv.includes('--help')) {
  console.log('Usage: node .github/scripts/check-homepage-no-price.mjs\nRun from the repository root. Rejects every $ followed by a digit in index.html.');
  process.exit(0);
}

try {
  const html = readFileSync('index.html', 'utf8');
  const hits = [...html.matchAll(/\$[0-9]/g)];
  if (hits.length) {
    console.error(`FAIL: homepage contains ${hits.length} dollar-digit match(es).`);
    for (const hit of hits) {
      const line = html.slice(0, hit.index).split('\n').length;
      console.error(`  index.html:${line} ${hit[0]}`);
    }
    process.exitCode = 1;
  } else {
    console.log('PASS: index.html contains 0 dollar-digit matches.');
  }
} catch (error) {
  console.error(`FAIL: homepage check could not read index.html: ${error.message}`);
  process.exitCode = 1;
}
