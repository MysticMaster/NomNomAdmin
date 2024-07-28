import mongoose from "mongoose";
import generateRandomString from "../services/generateRandomString.js";

const customerSchema = new mongoose.Schema({
    firstName: {
        type: String,
        default: generateRandomString(5),
    },
    lastName: {
        type: String,
        default: 'user',
    },
    email: {
        type: String,
        required: [true, 'Trống email'],
        unique: true,
    },
    phoneNumber: String,
    latitude: {
        type: Number,
        required: false,
    },
    longitude: {
        type: Number,
        required: false,
    },
    username: {
        type: String,
        required: [true, 'Trống tên đăng nhập'],
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, 'Trống mật khẩu'],
    },
    imageName: String,
    imageUrl: String,
    status: {
        type: Boolean,
        default: true,
    },
    createAt: {
        type: Date,
        default: Date.now,
    }
});

customerSchema.methods.validateCustomer = async function() {
    const emailExists = await mongoose.models.Customer.findOne({ email: this.email, status: true });
    if (emailExists) {
        throw new Error('email');
    }

    const usernameExists = await mongoose.models.Customer.findOne({ username: this.username });
    if (usernameExists) {
        throw new Error('username');
    }

    if (this.password.length < 8) {
        throw new Error('password');
    }
};

export default mongoose.model('Customer', customerSchema);