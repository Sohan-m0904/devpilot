"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { runQuery } from "@/lib/api";
import type { QueryTopItem, QueryResult } from "@/lib/types";
import { Send, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import SnippetCard from "./SnippetCard";


// Typing animation for the live explanation
function useTypewriter(text: string, speed = 20) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    if (!text) {
      setDisplayed("");
      return;
    }
    setDisplayed("");
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed((prev) => prev + text[i]);
      i++;
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  return displayed;
}

interface ChatPanelProps {
  projectId: string;
  setNotice: (msg: string) => void;
}

type DevPilotResponse = {
  explanation?: string;
  suggestion?: string;
  test_case?: any;
  code?: string;
  [key: string]: any;
};

interface ChatHistoryRow {
  id: string;
  question: string;
  response: DevPilotResponse | string;
  created_at: string;
}

// Normalize response from DB (jsonb or stringified)
function normalizeResponse(raw: any): DevPilotResponse {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      // if it's just plain text, treat as explanation
      return { explanation: raw };
    }
  }
  return raw as DevPilotResponse;
}

export default function ChatPanel({ projectId, setNotice }: ChatPanelProps) {
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);

  const [history, setHistory] = useState<ChatHistoryRow[]>([]);
  const [results, setResults] = useState<QueryTopItem[]>([]);
  const [showSnippets, setShowSnippets] = useState(false);

  // liveResponse is only for the *current* answer being typed
  const [liveResponse, setLiveResponse] = useState<DevPilotResponse | null>(null);
  const typedExplanation = useTypewriter(liveResponse?.explanation || "", 15);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom on updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, typedExplanation, showSnippets]);

  // Load chat history for selected project
  useEffect(() => {
    async function loadHistory() {
      if (!projectId) return;
      const { data, error } = await supabase
        .from("chats")
        .select("id, question, response, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (!error && data) setHistory(data as ChatHistoryRow[]);
    }
    loadHistory();
    // reset view state when switching projects
    setResults([]);
    setShowSnippets(false);
    setLiveResponse(null);
  }, [projectId]);

  async function ask() {
    if (!projectId) {
      setNotice("Please upload a project first.");
      return;
    }
    if (!question.trim()) {
      setNotice("Please type a question about your code.");
      return;
    }

    try {
      setBusy(true);
      setNotice("");
      setShowSnippets(false);
      setResults([]);
      setLiveResponse(null);

      const q = question.trim();

      // 1️⃣ Retrieve relevant snippets
      const queryRes = (await runQuery(projectId, q, 5)) as
        | QueryResult
        | QueryTopItem[]
        | null;

      const topSnippets: QueryTopItem[] = Array.isArray(queryRes)
        ? queryRes
        : Array.isArray(queryRes?.top)
        ? queryRes!.top
        : [];

      if (topSnippets.length === 0) {
        setNotice("⚠️ No relevant code snippets found for this project.");
        return;
      }

      // 2️⃣ Ask AI using those snippets
      const askRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          question: q,
          snippets: topSnippets.map((s) => s.content || s.snippet || ""),
        }),
      });

      if (!askRes.ok) {
        const payload = await askRes.json().catch(() => ({}));
        throw new Error(
          payload?.error?.message || payload?.error || "LLM request failed"
        );
      }

      const payload = await askRes.json();

      const responseObj: DevPilotResponse = {
        explanation: payload.explanation || "No explanation provided.",
        suggestion: payload.suggestion || "",
        test_case: payload.test_case || "",
        code: payload.code || "",
      };

      // 🔤 Show live explanation with typing effect
      setLiveResponse(responseObj);

      // store snippets for "View related files"
      setResults(topSnippets);

      // 3️⃣ Save to Supabase (only once)
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;
        if (userId && projectId) {
          await supabase.from("chats").insert({
            user_id: userId,
            project_id: projectId,
            question: q,
            response: responseObj,
          });
        }
      } catch (err) {
        console.warn("⚠️ Failed to save chat history:", err);
      }

      // 4️⃣ Append to local history (single, clean entry)
      setHistory((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          question: q,
          response: responseObj,
          created_at: new Date().toISOString(),
        },
      ]);

      // Clear input + live bubble (history now owns it)
      setQuestion("");
      setLiveResponse(null);
    } catch (err: any) {
      console.error("❌ ChatPanel ask() failed:", err);
      setNotice(`❌ ${err?.message || "Unknown error while asking AI."}`);
    } finally {
      setBusy(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !busy) ask();
  }

  return (
    <div className="flex flex-col h-full bg-[#0D1117]">
      {/* Header */}
      <div className="px-5 py-3 border-b border-zinc-800 bg-[#0D1117]/70 backdrop-blur-md">
        <h2 className="text-sm font-semibold text-zinc-300">Ask Your Codebase</h2>
        <p className="text-xs text-zinc-500">
          Conversations are saved per project. DevPilot replies with structured answers.
        </p>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Empty state */}
        {history.length === 0 && !busy && !liveResponse && (
          <p className="text-sm text-zinc-600 italic">
            No conversation yet — try asking{" "}
            <span className="text-zinc-400">
              “What does this project do?”
            </span>
          </p>
        )}

        {/* Past Q/A pairs */}
        {history.map((h) => {
          const resp = normalizeResponse(h.response);
          return (
            <div key={h.id} className="space-y-2">
              {/* You */}
              <div className="flex justify-end">
                <div className="max-w-[70%] rounded-xl bg-blue-600 text-white px-3 py-2 text-sm">
                  {h.question}
                </div>
              </div>

              {/* DevPilot */}
<div className="flex justify-start">
  <div className="max-w-[80%] rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 space-y-3">
    {/* Explanation */}
    {resp.explanation && (
      <div>
        <div className="font-semibold text-blue-400 text-[11px] mb-0.5">
          Explanation
        </div>
        <p className="whitespace-pre-wrap leading-relaxed text-[12px]">
          {resp.explanation}
        </p>
      </div>
    )}

    {/* Suggestion */}
    {resp.suggestion && (
      <div>
        <div className="font-semibold text-green-400 text-[11px] mb-0.5">
          Suggestion
        </div>
        <p className="whitespace-pre-wrap leading-relaxed text-[12px]">
          {resp.suggestion}
        </p>
      </div>
    )}

    {/* Test Cases (supports single or multiple) */}
    {Array.isArray(resp.test_cases) ? (
      resp.test_cases.map((t, i) => (
        <div key={i}>
          <div className="font-semibold text-purple-400 text-[11px] mb-0.5">
            Test Case {i + 1}
          </div>
          <p className="text-[11px] text-zinc-400 mb-1">{t.description}</p>
          <pre className="bg-[#111827] border border-zinc-800 rounded-lg p-2 overflow-x-auto text-[11px] text-zinc-200 whitespace-pre">
            {t.code}
          </pre>
          {i < resp.test_cases.length - 1 && (
            <div className="border-t border-zinc-800 my-2" />
          )}
        </div>
      ))
    ) : (
      resp.test_case && (
        <div>
          <div className="font-semibold text-purple-400 text-[11px] mb-0.5">
            Test Case
          </div>
          <pre className="bg-[#111827] border border-zinc-800 rounded-lg p-2 overflow-x-auto text-[11px] text-zinc-200 whitespace-pre">
            {typeof resp.test_case === "string"
              ? resp.test_case
              : JSON.stringify(resp.test_case, null, 2)}
          </pre>
        </div>
      )
    )}

    {/* Code (optional field) */}
    {resp.code && (
      <div>
        <div className="font-semibold text-amber-400 text-[11px] mb-0.5">
          Code
        </div>
        <pre className="bg-[#111827] border border-zinc-800 rounded-lg p-2 overflow-x-auto text-[11px] text-zinc-200 whitespace-pre">
          {resp.code}
        </pre>
      </div>
    )}
  </div>
</div>

            </div>
          );
        })}

        {/* Live typing bubble for *current* answer */}
        {typedExplanation && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-200 animate-fade-in">
              <div className="font-semibold text-blue-400 text-[11px] mb-0.5">
                Explanation
              </div>
              <p className="whitespace-pre-wrap leading-relaxed text-[12px]">
                {typedExplanation}
              </p>
            </div>
          </div>
        )}

        {/* Busy indicator */}
        {busy && (
          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <Loader2 size={16} className="animate-spin" />
            Analysing your code...
          </div>
        )}

        {/* View related files toggle + snippets (for last question) */}
        {results.length > 0 && !busy && (
          <div className="flex flex-col items-center gap-2 mt-2">
            <button
              onClick={() => setShowSnippets((v) => !v)}
              className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              {showSnippets ? (
                <>
                  Hide Related Files <ChevronUp size={14} />
                </>
              ) : (
                <>
                  View Related Files <ChevronDown size={14} />
                </>
              )}
            </button>
            {showSnippets && (
              <div className="w-full space-y-2">
                {results.map((r, idx) => (
                  <div
                    key={`${r.file_path}-${idx}`}
                    className="border border-zinc-800/60 rounded-xl bg-zinc-900/60"
                  >
                    <SnippetCard
                      snippet={r.snippet || r.content || ""}
                      score={r.score}
                      filePath={r.file_path}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-800 bg-[#0D1117]/80 backdrop-blur-md flex items-center gap-3">
        <input
          type="text"
          className="flex-1 rounded-lg bg-[#1A1D21] border border-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Ask a question about your code..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKey}
          disabled={busy}
        />
        <button
          onClick={ask}
          disabled={busy}
          className="h-9 w-9 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center disabled:opacity-60"
          title="Ask"
        >
          {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
}
