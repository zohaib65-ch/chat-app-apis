import TryCatch from "../config/TryCatch.js";
import { AuthenticatedRequest } from "../middleware/isAuth";
import Chat from "../models/Chat.js";
import { Response } from "express";
import mongoose from "mongoose";
import Message from "../models/Message.js";
import axios from "axios";
export const createNewChat = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?._id;
  const { otherUserId } = req.body; // You should destructure like this

  if (!otherUserId) {
    return res.status(400).json({ message: "Bad Request: Other user ID is required" });
  }

  const existingChat = await Chat.findOne({
    users: {
      $all: [new mongoose.Types.ObjectId(userId), new mongoose.Types.ObjectId(otherUserId)],
    },
  });

  if (existingChat) {
    return res.status(200).json({
      message: "Chat already exists",
      chatId: existingChat._id,
    });
  }

  const newChat = await Chat.create({
    users: [userId, otherUserId],
  });

  res.status(201).json({
    message: "New chat created successfully",
    chatId: newChat._id,
  });
});

export const fetchAllChats = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?._id;
  if (!userId) {
    return res.status(401).json({ message: "User Id missing" });
  }
  const chats = await Chat.find({ users: userId }).sort({ updatedAt: -1 });
  const ChatWithUserData = await Promise.all(
    chats.map(async (chat) => {
      const otherUserId = chat.users.find((id) => id !== userId);
      const unseenCount = await Message.countDocuments({
        chatId: chat._id,
        seen: false,
        sender: { $ne: userId },
      });
      try {
        const { data } = await axios.get(`${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`);
        return {
          user: data,
          chat: {
            ...chat.toObject(),
            latestMessage: chat.latestMessage || null,
            unseenCount,
          },
        };
      } catch (error) {
        console.log(error);
        return {
          user: { _id: otherUserId, name: "Unknown User", email: "  Unknown" },
          chat: { ...chat.toObject(), latestMessage: chat.latestMessage || null, unseenCount },
        };
      }
    })
  );
  res.status(200).json(ChatWithUserData);
});
