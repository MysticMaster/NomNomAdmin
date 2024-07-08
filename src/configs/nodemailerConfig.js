import nodemailer from 'nodemailer';

const nodemailerConfig = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'anhdnph31267@fpt.edu.vn',
        pass: 'dthr jrgv cqka mghv'
    }
});

export default nodemailerConfig;