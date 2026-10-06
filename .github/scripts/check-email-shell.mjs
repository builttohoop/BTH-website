#!/usr/bin/env node
// Generated funnel emails must retain the approved design-system shell marker.
import { readFileSync, readdirSync } from 'node:fs';

if (process.argv.includes('--help')) {
  console.log('Usage: node .github/scripts/check-email-shell.mjs\nRun from the repository root. Requires <!-- BTH-SHELL:1B --> in every email-sequences/html/*.html file.');
  process.exit(0);
}

try {
  const dir = 'email-sequences/html';
  const files = readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
    .map((entry) => `${dir}/${entry.name}`).sort();
  if (!files.length) throw new Error(`no HTML emails found in ${dir}`);
  const missing = files.filter((file) => !readFileSync(file, 'utf8').includes('<!-- BTH-SHELL:1B -->'));
  if (missing.length) {
    console.error(`FAIL: ${missing.length} email(s) missing <!-- BTH-SHELL:1B -->.`);
    for (const file of missing) console.error(`  ${file}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: all ${files.length} HTML emails contain <!-- BTH-SHELL:1B -->.`);
  }
} catch (error) {
  console.error(`FAIL: email shell check could not complete: ${error.message}`);
  process.exitCode = 1;
}
