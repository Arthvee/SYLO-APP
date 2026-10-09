const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Generate JWT token
const generateJWT = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

// Generate token hash (for storing verification/reset tokens)
const generateTokenHash = () => {
    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    return { token, hashedToken };
};

module.exports = {
    generateJWT,
    generateTokenHash
};
