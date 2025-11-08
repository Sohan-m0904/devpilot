// backend/routes/query.js
import express from "express";
import axios from "axios";
import { supabase } from "../supabaseClient.js";

const router = express.Router();

/**
 * POST /api/query
 * Retrieves top-N similar code snippets for a user's question.
 */
router.post("/", async (req, res) => {
  try {
    const { projectId, question, topK = 5 } = req.body;

    if (!projectId || !question) {
      return res.status(400).json({ error: "projectId and question are required." });
    }

    console.log(`🔍 Querying project ${projectId} for: "${question}"`);

    // 1️⃣ Retrieve snippets + embeddings from Supabase
    const { data: snippets, error: dbError } = await supabase
      .from("snippets")
      .select("id, file_path, snippet, embedding")
      .eq("project_id", projectId);

    if (dbError) throw dbError;
    if (!snippets || snippets.length === 0) {
      console.warn(`⚠️ No snippets found for project: ${projectId}`);
      return res.status(404).json({ error: "No snippets found for this project." });
    }

    console.log(`📄 Loaded ${snippets.length} snippets from Supabase.`);

    // 2️⃣ Embed the user's question
    const embedRes = await axios.post(
      "https://api.cohere.ai/v1/embed",
      {
        texts: [question],
        model: "embed-multilingual-v3.0", // same as your embed.js
        input_type: "search_query",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const queryVec = embedRes.data.embeddings?.[0];
    if (!queryVec) throw new Error("No query embedding returned from Cohere");

    console.log(`🧠 Query vector length: ${queryVec.length}`);

    // 3️⃣ Cosine similarity helper
    const cosine = (a, b) => {
      const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
      const normA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
      const normB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
      return dot / (normA * normB);
    };

    // 4️⃣ Score all snippets by similarity
    const scored = snippets
      .map((s) => {
        try {
          // Parse embedding from jsonb
          const emb = Array.isArray(s.embedding)
            ? s.embedding
            : JSON.parse(s.embedding || "[]");

          if (!Array.isArray(emb) || emb.length === 0) return null;

          const score = cosine(queryVec, emb);
          return {
            snippet_id: s.id,
            file_path: s.file_path,
            snippet: s.snippet || "",
            score,
          };
        } catch (err) {
          console.warn("⚠️ Failed to parse embedding for:", s.file_path);
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    if (scored.length === 0) {
      console.warn(`⚠️ No relevant vectors found for project: ${projectId}`);
      return res.status(404).json({ error: "No relevant code snippets found for this project." });
    }

    console.log(`✅ Returning top ${scored.length} snippets`);
    res.json({ top: scored });
  } catch (err) {
    console.error("❌ /api/query failed:", err.response?.data || err.message);
    res.status(500).json({ error: err.message || "Query failed" });
  }
});

export default router;
