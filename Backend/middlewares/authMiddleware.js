const jwt = require("jsonwebtoken");
const ErrorHandler = require("../utils/errorHandler");

const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return next(new ErrorHandler("No authorization token provided", 401));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        next(new ErrorHandler("Invalid or expired token", 401));
    }
};

module.exports = authMiddleware;
