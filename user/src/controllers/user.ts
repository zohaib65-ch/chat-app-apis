import { redisClient } from "../index.js";
import TryCatch from "../config/TryCatch.js";
import { publishToQueue } from "../config/rabbitmq.js";
import User from "../model/user.js";
import { generateToken } from "../config/generateToken.js";

export const loginUser = TryCatch(async (req, res) => {
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
    body: `Your OTP is ${otp}. It is valid for 5 minutes`,
  };
  await publishToQueue("send-otp", message),
    res.status(200).json({
      message: "OTP send to your mail",
    });
});
export const verifyUser = TryCatch(async (req, res) => {
  const { email, otp: enterOtp } = req.body;
  if (!email || !enterOtp) {
    res.status(400).json({
      message: "Email and OTP Required",
    });
    return;
  }
  const otpKey = `otp:${email}`;
  const storedOtp = await redisClient.get(otpKey);
  console.log(storedOtp)
  if (!storedOtp || storedOtp !== enterOtp) {
    res.status(400).json({
      message: "Invalid or expired OTP",
    });
    return;
  }
  await redisClient.del(otpKey);
  let user = await User.findOne({ email });
  if (!user) {
    const name = email.slice(0, 8);
    user = await User.create({ name, email });
  }
  const token = generateToken(user);
  res.status(400).json({
    message: "User Verified",
    user,
    token,
  });
});
