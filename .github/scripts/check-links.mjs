#!/usr/bin/env node
/**
 * Internal link integrity check.
 *
 * Every site-relative href/src in the shipped HTML must resolve to a real file in the repo.
 * A broken internal link is user-visible breakage that merges silently today — and it is exactly
 * the class of mistake a human skim misses and a machine never does.
 *
 * External URLs, mailto:, tel:, #anchors, and JS pseudo-links are ignored.
 * Zero dependencies.
 */

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';

// email-sequences/ is EMAIL html, not site pages — its links are Mail OS template vars, not files.
const SKIP_DIRS = new Set(['.git', 'node_modules', '.github', '_battle-hero-3d', 'reset-pdfs', 'email-sequences']);
const ATTR = /(?:href|src)\s*=\s*["']([^"']+)["']/gi;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), out);
    } else if (entry.name.endsWith('.html')) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

function isExternal(href) {
  return (
    /^(?:https?:)?\/\//i.test(href) ||
    /^(?:mailto|tel|data|javascript|blob):/i.test(href) ||
    /\{\{.*?\}\}|\$\{.*?\}/.test(href) || // template placeholder, resolved at render time
    href.startsWith('#') ||
    href.trim() === ''
  );
}

/** Resolve a site link the way a static host would. */
function resolveTarget(href, fromFile) {
  const clean = href.split(/[?#]/)[0];
  if (clean === '' || clean === '/') return 'index.html';
  const base = clean.startsWith('/') ? path.join('.', clean) : path.join(path.dirname(fromFile), clean);
  const normalized = path.normalize(base);
  if (existsSync(normalized)) {
    // A directory link resolves to its index.html.
    if (statSync(normalized).isDirectory()) {
      const idx = path.join(normalized, 'index.html');
      return existsSync(idx) ? idx : null;
    }
    return normalized;
  }
  // Extensionless page links (/about -> about.html)
  if (!path.extname(normalized) && existsSync(`${normalized}.html`)) return `${normalized}.html`;
  return null;
}

const broken = [];
let checked = 0;

for (const file of walk('.')) {
  const html = readFileSync(file, 'utf8');
  for (let m = ATTR.exec(html); m; m = ATTR.exec(html)) {
    const href = m[1];
    if (isExternal(href)) continue;
    checked += 1;
    if (!resolveTarget(href, file)) {
      const line = html.slice(0, m.index).split('\n').length;
      broken.push({ file: file.replace(/\\/g, '/'), line, href });
    }
  }
}

if (broken.length) {
  console.error(`\n✗ ${broken.length} broken internal link(s):\n`);
  for (const b of broken) console.error(`  ${b.file}:${b.line}  ->  ${b.href}`);
  console.error('');
  process.exit(1);
}

console.log(`✓ all ${checked} internal links resolve`);
