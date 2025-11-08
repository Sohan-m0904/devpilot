import express from "express";
import uploadRoute from "./routes/upload.js";
import parseRoute from "./routes/parse.js";
import queryRoute from "./routes/query.js";
import askRoute from "./routes/ask.js";
import cors from "cors"; 
import dotenv from "dotenv";
dotenv.config();
import { cleanupGuestProjects } from "./utils/cleanupGuests.js";



dotenv.config();
console.log("✅ SUPABASE_URL:", process.env.SUPABASE_URL || "❌ Missing");
console.log("✅ SUPABASE_KEY:", process.env.SUPABASE_KEY ? "Loaded" : "❌ Missing");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/ask", askRoute);

// register routes
app.use("/api/upload", uploadRoute);
app.use("/api/parse", parseRoute);
app.use("/api/query", queryRoute);

app.post("/test", (req, res) => {
  console.log("✅ Test route hit");
  res.json({ message: "Received" });
});


// test route
app.get("/api/ping", (req, res) => {
  res.json({ message: "DevPilot backend running ✅" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // 🧹 Schedule guest cleanup every 3 hours
  setInterval(() => {
    cleanupGuestProjects(6); // delete guests older than 6 hours
  }, 3 * 60 * 60 * 1000); // every 3 hours

  // Optionally, run once at startup too
  cleanupGuestProjects(6);
});
