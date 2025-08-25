// scripts/apply-update.mjs  (tolerant version)
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const updatePath = path.join(repoRoot, "assets", "data", "update.json");

const results = [];
let hadFatal = false;

function note(...a){ console.log("[apply-update]", ...a); }
function warn(...a){ console.warn("[apply-update][warn]", ...a); }
function err(...a){ console.error("[apply-update][error]", ...a); }
function safePath(p) {
  const full = path.join(repoRoot, String(p||"").replace(/^\/+/, ""));
  const rel = path.relative(repoRoot, full);
  if (!p || rel.startsWith("..")) throw new Error(`Refusing path outside repo or empty path: "${p}"`);
  return full;
}

try {
  if (!fs.existsSync(updatePath)) throw new Error("assets/data/update.json not found");
  const spec = JSON.parse(fs.readFileSync(updatePath, "utf8"));
  if (!spec || !Array.isArray(spec.ops)) throw new Error("update.json must have array 'ops'");

  for (let i=0; i<spec.ops.length; i++){
    const op = spec.ops[i] || {};
    const where = `ops[${i}]`;
    try {
      const kind = op.op;
      if (!kind) throw new Error(`${where} missing 'op'`);
      if (!["write","append","delete","mkdir"].includes(kind)) throw new Error(`${where} unsupported op '${kind}'`);

      if (kind === "mkdir"){
        const full = safePath(op.path);
        fs.mkdirSync(full, { recursive:true });
        results.push({i, kind, path: op.path, status:"ok"});
        continue;
      }

      if (kind === "delete"){
        const full = safePath(op.path);
        if (fs.existsSync(full)) {
          fs.rmSync(full, { recursive:true, force:true });
          results.push({i, kind, path: op.path, status:"deleted"});
        } else {
          results.push({i, kind, path: op.path, status:"skipped_not_found"});
        }
        continue;
      }

      // write / append
      const full = safePath(op.path);
      fs.mkdirSync(path.dirname(full), { recursive:true });

      let content = "";
      if (typeof op.content === "string") content = op.content;
      else if (typeof op.content_b64 === "string") content = Buffer.from(op.content_b64, "base64").toString("utf8");
      else throw new Error(`${where} ${kind} requires 'content' or 'content_b64'`);

      if (kind === "write"){
        fs.writeFileSync(full, content, "utf8");
        results.push({i, kind, path: op.path, status:"written", bytes: content.length});
      } else {
        fs.appendFileSync(full, content, "utf8");
        results.push({i, kind, path: op.path, status:"appended", bytes: content.length});
      }
    } catch(e){
      hadFatal = true; // mark an error, but continue to process remaining ops
      results.push({i, error: String(e.message||e)});
      err(where, "-", e.message||e);
    }
  }

} catch(e) {
  // Truly fatal (bad JSON / missing file)
  hadFatal = true;
  results.push({fatal: String(e.message||e)});
  err("fatal", "-", e.message||e);
}

// Always print a summary so the log is useful
note("summary:\n" + JSON.stringify(results, null, 2));

// Exit nonzero only if there was a fatal (keeps CI honest but won't hide partial success)
process.exit(hadFatal ? 1 : 0);
