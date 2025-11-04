import { fmtScore } from "@/lib/utils";

export default function SnippetCard({
  snippet,
  score,
}: {
  snippet: string;
  score: number;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      <div className="mb-2 text-xs text-zinc-400">Score: {fmtScore(score)}</div>
      <pre className="text-xs overflow-x-auto leading-relaxed">
        <code>{snippet}</code>
      </pre>
    </div>
  );
}
