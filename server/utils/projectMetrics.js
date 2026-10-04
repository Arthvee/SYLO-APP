const Task = require('../models/Task');
const Project = require('../models/Project');

/**
 * Calculates task counts, progress %, and derived status according to PRD formulas:
 * FR-32, FR-33, BR-12, BR-13
 * Zero-Division Guard: If Total Tasks = 0, progress is 0%
 * Derived status: 0-74%: Active, 75-99%: Almost Done, 100%: Completed
 */
const calculateProjectMetrics = async (projectId) => {
  const tasks = await Task.find({ project: projectId });
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress').length;
  const todoTasks = tasks.filter((t) => t.status === 'To Do').length;

  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const status = progress === 100 ? 'Completed' : progress >= 75 ? 'Almost Done' : 'Active';

  // Persist progress to project document
  await Project.findByIdAndUpdate(projectId, { progress });

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    todoTasks,
    progress,
    status,
  };
};

module.exports = {
  calculateProjectMetrics,
};
