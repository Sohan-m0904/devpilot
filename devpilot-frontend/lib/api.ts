// frontend/lib/api.ts

// 🧠 Use a single consistent backend base URL
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE || "https://devpilot.onrender.com";

// 🧩 Generic POST JSON helper
export async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
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

// 📦 Upload ZIP
export async function uploadZip(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  console.log("📤 Uploading to:", `${BASE_URL}/api/upload`);

  const res = await fetch(`${BASE_URL}/api/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Upload failed: ${msg}`);
  }

  return await res.json();
}

// 🧠 Parse project
export async function parseProject(projectId: string, projectPath?: string) {
  return postJSON(`/api/parse`, { projectId, projectPath });
}

// 🧠 Embed project (if you use embedding separately)
export async function runEmbed(projectId: string) {
  return postJSON(`/api/embed`, { projectId });
}

// 💬 Query project
export async function runQuery(projectId: string, question: string, k = 5) {
  return postJSON(`/api/query`, { projectId, question, k });
}
