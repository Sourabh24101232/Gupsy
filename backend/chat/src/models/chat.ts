import mongoose, { Document, Schema } from "mongoose";

//Define the TypeScript interface
export interface IChat extends Document {
  chatKey: string;
  users: string[];//This means every chat has an array of strings that includes users that are chatting 
  latestMessage: {
    text: string;
    sender: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const schema: Schema<IChat> = new Schema(
  {
    chatKey: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
    },
    users: [{ type: String, required: true }],

    latestMessage: {
      text: String,
      sender: String,
    },
  },
  {
    timestamps: true,
  },
);

export const Chat = mongoose.model<IChat>("Chat", schema);

//Document → TypeScript type representing a MongoDB document.
