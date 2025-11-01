"use client";
import { useState } from "react";
import axios from "axios";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!file && !url) {
      setMessage("Please upload a ZIP file or paste a GitHub URL");
      return;
    }
    setMessage("Uploading...");
    // mock request (will connect later)
    setTimeout(() => setMessage("Upload successful ✅"), 1000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">Upload Your Project</h1>

      <input
        type="file"
        accept=".zip"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="mb-4"
      />

      <input
        type="text"
        placeholder="Or paste GitHub URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="border p-2 w-80 rounded mb-4"
      />

      <button
        onClick={handleUpload}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
      >
        Upload
      </button>

      {message && <p className="mt-4 text-gray-700">{message}</p>}
    </div>
  );
}
