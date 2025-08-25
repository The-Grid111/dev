// scripts/gen-file-inventory.mjs
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

mkdirSync("dev/data", { recursive: true });

// List all tracked files (stable, ignores .git itself)
const list = execSync("git ls-files", { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);

// Save TXT (easy to paste to me)
writeFileSync("dev/data/file-tree.txt", list.join("\n") + "\n");

// Save JSON (machine-friendly)
const payload = {
  generatedAt: new Date().toISOString(),
  branch: execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf8" }).trim(),
  commit: execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim(),
  count: list.length,
  files: list,
};
writeFileSync("dev/data/file-tree.json", JSON.stringify(payload, null, 2));
console.log(`Wrote dev/data/file-tree.{txt,json} with ${list.length} items`);
