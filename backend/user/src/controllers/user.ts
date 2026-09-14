//This file contains the actual business logic for requesting an OTP

//Imports publishToQueue(), which sends a message to RabbitMQ so the mail service can send the OTP email.
import { publishToQueue } from "../config/rabbitmq.js";
import TryCatch from "../config/TryCatch.js";
import { redisClient } from "../index.js";
import { User } from "../model/User.js";
import { generateToken } from "../config/generateToken.js";
import type { AuthenticatedRequest } from "../middleware/isAuth.js";
import { randomInt } from "node:crypto";
import mongoose from "mongoose";

export const loginUser = TryCatch(async (req, res) => {
  // const { email } = req.body;
  const email = typeof req.body.email === "string"? req.body.email.trim().toLowerCase(): "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({
      message: "A valid email address is required",
    });
    return;
  }

  //rateLimitKey Creates a unique Redis key for this user's OTP requests.This allows Redis to track the OTP request limit separately for each email.
  const rateLimitKey = `otp:ratelimit:${email}`;
  const rateLimitSet = await redisClient.set(rateLimitKey, "true", {
    NX: true,
    EX: 60,
  });
  if (!rateLimitSet) {
    return res.status(429).json({
      message: "Too many requests. Please wait before requesting new otp",
    });
  }

  //generate otp
  // const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otp = randomInt(100000, 1000000).toString();
  //Creates a unique key for storing this user's OTP. otpKey = "otp:user@gmail.com" It is simply a unique identifier/key telling Redis: "The OTP belonging to user@gmail.com is stored here."
  const otpKey = `otp:${email}`;
  //Store otp in Redis
  await redisClient.set(otpKey, otp, {
    EX: 300, //EX: 300 means the key automatically expires after 300 seconds = 5 minutes.
  });

  //Why not simply store otp?
  //Because later, when the user submits the OTP, your server needs to know which user's OTP to retrieve.

  //Create email message
  const message = {
    to: email,
    subject: "Your otp code",
    body: `Your OTP is ${otp}. It is valid for 5 minutes`,
  };

  try {
    await publishToQueue("send-otp", message);
  } catch (error) {
    await Promise.all([redisClient.del(otpKey), redisClient.del(rateLimitKey)]);
    throw error;
  }

  return res.status(200).json({
    success: true,
    message: "OTP sent successfully",
  });
});

//user verification after sending otp
export const verifyUser = TryCatch(async (req, res) => {
  // const { email, otp: enteredOtp } = req.body;
  const email = typeof req.body.email === "string"? req.body.email.trim().toLowerCase(): "";
  const enteredOtp =typeof req.body.otp === "string" ? req.body.otp.trim() : "";

  // Check whether email and OTP are provided
  // if (!email || !enteredOtp) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(enteredOtp)) {
    res.status(400).json({
      message: "Email and OTP Required",
    });
    return;
  }

  // Create the same Redis key used while storing the OTP
  const otpKey = `otp:${email}`;
  const attemptsKey = `otp:attempts:${email}`;

  const attempts = await redisClient.incr(attemptsKey);
  if (attempts === 1) await redisClient.expire(attemptsKey, 300);
  if (attempts > 5) {
    await Promise.all([redisClient.del(otpKey), redisClient.del(attemptsKey)]);
    res.status(429).json({ message: "Too many OTP attempts. Request a new code." });
    return;
  }

  // Atomically compare and consume the OTP so concurrent requests cannot reuse it.
  const otpConsumed = await redisClient.eval(
    "if redis.call('GET', KEYS[1]) == ARGV[1] then redis.call('DEL', KEYS[1]); return 1 end; return 0",
    { keys: [otpKey], arguments: [enteredOtp] },
  );
  if (otpConsumed !== 1) {
    res.status(400).json({
      message: "Invalid or expired OTP",
    });
    return;
  }
  await redisClient.del(attemptsKey);

  // Find existing user
  let user = await User.findOne({ email });
  // If user doesn't exist, create a new user
  if (!user) {
    const name = email.slice(0, 8);
    user = await User.create({
      name,
      email,
    });
  }

  // Generate JWT token
  const token = generateToken(user);

  // Send response
  res.json({
    message: "User Verified",
    user,
    token,
  });
});

//fetch my profile
export const myProfile = TryCatch(async (req: AuthenticatedRequest, res) => {
  // const user = req.user;
  const user = await User.findById(req.user?._id);

  if (!user) {
    res.status(404).json({
      message: "User not found",
    });
    return;
  }

  res.json(user);
});

//update name of user
export const updateName = TryCatch(async (req: AuthenticatedRequest, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  if (name.length < 2 || name.length > 50) {
    res.status(400).json({ message: "Name must be between 2 and 50 characters" });
    return;
  }
  const user = await User.findById(req.user?._id);
  if (!user) {
    res.status(404).json({
      message: "Please login",
    });
    return;
  }

  //update and save
  user.name = name;
  await user.save();

  const token = generateToken(user);

  res.json({
    message: "User Updated",
    user,
    token,
  });
});

//get all users
export const getAllUsers = TryCatch(async (req: AuthenticatedRequest, res) => {
  const currentUserId = req.user?._id;
  if (!currentUserId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  // const users = await User.find();
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find({ _id: { $ne: currentUserId } }).select("_id name").skip(skip).limit(limit),
    User.countDocuments({ _id: { $ne: currentUserId } }),
  ]);

  // res.json(users);
  res.json({
    users,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

//get a patcicular user
// export const getAUser = TryCatch(async (req, res) => {
//   const user = await User.findById(req.params.id);
//   res.json(user);
// });
export const getAUser = TryCatch(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({
      message: "Invalid user ID",
    });
    return;
  }

  const user = await User.findById(id).select("_id name");

  if (!user) {
    res.status(404).json({
      message: "User not found",
    });
    return;
  }

  res.json(user);
});
