import { Server, Socket } from "socket.io"; //Server → creates the Socket.IO server and manages all connected users. Socket → TypeScript type representing one connected client and represents ONE connected user.
import http from "http"; //Node.js's built-in HTTP module.We need it because Socket.IO needs to attach itself to an HTTP server.
import express from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

const app = express(); //Create an Express app.it handles HTTP requests
const server = http.createServer(app); //Create an HTTP server using that Express app. You're taking the Express application and putting it inside a Node HTTP server Because Socket.IO will attach to this HTTP server, not directly to Express.

//creates a Socket.IO server and Attach it to the HTTP server.
const io = new Server(server, {
  //io is the object you'll use to manage Socket.IO connections and send events.
  cors: {
    origin: "*", //Allow requests from any origin.
    methods: ["GET", "POST"], //Allows GET and POST HTTP methods for the Socket.IO connection.
  },
});

//Keep a map for userId → socketId.
const userSocketMap: Record<string, Set<string>> = {};

export const getRecieverSocketId = (recieverId: string): string | undefined => {
  return userSocketMap[recieverId];
};

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token as string | undefined;
    const decoded = jwt.verify(
      token ?? "",
      process.env.JWT_SECRET as string,
    ) as JwtPayload;
    const userId = decoded.user?._id as string | undefined;
    if (!userId) return next(new Error("Unauthorized socket connection"));
    socket.data.userId = userId;
    next();
  } catch {
    next(new Error("Unauthorized socket connection"));
  }
});

//Detect when users connect/disconnect.Whenever a new client connects to Socket.IO, execute this function.For every connected client, Socket.IO gives you a socket.
io.on("connection", (socket: Socket) => {
  console.log("User Connected", socket.id); //Log connected user

  const userId = socket.data.userId as string | undefined;
  if (userId) {
    userSocketMap[userId] ??= new Set<string>();
    userSocketMap[userId].add(socket.id);
    console.log(`User ${userId} mapped to socket ${socket.id}`);
  }

  io.emit("getOnlineUser", Object.keys(userSocketMap));
  if (userId) {
    socket.join(userId);
  }

  socket.on("typing", (data) => {
    console.log(`User ${data.userId} is typing in chat ${data.chatId}`);

    socket.to(data.chatId).emit("userTyping", {
      chatId: data.chatId,
      userId: data.userId,
    });
  });

  socket.on("stopTyping", (data) => {
    console.log(`User ${data.userId} stopped typing in chat ${data.chatId}`);

    socket.to(data.chatId).emit("userStoppedTyping", {
      chatId: data.chatId,
      userId: data.userId,
    });
  });

  socket.on("joinChat", (chatId) => {
    socket.join(chatId);

    console.log(`User ${userId} joined chat room ${chatId}`);
  });

  socket.on("leaveChat", (chatId) => {
    socket.leave(chatId);

    console.log(`User ${userId} left chat room ${chatId}`);
  });

  //If THIS particular socket disconnects, execute this function.
  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);

    if (userId) {
      userSocketMap[userId]?.delete(socket.id);
      if (userSocketMap[userId]?.size === 0) {
        delete userSocketMap[userId];
        console.log(`user ${userId} is removed from online users`);
      }
      io.emit("getOnlineUser", Object.keys(userSocketMap));
    }
  });

  //If Socket.IO encounters a connection error, this event runs.
  socket.on("connect_error", (error) => {
    console.log("Socket connection Error", error);
  });
});

//Export everything so other backend files can use it.
export { app, server, io };
