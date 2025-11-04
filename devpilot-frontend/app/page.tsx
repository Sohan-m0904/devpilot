"use client";

import Header from "@/components/Header";
import ProjectSelector from "@/components/ProjectSelector";
import UploadPanel from "@/components/UploadPanel";
import ChatPanel from "@/components/ChatPanel";
import Toast from "@/components/Toast";
import { useEffect, useState } from "react";

export default function Page() {
  const [projectId, setProjectId] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("devpilot_project_id");
    if (saved) setProjectId(saved);
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <h2 className="font-medium mb-3">Project</h2>
            <ProjectSelector projectId={projectId} setProjectId={setProjectId} />
          </div>
          <UploadPanel projectId={projectId} setNotice={setNotice} />
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <h2 className="font-medium mb-2">Tips</h2>
            <ul className="text-sm text-zinc-400 list-disc pl-5 space-y-1">
              <li>Upload your ZIP, then run embedding</li>
              <li>Paste your project id from Supabase projects table</li>
              <li>Ask questions like: What does the main function do</li>
              <li>Scores near 1.0 indicate very high similarity</li>
            </ul>
          </div>
        </div>

        <div className="lg:col-span-2">
          <ChatPanel projectId={projectId} setNotice={setNotice} />
        </div>
      </div>

      <Toast notice={notice} />
    </div>
  );
}
