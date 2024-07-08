import express from 'express';
import customerApiController from "../../controllers/customerApiController.js";
import nodemailerApiController from "../../controllers/nodemailerApiController.js";
import categoryApiController from "../../controllers/categoryApiController.js";
import productApiController from "../../controllers/productApiController.js";

import multer from "multer";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({storage: storage});

router.post('/otp', nodemailerApiController.sendEmail);

router.post('/validate', customerApiController.checkSignup);

router.post('/signup', customerApiController.postSignup);

router.post('/login', customerApiController.postLogin);

router.get('/customer/:id', customerApiController.getCustomer);

router.put('/update-avatar/:id',upload.single("image"), customerApiController.putUpdateAvatar);

router.put('/update-full-name/:id', customerApiController.putUpdateFullName);

router.put('/update-password/:id',customerApiController.putUpdatePassword);

router.put('/update-phone/:id', customerApiController.putUpdatePhone);

router.put('/update-location/:id', customerApiController.putUpdateLocation);

router.get('/category', categoryApiController.getCategories);

router.get('/product', productApiController.getProducts);

export default router;