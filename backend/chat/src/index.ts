import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import chatRoutes from "./routes/chat.js";
import cors from "cors";
import { app ,server} from "./config/socket.js";

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

app.use(express.json());

//Without CORS, the browser can block:axios.get("https://localhost:5000/api/v1/me");
app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000" }));
app.use("/api/v1/", chatRoutes);

//run server
const start = async () => {
  await connectDb();
  const port = process.env.PORT;
  server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

void start().catch((error: unknown) => {
  console.error("Failed to start chat service", error);
  process.exit(1);
});
