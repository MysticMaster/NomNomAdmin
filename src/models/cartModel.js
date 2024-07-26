import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
    idCustomer: {
        type: String,
        required: true,
    },
    idProduct:{
        type: String,
        required: true
    },
    note:{
        type: String,
        default: ""
    },
    quantity:{
        type: Number,
        default: 1
    },
    createAt: {
        type: Date,
        default: Date.now,
    }
});

export default mongoose.model('Cart', cartSchema);