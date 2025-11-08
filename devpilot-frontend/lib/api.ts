const BASE = process.env.NEXT_PUBLIC_BACKEND_URL as string;

export async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// frontend/lib/api.ts
export async function uploadZip(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  console.log("📤 Sending upload request to:", process.env.NEXT_PUBLIC_API_URL);
  console.log("📤 Uploading to:", process.env.NEXT_PUBLIC_API_URL);

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Upload failed: ${msg}`);
  }

  return await res.json();
}



export async function parseProject(projectId: string, projectPath?: string) {
  // call your /api/parse if you wish to expose this in UI
  return postJSON(`/api/parse`, { projectId, projectPath });
}

export async function runEmbed(projectId: string) {
  return postJSON(`/api/embed`, { projectId });
}

export async function runQuery(projectId: string, question: string, k = 5) {
  return postJSON(`/api/query`, { projectId, question, k });
}
