import Customer from "../models/customerModel.js";
import {DeleteObjectCommand, GetObjectCommand, PutObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import s3 from "../configs/s3Config.js";
import sharp from "sharp";
import dotenv from "dotenv";
import generateImageName from "../services/generateImageName.js";
import generateRandomOTP from "../services/generateRandomOTP.js";
import nodemailerApiController from "./nodemailerApiController.js";

dotenv.config();
const bucketName = process.env.BUCKET_NAME;

const checkSignup = async (req, res) => {
    try {
        if (!req.body) {
            return res.json({status: 400, data: null, message: 'Lỗi biểu mẫu đăng ký'});
        }

        const {email, username, password} = req.body;
        const customer = new Customer({email, username, password});
        await customer.validateCustomer();

        const otp = generateRandomOTP(5);

        const content = {
            from: process.env.FROM,
            to: email,
            subject: `${otp} là mã xác nhận tài khoản NomNom của bạn`,
            text: `NomNom xin chào bạn\nBạn đang Đăng ký tài khoản ứng dụng đặt đồ ăn NomNom \nMã xác nhận là ${otp}\nVui lòng hoàn thành xác nhận trong vòng 30 phút\nNomNom\nĐây là thư hệ thống, vui lòng không trả lời thư.`
        }

        try {
            await nodemailerApiController.sendMailAsync(content);
            res.json({status: 200, data: otp, message: 'Thông tin hợp lệ'});
        } catch (error) {
            res.json({status: 500, data: null, message: 'Có lỗi xảy ra, vui lòng thử lại'});
        }

    } catch (error) {
        let errorMessage, status;

        switch (error.message) {
            case 'email':
                errorMessage = 'email';
                status = 400;
                break;
            case 'username':
                errorMessage = 'username';
                status = 400;
                break;
            case 'password':
                errorMessage = 'password';
                status = 400;
                break;
            default:
                errorMessage = 'Có lỗi xảy ra, vui lòng thử lại';
                status = 500;
        }

        res.json({status: status, data: null, message: errorMessage});
    }
};

const postSignup = async (req, res) => {
    try {
        if (!req.body) {
            return res.json({status: 400, data: null, message: 'Lỗi biểu mẫu đăng ký'});
        }

        const {email, username, password} = req.body;

        await Customer.create({
            email: email,
            username: username,
            password: password,
        });

        res.json({status: 201, data: null, message: 'Đăng ký tài khoản thành công'});
    } catch (error) {
        res.json({status: 500, data: null, message: error.message});
    }
}

const putUpdateFullName = async (req, res) => {
    try {
        if (!req.body) {
            return res.json({status: 400, data: null, message: 'Lỗi biểu mẫu'});
        }

        let {firstName, lastName} = req.body;

        const customer = await Customer.findOneAndUpdate(
            {_id: req.params.id},
            {
                firstName: firstName,
                lastName: lastName
            }, {new: true});

        if (!customer) {
            return res.json({status: 404, data: null, message: 'Người dùng không tồn tại'});
        }

        res.json({status: 200, data: null, message: 'Cập nhật thông tin thành công'});
    } catch (error) {
        res.json({status: 500, data: null, message: 'Có lỗi xảy ra'});
    }
}

const putUpdatePassword = async (req, res) => {
    try {
        const {password} = req.body;

        if (password.length < 8) {
            return res.json({status: 400, data: null, message: 'password'});
        }

        const customer = await Customer.findOneAndUpdate(
            {_id: req.params.id},
            {password: password},
            {new: true});

        if (!customer) {
            return res.json({status: 404, data: null, message: 'Người dùng không tồn tại'});
        }

        res.json({status: 200, data: customer, message: 'Đổi mật khẩu thành công'});
    } catch (error) {
        res.json({status: 500, data: null, message: 'Có lỗi xảy ra, vui lòng thử lại'});
    }
}

const putUpdateAvatar = async (req, res) => {
    try {
        let imageName = null;
        if (req.body) {
            imageName = req.body.imageName;
        }

        if (req.file) {
            try {
                if (imageName) {
                    const deleteParams = {
                        Bucket: bucketName,
                        Key: imageName,
                    };

                    const deleteCommand = new DeleteObjectCommand(deleteParams);
                    await s3.send(deleteCommand);
                }

                const buffer = await sharp(req.file.buffer)
                    .resize({height: 500, width: 500, fit: "cover"})
                    .toBuffer();

                imageName = generateImageName();

                const params = {
                    Bucket: bucketName,
                    Key: imageName,
                    Body: buffer,
                    ContentType: req.file.mimetype,
                };

                const command = new PutObjectCommand(params);
                await s3.send(command);
            } catch (error) {
                console.log("ERROR upload file: ", error);
            }
        }

        const customer = await Customer.findOneAndUpdate(
            {_id: req.params.id},
            {imageName: imageName},
            {new: true});

        if (!customer) {
            return res.json({status: 404, data: null, message: 'Người dùng không tồn tại'});
        }
        
        res.json({status: 200, data: null, message: 'Cập nhật thông tin thành công'});
    } catch (error) {
        console.log(error)
        res.json({status: 500, data: null, message: 'Có lỗi xảy ra, vui lòng thử lại'});
    }
}

const putUpdatePhone = async (req, res) => {
    try {
        const {phoneNumber} = req.body;

        const customer = await Customer.findOneAndUpdate(
            {_id: req.params.id},
            {phoneNumber: phoneNumber},
            {new: true});

        if (!customer) {
            return res.json({status: 404, data: null, message: 'Người dùng không tồn tại'});
        }

        res.json({status: 200, data: customer, message: 'Đổi số điện thoại thành công'});
    } catch (error) {
        res.json({status: 500, data: null, message: 'Có lỗi xảy ra, vui lòng thử lại'});
    }
}

const putUpdateLocation = async (req, res) => {
    try {
        const {latitude, longitude} = req.body;

        const customer = await Customer.findOneAndUpdate(
            {_id: req.params.id},
            {
                latitude: latitude,
                longitude: longitude
            },
            {new: true});

        if (!customer) {
            return res.json({status: 404, data: null, message: 'Người dùng không tồn tại'});
        }

        res.json({status: 200, data: customer, message: 'Đổi địa chỉ thành công'});
    } catch (error) {
        res.json({status: 500, data: null, message: 'Có lỗi xảy ra, vui lòng thử lại'});
    }
}

const postLogin = async (req, res) => {
    try {
        const {username, password} = req.body;

        const customer = await Customer.login(username, password);

        if (customer.imageName) {
            const getObjectParams = {
                Bucket: bucketName,
                Key: customer.imageName,
            };

            const command = new GetObjectCommand(getObjectParams);
            customer.imageUrl = await getSignedUrl(s3, command, {expiresIn: 60});
        }

        res.json({status: 200, data: customer, message: 'Đăng nhập thành công'});
    } catch (error) {
        let errorMessage, status;
        switch (error.message) {
            case 'username':
                errorMessage = 'username';
                status = 400;
                break;
            case 'password':
                errorMessage = 'password';
                status = 400;
                break;
            case 'status':
                errorMessage = 'status';
                status = 400;
                break;
            default:
                errorMessage = 'Có lỗi xảy ra, vui lòng thử lại';
                status = 500;
        }

        res.json({status: status, data: null, message: errorMessage});
    }
}

const getCustomer = async (req, res) => {
    try {
        const customer = await Customer.findOne({_id: req.params.id})

        if (!customer) {
            res.json({status: 404, data: null, message: 'Tài khoản không tồn tại'});
        }

        if (customer.imageName) {
            const getObjectParams = {
                Bucket: bucketName,
                Key: customer.imageName,
            };

            const command = new GetObjectCommand(getObjectParams);
            customer.imageUrl = await getSignedUrl(s3, command, {expiresIn: 7200});
        }

        res.json({status: 200, data: customer, message: 'Thành công'});

    } catch (error) {
        res.json({status: 500, data: null, message: 'Sự cố máy chủ'});
    }
}

export default {
    checkSignup,
    postSignup,
    putUpdateAvatar,
    putUpdateFullName,
    putUpdateLocation,
    putUpdatePassword,
    putUpdatePhone,
    postLogin,
    getCustomer
}