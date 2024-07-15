import { Router } from "express";
import { 
    creatNewUser,verifyEmail,signIn,
    sendProfile, generateVerificationTokenLink,
    grantRefreshToken, signOut,forgetPassword,
    grantValid, resetPassword, 
    updateProfile,
    updateAvatar,
    sendPublicProfile,
    me
    } from "controllers/auth";
import validate from "src/middleware/validate";
import { newUserSchema, resetPassSchema, verifyTokenSchema } from "src/utils/validationSchema";
import { isAuth, isValidPasswordToken } from "src/middleware/auth";
import fileParser from "src/middleware/fileParser";

const authRouter =  Router();

authRouter.post("/sign-up",validate(newUserSchema),creatNewUser);
authRouter.post("/verify",validate(verifyTokenSchema),verifyEmail);
authRouter.post("/sign-in",signIn);
authRouter.get("/profile",isAuth,sendProfile);
authRouter.post("/verify-token",isAuth,generateVerificationTokenLink);
authRouter.post("/refresh-token",grantRefreshToken);
authRouter.post("/sign-out",isAuth,signOut);
authRouter.post("/forget-password",forgetPassword);
authRouter.post("/verify-pass-reset-token",validate(verifyTokenSchema),isValidPasswordToken,grantValid);
authRouter.post("/reset-password",validate(resetPassSchema),isValidPasswordToken,resetPassword);
authRouter.patch("/update-profile",isAuth,updateProfile);
authRouter.post("/update-avatar",isAuth,fileParser,updateAvatar);
authRouter.get("/profile/:id",isAuth,sendPublicProfile)
authRouter.get("/me",me)
export default authRouter;