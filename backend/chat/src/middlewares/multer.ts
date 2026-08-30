import multer from "multer"; //Multer handles files sent from the frontend.
import { CloudinaryStorage } from "multer-storage-cloudinary"; //CloudinaryStorage connects Multer with Cloudinary.
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary, //This passes your Cloudinary configuration to CloudinaryStorage. You can also write: cloudinary, because the variable and property have the same name.
  params: {
    //Configure where the image goes
    folder: "chat-images",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [
      { width: 800, height: 600, crop: "limit" }, //"limit" means:Don't enlarge a smaller image unnecessarily; limit oversized images.
      { quality: "auto" }, //Cloudinary automatically chooses a suitable compression quality.
    ],
  } as any, //as any basically tells TypeScript:"Don't perform strict type checking on this object."
});

//Create the Multer middleware
export const upload = multer({
  storage, //Tell Multer where to store the file
  limits: {
    fileSize: 5 * 1024 * 1024, //Maximum file size
  },
  fileFilter: (req, file, cb) => {
    //fileFilter decides:"Should I accept this file or reject it?"Check whether the file is an image
    if (file.mimetype.startsWith("image/")) {//Every uploaded file has a MIME type.file.mimetype.startsWith("image/") means "Is this file an image?"
      cb(null, true);//Accept the file. 
      cb(null, true);//Accept the file. 
    } else {
      cb(new Error("only image allowed"));//Reject non-images
    }
  },
});
