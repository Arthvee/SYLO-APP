const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            trim: true
        },

        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true
        },

        assignees: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        status: {
            type: String,
            enum: ["todo", "in-progress", "completed"],
            default: "todo"
        },

        deadline: {
            type: Date
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        overdueReminderSentAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Task", taskSchema);