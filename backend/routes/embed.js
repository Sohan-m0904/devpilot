import express from "express";
import { CohereClient } from "cohere-ai";
import { supabase } from "../supabaseClient.js";

const router = express.Router();

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

router.post("/", async (req, res) => {
  try {
    const { projectId } = req.body;
    if (!projectId)
      return res.status(400).json({ error: "projectId required" });

    const { data: snippets, error } = await supabase
      .from("snippets")
      .select("id, snippet")
      .eq("project_id", projectId);

    if (error) throw error;
    if (!snippets?.length)
      return res.status(404).json({ error: "No snippets found" });

    let success = 0;

    for (const s of snippets) {
      try {
        // 🧠 Generate embedding (specify input_type)
        const response = await cohere.embed({
          texts: [s.snippet],
          model: "embed-english-light-v3.0",
          input_type: "search_document", // ✅ required for this model
        });

        const vec = response.embeddings[0];
        if (!Array.isArray(vec)) {
          console.warn(`⚠️ Invalid embedding for snippet ${s.id}`);
          continue;
        }

        const { error: insertError } = await supabase
          .from("embeddings")
          .insert({
            snippet_id: s.id,
            dim: vec.length,
            vector: vec,
          });

        if (insertError)
          console.warn(
            `❌ Failed to insert embedding for snippet ${s.id}:`,
            insertError.message
          );
        else {
          console.log(`✅ Embedded snippet ${s.id}`);
          success++;
        }
      } catch (err) {
        console.warn(
          `⚠️ Embedding failed for ${s.id}:`,
          err.statusCode || err.message,
          err.body || ""
        );
      }
    }

    res.json({ ok: true, total: snippets.length, success });
  } catch (err) {
    console.error("🔥 /api/embed crashed:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
