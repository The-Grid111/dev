// scripts/apply-update.mjs
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const repoRoot = process.cwd();
const updatePath = path.join(repoRoot, "assets", "data", "update.json");

function die(msg) { console.error(msg); process.exit(1); }
function safePath(p) {
  const full = path.join(repoRoot, p.replace(/^\/+/, "")); // no leading slash
  const rel = path.relative(repoRoot, full);
  if (rel.startsWith("..")) die(`Refusing to write outside repo: ${p}`);
  return full;
}

if (!fs.existsSync(updatePath)) die("assets/data/update.json not found.");
const spec = JSON.parse(fs.readFileSync(updatePath, "utf8"));

if (!spec || !Array.isArray(spec.ops)) die("update.json must have an array 'ops'.");

const results = [];
for (const [i, op] of spec.ops.entries()) {
  const kind = op.op;
  if (!kind) die(`ops[${i}] missing 'op'`);
  if (["write","append","delete","mkdir"].indexOf(kind) === -1) {
    die(`Unsupported op '${kind}' in ops[${i}]`);
  }

  if (kind === "mkdir") {
    if (!op.path) die(`ops[${i}] mkdir missing path`);
    const full = safePath(op.path);
    fs.mkdirSync(full, { recursive: true });
    results.push({ i, kind, path: op.path, status: "ok" });
    continue;
  }

  if (kind === "delete") {
    if (!op.path) die(`ops[${i}] delete missing path`);
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
  if (!op.path) die(`ops[${i}] ${kind} missing path`);
  const full = safePath(op.path);
  fs.mkdirSync(path.dirname(full), { recursive: true });

  let content = "";
  if (typeof op.content === "string") {
    content = op.content;
  } else if (typeof op.content_b64 === "string") {
    content = Buffer.from(op.content_b64, "base64").toString("utf8");
  } else {
    die(`ops[${i}] ${kind} requires 'content' (string) or 'content_b64'`);
  }

  if (kind === "write") {
    fs.writeFileSync(full, content, "utf8");
    results.push({ i, kind, path: op.path, status: "written", bytes: content.length });
  } else if (kind === "append") {
    fs.appendFileSync(full, content, "utf8");
    results.push({ i, kind, path: op.path, status: "appended", bytes: content.length });
  }
}

console.log("apply-update summary:", JSON.stringify(results, null, 2));

// Optional: clear ops after apply (so next run is explicit)
// Comment out if you prefer to keep history.
// spec.ops = [];
// fs.writeFileSync(updatePath, JSON.stringify(spec, null, 2) + "\n");
