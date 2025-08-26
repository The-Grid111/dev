import fs from 'node:fs/promises';
import path from 'node:path';

const event = JSON.parse(await fs.readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
const body = (event.comment?.body || '').trim();

function parseBlocks(text) {
  // Matches: /update <path>  then a fenced ```json block
  const re = /(^|\n)\/update\s+([^\s`]+)[^\S\r\n]*\r?\n```json\r?\n([\s\S]*?)\r?\n```/gi;
  const blocks = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    blocks.push({ path: m[2].trim(), json: m[3].trim() });
  }
  return blocks;
}

const blocks = parseBlocks(body);

let changed = false;
let commitParts = [];

for (const b of blocks) {
  // Validate JSON
  let parsed;
  try {
    parsed = JSON.parse(b.json);
  } catch (e) {
    console.error(`Invalid JSON for ${b.path}: ${e.message}`);
    process.exit(1);
  }

  const filePath = path.normalize(b.path);
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  const newContent = JSON.stringify(parsed, null, 2) + '\n';

  let oldContent = null;
  try {
    oldContent = await fs.readFile(filePath, 'utf8');
  } catch (_) {}

  if (oldContent !== newContent) {
    await fs.writeFile(filePath, newContent, 'utf8');
    changed = true;
    commitParts.push(`update ${filePath}`);
    console.log(`Applied update → ${filePath}`);
  } else {
    console.log(`No change for ${filePath}`);
  }
}

// Outputs for the workflow
const out = (k, v) => console.log(`::set-output name=${k}::${v}`);
out('changed', changed ? 'true' : 'false');
out('target_path', blocks.map(b => b.path).join(', '));
out('commit_message',
  commitParts.length
    ? `Issue #${event.issue?.number || '?'}: ${commitParts.join(', ')} via queue`
    : `Issue #${event.issue?.number || '?'}: no-op`
);

if (!blocks.length) {
  console.error('No /update blocks found in the comment. Use the template.');
  process.exit(1);
}
