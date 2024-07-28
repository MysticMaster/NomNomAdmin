import express from "express";
import homeController from "../../controllers/homeController.js";
import categoryController from "../../controllers/categoryController.js";
import productController from "../../controllers/productController.js";
import orderController from "../../controllers/orderController.js";
import authMiddleware from "../../middlewares/authMiddleware.js";

import multer from "multer";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/", authMiddleware.getUser, homeController.getHomePage);

router.get(
  "/category",
  authMiddleware.getUser,
  categoryController.getCategoryPage
);

router.post(
  "/create-category",
  authMiddleware.getUser,
  upload.single("image"),
  categoryController.postCreateCategory
);

router.post(
  "/delete-category/:id",
  authMiddleware.getUser,
  categoryController.deleteCategory
);

router.post(
  "/update-category/:id",
  authMiddleware.getUser,
  upload.single("image"),
  categoryController.updateCategory
);

router.get(
  "/product",
  authMiddleware.getUser,
  productController.getProductPage
);

router.post(
  "/create-product",
  authMiddleware.getUser,
  upload.single("image"),
  productController.postCreateProduct
);

router.post(
  "/delete-product/:id",
  authMiddleware.getUser,
  productController.deleteProduct
);

router.post(
  "/update-product/:id",
  authMiddleware.getUser,
  upload.single("image"),
  productController.updateProduct
);

router.get("/order", authMiddleware.getUser, orderController.getOrderPage);

router.get("/order/:id", authMiddleware.getUser, orderController.getDetail);

router.get(
  "/order/accept/:id",
  authMiddleware.getUser,
  orderController.acceptOrder
);

router.get(
  "/order/ship/:id",
  authMiddleware.getUser,
  orderController.shipOrder
);

router.get(
  "/order/delivere/:id",
  authMiddleware.getUser,
  orderController.delivereOrder
);

router.get(
  "/order/refuse/:id",
  authMiddleware.getUser,
  orderController.refuseOrder
);

export default router;
