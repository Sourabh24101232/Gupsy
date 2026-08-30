import amqp from "amqplib";
import dotenv from "dotenv";

dotenv.config();

let channel: amqp.Channel;

export const connectRabbitMQ = async () => {
  try {
    const host = process.env.Rabbitmq_Host;
    const username = process.env.Rabbitmq_User;
    const password = process.env.Rabbitmq_Password;

    if (!host || !username || !password) {
      throw new Error("RabbitMQ environment variables are missing");
    }

    const connection = await amqp.connect({
      protocol: "amqp",
      hostname: host,
      port: 5672,
      username: username,
      password: password,
    });

    channel = await connection.createChannel();

    console.log("✅ connected to rabbitmq");
  } catch (error) {
    console.log("❌ Failed to connect to rabbitmq", error);
  }
};

//This function is a RabbitMQ producer helper.
// Its job is simple: Take a JavaScript/TypeScript message → convert it to bytes → put it into a RabbitMQ queue.
export const publishToQueue = async (queueName: string, message: any) => {
  //channel is the object through which you're communicating with RabbitMQ.
  if (!channel) {
    console.log("RabbitMQ channel is not initialized");
    return;
  }
  
  //"Make sure this queue exists. If it doesn't exist, create it."
  await channel.assertQueue(queueName, {
    durable: true,
  });
  
  //Initially message is a JavaScript object. Convert the message to JSON
  channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
    persistent: true,//his tells RabbitMQ to mark the message as persistent.
  });
};

// queueName  → which RabbitMQ queue? queueName Tells RabbitMQ where to put the message.
// message    → what data should be sent?
// For example:
// publishToQueue("user-queue", {
//     userId: 123,
//     name: "Sourabh"
// });


// What does durable: true mean?
// durable: true means the queue should survive a RabbitMQ server restart.

// Without durable:
// RabbitMQ crashes/restarts
//         ↓
// Queue can disappear

// With durable:
// RabbitMQ restarts
//         ↓
// Queue remains

// Buffer.from(...) 
// converts that string into a Node.js Buffer.


// Queue
//  └── durable: true
//        ↓
//        Queue survives RabbitMQ restart

// Message
//  └── persistent: true
//        ↓
//        RabbitMQ should persist the message




// 1. assertQueue()
//    → Make sure queue exists.

// 2. durable: true
//    → Queue survives RabbitMQ restart.

// 3. JSON.stringify()
//    → Object → JSON string.

// 4. Buffer.from()
//    → JSON string → bytes.

// 5. sendToQueue()
//    → Send those bytes into the queue.

// 6. persistent: true
//    → Mark message for persistence.