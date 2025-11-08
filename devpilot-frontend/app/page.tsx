"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import UploadPanel from "@/components/UploadPanel";
import ChatPanel from "@/components/ChatPanel";
import Toast from "@/components/Toast";
import AuthPanel from "@/components/AuthPanel";
import ProjectSidebar from "@/components/ProjectSidebar";
import { supabase } from "@/lib/supabaseClient";

export default function Page() {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [projectId, setProjectId] = useState<string>("");
  const [notice, setNotice] = useState<string>("");
  const [refreshSignal, setRefreshSignal] = useState<number>(0);

  // --- Auth setup ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );
    return () => authListener.subscription.unsubscribe();
  }, []);

  // --- Load last project ---
  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem("devpilot_project_id");
    if (saved) setProjectId(saved);
  }, [user]);

  useEffect(() => {
    if (user && projectId)
      localStorage.setItem("devpilot_project_id", projectId);
  }, [user, projectId]);

  // --- Logout ---
  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProjectId("");
    setNotice("Logged out successfully.");
  }

  // --- UI ---
  return (
    <div className="flex flex-col h-screen bg-[#0D1117] text-zinc-100">
      {/* Header */}
      <Header />

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar (Fixed) */}
        {user && (
          <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800 bg-[#0D1117]/80 backdrop-blur-xl fixed left-0 top-[3.5rem] bottom-0">
            <div className="p-4 border-b border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
                Projects
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ProjectSidebar
                userId={user.id}
                activeId={projectId}
                onSelect={(pid) => setProjectId(pid)}
                refreshSignal={refreshSignal}
              />
            </div>
          </aside>
        )}

        {/* Middle Chat Section (Scrollable) */}
        <main
          className={`flex-1 flex flex-col border-x border-zinc-800 overflow-y-auto transition-all duration-300 ${
            user ? "md:ml-64 md:mr-80" : "md:mr-80"
          }`}
        >
          {projectId ? (
            <ChatPanel projectId={projectId} setNotice={setNotice} />
          ) : (
            <div className="m-auto text-center text-zinc-500 text-sm max-w-xs px-4">
              {user
                ? "Select or upload a project to start chatting."
                : "Upload a project to start chatting (not saved)."}
            </div>
          )}
        </main>

        {/* Right Sidebar (Fixed) */}
        <aside className="hidden md:flex flex-col w-80 border-l border-zinc-800 bg-[#0D1117]/80 backdrop-blur-lg fixed right-0 top-[3.5rem] bottom-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {!session ? (
              <AuthPanel onAuth={() => window.location.reload()} />
            ) : (
              <div className="p-4 rounded-lg border border-zinc-800 bg-[#10151C]">
                <p className="text-sm text-zinc-300 mb-2">
                  Signed in as{" "}
                  <span className="text-blue-400 font-medium">{user?.email}</span>
                </p>
                <button
                  onClick={handleLogout}
                  className="text-xs text-zinc-500 hover:text-zinc-300"
                >
                  Log out
                </button>
              </div>
            )}

            <UploadPanel
              setNotice={setNotice}
              onEmbedded={(pid) => {
                if (pid) setProjectId(pid);
                setNotice("✅ Project uploaded and embedded!");
                setRefreshSignal((r) => r + 1);
              }}
            />
          </div>

          {/* Footer */}
          <footer className="border-t border-zinc-800 text-xs text-center text-zinc-600 py-3">
            DevPilot © {new Date().getFullYear()}
          </footer>
        </aside>
      </div>

      {/* Toast */}
      {notice && <Toast notice={notice} />}
    </div>
  );
}
