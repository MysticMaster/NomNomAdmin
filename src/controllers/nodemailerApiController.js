import nodemailerConfig from "../configs/nodemailerConfig.js";
import dotenv from "dotenv";

dotenv.config();

const sendMailAsync = (content) => {
    return new Promise((resolve, reject) => {
        nodemailerConfig.sendMail(content, (err, info) => {
            if (err) {
                reject(err);
            } else {
                resolve(info);
            }
        });
    });
};

const sendEmail = async (req, res) => {
    try {
        const { to, subject, text } = req.body;

        let content = {
            from: process.env.FROM,
            to: to,
            subject: subject,
            text: text
        };

        const info = await sendMailAsync(content);
        console.log('Đã gửi:', info.response);
        res.json({ status: 200, data: null, message: 'Đã gửi đến gmail của bạn' });
    } catch (error) {
        console.log('Lỗi gửi:', error.response);
        res.json({status: 500, data: null, message: error.message});
    }
}

export default {
    sendMailAsync,
    sendEmail
};