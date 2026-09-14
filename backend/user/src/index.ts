//code to create a basic Express server
import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import { createClient } from "redis";
import userRoutes from "./routes/user.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import cors from "cors";

dotenv.config(); //to read variables from .env

const requiredEnv = [
  "PORT",
  "MONGO_URI",
  "JWT_SECRET",
  "REDIS_URL",
  "Rabbitmq_Host",
  "Rabbitmq_User",
  "Rabbitmq_Password",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`${key} is not defined`);
  }
}

//redis connection
export const redisClient = createClient({
  url: process.env.REDIS_URL!,
});

//Express → A Node.js web framework used to build servers, APIs, routes, and middleware easily.
const app = express(); //create server
app.use(express.json());//express.json() parses the JSON string received in the HTTP request into a JavaScript object so you can use it through req.body.
app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000" }));

//app.use() → Mounts userRoutes at a specific URL path.
// /api/v1 → base path and userRoutes → handles the routes after that
app.use("/api/v1", userRoutes);

//run server
const start = async () => {
  await connectDb();
  await redisClient.connect();
  console.log("Connected to redis");
  void connectRabbitMQ();

  const port = process.env.PORT;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

void start().catch((error: unknown) => {
  console.error("Failed to start user service", error);
  process.exit(1);
});
