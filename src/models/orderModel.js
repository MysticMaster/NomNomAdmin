import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
    id:{
        type: String,
        required: true
    },
    idProduct: {
      type: String,
      required: true
    },
    idOrder: {
      type: String,
      required: true
    },
    note: String,
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
  });

const orderSchema = new mongoose.Schema({
    idCustomer: {
        type: String,
        required: true,
    },
    idOrder:{
        type: String,
        require: true
    },
    shippingAddress: {
        type: String,
        required: true,
    },
    deliveryPhoneNumber: {
        type: String,
        required: true,
    },
    billingStatus: {
        type: Boolean,
        required: true,
    },
    discount: {
        type: Number,
        required: false,
        default: 0
    },
    totalPrice: {
        type: Number,
        required: true
    },
    totalQuantity:{
        type: Number,
        required: true
    },
    note: String,
    orderItem:{
        type: [orderItemSchema],
        required: true
    },
    orderPlacedAt: {
        type: Date,
        default: Date.now
    },
    orderConfirmedAt: Date,
    orderShippedAt: Date,
    orderDeliveredAt: Date,
    orderReceivedAt: Date,
    orderCancelledAt: Date,
    orderRefuseAt:Date,
    orderStatus: {
        type: Number,
        default: 0,
    },
    status: {
        type: Boolean,
        default: true,
    },
    createAt: {
        type: Date,
        default: Date.now,
    }
});

export default mongoose.model('Order', orderSchema);