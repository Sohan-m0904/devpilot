import { promises as fs } from "fs";
import path from "path";

const IGNORE_DIRS = new Set(["node_modules",".git",".next","dist","build","venv","__pycache__"]);
const ALLOWED_EXTS = new Set([".js",".jsx",".ts",".tsx",".py"]);

export async function walkFiles(root) {
  const out = [];
  async function rec(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory()) {
        if (!IGNORE_DIRS.has(e.name)) await rec(path.join(dir, e.name));
      } else {
        const ext = path.extname(e.name).toLowerCase();
        if (ALLOWED_EXTS.has(ext)) out.push(path.join(dir, e.name));
      }
    }
  }
  await rec(root);
  return out;
}
