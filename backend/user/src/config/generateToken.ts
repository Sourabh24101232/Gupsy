import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;

export const generateToken = (user: any) => {//user is the user document you got from MongoDB, we get it as input from VerifyUserfunction in user.ts
  return jwt.sign({ user }, JWT_SECRET, {
    expiresIn: "15d",
  });
};
