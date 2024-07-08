import mongoose from "mongoose";
import * as argon2 from "argon2";
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
        type: String,
        required: false,
    },
    longitude: {
        type: String,
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

customerSchema.pre('save', async function (next) {
    try {
        await this.validateCustomer();
        this.password = await argon2.hash(this.password);
        next();
    } catch (error) {
        next(error);
    }
});

customerSchema.statics.login = async function (username, password) {
    const customer = await this.findOne({username: username});
    if (!customer) {
        throw Error('username');
    }

    const isPasswordValid = await argon2.verify(customer.password,password);
    if(!isPasswordValid){
        throw Error('password');
    }

    if(!customer.status){
        throw Error('status');
    }
    return customer;
}

export default mongoose.model('Customer', customerSchema);