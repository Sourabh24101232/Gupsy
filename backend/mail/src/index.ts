import express from "express";
import dotenv from "dotenv";
import { startSendOtpConsumer } from "./consumer.js";

dotenv.config(); //to read variables from .env

const requiredEnv = [
  "PORT",
  "Rabbitmq_Host",
  "Rabbitmq_User",
  "Rabbitmq_Password",
  "USER",
  "PASSWORD",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`${key} is not defined`);
  }
}

startSendOtpConsumer();

const app = express();

//run server
const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

