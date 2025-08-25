// scripts/repo-snapshot.mjs
// Walk the repo and emit detailed analytics for automation.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";

const repo = process.cwd();
const outDir = path.join(repo, "dev/data");
fs.mkdirSync(outDir, { recursive: true });

function list(dir) {
  const out = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      const rel = path.relative(repo, p).replace(/\\/g, "/");
      if (rel === "" || rel.startsWith(".git")) continue; // skip root empty & .git
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

function extOf(p) {
  const b = path.basename(p);
  const i = b.lastIndexOf(".");
  if (i <= 0) return ""; // no ext or dotfile
  return b.slice(i).toLowerCase();
}

const files = list(repo);
const records = [];
let fileCount = 0;
let dirCount  = 0;
let totalBytes = 0;
const byExt = {}; // { ".js": {count, bytes} }

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
    byExt[ex].count++; byExt[ex].bytes += st.size;

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

// Sort helpers (non-destructive)
const filesOnly = records.filter(r => r.type === "file");
const largestN = [...filesOnly].sort((a,b)=>b.size-a.size).slice(0,15);
const recentN  = [...filesOnly].sort((a,b)=> (b.ts||0)-(a.ts||0)).slice(0,15);

// JSON (flat list for easy diffing)
fs.writeFileSync(path.join(outDir, "file-tree.json"), JSON.stringify(records, null, 2));

// TXT (human quick look)
const txt = records
  .map(r =>
    r.type === "dir"
      ? `[DIR] ${r.path}`
      : `${r.path}  (${r.size}B, ${r.hash}, ${r.commit || "?"}, ${r.date || "?"})`
  )
  .join("\n");
fs.writeFileSync(path.join(outDir, "file-tree.txt"), txt);

// Metrics summary
const metrics = {
  generated_at: new Date().toISOString(),
  totals: {
    files: fileCount,
    dirs: dirCount,
    bytes: totalBytes
  },
  by_extension: Object.fromEntries(
    Object.entries(byExt)
      .sort((a,b)=>b[1].bytes - a[1].bytes) // heaviest first
  ),
  largest: largestN.map(({path:sizePath, size, hash})=>({path:sizePath, size, hash})),
  most_recent: recentN.map(({path:rp, commit, date})=>({path:rp, commit, date}))
};
fs.writeFileSync(path.join(outDir, "repo-metrics.json"), JSON.stringify(metrics, null, 2));

console.log("✅ Repo snapshot written:");
console.log(" - dev/data/file-tree.json");
console.log(" - dev/data/file-tree.txt");
console.log(" - dev/data/repo-metrics.json");
