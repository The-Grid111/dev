import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";

/* ===== retention config (long-term stable) ===== */
const KEEP_DAYS = 30;     // keep everything from last N days
const MAX_KEEP = 200;     // upper cap regardless of age
const MIN_SAFETY = 40;    // never prune below this count
/* ================================================= */

const repo = process.cwd();
const dataDir = path.join(repo, "dev", "data");
const archiveDir = path.join(repo, "dev", "archive");
fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(archiveDir, { recursive: true });

function listRepo(dir) {
  const out = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      const rel = path.relative(repo, p).replace(/\\/g, "/");
      if (!rel || rel.startsWith(".git")) continue;
      if (e.isDirectory()) {
        out.push(rel + "/");
        walk(p);
      } else out.push(rel);
    }
  })(dir);
  return out.sort();
}

function sha12(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buf).digest("hex").slice(0, 12);
}

function gitInfo(relPath) {
  try {
    const out = execSync(`git log -1 --format="%h|%cs|%ct" -- "${relPath}"`, {
      encoding: "utf8",
    }).trim();
    const [commit, date, ts] = out.split("|");
    return { commit, date, ts: Number(ts) || null };
  } catch {
    return { commit: null, date: null, ts: null };
  }
}

function extOf(p) {
  const b = path.basename(p);
  const i = b.lastIndexOf(".");
  return i <= 0 ? "" : b.slice(i).toLowerCase();
}

/* ---------- build snapshot data ---------- */
const all = listRepo(repo);

const records = [];
let files = 0, dirs = 0, totalBytes = 0;
const byExt = {};

for (const rel of all) {
  const isDir = rel.endsWith("/");
  const full = path.join(repo, rel.replace(/\/$/, ""));

  if (isDir) {
    dirs++;
    records.push({ path: rel, type: "dir" });
  } else {
    const st = fs.statSync(full);
    const gi = gitInfo(rel);
    const hash = sha12(full);
    const ex = extOf(rel);
    files++;
    totalBytes += st.size;
    byExt[ex] ||= { count: 0, bytes: 0 };
    byExt[ex].count++; byExt[ex].bytes += st.size;

    records.push({
      path: rel,
      type: "file",
      size: st.size,
      hash,
      ext: ex,
      commit: gi.commit,
      date: gi.date,
      ts: gi.ts,
    });
  }
}

const onlyFiles = records.filter(r => r.type === "file");
const largest = [...onlyFiles].sort((a,b)=>b.size-a.size).slice(0,15)
  .map(({path:p,size,hash})=>({path:p,size,hash}));
const mostRecent = [...onlyFiles].sort((a,b)=>(b.ts||0)-(a.ts||0)).slice(0,15)
  .map(({path:p,commit,date})=>({path:p,commit,date}));

/* ---------- write outputs ---------- */
fs.writeFileSync(path.join(dataDir, "file-tree.json"), JSON.stringify(records, null, 2));

const txt = records.map(r =>
  r.type === "dir"
    ? `[DIR] ${r.path}`
    : `${r.path}  (${r.size}B, ${r.hash}, ${r.commit || "?"}, ${r.date || "?"})`
).join("\n");
fs.writeFileSync(path.join(dataDir, "file-tree.txt"), txt);

const metrics = {
  generated_at: new Date().toISOString(),
  totals: { files, dirs, bytes: totalBytes },
  by_extension: Object.fromEntries(Object.entries(byExt).sort((a,b)=>b[1].bytes-a[1].bytes)),
  largest,
  most_recent: mostRecent,
};
fs.writeFileSync(path.join(dataDir, "repo-metrics.json"), JSON.stringify(metrics, null, 2));

/* ---------- archive snapshot + retention ---------- */
const ts = Math.floor(Date.now() / 1000);
const snapName = `snapshot_${ts}.json`;
const snapPath = path.join(archiveDir, snapName);
fs.writeFileSync(snapPath, JSON.stringify({ generated_at: new Date().toISOString(), records, metrics }, null, 2));

/* prune older snapshots (hybrid) */
const now = Math.floor(Date.now() / 1000);
const maxAge = KEEP_DAYS * 24 * 60 * 60;

const snaps = fs.readdirSync(archiveDir)
  .filter(n => /^snapshot_\d+\.json$/.test(n))
  .map(n => ({ name: n, ts: Number(n.match(/^snapshot_(\d+)\.json$/)[1]) }))
  .sort((a,b) => b.ts - a.ts); // newest first

// 1) time-based: delete snapshots older than KEEP_DAYS (but respect MIN_SAFETY floor)
const timePrunable = snaps.filter(s => (now - s.ts) > maxAge).slice(MIN_SAFETY);
for (const f of timePrunable) {
  try { fs.unlinkSync(path.join(archiveDir, f.name)); console.log(`🧹 pruned (age) ${f.name}`); }
  catch (e) { console.warn(`Could not delete ${f.name}:`, e?.message || e); }
}

// 2) count-based: if still above MAX_KEEP, prune the oldest beyond MAX_KEEP
const refreshed = fs.readdirSync(archiveDir)
  .filter(n => /^snapshot_\d+\.json$/.test(n))
  .map(n => ({ name: n, ts: Number(n.match(/^snapshot_(\d+)\.json$/)[1]) }))
  .sort((a,b) => b.ts - a.ts);

if (refreshed.length > MAX_KEEP) {
  const toDelete = refreshed.slice(MAX_KEEP);
  for (const f of toDelete) {
    try { fs.unlinkSync(path.join(archiveDir, f.name)); console.log(`🧹 pruned (count) ${f.name}`); }
    catch (e) { console.warn(`Could not delete ${f.name}:`, e?.message || e); }
  }
}

console.log("✅ Repo snapshot updated:");
console.log(" - dev/data/file-tree.json");
console.log(" - dev/data/file-tree.txt");
console.log(" - dev/data/repo-metrics.json");
console.log(` - dev/archive/${snapName} (hybrid retention: ${KEEP_DAYS}d / max ${MAX_KEEP}, floor ${MIN_SAFETY})`);
