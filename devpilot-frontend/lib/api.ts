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

export async function uploadZip(file: File): Promise<any> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${BASE}/api/upload`, { method: "POST", body: fd });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
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
