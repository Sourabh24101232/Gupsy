import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

//this tells the application which Cloudinary account to use.
// cloudinary.config({
//   cloud_name: process.env.Cloud_Name!,
//   api_key: process.env.Api_Key!,
//   api_secret: process.env.Api_Secret!,
// });
const cloudName = process.env.Cloud_Name;
const apiKey = process.env.Api_Key;
const apiSecret = process.env.Api_Secret;

if (!cloudName || !apiKey || !apiSecret) {
  throw new Error("Cloudinary environment variables are missing");
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

export default cloudinary;
