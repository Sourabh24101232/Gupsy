import TryCatch from "../config/TryCatch.js";
import type { AuthenticatedRequest } from "../middlewares/isAuth.js";
import { Chat } from "../models/chat.js";
import axios from "axios";
import { Messages } from "../models/messages.js";

export const createNewChat = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id; //Get logged-in user's ID. And because the request is: AuthenticatedRequest,you can access:req.user

    const { otherUserId } = req.body; //otherUserId in body
    if (!otherUserId) {
      res.status(400).json({
        message: "Other userid is required",
      });
      return;
    }

    //Find a chat containing both users and containing exactly two users.
    //We're asking MongoDB: : "Do I already have a chat whose users array contains these two users and has exactly 2 users?"
    const existingChat = await Chat.findOne({
      users: { $all: [userId, otherUserId], $size: 2 },
    });
    //stops execution Because we don't want to create another chat between the same two users.
    if (existingChat) {
      res.json({
        message: "Chat already exist",
        chatId: existingChat._id,
      });
      return;
    }

    const newChat = await Chat.create({
      users: [userId, otherUserId],
    });

    res.status(201).json({
      message: "New Chat created",
      chatId: newChat._id,
    });
  },
);

//import type { Chat } ...
//"I only need the TypeScript definition."

//import { Chat } ...
//"I need the actual Chat object at runtime."

// Suppose the authenticated user is:
// {
//   "_id": "user123",
//   "name": "Sourabh",
//   "email": "abc@gmail.com"
// }

// Then: req.user._id ="user123"

//$all: [userId, otherUserId] means: The users array must contain both user123 and user456

//get all chats of the logged-in user
export const getAllChats = TryCatch(async (req: AuthenticatedRequest, res) => {
  //Get logged-in user's ID
  const userId = req.user?._id;
  if (!userId) {
    res.status(400).json({
      message: "UserId missing",
    });
    return;
  }

  //Find all chats belonging to the logged in user
  const chats = await Chat.find({
    users: userId,
  }).sort({ updatedAt: -1 }); //latest updated chat first.

  const chatWithUserData = await Promise.all(
    //Process every chat of logged in user
    chats.map(async (chat) => {
      //finds the other user in each chat,
      const otherUserId = chat.users.find((id) => id !== userId);
      //counts their unseen messages
      const unseenCount = await Messages.countDocuments({
        chatId: chat._id,
        sender: { $ne: userId }, //$ne means: not equal. Don't count my own messages
        seen: false,
      });

      try {
        //Get the other user's information from the User Service
        const { data } = await axios.get(
          `${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`,
        );

        //Return the data for this chat
        return {
          user: data,
          chat: {
            ...chat.toObject(), ////Mongoose documents aren't plain JavaScript objects. chat.toObject() converts the Mongoose document into a normal object.
            latestMessage: chat.latestMessage || null,
            unseenCount,
          },
        };
      } catch (error) {
        console.log(error);

        //What happens if User Service fails?
        return {
          user: {
            _id: otherUserId,
            name: "Unknown User",
          },
          chat: {
            ...chat.toObject(),
            latestMessage: chat.latestMessage || null,
            unseenCount,
          },
        };
      }
    }),
  );

  res.json({
    chats: chatWithUserData, //Return all chats to frontend
  });
});

export const sendMessage = TryCatch(async (req: AuthenticatedRequest, res) => {
  const senderId = req.user?._id;
  const { chatId, text } = req.body;
  const imageFile = req.file;

  if (!senderId) {
    res.status(401).json({
      message: "unauthorized",
    });
    return;
  }
  if (!chatId) {
    res.status(400).json({
      message: "ChatId Required",
    });
    return;
  }
  if (!text && !imageFile) {
    res.status(400).json({
      message: "Either text or image is required",
    });
    return;
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    res.status(404).json({
      message: "Chat not found",
    });
    return;
  }

  const isUserInChat = chat.users.some(
    (userId) => userId.toString() === senderId.toString(),
  );
  if (!isUserInChat) {
    res.status(403).json({
      message: "You are not a participant of this chat",
    });
    return;
  }

  const otherUserId = chat.users.find(
    (userId) => userId.toString() !== senderId.toString(),
  );
  if (!otherUserId) {
    res.status(401).json({
      message: "No other user",
    });
    return;
  }

  // socket setup

  let messageData: any = {
    chatId: chatId,
    sender: senderId,
    seen: false,
    seenAt: undefined,
  };

  if (imageFile) {
    messageData.image = {
      url: imageFile.path,
      publicId: imageFile.filename,
    };

    messageData.messageType = "image";
    messageData.text = text || "";
  } else {
    messageData.text = text;
    messageData.messageType = "text";
  }

  const message = new Messages(messageData);
  const savedMessage = await message.save();
  const latestMessageText = imageFile ? "📷 Image" : text;

  await Chat.findByIdAndUpdate(
    chatId,
    {
      latestMessage: {
        text: latestMessageText,
        sender: senderId,
      },
      updatedAt: new Date(),
    },
    { new: true },
  );

  // emit to sockets

  res.status(201).json({
    message: savedMessage,
    sender: senderId,
  });
});

//This function is used to get all messages of a particular chat.
export const getMessagesByChat = TryCatch(
  async (req: AuthenticatedRequest, res) => {

    //Check logged-in user
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({
        message: "Unauthorized",
      });
      return;
    }

    //Check chatId
    const { chatId } = req.body;
    if (!chatId) {
      res.status(400).json({
        message: "ChatId Required",
      });
      return;
    }

    //Find chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      res.status(404).json({
        message: "Chat not found",
      });
      return;
    }

    //Check user belongs to chat
    const isUserInChat = chat.users.some(
      (userId) => userId.toString() === userId.toString(),
    );
    if (!isUserInChat) {
      res.status(403).json({
        message: "You are not a participant of this chat",
      });
      return;
    }

    //Mark received messages as seen
    const messagesToMarkSeen = await Messages.find({
      chatId: chatId,
      sender: { $ne: userId },
      seen: false,
    });

    await Messages.updateMany(
      {
        chatId: chatId,
        sender: { $ne: userId },
        seen: false,
      },
      {
        seen: true,
        seenAt: new Date(),
      },
    );

    //Get all messages
    const messages = await Messages.find({ chatId }).sort({
      createdAt: 1,
    });

    //Find the other user
    const otherUserId = chat.users.find(
      (id) => id.toString() !== userId.toString(),
    );
    if (!otherUserId) {
      res.status(400).json({
        message: "No other user",
      });
      return;
    }

    //Get other user's details from User Service
    let data;
    try {
      const response = await axios.get(
        `${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`,
      );
      data = response.data;
    } catch (error) {
      console.log(error);
      res.json({
        messages,
        user: {
          _id: otherUserId,
          name: "Unknown User",
        },
      });
      return;
    }

    // socket work

    //Send messages + user details
    res.json({
      messages,
      user: data,
    });
  },
);
