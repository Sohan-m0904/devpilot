"use client";

import { useEffect, useRef, useState } from "react";
import { runQuery } from "@/lib/api";
import SnippetCard from "./SnippetCard";
import type { QueryTopItem } from "@/lib/types";

export default function ChatPanel({
  projectId,
  setNotice,
}: {
  projectId: string;
  setNotice: (s: string) => void;
}) {
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<QueryTopItem[]>([]);

  async function ask() {
    if (!projectId) {
      setNotice("Please set a valid project id");
      return;
    }
    if (!question.trim()) return;

    try {
      setBusy(true);
      const res = await runQuery(projectId, question.trim(), 5);
      setResults(res.top || []);
    } catch (e: any) {
      setNotice(`Query failed: ${e.message || e}`);
    } finally {
      setBusy(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") ask();
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="p-4 border-b border-zinc-800">
        <h2 className="font-medium">Ask your codebase</h2>
        <p className="text-sm text-zinc-400">The top 5 relevant snippets will appear below</p>
      </div>

      <div className="p-4 flex items-center gap-2">
        <input
          className="flex-1 rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm outline-none focus:border-brand-600"
          placeholder="Example: How does addition work?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKey}
        />
        <button
          onClick={ask}
          disabled={busy}
          className="px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-sm disabled:opacity-50"
        >
          Ask
        </button>
      </div>

      <div className="p-4 grid gap-3 overflow-auto">
        {results.length === 0 ? (
          <p className="text-sm text-zinc-500">No results yet</p>
        ) : (
          results.map((r, idx) => (
            <SnippetCard key={`${r.snippet_id}-${idx}`} snippet={r.snippet} score={r.score} />
          ))
        )}
      </div>
    </div>
  );
}
