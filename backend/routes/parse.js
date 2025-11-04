import express from "express";
import path from "path";
import { promises as fs } from "fs";
import { supabase } from "../supabaseClient.js";
import { walkFiles } from "../utils/fsWalk.js";
import { inferLanguage } from "../utils/language.js";
import { extractUnits } from "../utils/ast.js";
import { chunkSnippet } from "../utils/chunk.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { projectId, projectPath } = req.body;
    if (!projectId || !projectPath)
      return res.status(400).json({ error: "projectId and projectPath required" });

    const files = await walkFiles(projectPath);
    const inserted = [];

    for (const file of files) {
      const language = inferLanguage(file);
      const source = await fs.readFile(file, "utf8");
      const units = extractUnits(source);
      for (const unit of units) {
        for (const chunk of chunkSnippet(unit)) {
          const { data, error } = await supabase
            .from("snippets")
            .insert({
              project_id: projectId,
              file_path: path.relative(projectPath, file),
              language,
              type: chunk.type,
              name: chunk.name,
              start_line: chunk.start,
              end_line: chunk.end,
              snippet: chunk.snippet,
            })
            .select("id,file_path,name,type");
          if (error) throw error;
          inserted.push(data[0]);
        }
      }
    }

    res.json({ ok: true, count: inserted.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
