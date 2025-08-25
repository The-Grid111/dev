// scripts/svg-sanity.mjs
import fs from "node:fs";
import path from "node:path";

const scan = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? scan(p) : p;
  });

const candidates = [
  "favicon.svg",
  ...((fs.existsSync("assets/images") && scan("assets/images")) || []),
].filter((p) => p.endsWith(".svg"));

if (!candidates.length) {
  console.log("No SVGs found. Skipping.");
  process.exit(0);
}

let bad = 0;

for (const file of candidates) {
  const buf = fs.readFileSync(file);
  const txt = buf.toString("utf8");

  // Basic parse checks
  if (!/^<\s*svg[\s>]/i.test(txt)) {
    console.error(`❌ ${file}: Not an <svg> root element.`);
    bad++;
    continue;
  }
  if (!/viewBox="/i.test(txt)) {
    console.error(`❌ ${file}: Missing viewBox (needed for responsive sizing).`);
    bad++;
  }
  if (/<script[\s>]/i.test(txt)) {
    console.error(`❌ ${file}: Contains <script> — not allowed in our SVGs.`);
    bad++;
  }
  const kb = Math.round(buf.length / 1024);
  if (kb > 200) {
    console.error(`❌ ${file}: Too large (${kb}KB). Keep ≤ 200KB.`);
    bad++;
  } else {
    console.log(`✅ ${file} (${kb}KB) OK`);
  }
}

if (bad) {
  console.error(`\n${bad} SVG issue(s) detected.`);
  process.exit(1);
} else {
  console.log("\nAll SVGs passed.");
}
