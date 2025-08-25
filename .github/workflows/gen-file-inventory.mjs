#!/usr/bin/env node
/**
 * Generate repo inventory in three formats:
 *  - dev/data/file-tree.json (structured)
 *  - dev/data/file-tree.txt  (indented tree, easy copy/paste)
 *  - dev/data/file-tree.csv  (path,size(bytes))
 *
 * Safe to run in Actions or locally (Node 18+).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const REPO_ROOT  = path.resolve(__dirname, "../.."); // repo root
const OUT_DIR    = path.resolve(REPO_ROOT, "dev/data");

// -------- configuration -------
const INCLUDE_DOTFILES = false;     // set true if you want .env, etc.
const IGNORES = new Set([
  ".git",
  ".github",           // include if you want workflows listed (remove this line)
  "node_modules",
  ".DS_Store",
  "dist",
  "build",
  ".cache"
]);
// --------------------------------

const ensureDir = (p) => fs.mkdirSync(p, { recursive: true });

function listDir(absDir, relDir = "") {
  const entries = fs.readdirSync(absDir, { withFileTypes: true });

  // optional dotfile filter
  const filtered = entries.filter((e) => {
    if (!INCLUDE_DOTFILES && e.name.startsWith(".")) return false;
    if (IGNORES.has(e.name)) return false;
    return true;
  });

  // sort: folders first, then files; alpha within
  filtered.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name, "en");
  });

  const items = [];
  for (const entry of filtered) {
    const abs = path.join(absDir, entry.name);
    const rel = path.join(relDir, entry.name);
    if (entry.isDirectory()) {
      items.push({
        type: "dir",
        name: entry.name,
        path: rel.replaceAll("\\", "/"),
        children: listDir(abs, rel)
      });
    } else {
      const stat = fs.statSync(abs);
      items.push({
        type: "file",
        name: entry.name,
        path: rel.replaceAll("\\", "/"),
        size: stat.size
      });
    }
  }
  return items;
}

function toTextTree(nodes, indent = "") {
  let out = "";
  const branch = (i, n) => (i === n - 1 ? "└─ " : "├─ ");
  const nextIndent = (i, n) => indent + (i === n - 1 ? "   " : "│  ");

  nodes.forEach((node, i) => {
    out += `${indent}${branch(i, nodes.length)}${node.name}\n`;
    if (node.type === "dir") {
      out += toTextTree(node.children, nextIndent(i, nodes.length));
    }
  });
  return out;
}

function toCSV(nodes, rows = []) {
  nodes.forEach((node) => {
    if (node.type === "file") {
      rows.push([node.path, node.size]);
    } else {
      toCSV(node.children, rows);
    }
  });
  return rows;
}

function main() {
  ensureDir(OUT_DIR);
  const tree = listDir(REPO_ROOT, "");
  const jsonOut = {
    repo: path.basename(REPO_ROOT),
    generatedAt: new Date().toISOString(),
    root: "",
    tree
  };

  // JSON
  fs.writeFileSync(
    path.join(OUT_DIR, "file-tree.json"),
    JSON.stringify(jsonOut, null, 2),
    "utf8"
  );

  // TXT
  const txt = `${jsonOut.repo} (generated ${jsonOut.generatedAt})\n` +
              toTextTree(tree);
  fs.writeFileSync(path.join(OUT_DIR, "file-tree.txt"), txt, "utf8");

  // CSV
  const csvRows = [["path", "size_bytes"], ...toCSV(tree)];
  const csv = csvRows.map((r) => r.map(String).join(",")).join("\n");
  fs.writeFileSync(path.join(OUT_DIR, "file-tree.csv"), csv, "utf8");

  console.log("Wrote:");
  console.log(" - dev/data/file-tree.json");
  console.log(" - dev/data/file-tree.txt");
  console.log(" - dev/data/file-tree.csv");
}

main();
