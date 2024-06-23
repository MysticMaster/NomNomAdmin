import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    idCustomer: {
        type: String,
        required: true,
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
    orderItems: [{
        idProduct: String,
        price: Number,
        quantity: Number
    }],
    discount: Number,
    totalPrice: {
        type: Number,
        required: true,
    },
    note: String,
    orderPlacedAt: {
        type: Date,
        default: Date.now
    },
    orderConfirmedAt: Date,
    orderShippedAt: Date,
    orderDeliveredAt: Date,
    orderCancelledAt: Date,
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