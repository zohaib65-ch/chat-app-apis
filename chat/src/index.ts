import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import chatRoutes from "./routes/chat.js";
dotenv.config();
connectDB();
const app = express();
app.use(express.json());
app.use("/api/v1", chatRoutes);
const PORT = process.env.PORT || 5003;
app.get("/", (_req, res) => {
  res.send("Hello, world!");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
