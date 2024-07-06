import { Response } from "express";

export const sendErrorRes = (res:Response,message :String,statusCode :number) => {
    res.status(statusCode).json({message})
}