const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true
        },

        lastName: {
            type: String,
            required: true,
            trim: true
        },

        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },

        password: {
            type: String,
            required: true,
            select: false
        },

        isEmailVerified: {
            type: Boolean,
            default: false
        },

        emailVerificationToken: {
            type: String,
            select: false
        },

        emailVerificationExpires: {
            type: Date,
            select: false
        },

        passwordResetToken: {
            type: String,
            select: false
        },

        passwordResetExpires: {
            type: Date,
            select: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);