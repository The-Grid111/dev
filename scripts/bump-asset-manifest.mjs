// scripts/bump-asset-manifest.mjs
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = "assets";
const MANIFEST = path.join(ROOT, "manifest.json");

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : p;
  });

if (!fs.existsSync(ROOT)) {
  console.log("No assets/ folder; nothing to do.");
  process.exit(0);
}

const files = walk(ROOT).filter((p) => p !== MANIFEST);
const entries = files.map((p) => {
  const buf = fs.readFileSync(p);
  const hash = crypto.createHash("sha256").update(buf).digest("hex");
  return { path: p.replace(/\\/g, "/"), sha256: hash };
});

const versionSeed = entries.map((e) => e.sha256).join("");
const version = "assets-" + crypto.createHash("sha1").update(versionSeed).digest("hex").slice(0, 12);

const manifest = { version, generatedAt: new Date().toISOString(), files: entries };

const prev = fs.existsSync(MANIFEST) ? fs.readFileSync(MANIFEST, "utf8") : "";
const next = JSON.stringify(manifest, null, 2);

if (prev.trim() === next.trim()) {
  console.log("No asset changes. Manifest unchanged.");
} else {
  fs.writeFileSync(MANIFEST, next + "\n");
  console.log(`Wrote ${MANIFEST} with version ${version}`);
}
