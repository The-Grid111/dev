import { createHash } from 'crypto';
import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join, extname, relative } from 'path';

const roots = ['assets/images', 'assets/css', 'assets/js', 'assets/videos'];
const outFile = 'assets/manifest.json';
const manifest = {};

function* walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

function hashContents(path) {
  const h = createHash('sha1');
  h.update(readFileSync(path));
  return h.digest('hex').slice(0, 10);
}

for (const root of roots) {
  try {
    for (const file of walk(root)) {
      if (statSync(file).size === 0) continue;
      const ext = extname(file).toLowerCase();
      const key = relative('assets', file).replace(/\\/g, '/'); // e.g. images/foo.svg
      const fingerprint = hashContents(file);
      manifest[key] = { hash: fingerprint, bytes: statSync(file).size, ext };
    }
  } catch (_) { /* root may not exist yet */ }
}

writeFileSync(outFile, JSON.stringify(manifest, null, 2));
console.log(`Wrote ${outFile} with ${Object.keys(manifest).length} entries`);
