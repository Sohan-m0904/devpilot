// backend/routes/parse.js
import express from "express";
import { parseProject } from "../utils/parseCode.js";

const router = express.Router();

// POST /api/parse
router.post("/", async (req, res) => {
  try {
    const { projectPath } = req.body; // from frontend or upload route
    if (!projectPath) return res.status(400).json({ error: "Missing project path" });

    const parsed = await parseProject(projectPath);
    res.json({ message: "Parsed successfully ✅", results: parsed });
  } catch (error) {
    console.error("Parsing error:", error);
    res.status(500).json({ error: "Failed to parse project" });
  }
});

export default router;
