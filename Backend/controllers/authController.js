const User = require("../Models/user");
const bcryptjs = require("bcryptjs");
const { generateJWT, generateTokenHash } = require("../utils/generateToken");
const { sendEmail } = require("../services/emailService");
const crypto = require("crypto");
const ErrorHandler = require("../utils/errorHandler");

exports.register = async (req, res, next) => {
    try {
        const { firstName, lastName, username, email, password, confirmPassword } = req.body;

        // Validation
        if (!firstName || !lastName || !username || !email || !password) {
            return next(new ErrorHandler("All fields are required", 400));
        }

        if (password !== confirmPassword) {
            return next(new ErrorHandler("Passwords do not match", 400));
        }

        if (password.length < 6) {
            return next(new ErrorHandler("Password must be at least 6 characters", 400));
        }

        // Check if user already exists
        const userExists = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }]
        });

        if (userExists) {
            return next(new ErrorHandler("Email or username already in use", 409));
        }

        // Hash password
        const hashedPassword = await bcryptjs.hash(password, 10);

        // Create user and allow immediate login without verification requirement
        const user = await User.create({
            firstName,
            lastName,
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            password: hashedPassword,
            isEmailVerified: true
        });

        res.status(201).json({
            success: true,
            message: "Registration successful. You can now log in.",
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return next(new ErrorHandler("Email and password are required", 400));
        }

        // Find user and explicitly select password field
        const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

        if (!user) {
            return next(new ErrorHandler("Invalid email or password", 401));
        }

        // Compare password
        const isPasswordValid = await bcryptjs.compare(password, user.password);

        if (!isPasswordValid) {
            return next(new ErrorHandler("Invalid email or password", 401));
        }

        // Generate JWT
        const token = generateJWT(user._id);

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                email: user.email,
                isEmailVerified: user.isEmailVerified
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.verifyEmail = async (req, res, next) => {
    try {
        const { token, email } = req.body;

        if (!token || !email) {
            return next(new ErrorHandler("Token and email are required", 400));
        }

        // Hash the token to compare with stored hash
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        // Find user
        const user = await User.findOne({
            email: email.toLowerCase(),
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: new Date() }
        }).select("+emailVerificationToken +emailVerificationExpires");

        if (!user) {
            return next(new ErrorHandler("Invalid or expired verification token", 400));
        }

        if (user.isEmailVerified) {
            return res.status(200).json({
                success: true,
                message: "Email is already verified"
            });
        }

        // Update user
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        // Send welcome email
        try {
            await sendEmail({
                email: user.email,
                subject: "Welcome to SYLO!",
                html: `
                    <h2>Welcome to SYLO, ${user.firstName}!</h2>
                    <p>Your email has been successfully verified.</p>
                    <p><a href="${process.env.CLIENT_URL}/login">Log In to SYLO</a></p>
                `
            });
        } catch (error) {
            console.error("Failed to send welcome email:", error.message);
        }

        res.status(200).json({
            success: true,
            message: "Email verified successfully"
        });
    } catch (error) {
        next(error);
    }
};

exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return next(new ErrorHandler("Email is required", 400));
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            // For security, don't reveal if email exists
            return res.status(200).json({
                success: true,
                message: "If an account with this email exists, a password reset link has been sent"
            });
        }

        // Generate reset token
        const { token, hashedToken } = generateTokenHash();

        // Update user
        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        await user.save();

        // Send reset email
        try {
            await sendEmail({
                email: user.email,
                subject: "Password Reset - SYLO",
                html: `
                    <h2>Password Reset Request</h2>
                    <p>You requested a password reset for your SYLO account.</p>
                    <p><a href="${process.env.CLIENT_URL}/reset-password?token=${token}&email=${user.email}">Reset Password</a></p>
                    <p>This link expires in 30 minutes.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                `
            });
        } catch (error) {
            console.error("Failed to send password reset email:", error.message);
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save();
            return next(new ErrorHandler("Failed to send password reset email", 500));
        }

        res.status(200).json({
            success: true,
            message: "Password reset link has been sent to your email"
        });
    } catch (error) {
        next(error);
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const { token, email, password, confirmPassword } = req.body;

        if (!token || !email || !password || !confirmPassword) {
            return next(new ErrorHandler("All fields are required", 400));
        }

        if (password !== confirmPassword) {
            return next(new ErrorHandler("Passwords do not match", 400));
        }

        if (password.length < 6) {
            return next(new ErrorHandler("Password must be at least 6 characters", 400));
        }

        // Hash the token to compare
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        // Find user
        const user = await User.findOne({
            email: email.toLowerCase(),
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: new Date() }
        }).select("+passwordResetToken +passwordResetExpires");

        if (!user) {
            return next(new ErrorHandler("Invalid or expired reset token", 400));
        }

        // Update password
        user.password = await bcryptjs.hash(password, 10);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password reset successfully. You can now log in with your new password."
        });
    } catch (error) {
        next(error);
    }
};

