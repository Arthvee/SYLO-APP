const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            trim: true
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        collaborators: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        deadline: {
            type: Date
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

module.exports = mongoose.model("Project", projectSchema);