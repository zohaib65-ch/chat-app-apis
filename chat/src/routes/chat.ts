import express from "express";
import { isAuth } from "../middleware/isAuth.js";
import { createNewChat, fetchAllChats, getMessagesByChat, sendMessage } from "../controllers/chat.js";
import { upload } from "../middleware/multer.js";

const router = express.Router();

router.post("/chat/new", isAuth, createNewChat);
router.get("/chat/all", isAuth, fetchAllChats);
router.post("/message", isAuth, upload.single("image"), sendMessage);
router.get("/messages/:chatId", isAuth, getMessagesByChat);

export default router;
