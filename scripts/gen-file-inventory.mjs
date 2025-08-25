import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const OUTDIR = path.join(ROOT, "dev", "data");

// folders to ignore in the listing (safe defaults)
const IGNORE = new Set([".git", "node_modules", ".github", ".vscode", ".DS_Store"]);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const e of entries) {
    if (IGNORE.has(e.name)) continue;
    const p = path.join(dir, e.name);
    const rel = path.relative(ROOT, p).replace(/\\/g, "/");
    if (e.isDirectory()) {
      files = files.concat(walk(p));
    } else {
      const size = fs.statSync(p).size;
      files.push({ path: rel, bytes: size });
    }
  }
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

function asText(list) {
  return list.map(f => `${f.path} (${f.bytes} B)`).join("\n") + "\n";
}

fs.mkdirSync(OUTDIR, { recursive: true });
const files = walk(ROOT);

fs.writeFileSync(
  path.join(OUTDIR, "file-tree.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), files }, null, 2)
);
fs.writeFileSync(
  path.join(OUTDIR, "file-tree.txt"),
  asText(files)
);

console.log(`✅ File inventory written: ${files.length} files → dev/data/file-tree.{json,txt}`);
