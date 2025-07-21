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
        const { data } = await axios.get(`${process.env.USER_SERVICE}/api/v1/users/${otherUserId}`, {
          headers: {
            Authorization: req.headers.authorization || "",
          },
        });

        console.log(`${process.env.USER_SERVICE}/api/v1/users/${otherUserId}`);
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
export const sendMessage = TryCatch(async (req: AuthenticatedRequest & { body: { chatId: string; text?: string } }, res: Response) => {
  const { chatId, text } = req.body;
  const senderID = req.user?._id;
  const imageFile = req.file;
  if (!senderID || !chatId) {
    return res.status(400).json({ message: "Sender ID and Chat ID are required" });
  }

  if (!text && !imageFile) {
    return res.status(400).json({ message: "Either text or image is required" });
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    return res.status(404).json({ message: "Chat not found" });
  }

  const isUserInChat = chat.users.some((userId) => userId.toString() === senderID.toString());
  if (!isUserInChat) {
    return res.status(403).json({ message: "You are not a participant in this chat" });
  }

  const otherUserId = chat.users.find((userId) => userId.toString() !== senderID.toString());
  if (!otherUserId) {
    return res.status(404).json({ message: "Other user not found" });
  }

  const messageData: any = {
    chatId,
    sender: senderID,
    seen: false,
    seenAt: undefined,
  };

  if (imageFile) {
    messageData.image = {
      url: imageFile.path,
      publicId: imageFile.filename,
    };
    messageData.messageType = "image";
    messageData.text = text || "";
  } else {
    messageData.text = text;
    messageData.messageType = "text";
  }

  const message = await Message.create(messageData);
  const savedMessage = await message.save();

  const latestMessage = imageFile ? "📷 Image" : text;

  await Chat.findByIdAndUpdate(
    chatId,
    {
      latestMessage: {
        text: latestMessage,
        senderID,
      },
      updatedAt: new Date(),
    },
    { new: true }
  );

  res.status(201).json({ message: savedMessage, sender: senderID });
});

export const getMessagesByChat = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
  const { chatId } = req.params;
  const userId = req.user?._id;

  if (!chatId) {
    return res.status(400).json({ message: "Chat ID is required" });
  }
  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }
  const chat = await Chat.findById(chatId);
  if (!chat) {
    return res.status(404).json({ message: "Chat not found" });
  }
  const isUserInChat = chat.users.some((userId) => userId.toString() === userId.toString());
  if (!isUserInChat) {
    return res.status(403).json({ message: "You are not a participant in this chat" });
  }
  const messagesToMarkSeen = await Message.find({
    chatId: chatId,
    sender: { $ne: userId },
    seen: false,
  });
  await Message.updateMany(
    { chatId: chatId, sender: { $ne: userId }, seen: false },
    {
      seen: true,
      seenAt: new Date(),
    }
  );
  const messages = await Message.find({ chatId }).sort({ createdAt: -1 });
  res.status(200).json(messages);
  const otherUserId = chat.users.find((id) => id.toString() !== userId.toString());

  try {
    if (!otherUserId) {
      return res.status(400).json({ message: "Other user not found" });
    }
    const { data } = await axios.get(`${process.env.USER_SERVICE}/api/v1/users/${otherUserId}`, {
      headers: {
        Authorization: req.headers.authorization || "",
      },
    });
    res.status(200).json({
      messages,
      user: data,
    });
    // use `data` here if needed...
  } catch (error) {
    console.error(error);
    return res.json({ messages, user: { _id: otherUserId, name: "Unknown User", email: "Unknown" } });
  }
});
