import nodemailer from 'nodemailer';

//     -- ENV --
const MAIL_USERNAME  = process.env.MAIL_USERNAME!;
const MAIL_PASSWORD  = process.env.MAIL_PASSWORD!;
//     -- ENV --

const transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
    user: MAIL_USERNAME,
    pass: MAIL_PASSWORD
  }}
);

const sendVerificationLink = async (email : string,link:string) => {
    await transport.sendMail({
        from : 'pouya@myapp.com',
        to : email,
        html: `<h1>please click on <a href="${link}">this link</a> to verify your acount</h1>`
    })
}
const sendPasswordRestLink = async (email : string,link:string) => {
    await transport.sendMail({
        from : 'security@myapp.com',
        to : email,
        html: `<h1>please click on <a href="${link}">this link</a> to rest your password</h1>`
    })
}
const sendPasswordUpdateMessage = async (email : string) => {
    await transport.sendMail({
        from : 'security@myapp.com',
        to : email,
        html: `<h1>Your password has been updated!</h1>`
    })
}

sendPasswordUpdateMessage


const mail = {
    sendVerificationLink,
    sendPasswordRestLink,
    sendPasswordUpdateMessage
}
export default mail;