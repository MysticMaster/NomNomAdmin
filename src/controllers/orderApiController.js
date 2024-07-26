import Order from "../models/orderModel.js";

const getOrderByIdCustomer = async (req, res) => {
  try {
    const orders = await Order.find({ idCustomer: req.params.id });

    res.json({ status: 200, data: orders, message: "Thành công" });
  } catch (error) {
    res.json({ status: 500, data: null, message: "Sự cố máy chủ" });
  }
};

const postCreateOrder = async (req, res) => {
  try {
    const {
      idCustomer,
      idOrder,
      shippingAddress,
      deliveryPhoneNumber,
      billingStatus,
      discount,
      totalPrice,
      totalQuantity,
      note,
      orderItem,
    } = req.body;

    const order = await Order.create({
      idCustomer: idCustomer,
      idOrder: idOrder,
      shippingAddress: shippingAddress,
      deliveryPhoneNumber: deliveryPhoneNumber,
      billingStatus: billingStatus,
      discount: discount,
      totalPrice: totalPrice,
      totalQuantity: totalQuantity,
      note: note,
      orderItem: orderItem,
    });

    res.json({ status: 201, data: order, message: "Thành công" });
  } catch (error) {
    res.json({ status: 500, data: null, message: "Sự cố máy chủ" });
  }
};

const putReceiveOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id },
      { orderReceivedAt: Date.now(), orderStatus: 4 },
      { new: true }
    );

    res.json({ status: 200, data: order, message: "" });
  } catch (error) {
    res.json({ status: 500, data: null, message: "Sự cố máy chủ" });
  }
};

const putCancelOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id },
      { orderCancelledAt: Date.now(), orderStatus: 5 },
      { new: true }
    );

    res.json({ status: 200, data: order, message: "" });
  } catch (error) {
    res.json({ status: 500, data: null, message: "Sự cố máy chủ" });
  }
}

export default {
  getOrderByIdCustomer,
  postCreateOrder,
  putReceiveOrder,
  putCancelOrder,
};
