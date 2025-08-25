// Simple, safe SVG sanity pass
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, extname } from 'path';

const roots = ['.', 'assets/images'];
let failed = false;

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (p.includes('node_modules') || p.startsWith('.git')) continue;
      yield* walk(p);
    } else {
      yield p;
    }
  }
}

for (const root of roots) {
  for (const file of walk(root)) {
    if (extname(file).toLowerCase() !== '.svg') continue;

    const buf = readFileSync(file, 'utf8');
    const sizeKB = statSync(file).size / 1024;

    const hasSvg = /^\s*<svg[\s>]/i.test(buf);
    const hasViewBox = /\bviewBox=("|').+?\1/i.test(buf);
    const hasScript = /<script\b/i.test(buf);

    if (!hasSvg) { console.error(`::error file=${file}::Missing <svg>`); failed = true; }
    if (!hasViewBox) { console.error(`::error file=${file}::Missing viewBox attribute`); failed = true; }
    if (hasScript) { console.error(`::error file=${file}::Inline <script> not allowed`); failed = true; }
    if (sizeKB > 512) { console.error(`::warning file=${file}::SVG > 512KB (${sizeKB.toFixed(1)} KB)`); }
  }
}

if (failed) process.exit(1);
console.log('SVG sanity passed');
