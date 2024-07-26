import express from 'express';
import homeController from '../../controllers/homeController.js';
import categoryController from '../../controllers/categoryController.js';
import productController from '../../controllers/productController.js';

import multer from "multer";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({storage: storage});

router.get('/', homeController.getHomePage);

router.get('/category', categoryController.getCategoryPage);

router.post('/create-category',  upload.single("image"),categoryController.postCreateCategory);

router.post('/delete-category/:id', categoryController.deleteCategory);

router.post('/update-category/:id', upload.single("image"), categoryController.updateCategory);

router.get('/product', productController.getProductPage);

router.post('/create-product', upload.single("image"), productController.postCreateProduct);

router.post('/delete-product/:id', productController.deleteProduct);

router.post('/update-product/:id', upload.single("image"), productController.updateProduct);

export default router;
