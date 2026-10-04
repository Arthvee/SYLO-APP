const Task = require('../models/Task');
const Project = require('../models/Project');
const { calculateProjectMetrics } = require('../utils/projectMetrics');

/**
 * Create a new task within a project (Admin only, FR-19, FR-22, FR-24, BR-05, BR-06, AC-05)
 */
const createTask = async (req, res, next) => {
  try {
    const { title, description, assignees, deadline } = req.body;
    const project = req.project;

    // Validate that all assignees belong to project (collaborators or owner) (FR-24, BR-06)
    const ownerId = project.owner._id ? project.owner._id.toString() : project.owner.toString();
    const allowedMemberIds = [
      ownerId,
      ...project.collaborators.map((c) => (c._id ? c._id.toString() : c.toString())),
    ];

    if (assignees && Array.isArray(assignees)) {
      const invalidAssignee = assignees.find(
        (id) => !allowedMemberIds.includes(id.toString())
      );
      if (invalidAssignee) {
        return res.status(400).json({
          success: false,
          message: `Invalid assignee: user "${invalidAssignee}" is not a member of this project`,
          errors: [],
        });
      }
    }

    const task = await Task.create({
      project: project._id,
      title,
      description: description || '',
      assignees: assignees || [],
      deadline: deadline || null,
      status: 'To Do',
    });

    const populatedTask = await Task.findById(task._id).populate(
      'assignees',
      'name username email'
    );

    // Recalculate parent project metrics
    const metrics = await calculateProjectMetrics(project._id);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: {
        task: {
          id: populatedTask._id,
          title: populatedTask.title,
          description: populatedTask.description,
          status: populatedTask.status,
          assignees: populatedTask.assignees.map((a) => ({
            id: a._id,
            name: a.name,
            username: a.username,
            email: a.email,
          })),
          deadline: populatedTask.deadline,
          isOverdue: populatedTask.isOverdue,
          createdAt: populatedTask.createdAt,
          updatedAt: populatedTask.updatedAt,
        },
        projectMetrics: {
          progress: metrics.progress,
          status: metrics.status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all tasks for a project (Project members only, FR-20, AC-06)
 */
const getProjectTasks = async (req, res, next) => {
  try {
    const projectId = req.project._id;
    const { status, assignee } = req.query;

    const filter = { project: projectId };

    if (status) {
      filter.status = status;
    }

    if (assignee) {
      filter.assignees = assignee;
    }

    const tasks = await Task.find(filter)
      .populate('assignees', 'name username email')
      .sort({ createdAt: -1 });

    const formattedTasks = tasks.map((t) => ({
      id: t._id,
      title: t.title,
      description: t.description,
      status: t.status,
      assignees: t.assignees.map((a) => ({
        id: a._id,
        name: a.name,
        username: a.username,
        email: a.email,
      })),
      deadline: t.deadline,
      isOverdue: t.isOverdue,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    res.status(200).json({
      success: true,
      message: 'Tasks retrieved successfully',
      data: {
        tasks: formattedTasks,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single task by ID (Project members only)
 */
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate(
      'assignees',
      'name username email'
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
        errors: [],
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task retrieved successfully',
      data: {
        task: {
          id: task._id,
          title: task.title,
          description: task.description,
          status: task.status,
          assignees: task.assignees.map((a) => ({
            id: a._id,
            name: a.name,
            username: a.username,
            email: a.email,
          })),
          deadline: task.deadline,
          isOverdue: task.isOverdue,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update task details (Admin only, FR-21, FR-22, FR-28)
 */
const updateTask = async (req, res, next) => {
  try {
    const { title, description, assignees, deadline } = req.body;
    const task = req.task;
    const project = req.project;

    // If updating assignees, validate membership
    if (assignees !== undefined && Array.isArray(assignees)) {
      const ownerId = project.owner._id ? project.owner._id.toString() : project.owner.toString();
      const allowedMemberIds = [
        ownerId,
        ...project.collaborators.map((c) => (c._id ? c._id.toString() : c.toString())),
      ];
      const invalidAssignee = assignees.find(
        (id) => !allowedMemberIds.includes(id.toString())
      );
      if (invalidAssignee) {
        return res.status(400).json({
          success: false,
          message: `Invalid assignee: user "${invalidAssignee}" is not a member of this project`,
          errors: [],
        });
      }
      task.assignees = assignees;
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (deadline !== undefined) task.deadline = deadline || null;

    await task.save();

    const populatedTask = await Task.findById(task._id).populate(
      'assignees',
      'name username email'
    );

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: {
        task: {
          id: populatedTask._id,
          title: populatedTask.title,
          description: populatedTask.description,
          status: populatedTask.status,
          assignees: populatedTask.assignees.map((a) => ({
            id: a._id,
            name: a.name,
            username: a.username,
            email: a.email,
          })),
          deadline: populatedTask.deadline,
          isOverdue: populatedTask.isOverdue,
          updatedAt: populatedTask.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete task (Admin only, FR-21)
 * CRITICAL: Recalculates parent project progress
 */
const deleteTask = async (req, res, next) => {
  try {
    const taskId = req.task._id;
    const projectId = req.project._id;

    await Task.deleteOne({ _id: taskId });

    // CRITICAL: Recalculate parent project's progress
    const metrics = await calculateProjectMetrics(projectId);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: {
        projectMetrics: {
          progress: metrics.progress,
          status: metrics.status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update task status (Assignee or Admin, FR-26, FR-27, BR-10, BR-11, AC-07)
 * CRITICAL: Recalculates parent project's progress and derived status
 */
const updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const task = req.task;
    const projectId = req.project._id;

    task.status = status;
    await task.save();

    // CRITICAL: Recalculate parent project's progress
    const metrics = await calculateProjectMetrics(projectId);

    res.status(200).json({
      success: true,
      message: `Task status updated to ${status}`,
      data: {
        task: {
          id: task._id,
          title: task.title,
          status: task.status,
          isOverdue: task.isOverdue,
          updatedAt: task.updatedAt,
        },
        projectMetrics: {
          progress: metrics.progress,
          status: metrics.status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getProjectTasks,
  getTaskById,
  updateTask,
  deleteTask,
  updateTaskStatus,
};
