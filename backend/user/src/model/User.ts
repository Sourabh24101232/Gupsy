//This User.ts file defines the structure of a User in MongoDB using Mongoose.

import mongoose, { Document, Schema } from "mongoose";

//Define the TypeScript interface.This defines what a User object should look like in TypeScript.
export interface IUser extends Document {
  name: string;
  email: string;
}

const schema: Schema<IUser> = new Schema( //Schema<IUser> connects the Mongoose schema with your TypeScript IUser interface.
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,//MongoDB should not allow duplicate email values.
    },
  },
  {
    timestamps: true,//Mongoose automatically adds: createdAt and updatedAt to every user document.
  }
);

//This creates the Mongoose Model called User.Model → Used to actually perform database operations
export const User = mongoose.model<IUser>("User", schema);
//first User is just a variable name 
//second User is the name of mongoose model, Mongoose uses the model name "User" and normally derives the collection name "users"


// Correct MongoDB hierarchy is:
// Database
//    ↓
// Collection
//    ↓
// Document
//    ↓
// Fields

// MongoDB
// └── Gupsymicroserviceapp   ← Database
//     └── users                 ← Collection
//         ├── Document 1
//         │   ├── name
//         │   └── email
//         ├── Document 2
//         │   ├── name
//         │   └── email
//         └── Document 3


////Schema → Defines the structure and rules of a document.
// example:
// const schema = new Schema({
//   name: { type: String, required: true },
//   email: { type: String, required: true }
// });

//Document → An actual piece of data stored inside a MongoDB collection.
// Example:
// {
//   "name": "Sourabh",
//   "email": "sourabh@gmail.com"
// }


// extends Document means IUser also gets Mongoose document functionality/properties.
// Think:
// IUser
//  ├── name
//  ├── email
//  └── Mongoose Document properties (_id, etc.)


// The model is what you actually use to interact with MongoDB:
// User.find()
// User.findOne()
// User.create()
// User.deleteOne()
// User.updateOne()