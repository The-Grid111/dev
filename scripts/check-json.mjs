// scripts/check-json.mjs
import fs from "node:fs";

const files = (process.env.FILES || "")
  .split(/\s+/)
  .map((s) => s.trim())
  .filter(Boolean);

let bad = 0;

for (const file of files) {
  try {
    const txt = fs.readFileSync(file, "utf8");
    JSON.parse(txt);
    console.log(`✅ ${file}`);
  } catch (err) {
    bad++;
    console.error(`❌ ${file}\n${err.message}`);
  }
}

if (bad) {
  console.error(`\n${bad} JSON file(s) invalid.`);
  process.exit(1);
} else {
  console.log("\nAll JSON validated.");
}
