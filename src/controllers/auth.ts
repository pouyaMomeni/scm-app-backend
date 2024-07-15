import { RequestHandler } from "express";
import UserModel from "model/user";
import crypto from 'crypto';
import AuthVerificationTokenModel from "model/authVerificationToken";
import { sendErrorRes } from "utils/helper";
import jwt from 'jsonwebtoken'
import mail from "src/utils/mail";
import PasswordRestTokenModel from "src/model/passwordRestToken";
import { isValidObjectId } from "mongoose";
import cloudUploader from "src/cloud";

//     -- ENV --
const VERIFY_LINK  = process.env.VERIFY_LINK!;
const JWT_SECRET  = process.env.JWT_SECRET!;
const PASSWORD_RESET_LINK = process.env.PASSWORD_RESET_LINK!;
//     -- ENV --

// -- 1 --
export const creatNewUser : RequestHandler = async (req,res) => {
    // Read incoming data
    const {email,password,name} = req.body;
    // if exist this email in db or not
    const existingUser = await UserModel.findOne({email : email});
    // if is exist or not
    if (existingUser) {
        sendErrorRes(res,"email is already in use!",401);
    }
    // create new user
    const user = await UserModel.create({name,email,password});
    // generate token
    const token = crypto.randomBytes(36).toString('hex');
    await AuthVerificationTokenModel.create({owner : user._id,token})
    const link = `${VERIFY_LINK}?id=${user._id}&token=${token}`;
    await mail.sendVerificationLink(user.email,link);
    res.json({message : "Please verify your acount"});
}
// -- 2 --
export const generateVerificationTokenLink : RequestHandler = async (req,res) => {
    const {id,email} = req.user;
    await AuthVerificationTokenModel.findOneAndDelete({owner:id});
    const token = crypto.randomBytes(36).toString('hex');
    await AuthVerificationTokenModel.create({owner : id,token});
    const link = `${VERIFY_LINK}?id=${id}&token=${token}`;
    await mail.sendVerificationLink(email,link);
    res.json({message : "Please verify your acount"});
}
// -- 3 --
export const verifyEmail : RequestHandler = async (req,res) => {
    const {id,token} = req.body;
    const authToken = await AuthVerificationTokenModel.findOne({owner : id});
    if(!authToken) return sendErrorRes(res,'unauthorized request!',403);

    const isMatch = await authToken.compareToken(token);
    if(!isMatch) return sendErrorRes(res,'unauthorized request!, invalid token',403);

    await UserModel.findByIdAndUpdate(id,{verify : true});
    await AuthVerificationTokenModel.findByIdAndDelete(authToken._id)

    res.json({message : "Thanks for joining us,your acount has been verified."})
}
// -- 4 --
export const signIn : RequestHandler = async (req,res) => {
    const  {email,password} = req.body;

    const user = await UserModel.findOne({email});
    if(!user) return sendErrorRes(res,"email/password dismatch!",403);
    const isMatch = await user.comparePassword(password);
    if(!isMatch) return sendErrorRes(res,"email/password dismatch!",403);

    const payload = {id : user._id};
    const accessToken = jwt.sign(payload,JWT_SECRET,{expiresIn:"15m"});
    const refreshToken = jwt.sign(payload,JWT_SECRET);

    if(!user.tokens) user.tokens = [refreshToken];
    else user.tokens.push(refreshToken)
    
    await user.save();

    res.json({
        profile : {
            id : user._id,
            email : user.email,
            name : user.name,
            verify : user.verify,
            avatar : user.avatar
        },
        verifyTokenSchema : {
            access : accessToken,
            refresh : refreshToken
        }
    })
    console.log("SIGN IN - AUTH - CONTROLLER - LUNCH");
    

}
// -- 5 --
export const sendProfile :RequestHandler = async (req,res) => {
    res.json({
        profile :req.user
    })
}
// -- 6 --
export const grantRefreshToken :RequestHandler = async (req,res) => {
    const {refreshToken} = req.body;
    if(!refreshToken) return sendErrorRes(res,"unauthorized request! - p1",403);
    const payload = jwt.verify(refreshToken,JWT_SECRET) as {id : string};

    if (!payload.id) {
        return sendErrorRes(res,"unauthorized request! p - 2",401);
    }

    const user = await UserModel.findOne({
        _id : payload.id,
        tokens : refreshToken
    });

    if(!user){
        await UserModel.findByIdAndUpdate(payload.id,{tokens : []})
        return sendErrorRes(res,"unauthorized request!",401);
    }

    const newAccessToken = jwt.sign({id : user._id},JWT_SECRET,{expiresIn:"15m"});
    const newRefreshToken = jwt.sign({id : user._id},JWT_SECRET);

    const filterdToken = user.tokens.filter((t) => t !== refreshToken);
    user.tokens = filterdToken;
    user.tokens.push(newRefreshToken);
    await user.save();

    res.json({refresh : newRefreshToken , access : newAccessToken});

}
// -- 7 --
// -- sign out from the acount --
export const signOut :RequestHandler = async (req,res) => {
    const {refreshToken} = req.body;
    const user = await UserModel.findOne({_id : req.user.id,tokens : refreshToken});
    if(!user) return sendErrorRes(res,"unauthorized request! User Not Found",403);
    const newTokens = user.tokens.filter(t => t !== refreshToken );
    user.tokens = newTokens;
    await user.save();

    res.send("Sign out");
}
// -- 8 --
// -- send email Link for the restting the password --
export const forgetPassword :RequestHandler = async (req,res) => {
    // ask user for his/her email
    const {email} = req.body;
    const user = await UserModel.findOne({email});
    if(!user) return sendErrorRes(res,"Acount not found!",404);
    // remove token
    await PasswordRestTokenModel.findOneAndDelete({owner:user._id});

    // create new token
    const token = crypto.randomBytes(36).toString('hex');
    await PasswordRestTokenModel.create({owner:user._id,token})
    // send email to register email
    const passwordRestLink = `${PASSWORD_RESET_LINK}?id=${user._id}&token=${token}`;
    await mail.sendPasswordRestLink(email,passwordRestLink);
    // send res back
    res.json({message : "Please check your inbox email!"})
}
// -- 9 --
// -- for the passwor rest Link is valid or not --
export const grantValid :RequestHandler = async (req,res) => {
    res.json({valid : true});
}
// -- 10 --
// -- rest password --
export const resetPassword :RequestHandler = async (req,res) => {
    const {id,password} = req.body;
    const user = await UserModel.findById(id);
    if(!user) return sendErrorRes(res,"Acount not found!",404);
    const matched = await user.comparePassword(password);
    if(matched) return sendErrorRes(res,"The password must be new!",422);
    user.password = password;
    await user.save();
    await PasswordRestTokenModel.findOneAndDelete({owner : user._id});
    await mail.sendPasswordUpdateMessage(user.email);
    res.json({message:"Your password has beed Updated successfully!"})
}
// -- 11 --
// -- updating profile --
export const updateProfile :RequestHandler = async (req,res) => {
    const {name} = req.body;

    if(typeof name !== 'string' || name.trim().length < 3){
        return sendErrorRes(res,"Invalid name",422);
    } 
    await UserModel.findByIdAndUpdate(req.user.id,{name});
    res.json({profile : {...req.user,name}})
}
// -- 12 --
// -- update avatar -- 
export const updateAvatar :RequestHandler = async (req,res) => {
    const {avatar} = req.files;
    if(Array.isArray(avatar)){
        return sendErrorRes(res,"Multiple files are not allowed",422);
    }
    if(!avatar.mimetype?.startsWith("image")){
        return sendErrorRes(res,"Invalid image file",422);
    }
    const user = await UserModel.findById(req.user.id);
    if(!user){
        return sendErrorRes(res,"User not found",404);
    }
    console.log("ok1");
    
    if(user.avatar?.id){
        // remove avatar file
        await cloudUploader.destroy(user.avatar.id)
        console.log("ok");
    }
    // upload avatar file
    const {secure_url : url , public_id : id} = await cloudUploader.upload(
        avatar.filepath,
        {
            width : 300,
            height : 300,
            crop :  "thumb",
            gravity : "face"
        }
    )
    user.avatar = {url , id};
    user.save();
    res.json({profile : {...req.user , avatar: user.avatar.url}});
}   
// -- 13 --
// -- Get Profile By ID -- 
export const sendPublicProfile :RequestHandler = async (req,res) => {
    const profileId = req.params.id;
    if(!isValidObjectId(profileId)){
        return sendErrorRes(res,'Invalid profile Id',422);
    }
    const user = await UserModel.findById(profileId);
    if(!user){
        return sendErrorRes(res,"Profile Not Found!",404);
    }
    
    res.json({
        profile : {id : user._id, name : user.name , avatar : user.avatar?.url}
    })
}  


export const me :RequestHandler = async (req,res) => {
    res.json({messgae : 'me'})
}








