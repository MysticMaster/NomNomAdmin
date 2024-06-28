import jwt from 'jsonwebtoken';
import Member from "../models/memberModel.js";

const requireAuthentication = (req, res, next) => {
    const token = req.cookies.authenticated;
    if (token) {
        jwt.verify(token, process.env.SECRET_KEY, (err, decodedToken) => {
            if (err) {
               // console.log(err);
                res.redirect('/login');
            } else {
                // console.log(decodedToken);
                next();
            }
        });
    } else {
        res.redirect('/login');
    }
}

const checkUser = (req, res, next) => {
    const token = req.cookies.authenticated;
    if (token) {
        if (token) {
            jwt.verify(token, process.env.SECRET_KEY, async (err, decodedToken) => {
                if (err) {
                 //   console.log(err);
                    res.locals.user = null;
                    next();
                } else {
                //    console.log(decodedToken);
                    res.locals.user = await Member.findById(decodedToken.id);
                    next();
                }
            });
        } else {
            res.redirect('/login');
        }
    } else {
        res.locals.user = null;
        next();
    }
}

export default {
    requireAuthentication,
    checkUser
};