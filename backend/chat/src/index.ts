import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import chatRoutes from "./routes/chat.js";
import cors from "cors";

dotenv.config(); //to read variables from .env

const requiredEnv = [
  "PORT",
  "MONGO_URI",
  "JWT_SECRET",
  "USER_SERVICE",
  "Cloud_Name",
  "Api_Key",
  "Api_Secret",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`${key} is not defined`);
  }
}

connectDb();

const app = express(); //create server
app.use(express.json());
//Without CORS, the browser can block:axios.get("https://localhost:5000/api/v1/me");
app.use(cors);//This tells the browser:"Requests from other origins are allowed."
app.use("/api/v1/", chatRoutes);

//run server
const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
