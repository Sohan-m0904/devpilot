import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import uploadRoute from "./routes/upload.js";
import parseRoute from "./routes/parse.js";
import embedRoute from "./routes/embed.js";
import queryRoute from "./routes/query.js";

dotenv.config();
console.log("✅ SUPABASE_URL:", process.env.SUPABASE_URL || "❌ Missing");
console.log("✅ SUPABASE_KEY:", process.env.SUPABASE_KEY ? "Loaded" : "❌ Missing");

const app = express();

app.use(cors());
app.use(express.json());

// register routes
app.use("/api/upload", uploadRoute);
app.use("/api/parse", parseRoute);
app.use("/api/embed", embedRoute);
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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
