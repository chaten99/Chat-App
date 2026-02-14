import { Router } from "express";
import {auth0Login, verifyOtp ,checkAuth, login, signup, updateProfile, logout } from "../controllers/userController.js";
import { protectRoute } from "../middleware/auth.js";
const userRouter = Router();

userRouter.post('/signup', signup);
userRouter.post('/login', login);
userRouter.post("/auth0", auth0Login);

userRouter.post("/verify-otp", verifyOtp);

userRouter.put('/update-profile', protectRoute ,updateProfile);
userRouter.get('/check', protectRoute ,checkAuth);
userRouter.post('/logout', logout);


export default userRouter;
