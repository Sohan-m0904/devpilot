import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { fileURLToPath } from "url";

const router = express.Router();

// Handle __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadFolder = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

const upload = multer({ dest: uploadFolder });

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const zipPath = req.file.path;
    const folderName = path.parse(req.file.originalname).name;
    const extractPath = path.join(uploadFolder, folderName);

    // Ensure extraction folder exists
    if (!fs.existsSync(extractPath)) {
      fs.mkdirSync(extractPath, { recursive: true });
    }

    // Extract the ZIP using adm-zip
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractPath, true);

    // Remove the uploaded ZIP
    fs.unlinkSync(zipPath);

    res.json({
      message: "File uploaded and extracted ✅",
      extractPath: `uploads/${folderName}`,
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({ error: "Failed to extract ZIP file" });
  }
});

export default router;
