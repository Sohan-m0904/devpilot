"use client";

import { useRef, useState } from "react";
import { uploadZip, runEmbed } from "@/lib/api";

export default function UploadPanel({
  projectId,
  onEmbedded,
  setNotice,
}: {
  projectId: string;
  onEmbedded?: () => void;
  setNotice: (s: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setNotice("Please choose a ZIP file first");
      return;
    }
    try {
      setBusy(true);
      const res = await uploadZip(file);
      // if your backend later returns projectId, you can surface it here
      setNotice("Uploaded and extracted. Now embed for this project id.");
    } catch (e: any) {
      setNotice(`Upload failed: ${e.message || e}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleEmbed() {
    if (!projectId) {
      setNotice("Please set a valid project id");
      return;
    }
    try {
      setBusy(true);
      const res = await runEmbed(projectId);
      setNotice(`Embedded ${res.success} of ${res.total} snippets`);
      onEmbedded?.();
    } catch (e: any) {
      setNotice(`Embed failed: ${e.message || e}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h2 className="font-medium">Upload or embed</h2>

      <div className="space-y-2">
        <input type="file" accept=".zip" ref={fileRef} className="text-sm" />
        <div className="flex gap-2">
          <button
            onClick={handleUpload}
            disabled={busy}
            className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm disabled:opacity-50"
          >
            Upload ZIP
          </button>
          <button
            onClick={handleEmbed}
            disabled={busy}
            className="px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-sm disabled:opacity-50"
          >
            Run Embedding
          </button>
        </div>
        <p className="text-xs text-zinc-500">
          Upload just copies files to server. Embedding writes vectors to Supabase.
        </p>
      </div>
    </div>
  );
}
