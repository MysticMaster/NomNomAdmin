import mongoose from "mongoose";
import * as argon2 from "argon2";

const memberSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    address: String,
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
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

memberSchema.pre('save', async function (next) {
    try {
        this.password = await argon2.hash(this.password);
        next();
    } catch (error) {
        next(error);
    }
});

memberSchema.statics.login = async function (username, password) {
    const member = await this.findOne({ username: username });
    if (!member) {
        throw Error('username');
    }

    const isPasswordValid = await argon2.verify(member.password, password);
    if (!isPasswordValid) {
        throw Error('password');
    }
    return member;
};

export default mongoose.model('Member', memberSchema);