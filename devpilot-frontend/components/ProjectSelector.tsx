"use client";

import { useEffect, useState } from "react";

export default function ProjectSelector({
  projectId,
  setProjectId,
}: {
  projectId: string;
  setProjectId: (s: string) => void;
}) {
  const [input, setInput] = useState(projectId);

  useEffect(() => {
    setInput(projectId);
  }, [projectId]);

  return (
    <div className="space-y-2">
      <label className="text-sm text-zinc-400">Project ID</label>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste your UUID from Supabase"
          className="flex-1 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm outline-none focus:border-brand-600"
        />
        <button
          onClick={() => {
            setProjectId(input.trim());
            localStorage.setItem("devpilot_project_id", input.trim());
          }}
          className="px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-sm"
        >
          Use
        </button>
      </div>
      <p className="text-xs text-zinc-500">
        Tip: save the latest ID locally. It will auto load next time.
      </p>
    </div>
  );
}
