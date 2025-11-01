// backend/utils/parseCode.js
import fs from "fs-extra";
import path from "path";
import * as babelParser from "@babel/parser";
import traverse from "@babel/traverse";

export async function parseProject(directoryPath) {
  const results = [];

  // recursively collect JS/TS files
  async function walk(dir) {
    const files = await fs.readdir(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) await walk(filePath);
      else if (file.endsWith(".js") || file.endsWith(".ts"))
        await parseFile(filePath);
    }
  }

  async function parseFile(filePath) {
    const code = await fs.readFile(filePath, "utf8");
    try {
      const ast = babelParser.parse(code, {
        sourceType: "module",
        plugins: ["typescript", "jsx"],
      });

      traverse(ast, {
        FunctionDeclaration({ node }) {
          results.push({
            type: "function",
            name: node.id ? node.id.name : "anonymous",
            file: filePath,
            startLine: node.loc?.start.line,
            endLine: node.loc?.end.line,
          });
        },
        ClassDeclaration({ node }) {
          results.push({
            type: "class",
            name: node.id ? node.id.name : "anonymous",
            file: filePath,
            startLine: node.loc?.start.line,
            endLine: node.loc?.end.line,
          });
        },
      });
    } catch (err) {
      console.warn(`⚠️ Could not parse ${filePath}`);
    }
  }

  await walk(directoryPath);
  return results;
}
