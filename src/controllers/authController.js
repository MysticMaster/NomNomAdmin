import Member from "../models/memberModel.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const handleErrors = (err) => {
    let errors = {username: '', password: ''};

    // incorrect email
    if(err.message === 'username'){
        errors.username = 'Tên đăng nhập không tồn tại';
    }

    // incorrect password
    if(err.message === 'password'){
        errors.password = 'Mật khẩu không đúng';
    }

    return errors;
}

const maxAge = 1000 * 60 * 60 * 2;
const createToken = id => {
    return jwt.sign({id}, process.env.SECRET_KEY, {
        expiresIn: maxAge,
    });
}

const getLoginPage = (req, res) => {
    res.render('login');
}

const postLogin = async (req, res) => {
    try {
        const {username, password} = req.body;

        const member = await Member.login(username, password);
        const token = createToken(member._id);

        res.cookie('authenticated', token, {httpOnly: true, secure: false, maxAge: maxAge});
        res.status(200).json({member: member._id});
    } catch (error) {
        const errors = handleErrors(error);
        res.status(200).json({errors});
    }
}

const getLogout = async (req, res) => {
    res.cookie('authenticated','',{maxAge:1});
    res.redirect('/login');
}

export default {
    getLoginPage,
    postLogin,
    getLogout
}