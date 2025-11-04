// utils/ast.js
import * as esprima from "esprima";

/**
 * Extract top-level functions, classes, and the full module
 * from a JS/TS source file.
 */
export function extractUnits(source) {
  const out = [];
  try {
    const ast = esprima.parseModule(source, { range: true, loc: true });

    function traverse(node) {
      if (!node || typeof node !== "object") return;
      if (node.type === "FunctionDeclaration" || node.type === "ClassDeclaration") {
        const snippet = source.slice(node.range[0], node.range[1]);
        out.push({
          type: node.type === "ClassDeclaration" ? "class" : "function",
          name: node.id?.name || null,
          start: node.loc.start.line,
          end: node.loc.end.line,
          snippet,
        });
      }
      for (const key in node) {
        const val = node[key];
        if (Array.isArray(val)) val.forEach(traverse);
        else if (typeof val === "object") traverse(val);
      }
    }

    traverse(ast);
  } catch {
    // fallback: return entire file
    out.push({
      type: "module",
      name: null,
      start: 1,
      end: source.split("\n").length,
      snippet: source,
    });
  }

  if (out.length === 0) {
    out.push({
      type: "module",
      name: null,
      start: 1,
      end: source.split("\n").length,
      snippet: source,
    });
  }

  return out;
}
