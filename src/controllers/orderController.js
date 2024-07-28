import Order from "../models/orderModel.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3 from "../configs/s3Config.js";
import dotenv from "dotenv";
import Category from "../models/categoryModel.js";
import Product from "../models/productModel.js";
import Notification from "../models/notificationModel.js";

dotenv.config();
const bucketName = process.env.BUCKET_NAME;

const getOrderPage = async (req, res) => {
  const perPage = 5; // số lượng order trên mỗi trang
  const currentPage = +req.query.page || 1; // trang hiện tại, mặc định là 1
  const status = req.query.status;

  const user = res.locals.user;

  try {
    let conditions = {};

    if (status) {
      conditions.orderStatus = status;
    }

    const totalOrder = await Order.countDocuments(conditions); // tổng số order
    const totalPages = Math.ceil(totalOrder / perPage); // tổng số trang

    const orders = await Order.find(conditions)
      .sort({ createAt: -1 })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    res.render("index", {
      title: "Quản lý đơn hàng",
      active: "order",
      orders: orders,
      currentPage: currentPage,
      totalPages: totalPages,
      orderStatus: parseInt(status),
      user: user,
    });
  } catch (error) {
    res.render("detailPage", {
      code: 500,
      route: "order",
      title: "Lỗi kết nối máy chủ",
      message: "Đã có lỗi phát sinh từ phía máy chủ. Vui lòng thử lại",
    });
  }
};

const getDetail = async (req, res) => {
  try {
    const id = req.params.id;

    const order = await Order.findOne({ _id: id });

    if (!order) {
      return res.render("detailPage", {
        code: 404,
        route: "order",
        title: "Lỗi hiển thị",
        message: "Đon hàng này không tồn tại trong hệ thống",
      });
    }

    const orderModel = {
      id: order._id,
      shippingAddress: order.shippingAddress,
      deliveryPhoneNumber: order.deliveryPhoneNumber,
      billingStatus: order.billingStatus,
      discount: order.discount,
      totalPrice: order.totalPrice,
      totalQuantity: order.totalQuantity,
      note: order.note,
      orderPlacedAt: order.orderPlacedAt,
      orderConfirmedAt: order.orderConfirmedAt,
      orderShippedAt: order.orderShippedAt,
      orderDeliveredAt: order.orderDeliveredAt,
      orderReceivedAt: order.orderReceivedAt,
      orderCancelledAt: order.orderCancelledAt,
      orderRefusedAt: order.orderRefusedAt,
      orderStatus: order.orderStatus,
    };

    const orderItems = [];

    for (const obj of order.orderItem) {
      const product = await Product.findOne({ _id: obj.idProduct });
      if (product) {
        const category = await Category.findOne({ _id: product.idCategory });

        if (product.imageName) {
          const getObjectParams = {
            Bucket: bucketName,
            Key: product.imageName,
          };

          const command = new GetObjectCommand(getObjectParams);
          product.imageUrl = await getSignedUrl(s3, command, {
            expiresIn: 360,
          });
        }

        orderItems.push({
          imageUrl: product.imageUrl,
          productName: product.name,
          categoryName: category.name,
          note: obj.note,
          price: obj.price,
          quantity: obj.quantity,
        });
      }
    }

    res.render("orderDetail", {
      code: 200,
      route: "order",
      title: "Chi tiết đơn hàng",
      order: order,
      orderItems: orderItems,
    });
  } catch (error) {
    res.render("detailPage", {
      code: 500,
      route: "order",
      title: "Lỗi kết nối máy chủ",
      message: "Đã có lỗi phát sinh từ phía máy chủ. Vui lòng thử lại",
    });
  }
};

const acceptOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id },
      { orderConfirmedAt: Date.now(), orderStatus: 1 },
      { new: true }
    );

    if (!order) {
      res.render("detailPage", {
        code: 404,
        route: "order",
        title: "Lỗi phát sinh",
        message: "Đơn hàng không tồn tại",
      });
    }

    await Notification.create({
      idCustomer: order.idCustomer,
      idOrder: order.idOrder,
      title: "Đơn hàng",
      content: `Đơn hàng ${order.idOrder} đã được xác nhận`,
    });

    res.redirect("/order");
  } catch (error) {
    res.render("detailPage", {
      code: 500,
      route: "order",
      title: "Lỗi kết nối máy chủ",
      message: "Đã có lỗi phát sinh từ phía máy chủ. Vui lòng thử lại",
    });
  }
};

const shipOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id },
      { orderShippedAt: Date.now(), orderStatus: 2 },
      { new: true }
    );

    if (!order) {
      res.render("detailPage", {
        code: 404,
        route: "order",
        title: "Lỗi phát sinh",
        message: "Đơn hàng không tồn tại",
      });
    }

    await Notification.create({
      idCustomer: order.idCustomer,
      idOrder: order.idOrder,
      title: "Đơn hàng",
      content: `Đơn hàng ${order.idOrder} đang được vận chuyển`,
    });

    res.redirect("/order");
  } catch (error) {
    res.render("detailPage", {
      code: 500,
      route: "order",
      title: "Lỗi kết nối máy chủ",
      message: "Đã có lỗi phát sinh từ phía máy chủ. Vui lòng thử lại",
    });
  }
};

const delivereOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id },
      { orderDeliveredAt: Date.now(), orderStatus: 3 },
      { new: true }
    );

    if (!order) {
      res.render("detailPage", {
        code: 404,
        route: "order",
        title: "Lỗi phát sinh",
        message: "Đơn hàng không tồn tại",
      });
    }

    await Notification.create({
      idCustomer: order.idCustomer,
      idOrder: order.idOrder,
      title: "Đơn hàng",
      content: `Đơn hàng ${order.idOrder} đã đến địa điểm giao hàng`,
    });

    res.redirect("/order");
  } catch (error) {
    res.render("detailPage", {
      code: 500,
      route: "order",
      title: "Lỗi kết nối máy chủ",
      message: "Đã có lỗi phát sinh từ phía máy chủ. Vui lòng thử lại",
    });
  }
};

const refuseOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id },
      { orderRefusedAt: Date.now(), orderStatus: 6 },
      { new: true }
    );

    if (!order) {
      res.render("detailPage", {
        code: 404,
        route: "order",
        title: "Lỗi phát sinh",
        message: "Đơn hàng không tồn tại",
      });
    }

    await Notification.create({
      idCustomer: order.idCustomer,
      idOrder: order.idOrder,
      title: "Đơn hàng",
      content: `Đơn hàng ${order.idOrder} đã bị từ chối do không xác nhận được thông tin`,
    });

    res.redirect("/order");
  } catch (error) {
    res.render("detailPage", {
      code: 500,
      route: "order",
      title: "Lỗi kết nối máy chủ",
      message: "Đã có lỗi phát sinh từ phía máy chủ. Vui lòng thử lại",
    });
  }
};

export default {
  getOrderPage,
  getDetail,
  acceptOrder,
  shipOrder,
  delivereOrder,
  refuseOrder,
};
