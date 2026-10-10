require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { specs, swaggerUi } = require("./config/swagger");
const { scheduleOverdueReminders } = require("./services/overdueReminderService");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Swagger Documentation
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/users", require("./routes/userRoutes"));

// Health check
app.get("/api/health", (req, res) => {
    res.status(200).json({ success: true, message: "Server is running" });
});

// Schedule overdue reminders
scheduleOverdueReminders();

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === "development" && { error: err })
    });
});

// Start server only when running app.js directly
const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
        console.log(`SYLO Server running on port ${PORT}`);
        console.log(`Swagger Docs: http://localhost:${PORT}/api/docs`);
    });

module.exports = app;
