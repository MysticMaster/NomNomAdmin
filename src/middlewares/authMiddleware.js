import jwt from "jsonwebtoken";
import Member from "../models/memberModel.js";

const requireAuthentication = (req, res, next) => {
  const token = req.cookies.authenticated;
  if (token) {
    jwt.verify(token, process.env.SECRET_KEY, (err, decodedToken) => {
      if (err) {
        res.redirect("/login");
      } else {
        next();
      }
    });
  } else {
    res.redirect("/login");
  }
};

const getUser = (req, res, next) => {
  const token = req.cookies.authenticated;
  if (token) {
    if (token) {
      jwt.verify(token, process.env.SECRET_KEY, async (err, decodedToken) => {
        if (err) {
          res.locals.user = null;
          next();
        } else {
          res.locals.user = decodedToken.id;
          next();
        }
      });
    } else {
      res.redirect("/login");
    }
  } else {
    res.locals.user = null;
    next();
  }
};

export default {
  requireAuthentication,
  getUser,
};
