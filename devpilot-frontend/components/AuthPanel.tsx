"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, LogIn, UserPlus } from "lucide-react";

export default function AuthPanel({ onAuth }: { onAuth: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signup");

  async function handleSubmit() {
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (data.user) {
          const { error: profileError } = await supabase
            .from("profiles")
            .insert([{ id: data.user.id, username }]);
          if (profileError) console.warn("Profile insert error:", profileError);
        }

        alert("✅ Signup successful! You can now log in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onAuth();
      }
    } catch (err: any) {
      alert(err.message || "Auth failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    onAuth();
  }

  return (
    <div className="glass-panel fade-in p-6 rounded-2xl space-y-4 text-sm">
      <h2 className="text-zinc-200 font-semibold text-center mb-2">
        {mode === "signup" ? "Create an Account" : "Welcome Back"}
      </h2>

      <div className="space-y-3">
        {mode === "signup" && (
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg bg-[#1A1D21] border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        )}

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg bg-[#1A1D21] border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg bg-[#1A1D21] border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Processing...
            </>
          ) : mode === "signup" ? (
            <>
              <UserPlus size={16} /> Sign Up
            </>
          ) : (
            <>
              <LogIn size={16} /> Sign In
            </>
          )}
        </button>
      </div>

      <div className="flex flex-col items-center gap-1 mt-2">
        <button
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          {mode === "signup"
            ? "Already have an account? Log in"
            : "Don’t have an account? Sign up"}
        </button>

        <button
          onClick={handleLogout}
          className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors mt-1"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
