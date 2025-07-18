import { Request, Response } from "express";
import { redisClient } from "../index.js";
import TryCatch from "../config/TryCatch.js";
import { publishToQueue } from "../config/rabbitmq.js";
import User, { IUser } from "../model/user.js";
import { generateToken } from "../config/generateToken.js";
import { AuthenticatedRequest } from "../middleware/isAuth.js";

export const loginUser = TryCatch(async (req: Request, res: Response) => {
  const { email } = req.body;

  const rateLimitKey = `otp:ratelimit:${email}`;
  const ratelimit = await redisClient.get(rateLimitKey);
  if (ratelimit) {
    res.status(429).json({
      message: "To many requests. Please wait before requesting new otp",
    });
    return;
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpKey = `otp:${email}`;
  await redisClient.set(otpKey, otp, {
    EX: 300,
  });
  await redisClient.set(rateLimitKey, "true", {
    EX: 60,
  });
  const message = {
    to: email,
    subject: "Your OTP code",
    body: `Your One-Time Password (OTP) is ${otp}. It will expire in 5 minutes. Please do not share it with anyone.`,
  };
  await publishToQueue("send-otp", message),
    res.status(200).json({
      message: "OTP send to your mail",
    });
});
export const verifyUser = TryCatch(async (req: Request, res: Response) => {
  const { email, otp: enterOtp } = req.body;
  if (!email || !enterOtp) {
    res.status(400).json({
      message: "Email and OTP Required",
    });
    return;
  }
  const otpKey = `otp:${email}`;
  const storedOtp = await redisClient.get(otpKey);
  if (!storedOtp || storedOtp !== enterOtp) {
    res.status(400).json({
      message: "Invalid or expired OTP",
    });
    return;
  }
  await redisClient.del(otpKey);
  let user: IUser | null = await User.findOne({ email });
  if (!user) {
    const name = email.slice(0, 8);
    user = await User.create({ name, email });
  }
  const token = generateToken(user);
  res.status(200).json({
    message: "User Verified",
    user,
    token,
  });
});
export const myProfile = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  res.json(user);
});

export const updateName = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
  const { name } = req.body;
  const user = await User.findById(req.user?._id);

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  user.name = name;
  await user.save();

  res.status(200).json({
    message: "Name updated successfully",
    user,
  });
});
export const getAllUsers = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
  const users = await User.find({ _id: { $ne: req.user?._id } });
  res.status(200).json(users);
});

export const getAUser = TryCatch(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await User.findById(id);

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.status(200).json(user);
});
