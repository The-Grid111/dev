// scripts/apply-update.mjs — reads dev/assets/data/update.json and applies ops
// Supports scope: "dev" (default) or "root", and ops: mkdir, write, append, delete, move, copy.
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const updatePath = path.join(repoRoot, "dev", "assets", "data", "update.json");

function note(...a){ console.log("[apply-update]", ...a); }
function err(...a){ console.error("[apply-update][error]", ...a); }

// scope maps paths:
//  - "dev"  -> prefix "dev/"
//  - "root" -> no prefix (repo root)
function resolveTarget(p, scope="dev") {
  const pref = scope === "root" ? "" : "dev/";
  const rel = path.join(pref, String(p || "").replace(/^\/+/, ""));
  const full = path.join(repoRoot, rel);
  const safe = path.relative(repoRoot, full);
  if (!p || safe.startsWith("..")) throw new Error(`Refusing path outside repo or empty path: "${p}"`);
  return full;
}

function ensureDirFor(filePath){
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

let hadError = false;
const results = [];

try {
  if (!fs.existsSync(updatePath)) throw new Error("dev/assets/data/update.json not found");
  const spec = JSON.parse(fs.readFileSync(updatePath, "utf8"));
  if (!spec || !Array.isArray(spec.ops)) throw new Error("update.json must have array 'ops'");

  note(`using update file: ${path.relative(repoRoot, updatePath)}`);

  for (let i=0; i<spec.ops.length; i++){
    const op = spec.ops[i] || {};
    const where = `ops[${i}]`;
    try {
      const kind  = op.op;
      const pathA = op.path;          // for single-path ops
      const dest  = op.dest;          // for move/copy
      const scope = op.scope || "dev";

      if (!kind) throw new Error(`${where} missing 'op'`);
      if (!["mkdir","write","append","delete","move","copy"].includes(kind))
        throw new Error(`${where} unsupported op '${kind}'`);

      if (kind === "mkdir"){
        if (!pathA) throw new Error(`${where} mkdir missing path`);
        const full = resolveTarget(pathA, scope);
        fs.mkdirSync(full, { recursive: true });
        results.push({ i, kind, scope, path: pathA, status: "ok" });
        continue;
      }

      if (kind === "delete"){
        if (!pathA) throw new Error(`${where} delete missing path`);
        const full = resolveTarget(pathA, scope);
        if (fs.existsSync(full)) {
          fs.rmSync(full, { recursive: true, force: true });
          results.push({ i, kind, scope, path: pathA, status: "deleted" });
        } else {
          results.push({ i, kind, scope, path: pathA, status: "skipped_not_found" });
        }
        continue;
      }

      if (kind === "move" || kind === "copy"){
        if (!pathA || !dest) throw new Error(`${where} ${kind} requires 'path' and 'dest'`);
        const from = resolveTarget(pathA, scope);
        const to   = resolveTarget(dest, scope);
        if (!fs.existsSync(from)) {
          results.push({ i, kind, scope, path: pathA, dest, status: "skipped_src_missing" });
          continue;
        }
        ensureDirFor(to);
        if (fs.lstatSync(from).isDirectory()){
          // naive dir copy/move
          copyDir(from, to);
          if (kind === "move") fs.rmSync(from, { recursive: true, force: true });
        } else {
          fs.copyFileSync(from, to);
          if (kind === "move") fs.rmSync(from, { force: true });
        }
        results.push({ i, kind, scope, path: pathA, dest, status: "ok" });
        continue;
      }

      // write / append
      if (!pathA) throw new Error(`${where} ${kind} missing path`);
      const full = resolveTarget(pathA, scope);
      ensureDirFor(full);

      let content = "";
      if (typeof op.content === "string") content = op.content;
      else if (typeof op.content_b64 === "string") content = Buffer.from(op.content_b64, "base64").toString("utf8");
      else throw new Error(`${where} ${kind} requires 'content' or 'content_b64'`);

      if (kind === "write"){
        fs.writeFileSync(full, content, "utf8");
        results.push({ i, kind, scope, path: pathA, status: "written", bytes: content.length });
      } else {
        fs.appendFileSync(full, content, "utf8");
        results.push({ i, kind, scope, path: pathA, status: "appended", bytes: content.length });
      }
    } catch (e) {
      hadError = true;
      results.push({ i, error: String(e.message || e) });
      err(where, "-", e.message || e);
    }
  }
} catch (e) {
  hadError = true;
  results.push({ fatal: String(e.message || e) });
  err("fatal", "-", e.message || e);
}

note("summary:\n" + JSON.stringify(results, null, 2));
process.exit(hadError ? 1 : 0);

// --- helpers ---
function copyDir(src, dst){
  if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })){
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}
