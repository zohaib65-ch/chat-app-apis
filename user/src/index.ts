import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { createClient } from "redis";
import userRoutes from "./routes/user.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";
dotenv.config();
const app = express();

export const redisClient = createClient({
  url: process.env.REDIS_URL,
});
redisClient
  .connect()
  .then(() => {
    console.log("✅ Connected to Redis");
  })
  .catch((err) => {
    console.error("❌ Redis connection error:", err);
  });

app.use("api/v1", userRoutes);
connectDB();
connectRabbitMQ()
const PORT = process.env.PORT;

app.get("/", (_req, res) => {
  res.send("Hello, world!");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
