import { RequestHandler } from "express";
import { sendErrorRes } from "src/utils/helper";
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'
import UserModel from "src/model/user";
import PasswordRestTokenModel from "src/model/passwordRestToken";

interface UserProfile {
    id : string;
    email : string;
    name : string;
    verufy : boolean;
    avatar? : string;
}

declare global {
    namespace Express {
        interface Request {
            user : UserProfile
        }
    }
}


//     -- ENV --
const JWT_SECRET  = process.env.JWT_SECRET!;
//     -- ENV --

export const isAuth : RequestHandler = async (req,res,next) => {

    try {
        const authToken  = req.headers.authorization;

        if(!authToken) return sendErrorRes(res,"unauthorized request!",403);

        const token = authToken.split("Bearer ")[1];
        const payload = jwt.verify(token,JWT_SECRET) as {id : string}
        const user = await UserModel.findById(payload.id);

        if(!user) return sendErrorRes(res,"unauthorized request!",403);

        req.user = {
            id : user._id,
            email : user.email,
            name : user.name,
            verufy : user.verify,
            avatar : user.avatar.url
        };

        next();
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            sendErrorRes(res,"Session expired",401);
        }
        if (error instanceof JsonWebTokenError) {
            sendErrorRes(res,"unauthorized access",401);
        }
        next(error);
    }
}


export const isValidPasswordToken : RequestHandler = async (req,res,next) => {
    const {id,token} = req.body;
    // check that user is exist!
    const user = await PasswordRestTokenModel.findOne({owner:id});
    if(!user) return sendErrorRes(res,"unauthorized request! User Not Found",403);
    // compare token
    const isTokenValid = await user.compareToken(token);
    if(!isTokenValid) return sendErrorRes(res,"unauthorized request! Token not valid!",403);

    next();
}