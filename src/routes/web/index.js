import express from 'express';
import homeController from '../../controllers/homeController.js';
import multer from "multer";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({storage: storage});

router.get('/home', homeController.getHomePage);

router.get('/category', homeController.getCategoryPage);

router.post('/create-category', upload.single("image"), homeController.postCreateCategory);

router.post('/delete-category/:id', homeController.deleteCategory);

export default router;
