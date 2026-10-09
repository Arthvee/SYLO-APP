const cron = require("node-cron");
const Project = require("../Models/project");
const Task = require("../Models/task");
const User = require("../Models/user");
const { sendEmail } = require("./emailService");

// Run every day at 9 AM
const scheduleOverdueReminders = () => {
    cron.schedule("0 9 * * *", async () => {
        try {
            console.log("Running overdue reminder check...");

            // Find all tasks that are overdue and not completed
            const overdueTasks = await Task.find({
                status: { $ne: "completed" },
                deadline: { $lt: new Date() },
                overdueReminderSentAt: null
            }).populate("assignees").populate("project");

            for (const task of overdueTasks) {
                if (task.assignees.length > 0) {
                    for (const assignee of task.assignees) {
                        await sendEmail({
                            email: assignee.email,
                            subject: `Task Overdue: ${task.title}`,
                            html: `
                                <h2>Task Overdue</h2>
                                <p>The task "<strong>${task.title}</strong>" in project "${task.project.name}" is now overdue.</p>
                                <p>Project Deadline: ${task.deadline.toDateString()}</p>
                                <p>Current Status: ${task.status}</p>
                                <p>Please update the task status or contact the project owner.</p>
                            `
                        });
                    }
                }

                // Mark reminder as sent
                task.overdueReminderSentAt = new Date();
                await task.save();
            }

            console.log(`Processed ${overdueTasks.length} overdue tasks`);
        } catch (error) {
            console.error(`Error in overdueReminder service: ${error.message}`);
        }
    });
};

module.exports = { scheduleOverdueReminders };
