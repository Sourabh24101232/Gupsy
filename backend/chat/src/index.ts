import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import chatRoutes from "./routes/chat.js";

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
app.use("/api/v1/", chatRoutes);

//run server
const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
