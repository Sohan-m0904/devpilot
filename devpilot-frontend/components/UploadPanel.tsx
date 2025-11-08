"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { UploadCloud, Loader2 } from "lucide-react";

export default function UploadPanel({
  setNotice,
  onEmbedded,
}: {
  setNotice: (s: string) => void;
  onEmbedded?: (projectId?: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState<string>("");

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setNotice("Please choose a ZIP file first.");
      return;
    }

    try {
      setBusy(true);
      setNotice("Uploading and embedding your project... please wait ⏳");

      // ✅ Get current user session (optional)
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError)
        console.warn("⚠️ Failed to fetch session:", sessionError.message);

      const userId = sessionData?.session?.user?.id || null;

      // ✅ Build FormData
      const formData = new FormData();
      formData.append("file", file);
      if (userId) formData.append("user_id", userId);

      // ✅ Upload to backend
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setNotice(`✅ ${data.projectName} uploaded and embedded successfully!`);
      onEmbedded?.(data.projectId);
      setFileName("");
    } catch (err: any) {
      console.error("❌ Upload failed:", err);
      setNotice(`❌ Upload failed: ${err.message || err}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fade-in glass-panel p-5 space-y-4">
      <h2 className="text-sm font-semibold text-zinc-200 tracking-wide">
        Upload Your Project
      </h2>

      <div
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all duration-300 ${
          busy
            ? "border-zinc-700 bg-zinc-900/40"
            : "hover:border-blue-500 hover:bg-zinc-900/60 border-zinc-800 bg-zinc-900/30"
        }`}
        onClick={() => !busy && fileRef.current?.click()}
      >
        {busy ? (
          <Loader2 className="animate-spin text-blue-400 mb-2" size={24} />
        ) : (
          <UploadCloud className="text-blue-400 mb-2" size={24} />
        )}
        <p className="text-sm text-zinc-300">
          {fileName
            ? `Selected: ${fileName}`
            : "Click to choose or drop a ZIP file"}
        </p>
        <p className="text-xs text-zinc-500 mt-1">
          DevPilot will extract and embed your code automatically
        </p>

        {/* Hidden File Input */}
        <input
          type="file"
          accept=".zip"
          ref={fileRef}
          onChange={(e) =>
            setFileName(e.target.files?.[0]?.name || "No file selected")
          }
          className="hidden"
          disabled={busy}
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={busy}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white disabled:opacity-50 transition-colors"
      >
        {busy ? (
          <>
            <Loader2 className="animate-spin" size={16} />
            Processing...
          </>
        ) : (
          <>
            <UploadCloud size={16} />
            Upload & Embed ZIP
          </>
        )}
      </button>
    </div>
  );
}
