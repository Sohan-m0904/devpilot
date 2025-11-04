export function inferLanguage(filePath) {
  const ext = filePath.split(".").pop();
  if (["js","jsx"].includes(ext)) return "javascript";
  if (["ts","tsx"].includes(ext)) return "typescript";
  if (ext === "py") return "python";
  return "unknown";
}
