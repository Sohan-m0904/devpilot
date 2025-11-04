import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { fileURLToPath } from "url";
import { supabase } from "../supabaseClient.js"; // Supabase re-enabled

const router = express.Router();

// Handle __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads folder exists
const uploadFolder = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder, { recursive: true });

// Configure Multer (safe on Windows)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => {
    const safeName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, safeName);
  },
});
const upload = multer({ storage });

// Helper function to safely insert into Supabase with timeout
async function safeSupabaseInsert(payload) {
  try {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Supabase request timed out")), 4000)
    );

    const insert = supabase.from("projects").insert([payload]).select();
    return await Promise.race([insert, timeout]);
  } catch (err) {
    throw err;
  }
}

router.post("/", upload.single("file"), async (req, res) => {
  console.log("📦 /api/upload hit");

  try {
    if (!req.file) {
      console.warn("❌ No file uploaded");
      return res.status(400).json({ error: "No file uploaded" });
    }

    const zipPath = req.file.path;
    const folderName = path.parse(req.file.originalname).name.replace(/\s+/g, "_");
    const extractPath = path.join(uploadFolder, folderName);
    console.log("🗂 Extract path:", extractPath);

    if (!fs.existsSync(extractPath)) fs.mkdirSync(extractPath, { recursive: true });

    // Extract the ZIP
    try {
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(extractPath, true);
      console.log("✅ ZIP extracted successfully");
    } catch (err) {
      console.error("❌ ZIP extraction failed:", err);
      return res.status(500).json({ error: "ZIP extraction failed" });
    }

    // Delete the uploaded ZIP file
    fs.unlink(zipPath, () => {});

    // ✅ Respond to client first
    res.status(200).json({
      message: "File uploaded and extracted ✅",
      folder: `uploads/${folderName}`,
    });

    // ⏳ Then run Supabase insert safely
    setImmediate(async () => {
      console.log("🧠 Background task started...");
      try {
        const { data, error } = await supabase
          .from("projects")
          .insert([
            {
              name: folderName,
              extract_path: `uploads/${folderName}`,
              user_id: null,
            },
          ])
          .select();

        if (error) {
          console.error("❌ (BG) Supabase insert error:", error.message);
        } else {
          console.log("✅ (BG) Project saved to Supabase:", data[0]);
        }
      } catch (err) {
        console.error("🔥 (BG) Supabase insert crashed:", err);
      }
      console.log("🧠 Background task ended.");
    });
  } catch (error) {
    console.error("❌ Upload route crashed:", error);
    return res.status(500).json({
      error: "Unexpected server error during upload",
      details: error.message,
    });
  }
});




export default router;
