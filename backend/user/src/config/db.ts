import mongoose from "mongoose";

//function to connect database
const connectDb = async () => {

  //get mongodb connection url from env file
  const url = process.env.MONGO_URI;
  if (!url) {
    throw new Error("MONGO_URI is not defined in environment variables");
  }

  try {
    //use inbuilt mongoose.connect() 
    await mongoose.connect(url, { 
      dbName: "Gupsymicroserviceapp",
    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    process.exit(1);
  }
};

export default connectDb;