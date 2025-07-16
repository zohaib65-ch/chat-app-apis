import express from "express";
import { loginUser } from "../controllers/user.js"; // ✅ has .js extension

const router = express.Router();

router.post("/login", loginUser);
router.get("/ping", (_req, res) => {
  res.send("Hello, world!");
});

export default router;
