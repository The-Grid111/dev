// scripts/apply-update.mjs — autodetect root or /dev update.json, write with correct base
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

// Prefer dev/assets/data/update.json if present, else assets/data/update.json
const devUpdate = path.join(repoRoot, "dev", "assets", "data", "update.json");
const rootUpdate = path.join(repoRoot, "assets", "data", "update.json");

let updatePath = null;
let basePrefix = ""; // prefix for write targets when update.json lives under /dev
if (fs.existsSync(devUpdate)) {
  updatePath = devUpdate;
  basePrefix = "dev/";
} else if (fs.existsSync(rootUpdate)) {
  updatePath = rootUpdate;
  basePrefix = ""; // root
} else {
  console.error("[apply-update] ERROR: update.json not found in assets/data/ or dev/assets/data/");
  process.exit(1);
}

function note(...a){ console.log("[apply-update]", ...a); }
function err(...a){ console.error("[apply-update][error]", ...a); }

function safePath(p) {
  const relTarget = path.join(basePrefix, String(p || "").replace(/^\/+/, "")); // prefix dev/ if needed
  const full = path.join(repoRoot, relTarget);
  const rel = path.relative(repoRoot, full);
  if (!p || rel.startsWith("..")) throw new Error(`Refusing path outside repo or empty path: "${p}"`);
  return full;
}

let hadError = false;
const results = [];

try {
  const spec = JSON.parse(fs.readFileSync(updatePath, "utf8"));
  if (!spec || !Array.isArray(spec.ops)) throw new Error("update.json must have array 'ops'");

  note(`using update file: ${path.relative(repoRoot, updatePath)}`);
  note(`base write prefix: ${basePrefix || "(repo root)"}`);

  for (let i = 0; i < spec.ops.length; i++) {
    const op = spec.ops[i] || {};
    const where = `ops[${i}]`;
    try {
      const kind = op.op;
      if (!kind) throw new Error(`${where} missing 'op'`);
      if (!["write","append","delete","mkdir"].includes(kind)) throw new Error(`${where} unsupported op '${kind}'`);
      if (!op.path) throw new Error(`${where} missing 'path'`);

      if (kind === "mkdir") {
        const full = safePath(op.path);
        fs.mkdirSync(full, { recursive: true });
        results.push({ i, kind, path: op.path, status: "ok" });
        continue;
      }

      if (kind === "delete") {
        const full = safePath(op.path);
        if (fs.existsSync(full)) {
          fs.rmSync(full, { recursive: true, force: true });
          results.push({ i, kind, path: op.path, status: "deleted" });
        } else {
          results.push({ i, kind, path: op.path, status: "skipped_not_found" });
        }
        continue;
      }

      // write / append
      const full = safePath(op.path);
      fs.mkdirSync(path.dirname(full), { recursive: true });

      let content = "";
      if (typeof op.content === "string") content = op.content;
      else if (typeof op.content_b64 === "string") content = Buffer.from(op.content_b64, "base64").toString("utf8");
      else throw new Error(`${where} ${kind} requires 'content' or 'content_b64'`);

      if (kind === "write") {
        fs.writeFileSync(full, content, "utf8");
        results.push({ i, kind, path: op.path, status: "written", bytes: content.length });
      } else {
        fs.appendFileSync(full, content, "utf8");
        results.push({ i, kind, path: op.path, status: "appended", bytes: content.length });
      }
    } catch (e) {
      hadError = true; // record but keep going so we get a full summary
      results.push({ i, error: String(e.message || e) });
      err(where, "-", e.message || e);
    }
  }
} catch (e) {
  hadError = true;
  results.push({ fatal: String(e.message || e) });
  err("fatal", "-", e.message || e);
}

// Always print a summary
note("summary:\n" + JSON.stringify(results, null, 2));

// Nonzero if any op failed (keeps CI honest), but we still processed as many as possible
process.exit(hadError ? 1 : 0);
