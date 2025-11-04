const MAX_CHARS = 3000; // ~ 800-1000 tokens

export function chunkSnippet(unit) {
  if (unit.snippet.length <= MAX_CHARS) return [unit];
  const parts = [];
  let i = 0;
  while (i < unit.snippet.length) {
    const slice = unit.snippet.slice(i, i + MAX_CHARS);
    parts.push({
      ...unit,
      snippet: slice
    });
    i += MAX_CHARS;
  }
  return parts;
}
