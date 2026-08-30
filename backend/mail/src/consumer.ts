//This code is a RabbitMQ consumer whose job is to receive OTP email requests from a queue and send those emails using Gmail SMTP.


import amqp from "amqplib";//amqplib allows Node.js to communicate with RabbitMQ.
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

//Create the consumer function
export const startSendOtpConsumer = async () => {
  try {

    //Read RabbitMQ configuration
    const host = process.env.Rabbitmq_Host;
    const username = process.env.Rabbitmq_User;
    const password = process.env.Rabbitmq_Password;
    if (!host || !username || !password) {
      throw new Error("RabbitMQ environment variables are missing");
    }

    //This creates a connection between your Node.js application and RabbitMQ
    const connection = await amqp.connect({
      protocol: "amqp",
      hostname: host,
      port: 5672,
      username: username,
      password: password,
    });

    //Create a RabbitMQ channel
    const channel = await connection.createChannel();

    //Define queue name
    const queueName = "send-otp";
    //assertQueue() basically means: Make sure this queue exists. If it doesn't exist, create it
    await channel.assertQueue(queueName, { durable: true });

    console.log("✅ Mail service consumer started.listening for otp emails.");

    //consume() means: Keep watching this queue. Whenever a message arrives, execute this function.
    channel.consume(queueName, async (msg) => {
      if (msg) {
        try {

          //msg.content: RabbitMQ gives the message content as a Buffer.
          //msg.content.toString(): Convert Buffer to string
          //JSON.parse(...) : This converts the JSON string into a JavaScript object.
          const { to, subject, body } = JSON.parse(msg.content.toString());//t0--> user@gmail.com, subject → Your OTP,body    → Your OTP is 123456

          //A transporter is basically the object Nodemailer uses to communicate with the email server.
          const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            auth: {
              user: process.env.USER,
              pass: process.env.PASSWORD,
            },
          });

          //Send the email
          await transporter.sendMail({
            from: "Gupsy",
            to,
            subject,
            text: body,
          });

          console.log(`OTP mail sent to ${to}`);

          //You are telling RabbitMQ: I successfully processed this message. You can remove it from the queue.
          channel.ack(msg);
        } catch (err) {
          console.log("Failed to send OTP", err);
        }
      }
    });
  } catch (err) {
    console.log("Failed to start rabbitMq consumer", err);
  }
};
