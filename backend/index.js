import express from "express";
import uploadRoute from "./routes/upload.js";
import parseRoute from "./routes/parse.js";
import queryRoute from "./routes/query.js";
import askRoute from "./routes/ask.js";
import cors from "cors";
import dotenv from "dotenv";
import { cleanupGuestProjects } from "./utils/cleanupGuests.js";

dotenv.config();

console.log("✅ SUPABASE_URL:", process.env.SUPABASE_URL || "❌ Missing");
console.log("✅ SUPABASE_KEY:", process.env.SUPABASE_KEY ? "Loaded" : "❌ Missing");

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/ask", askRoute);
app.use("/api/upload", uploadRoute);
app.use("/api/parse", parseRoute);
app.use("/api/query", queryRoute);

// Health check
app.get("/", (req, res) => {
  res.send("✅ DevPilot backend is live and running!");
});

// Test route
app.get("/api/ping", (req, res) => {
  res.json({ message: "DevPilot backend running ✅" });
});

// Start server once
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // 🧹 Schedule guest cleanup every 3 hours
  setInterval(() => {
    cleanupGuestProjects(6);
  }, 3 * 60 * 60 * 1000);

  // Run once at startup
  cleanupGuestProjects(6);
});
