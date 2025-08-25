// scripts/apply-update.mjs
// Reads dev/dev/data/update.json and applies ops to the repo.
// Supported ops: mkdir, touch, write, append, delete, move, copy
// Optional: scope = "root" (default) or "dev" (writes under "dev/dev/")

import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const cfgPath  = path.join(repoRoot, "dev", "dev", "data", "update.json");

function log(...a){ console.log("[apply-update]", ...a); }
function warn(...a){ console.warn("[apply-update][warn]", ...a); }
function err(...a){ console.error("[apply-update][error]", ...a); }

function resolveTarget(p, scope = "root") {
  const prefix = scope === "dev" ? "dev/dev/" : "";
  const rel = path.join(prefix, String(p || "").replace(/^\/+/, ""));
  const full = path.join(repoRoot, rel);
  const safe = path.relative(repoRoot, full);
  if (!p || safe.startsWith("..")) throw new Error(`Refusing path outside repo or empty: "${p}"`);
  return full;
}

function ensureDirFor(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readContent(op) {
  if (typeof op.content === "string") return op.content;
  if (typeof op.content_b64 === "string") return Buffer.from(op.content_b64, "base64").toString("utf8");
  throw new Error(`op requires "content" or "content_b64"`);
}

let summary = [];
let hadError = false;

try {
  if (!fs.existsSync(cfgPath)) {
    log("No update file found at", path.relative(repoRoot, cfgPath), "— nothing to apply.");
    process.exit(0);
  }
  const spec = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
  const ops = Array.isArray(spec.ops) ? spec.ops : [];
  if (!ops.length) {
    log("No ops in update.json — skipping apply.");
    process.exit(0);
  }

  log(`Applying ${ops.length} op(s) from`, path.relative(repoRoot, cfgPath));
  for (let i = 0; i < ops.length; i++) {
    const op = ops[i] || {};
    const where = `ops[${i}]`;
    try {
      const kind  = String(op.op || "").toLowerCase();
      const scope = op.scope || "root";

      switch (kind) {
        case "note": {
          summary.push({ i, op: kind, note: op.content || "" });
          break;
        }
        case "mkdir": {
          const full = resolveTarget(op.path, scope);
          fs.mkdirSync(full, { recursive: true });
          summary.push({ i, op: kind, path: op.path, scope, status: "ok" });
          break;
        }
        case "touch": {
          const full = resolveTarget(op.path, scope);
          ensureDirFor(full);
          fs.closeSync(fs.openSync(full, "a"));
          summary.push({ i, op: kind, path: op.path, scope, status: "ok" });
          break;
        }
        case "write": {
          const full = resolveTarget(op.path, scope);
          const content = readContent(op);
          ensureDirFor(full);
          fs.writeFileSync(full, content, "utf8");
          summary.push({ i, op: kind, path: op.path, scope, status: "written", bytes: content.length });
          break;
        }
        case "append": {
          const full = resolveTarget(op.path, scope);
          const content = readContent(op);
          ensureDirFor(full);
          fs.appendFileSync(full, content, "utf8");
          summary.push({ i, op: kind, path: op.path, scope, status: "appended", bytes: content.length });
          break;
        }
        case "delete": {
          const full = resolveTarget(op.path, scope);
          if (fs.existsSync(full)) {
            fs.rmSync(full, { recursive: true, force: true });
            summary.push({ i, op: kind, path: op.path, scope, status: "deleted" });
          } else {
            summary.push({ i, op: kind, path: op.path, scope, status: "skipped_not_found" });
          }
          break;
        }
        case "move":
        case "copy": {
          if (!op.path || !op.dest) throw new Error(`"${kind}" requires "path" and "dest"`);
          const from = resolveTarget(op.path, scope);
          const to   = resolveTarget(op.dest, scope);
          if (!fs.existsSync(from)) {
            summary.push({ i, op: kind, path: op.path, dest: op.dest, scope, status: "skipped_src_missing" });
            break;
          }
          // ensure dest dir exists
          ensureDirFor(to);
          const stat = fs.lstatSync(from);
          if (stat.isDirectory()) {
            copyDir(from, to);
            if (kind === "move") fs.rmSync(from, { recursive: true, force: true });
          } else {
            fs.copyFileSync(from, to);
            if (kind === "move") fs.rmSync(from, { force: true });
          }
          summary.push({ i, op: kind, path: op.path, dest: op.dest, scope, status: "ok" });
          break;
        }
        default:
          summary.push({ i, op: kind || "(missing)", status: "ignored_unknown_op" });
      }
    } catch (e) {
      hadError = true;
      summary.push({ i, error: String(e.message || e) });
      err(where, "-", e.message || e);
    }
  }
} catch (e) {
  hadError = true;
  summary.push({ fatal: String(e.message || e) });
  err("fatal", "-", e.message || e);
}

// Print a clear summary for Action logs
log("summary:\n" + JSON.stringify(summary, null, 2));

// Don’t block the pipeline; we want inventory/snapshot to still run.
// If you prefer hard-fail on any error, change to: process.exit(hadError ? 1 : 0)
process.exit(0);

// helpers
function copyDir(src, dst) {
  if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dst, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}
