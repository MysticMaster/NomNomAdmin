import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    idCustomer: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    createAt: {
        type: Date,
        default: Date.now,
    }
});

export default mongoose.model('Notification', notificationSchema);