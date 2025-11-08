"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileCode } from "lucide-react";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import js from "react-syntax-highlighter/dist/esm/languages/hljs/javascript";
import ts from "react-syntax-highlighter/dist/esm/languages/hljs/typescript";
import py from "react-syntax-highlighter/dist/esm/languages/hljs/python";
import json from "react-syntax-highlighter/dist/esm/languages/hljs/json";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";

SyntaxHighlighter.registerLanguage("javascript", js);
SyntaxHighlighter.registerLanguage("typescript", ts);
SyntaxHighlighter.registerLanguage("python", py);
SyntaxHighlighter.registerLanguage("json", json);

interface SnippetCardProps {
  snippet: string;
  score: number;
  filePath?: string;
}

export default function SnippetCard({
  snippet,
  score,
  filePath,
}: SnippetCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = snippet.length > 800;

  return (
    <div className="rounded-xl border border-zinc-800 bg-[#0D1117]/70 backdrop-blur-sm p-3 relative group transition-all hover:border-blue-500/40">
      {/* File header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono truncate">
          <FileCode size={14} className="text-blue-400 shrink-0" />
          <span className="truncate max-w-[180px]">
            {filePath || "Unknown File"}
          </span>
        </div>
        <span className="text-[10px] text-zinc-500">
          {(score * 100).toFixed(1)}% match
        </span>
      </div>

      {/* Code block */}
      <div
        className={`overflow-hidden rounded-lg border border-zinc-800 ${
          expanded ? "max-h-[700px]" : "max-h-[240px]"
        } transition-all duration-300`}
      >
        <SyntaxHighlighter
          language="javascript"
          style={atomOneDark}
          customStyle={{
            background: "transparent",
            fontSize: "12px",
            lineHeight: "1.5",
            margin: 0,
            padding: "12px",
          }}
        >
          {snippet}
        </SyntaxHighlighter>
      </div>

      {/* Expand toggle for long snippets */}
      {isLong && (
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-2 w-full flex items-center justify-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
        >
          {expanded ? (
            <>
              Collapse <ChevronUp size={12} />
            </>
          ) : (
            <>
              Expand <ChevronDown size={12} />
            </>
          )}
        </button>
      )}
    </div>
  );
}
