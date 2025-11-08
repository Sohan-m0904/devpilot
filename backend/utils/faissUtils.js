// backend/utils/faissUtils.js
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const INDEX_PATH = path.join(__dirname, "../data/faiss_index.json");

// ---------- Local index helpers ----------
function loadIndex() {
  if (fs.existsSync(INDEX_PATH))
    return JSON.parse(fs.readFileSync(INDEX_PATH, "utf-8"));
  return { items: [] };
}

function saveIndex(data) {
  fs.mkdirSync(path.dirname(INDEX_PATH), { recursive: true });
  fs.writeFileSync(INDEX_PATH, JSON.stringify(data, null, 2));
}

function cosineSim(a, b) {
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const normA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const normB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return dot / (normA * normB);
}

// ---------- GROQ Embeddings ----------
export async function getEmbeddings(text) {
  const HF_MODEL = "sentence-transformers/all-MiniLM-L6-v2";
  const url = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`;

  // New router format requires both "source_sentence" and "sentences" array
  const body = {
    inputs: {
      source_sentence: text,
      sentences: [text], // self-embedding workaround
    },
  };

  const res = await axios.post(url, body, {
    headers: {
      Authorization: `Bearer ${process.env.HF_API_KEY}`,
      "Content-Type": "application/json",
    },
    timeout: 60000,
  });

  // router returns [{ embeddings: [ ... ] }]
  const embeddings =
    Array.isArray(res.data) && res.data[0]?.embeddings
      ? res.data[0].embeddings
      : res.data;
  return embeddings;
}
// ---------- Add / Search ----------
export async function addToIndex(projectId, snippetId, vector) {
  const index = loadIndex();
  index.items.push({ projectId, snippetId, vector });
  saveIndex(index);
}

export async function searchSimilar(projectId, queryEmbedding, limit = 5) {
  const index = loadIndex();
  const filtered = index.items.filter((i) => i.projectId === projectId);
  const scored = filtered.map((i) => ({
    id: i.snippetId,
    score: cosineSim(queryEmbedding, i.vector),
  }));
  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}
