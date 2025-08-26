import fs from "fs";

const comment = process.env.ISSUE_COMMENT || "";
const match = comment.match(/PATCH:([\s\S]*?)ENDPATCH/);

if (match) {
  const patch = match[1].trim();
  fs.writeFileSync("patch.diff", patch);
  console.log("✅ Patch extracted and written to patch.diff");
} else {
  console.log("⚠️ No patch block found in comment.");
}
