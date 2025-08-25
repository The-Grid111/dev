// scripts/apply-update.mjs
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const updatePath = path.join(repoRoot, "assets", "data", "update.json");

function fail(msg) { console.error("[apply-update] ERROR:", msg); process.exit(1); }
function note(msg) { console.log("[apply-update]", msg); }
function safePath(p) {
  const full = path.join(repoRoot, p.replace(/^\/+/, "")); // strip leading slash
  const rel = path.relative(repoRoot, full);
  if (rel.startsWith("..")) fail(`Refusing to write outside repo: ${p}`);
  return full;
}

if (!fs.existsSync(updatePath)) fail("assets/data/update.json not found.");
let spec;
try {
  spec = JSON.parse(fs.readFileSync(updatePath, "utf8"));
} catch (e) {
  fail("update.json could not be parsed as JSON: " + e.message);
}
if (!spec || !Array.isArray(spec.ops)) fail("update.json must have an array 'ops'.");

const results = [];
for (const [i, op] of spec.ops.entries()) {
  const where = `ops[${i}]`;
  if (!op || !op.op) fail(`${where} is missing 'op'`);
  const kind = op.op;
  const pathStr = op.path || "";

  if (!["write","append","delete","mkdir"].includes(kind)) {
    fail(`${where} unsupported op '${kind}'`);
  }

  if (kind === "mkdir") {
    if (!pathStr) fail(`${where} mkdir missing path`);
    const full = safePath(pathStr);
    fs.mkdirSync(full, { recursive: true });
    results.push({ i, kind, path: pathStr, status: "ok" });
    continue;
  }

  if (kind === "delete") {
    if (!pathStr) fail(`${where} delete missing path`);
    const full = safePath(pathStr);
    if (fs.existsSync(full)) {
      fs.rmSync(full, { recursive: true, force: true });
      results.push({ i, kind, path: pathStr, status: "deleted" });
    } else {
      results.push({ i, kind, path: pathStr, status: "skipped_not_found" });
    }
    continue;
  }

  // write / append
  if (!pathStr) fail(`${where} ${kind} missing path`);
  const full = safePath(pathStr);
  fs.mkdirSync(path.dirname(full), { recursive: true });

  let content = "";
  if (typeof op.content === "string") {
    content = op.content;
  } else if (typeof op.content_b64 === "string") {
    content = Buffer.from(op.content_b64, "base64").toString("utf8");
  } else {
    fail(`${where} ${kind} requires 'content' (string) or 'content_b64'`);
  }

  if (kind === "write") {
    fs.writeFileSync(full, content, "utf8");
    results.push({ i, kind, path: pathStr, status: "written", bytes: content.length });
  } else {
    fs.appendFileSync(full, content, "utf8");
    results.push({ i, kind, path: pathStr, status: "appended", bytes: content.length });
  }
}

note("summary:\n" + JSON.stringify(results, null, 2));
