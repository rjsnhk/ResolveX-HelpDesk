const express=require("express");
const authRouter=express.Router();

const {signupUser,loginUser,logoutUser,getProfile}=require("../controllers/authController");
const { verifyToken } = require("../middleware/auth");

authRouter.post("/register",signupUser);
authRouter.post("/login",loginUser);
authRouter.post("/logout",logoutUser);

authRouter.get("/me",verifyToken,getProfile);

module.exports=authRouter;