import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMessage extends Document {
  chatId: Types.ObjectId; //This stores which chat this message belongs to.
  sender: string; //Stores the ID of the user who sent the message.
  text?: string;
  image?: {
    url: string; //The actual cloudinary URL where the image can be accessed
    publicId: string; //This is typically the ID Cloudinary gives the uploaded image
  };
  messageType: "text" | "image";
  seen: boolean;
  seenAt?: Date; //Stores when the message was seen.Ex- seenAt: 2026-08-30T10:30:00
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IMessage>(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: "Chat", //chatId refers to a document in the Chat model.
      required: true,
    },

    sender: {
      type: String,
      required: true,
    },

    text: String,

    image: {
      url: String,
      publicId: String,
    },

    messageType: {
      type: String,
      enum: ["text", "image"],
      default: "text",
    },

    seen: {
      type: Boolean,
      default: false,
    },

    seenAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export const Messages = mongoose.model<IMessage>("Messages", schema);
