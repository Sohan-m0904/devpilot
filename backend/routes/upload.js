import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { supabase } from "../supabaseClient.js";
import { embedProject } from "./embed.js";

const router = express.Router();

// Configure Multer for uploads
const upload = multer({ dest: "uploads/" });

/**
 * POST /api/upload
 * Handles ZIP upload, extraction, DB insert, and triggers embedding automatically
 */
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // ✅ Extract user_id if provided in multipart form
    const userId = req.body?.user_id || null;
    if (userId) console.log(`👤 Upload initiated by user: ${userId}`);
    else console.log("👥 Guest upload (no user_id)");

    const zipPath = req.file.path;
    const projectName = path.basename(req.file.originalname, ".zip");
    const extractDir = path.join("uploads", `${projectName}_${Date.now()}`);

    // Ensure uploads folder exists
    fs.mkdirSync(extractDir, { recursive: true });

    // ✅ Extract ZIP contents
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractDir, true);
    fs.unlinkSync(zipPath); // cleanup ZIP

    console.log(`📦 Extracted project: ${projectName}`);
    console.log(`🗂️ Extract path: ${extractDir}`);

    // ✅ Insert project into Supabase with optional user_id
    const { data: project, error: insertError } = await supabase
      .from("projects")
      .insert([
        {
          name: projectName,
          extract_path: extractDir,
          user_id: userId, // 👈 attach user_id if logged in
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("❌ Supabase insert error:", insertError.message);
      throw insertError;
    }

    const projectId = project.id;
    console.log(`✅ Uploaded & inserted project: ${projectName} (ID: ${projectId})`);

    // ✅ Automatically embed after upload
    await embedProject(projectId, extractDir);

    console.log(`✅ Embedding completed for project ${projectId}`);

    return res.json({
      success: true,
      projectId,
      projectName,
      message: "Project uploaded, extracted, and embedded successfully.",
    });
  } catch (err) {
    console.error("❌ Upload failed:", err);
    return res.status(500).json({ error: err.message || "Upload failed" });
  }
});

export default router;
