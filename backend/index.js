import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import uploadRoute from "./routes/upload.js";
import parseRoute from "./routes/parse.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// register routes
app.use("/api/upload", uploadRoute);
app.use("/api/parse", parseRoute);

// test route
app.get("/api/ping", (req, res) => {
  res.json({ message: "DevPilot backend running ✅" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
