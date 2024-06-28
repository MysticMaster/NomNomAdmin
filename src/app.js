import createError from 'http-errors';
import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import dotenv from "dotenv";
import mongoose from "mongoose";
import configViewEngine from "./configs/viewEngine.js";
import authMiddleware from "./middlewares/authMiddleware.js";

dotenv.config();

import indexRouter from './routes/web/index.js'

import CategoryApiRoute from "./routes/api/categoryApiRoute.js";
import staticFile from "./configs/staticFile.js";
import MemberApiRoute from "./routes/api/memberApiRoute.js";

const app = express();

configViewEngine(app);
staticFile(app);

const connect = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL);
        console.log('Connect to MongoDB successful');
    } catch (error) {
        console.error('Connect to MongoDB fail: ', error.message);
    }
}
connect();


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());

import authController from './controllers/authController.js';

app.get('*',authMiddleware.checkUser);
app.get('/login', authController.getLoginPage);
app.post('/login', authController.postLogin);
app.get('/logout', authController.getLogout);

app.use('/',authMiddleware.requireAuthentication, indexRouter);

app.use('/api', CategoryApiRoute);
app.use('/api', MemberApiRoute);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

export default app;
