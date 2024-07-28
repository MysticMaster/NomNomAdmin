import express from "express";
import customerApiController from "../../controllers/customerApiController.js";
import nodemailerApiController from "../../controllers/nodemailerApiController.js";
import categoryApiController from "../../controllers/categoryApiController.js";
import productApiController from "../../controllers/productApiController.js";
import cartApiController from "../../controllers/cartApiController.js";
import searchHistoryApiController from "../../controllers/searchHistoryApiController.js";
import orderApiController from "../../controllers/OrderApiController.js";
import notificationApiController from "../../controllers/notificationApiController.js";

import multer from "multer";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/otp", nodemailerApiController.sendEmail);

router.post("/validate", customerApiController.checkSignup);
router.post("/signup", customerApiController.postSignup);
router.post("/login", customerApiController.postLogin);
router.get("/customer/:id", customerApiController.getCustomer);
router.put(
  "/update-avatar/:id",
  upload.single("image"),
  customerApiController.putUpdateAvatar
);
router.put("/update-full-name/:id", customerApiController.putUpdateFullName);
router.put("/update-password/:id", customerApiController.putUpdatePassword);
router.put("/update-phone/:id", customerApiController.putUpdatePhone);
router.put("/update-location/:id", customerApiController.putUpdateLocation);
router.post("/forgot",customerApiController.postForgotPassword);
router.post("/password",customerApiController.autoResetPassword);

router.get("/category", categoryApiController.getCategories);

router.get("/product", productApiController.getProducts);
router.post("/product/search", productApiController.searchProducts);

router.get("/cart/:id", cartApiController.getCartsByIdCustomer);
router.post("/cart", cartApiController.postAddToCart);
router.put("/cart/update-quantity/:id", cartApiController.putUpdateQuantity);
router.put("/cart/update-note/:id", cartApiController.putUpdateNote);
router.delete("/cart/:id", cartApiController.deleteCart);
router.delete("/cart/all/:id", cartApiController.deleteAllCart);

router.get("/order/:id", orderApiController.getOrderByIdCustomer);
router.post("/order", orderApiController.postCreateOrder);
router.put("/order/receive/:id", orderApiController.putReceiveOrder);
router.put("/order/cancel/:id", orderApiController.putCancelOrder);

router.get(
  "/search-history/:id",
  searchHistoryApiController.getSeacrhHistoriesByIdCustomer
);
router.post("/search-history", searchHistoryApiController.postAddSearchHistory);
router.delete(
  "/search-history/:id",
  searchHistoryApiController.deleteSearchHistory
);
router.delete(
  "/search-history/all/:id",
  searchHistoryApiController.deleteAllSearchHistory
);

router.get(
  "/notification/:id",
  notificationApiController.getAllNotificationByIdCustomer
);

export default router;
