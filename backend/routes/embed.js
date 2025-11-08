import fs from "fs";
import path from "path";
import axios from "axios";
import { supabase } from "../supabaseClient.js";

export async function embedProject(projectId, rootDir) {
  console.log(`\n🔍 Starting embedding for project ${projectId}...`);
  console.log("🗂 Root dir before adjustment:", rootDir);

  // 1️⃣ Adjust if ZIP has a single inner folder
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  if (
    entries.length === 1 &&
    entries[0].isDirectory() &&
    !entries[0].name.startsWith("__MACOSX")
  ) {
    rootDir = path.join(rootDir, entries[0].name);
    console.log("📁 Adjusted to inner folder:", rootDir);
  }

  // 2️⃣ Recursively collect all files
  const allFiles = getAllFiles(rootDir);
  console.log("📄 Found files:", allFiles);

  let count = 0;

  // Simple file-extension → language map
  const extToLang = {
    ".js": "JavaScript",
    ".ts": "TypeScript",
    ".py": "Python",
    ".md": "Markdown",
    ".jsx": "React JSX",
    ".tsx": "React TSX",
  };

  // 3️⃣ Process each file
  for (const filePath of allFiles) {
    const ext = path.extname(filePath).toLowerCase();
    if (![".js", ".ts", ".py", ".jsx", ".tsx", ".md"].includes(ext)) continue;

    let code = "";
    try {
      code = fs.readFileSync(filePath, "utf8");
    } catch (readErr) {
      console.error("❌ Failed to read file:", filePath, readErr.message);
      continue;
    }

    const lineCount = code.split("\n").length;
    console.log(`📜 ${path.basename(filePath)} — ${code.length} chars, ${lineCount} lines`);

    if (code.trim().length === 0) {
      console.warn(`⚠️ Skipping empty file: ${filePath}`);
      continue;
    }

    try {
      // 4️⃣ Generate embedding via Cohere
      const embeddingRes = await axios.post(
        "https://api.cohere.ai/v1/embed",
        {
          texts: [code],
          model: "embed-multilingual-v3.0",
          input_type: "search_document",
        },
        {
          headers: {
            "Authorization": `Bearer ${process.env.COHERE_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const vector = embeddingRes.data.embeddings?.[0];
      if (!vector) {
        console.warn("⚠️ No embedding returned for:", filePath);
        continue;
      }

      const language = extToLang[ext] || "Unknown";

      // 5️⃣ Insert snippet into Supabase (write both snippet + content)
      console.log("🧠 About to insert:", {
  project_id: projectId,
  file_path: path.relative(rootDir, filePath),
  snippet: code?.substring(0, 60),
  content: code?.substring(0, 60),
});

      const { error } = await supabase.from("snippets").insert([
        {
          project_id: projectId,
          file_path: path.relative(rootDir, filePath),
          snippet: code,
          content: code,
          language,
          start_line: 1,
          end_line: lineCount,
          embedding: vector,
        },
      ]);

      if (error) {
        console.error("❌ Supabase insert error:", error);
      } else {
        console.log(`✅ Embedded: ${path.basename(filePath)}`);
        count++;
      }
    } catch (err) {
      console.error("❌ Embedding failed for", filePath, err.response?.data || err.message);
    }
  }

  console.log(`\n✅ Embedded ${count} snippets for project ${projectId}`);
}

// 🔁 Recursive helper to get all files
function getAllFiles(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) results = results.concat(getAllFiles(fullPath));
    else results.push(fullPath);
  }
  return results;
}
