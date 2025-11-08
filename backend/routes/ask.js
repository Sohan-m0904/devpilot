// backend/routes/ask.js
import express from "express";
import axios from "axios";
import { supabase } from "../supabaseClient.js";
import { z } from "zod";

const router = express.Router();

// 🧩 Define schema for validation
const ResponseSchema = z.object({
  explanation: z.string().default("No explanation provided."),
  suggestion: z.string().default(""),
  test_case: z
    .object({
      description: z.string().default(""),
      code: z.string().default(""),
    })
    .default({ description: "", code: "" }),
});

/**
 * POST /api/ask
 * Uses top retrieved snippets + LLM reasoning to answer user's question.
 */
router.post("/", async (req, res) => {
  try {
    const { projectId, question } = req.body;
    if (!projectId || !question) {
      return res
        .status(400)
        .json({ error: "projectId and question are required." });
    }

    console.log(`🧠 Asking about project ${projectId}: "${question}"`);

    // 1️⃣ Load all snippets from Supabase
    const { data: snippets, error: dbError } = await supabase
      .from("snippets")
      .select("file_path, snippet, embedding")
      .eq("project_id", projectId);

    if (dbError) throw dbError;
    if (!snippets?.length)
      return res
        .status(404)
        .json({ error: "No snippets found for this project." });

    // 2️⃣ Get embedding for user's question
    const embedRes = await axios.post(
      "https://api.cohere.ai/v1/embed",
      {
        texts: [question],
        model: "embed-multilingual-v3.0",
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

    // 3️⃣ Cosine similarity helper
    const cosine = (a, b) => {
      const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
      const normA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
      const normB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
      return dot / (normA * normB);
    };

    // 4️⃣ Rank snippets by relevance
    const scored = snippets
      .map((s) => {
        try {
          const emb = Array.isArray(s.embedding)
            ? s.embedding
            : JSON.parse(s.embedding || "[]");
          if (!emb.length) return null;
          return {
            file_path: s.file_path,
            snippet: s.snippet || "",
            score: cosine(queryVec, emb),
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (!scored.length)
      return res
        .status(404)
        .json({ error: "No relevant code snippets found for this project." });

    console.log(`✅ Found ${scored.length} relevant snippets.`);

    // 5️⃣ Build structured prompt
    const contextText = scored
      .map((s, i) => `File: ${s.file_path}\nCode:\n${s.snippet}\n`)
      .join("\n---\n");

const systemPrompt = `
You are DevPilot, an expert AI code mentor and reviewer.

Your task:
- Carefully analyse the provided code context in depth.
- Explain exactly what the code does, step by step.
- Describe how each function, variable, and module contributes to the overall logic.
- Identify inputs, outputs, and side effects clearly.
- Highlight relationships between files, imports, or functions if relevant.
- Provide a clear, structured explanation that teaches the user how the code works.
- Suggest *specific* improvements or fixes (e.g., refactoring ideas, naming conventions, performance, error handling, maintainability).
- Generate a realistic, runnable test case in JavaScript that directly tests the described logic.

💡 Focus on clarity and technical accuracy. Avoid high-level summaries.

🚨 CRITICAL FORMAT INSTRUCTIONS 🚨
Always return ONLY valid JSON.
Do NOT include markdown, code fences, commentary, or explanations outside of the JSON.
Your response MUST parse successfully with JSON.parse() in JavaScript.
THE JSON MUST conform EXACTLY to the following schema — UNDER NO CIRCUMSTANCES DEVIATE FROM IT.

{
  "explanation": "string — A clear, detailed, line-by-line or logical-block explanation of the code’s behaviour, including how functions interact and what data flows through them.",
  "suggestion": "string — Specific, actionable improvements (naming, optimisation, structure, error handling, testing). Avoid vague advice.",
  "test_case": {
    "description": "string — What the test validates and why it matters.",
    "code": "string — A complete, runnable JavaScript test verifying a key function or behaviour described above."
  }
}
`;


    const fullPrompt = `${systemPrompt}
Question: ${question}
Code context:
${contextText}
`;

    // 6️⃣ Safe LLM call with model fallback
    const modelsToTry = [
      "llama-3.1-70b-versatile",
      "llama-3.1-8b-instant",
      "gemma2-9b-it",
    ];
    let llmResponse = null;

    for (const model of modelsToTry) {
      try {
        console.log(`🤖 Trying model: ${model}`);
        const llmRes = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: fullPrompt },
            ],
            temperature: 0.3,
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );

        llmResponse = llmRes.data?.choices?.[0]?.message?.content || "";
        console.log(`✅ Model ${model} responded (${llmResponse.length} chars)`);
        break; // stop after first successful model
      } catch (err) {
        console.warn(
          `⚠️ Model ${model} failed:`,
          err.response?.data?.error?.message || err.message
        );
      }
    }

    if (!llmResponse) throw new Error("All models failed to generate a response.");

    // 7️⃣ Clean and parse model output
    let cleaned = llmResponse
      .replace(/^```json/i, "")
      .replace(/^```/, "")
      .replace(/```$/, "")
      .trim();

    let output;
    try {
      output = JSON.parse(cleaned);
    } catch {
      console.warn("⚠️ Initial JSON parse failed, attempting repair...");
      try {
        cleaned = cleaned
          .replace(/,\s*}/g, "}")
          .replace(/,\s*]/g, "]")
          .trim();
        output = JSON.parse(cleaned);
      } catch {
        console.error("❌ Could not parse JSON output, sending fallback text.");
        output = { explanation: cleaned };
      }
    }

    // 8️⃣ Validate with Zod
    const validated = ResponseSchema.safeParse(output);
    const data = validated.success
      ? validated.data
      : {
          explanation:
            typeof output === "string"
              ? output
              : output?.explanation || "No explanation provided.",
          suggestion: output?.suggestion || "",
          test_case: output?.test_case || { description: "", code: "" },
        };

    // 9️⃣ Send final structured response
    res.json(data);
  } catch (err) {
    console.error("❌ /api/ask failed:", err.response?.data || err.message);
    res.status(500).json({ error: err.message || "Ask failed" });
  }
});

export default router;
