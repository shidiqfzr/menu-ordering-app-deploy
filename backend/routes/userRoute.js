import express from "express";
import { loginUser, registerUser, adminLogin, verifyAdmin } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/admin-login", adminLogin);
userRouter.get("/admin-check", verifyAdmin);

export default userRouter;