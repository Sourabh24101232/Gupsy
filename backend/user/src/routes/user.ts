import express from "express";
import { getAllUsers, getAUser, loginUser, myProfile, updateName, verifyUser } from "../controllers/user.js";
import { isAuth } from "../middleware/isAuth.js";

const router = express.Router(); //create Router
router.post("/login", loginUser);//send otp for login
router.post("/verify", verifyUser); //verify route
router.get("/me", isAuth, myProfile);//fetch my profile 

router.get("/user/all", isAuth, getAllUsers);
router.get("/user/:id", getAUser);
router.post("/update/user", isAuth, updateName);

export default router;
