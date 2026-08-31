import jwt from "jsonwebtoken";
// import dotenv from "dotenv";
import dotenvRuntime from "dotenv";

// dotenv.config();
dotenvRuntime.config();

// const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

// export const generateToken = (user: any) => {//user is the user document you got from MongoDB, we get it as input from VerifyUserfunction in user.ts
export const generateToken = (user: { _id: { toString(): string } }) => {
  return jwt.sign({ user: { _id: user._id.toString() } }, JWT_SECRET, {
    expiresIn: "15d",
  });
};
