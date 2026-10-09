const User = require("../Models/user");
const bcryptjs = require("bcryptjs");
const ErrorHandler = require("../utils/errorHandler");

exports.getProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId).select("-password");

        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        res.status(200).json({
            success: true,
            message: "Profile retrieved successfully",
            user
        });
    } catch (error) {
        next(error);
    }
};

exports.updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { firstName, lastName } = req.body;

        if (!firstName || !lastName) {
            return next(new ErrorHandler("First name and last name are required", 400));
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { firstName, lastName },
            { new: true, runValidators: true }
        ).select("-password");

        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user
        });
    } catch (error) {
        next(error);
    }
};

exports.changePassword = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return next(new ErrorHandler("All fields are required", 400));
        }

        if (newPassword !== confirmPassword) {
            return next(new ErrorHandler("New passwords do not match", 400));
        }

        if (newPassword.length < 6) {
            return next(new ErrorHandler("Password must be at least 6 characters", 400));
        }

        // Get user with password field
        const user = await User.findById(userId).select("+password");

        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        // Verify current password
        const isPasswordValid = await bcryptjs.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            return next(new ErrorHandler("Current password is incorrect", 401));
        }

        // Update password
        user.password = await bcryptjs.hash(newPassword, 10);
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });
    } catch (error) {
        next(error);
    }
};

