import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";

const repo = process.cwd();
const outDir = path.join(repo, "dev", "data");
const archiveDir = path.join(repo, "dev", "archive"); // NEW: archive history
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(archiveDir, { recursive: true });

function list(dir) {
  const out = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      const rel = path.relative(repo, p).replace(/\\/g, "/");
      if (rel === "" || rel.startsWith(".git")) continue;
      if (e.isDirectory()) {
        out.push(rel + "/");
        walk(p);
      } else {
        out.push(rel);
      }
    }
  })(dir);
  return out.sort();
}

function hashFile(f) {
  const buf = fs.readFileSync(f);
  return crypto.createHash("sha256").update(buf).digest("hex").slice(0, 12);
}

function gitInfo(f) {
  try {
    const out = execSync(`git log -1 --format="%h|%cs|%ct" -- "${f}"`, { encoding: "utf8" }).trim();
    const [commit, date, ts] = out.split("|");
    return { commit, date, ts: Number(ts) || null };
  } catch {
    return { commit: null, date: null, ts: null };
  }
}

function extOf(pth) {
  const b = path.basename(pth);
  const i = b.lastIndexOf(".");
  if (i <= 0) return "";
  return b.slice(i).toLowerCase();
}

const files = list(repo);
const records = [];
let fileCount = 0;
let dirCount = 0;
let totalBytes = 0;
const byExt = {};

for (const rel of files) {
  const full = path.join(repo, rel.replace(/\/$/, ""));
  const isDir = rel.endsWith("/");
  if (isDir) {
    dirCount++;
    records.push({ path: rel, type: "dir" });
  } else {
    const st = fs.statSync(full);
    const { commit, date, ts } = gitInfo(rel);
    const h = hashFile(full);
    const ex = extOf(rel);
    fileCount++;
    totalBytes += st.size;
    if (!byExt[ex]) byExt[ex] = { count: 0, bytes: 0 };
    byExt[ex].count++;
    byExt[ex].bytes += st.size;

    records.push({
      path: rel,
      type: "file",
      size: st.size,
      hash: h,
      ext: ex,
      commit,
      date,
      ts
    });
  }
}

const filesOnly = records.filter(r => r.type === "file");
const largestN = [...filesOnly].sort((a, b) => b.size - a.size).slice(0, 15);
const recentN = [...filesOnly].sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 15);

// JSON list
fs.writeFileSync(path.join(outDir, "file-tree.json"), JSON.stringify(records, null, 2));

// TXT quick view
const txt = records
  .map(r =>
    r.type === "dir"
      ? `[DIR] ${r.path}`
      : `${r.path}  (${r.size}B, ${r.hash}, ${r.commit || "?"}, ${r.date || "?"})`
  )
  .join("\n");
fs.writeFileSync(path.join(outDir, "file-tree.txt"), txt);

// Metrics
const metrics = {
  generated_at: new Date().toISOString(),
  totals: { files: fileCount, dirs: dirCount, bytes: totalBytes },
  by_extension: Object.fromEntries(Object.entries(byExt).sort((a, b) => b[1].bytes - a[1].bytes)),
  largest: largestN.map(({ path: p, size, hash }) => ({ path: p, size, hash })),
  most_recent: recentN.map(({ path: p, commit, date }) => ({ path: p, commit, date }))
};
fs.writeFileSync(path.join(outDir, "repo-metrics.json"), JSON.stringify(metrics, null, 2));

// NEW: timestamped archive entry
const ts = Math.floor(Date.now() / 1000);
fs.writeFileSync(
  path.join(archiveDir, `snapshot_${ts}.json`),
  JSON.stringify({ generated_at: new Date().toISOString(), records, metrics }, null, 2)
);

console.log("✅ Repo snapshot written:");
console.log(" - dev/data/file-tree.json");
console.log(" - dev/data/file-tree.txt");
console.log(" - dev/data/repo-metrics.json");
console.log(` - dev/archive/snapshot_${ts}.json`);
