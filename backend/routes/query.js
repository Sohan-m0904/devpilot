import express from "express";
import { CohereClient } from "cohere-ai";
import * as math from "mathjs";
import { supabase } from "../supabaseClient.js";

const router = express.Router();

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

router.post("/", async (req, res) => {
  try {
    const { projectId, question, k } = req.body;
    if (!projectId || !question)
      return res.status(400).json({ error: "projectId and question required" });

    // 1️⃣ Fetch embeddings + snippet text
    const { data: embeddings, error } = await supabase
      .from("embeddings")
      .select("snippet_id, vector, snippets(snippet)")
      .eq("snippets.project_id", projectId);

    if (error) throw error;
    if (!embeddings?.length)
      return res.status(404).json({ error: "No embeddings found for project" });

    // 2️⃣ Generate query embedding (as search_query)
    const response = await cohere.embed({
      texts: [question],
      model: "embed-english-light-v3.0",
      input_type: "search_query", // ✅ for user questions
    });

    const queryVec = response.embeddings[0];
    if (!Array.isArray(queryVec))
      throw new Error("Invalid query embedding response");

    // 3️⃣ Compute cosine similarity between query and each snippet
    const scores = embeddings.map((e) => {
      const score =
        math.dot(e.vector, queryVec) /
        (math.norm(e.vector) * math.norm(queryVec));
      return { snippet_id: e.snippet_id, snippet: e.snippets.snippet, score };
    });

    // 4️⃣ Sort & return top-k
    const top = scores.sort((a, b) => b.score - a.score).slice(0, k || 5);

    res.json({ ok: true, top });
  } catch (err) {
    console.error("🔥 /api/query crashed:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
