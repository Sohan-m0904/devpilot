"use client";
import { useEffect, useState } from "react";
import { FolderOpen, Loader2, Plus } from "lucide-react"; // ✅ new icons
import { supabase } from "@/lib/supabaseClient";

interface Project {
  id: string;
  name: string;
  uploaded_at: string;
}

export default function ProjectSidebar({
  userId,
  activeId,
  onSelect,
  refreshSignal,
}: {
  userId: string;
  activeId: string;
  onSelect: (id: string) => void;
  refreshSignal?: number;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadProjects() {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("id, name, uploaded_at")
      .eq("user_id", userId)
      .order("uploaded_at", { ascending: false });

    if (error) console.error("❌ Failed to load projects:", error.message);
    else setProjects(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadProjects();
  }, [userId, refreshSignal]);

  return (
    <aside className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 pb-3 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-wide text-zinc-400 font-semibold">
          My Projects
        </h3>
        <button
          onClick={() => onSelect("")}
          className="text-zinc-400 hover:text-blue-400 transition-colors"
          title="Upload new project"
        >
          <Plus size={16} strokeWidth={2} />
        </button>
      </div>

      <div className="flex-1 px-2 py-3 space-y-1">
        {loading ? (
          <div className="flex items-center gap-2 text-zinc-500 text-xs px-3 py-2">
            <Loader2 size={14} className="animate-spin" /> Loading projects…
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-zinc-600 text-xs p-6">
            <FolderOpen size={18} className="mb-2 opacity-60" />
            No saved projects yet
          </div>
        ) : (
          projects.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={`group flex flex-col w-full text-left px-3 py-2 rounded-lg border border-transparent transition-all ${
                p.id === activeId
                  ? "bg-blue-600/20 border-blue-500/30 text-blue-300"
                  : "hover:bg-zinc-800/70 text-zinc-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`truncate text-sm font-medium ${
                    p.id === activeId ? "text-blue-400" : "text-zinc-200"
                  }`}
                >
                  {p.name || "Untitled Project"}
                </span>
                <span
                  className={`text-[10px] uppercase ${
                    p.id === activeId ? "text-blue-500" : "text-zinc-500"
                  }`}
                >
                  {new Date(p.uploaded_at).toLocaleDateString()}
                </span>
              </div>
              <span className="text-[11px] text-zinc-500 group-hover:text-zinc-400 transition-colors">
                {p.id.slice(0, 8)}…
              </span>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
