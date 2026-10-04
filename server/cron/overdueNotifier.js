const cron = require('node-cron');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const emailService = require('../services/emailService');

let scheduledJob = null;

/**
 * Execute a single sweep for overdue tasks and dispatch alert notifications.
 * Callable directly for testing or manual execution.
 * PRD Mapping: FR-31, AC-09
 */
const runOverdueCheckNow = async () => {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find incomplete tasks past their deadline that haven't received an alert in the last 24h
    const overdueTasks = await Task.find({
      status: { $ne: 'Completed' },
      deadline: { $lt: now },
      $or: [
        { overdueEmailSentAt: null },
        { overdueEmailSentAt: { $lt: twentyFourHoursAgo } },
      ],
    })
      .populate('project')
      .populate('assignees');

    const dispatchedResults = [];

    for (const task of overdueTasks) {
      if (!task.project) continue;

      let recipients = [];

      if (task.assignees && task.assignees.length > 0) {
        recipients = task.assignees;
      } else {
        // Fallback: If no assignees are assigned, alert the project owner
        const owner = await User.findById(task.project.owner);
        if (owner) {
          recipients = [owner];
        }
      }

      for (const recipient of recipients) {
        try {
          await emailService.sendOverdueTaskAlert(recipient, task, task.project);
          dispatchedResults.push({
            taskId: task._id,
            recipient: recipient.email,
          });
        } catch (emailErr) {
          console.error(`[OverdueNotifier] Failed to send email to ${recipient.email}:`, emailErr.message);
        }
      }

      // Update timestamp to avoid duplicate notifications within 24 hours
      task.overdueEmailSentAt = new Date();
      await task.save();
    }

    return {
      processedCount: overdueTasks.length,
      dispatchedCount: dispatchedResults.length,
      dispatchedResults,
    };
  } catch (error) {
    console.error('[OverdueNotifier] Error in overdue sweep:', error);
    throw error;
  }
};

/**
 * Initialize the daily cron job scheduled at 08:00 UTC (0 8 * * *)
 */
const initOverdueNotifier = () => {
  // Prevent duplicate cron jobs if already initialized
  if (scheduledJob) {
    return scheduledJob;
  }

  // Run daily at 08:00 UTC
  scheduledJob = cron.schedule(
    '0 8 * * *',
    async () => {
      console.log('[OverdueNotifier] Running scheduled daily 08:00 UTC sweep...');
      try {
        const result = await runOverdueCheckNow();
        console.log(`[OverdueNotifier] Sweep complete: processed ${result.processedCount} tasks, sent ${result.dispatchedCount} alerts.`);
      } catch (err) {
        console.error('[OverdueNotifier] Scheduled job failed:', err.message);
      }
    },
    {
      timezone: 'UTC',
    }
  );

  console.log('[OverdueNotifier] Cron job initialized (08:00 UTC daily).');
  return scheduledJob;
};

/**
 * Stop the cron job (useful for clean test teardown)
 */
const stopOverdueNotifier = () => {
  if (scheduledJob) {
    scheduledJob.stop();
    scheduledJob = null;
  }
};

module.exports = {
  runOverdueCheckNow,
  initOverdueNotifier,
  stopOverdueNotifier,
};
