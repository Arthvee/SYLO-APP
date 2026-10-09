const Project = require('../models/Project');
const Task = require('../models/Task');

/**
 * Ensures authenticated user is a confirmed member (Owner or Collaborator) of the project
 * PRD Mapping: FR-11, FR-20, BR-09
 */
const requireProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
        errors: [],
      });
    }

    const userId = req.user._id.toString();
    const ownerId = project.owner._id ? project.owner._id.toString() : project.owner.toString();
    const isOwner = ownerId === userId;
    const isCollaborator = project.collaborators.some(
      (collabId) => (collabId._id ? collabId._id.toString() : collabId.toString()) === userId
    );

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this project.',
        errors: [],
      });
    }

    req.project = project;
    req.isProjectAdmin = isOwner;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Ensures authenticated user is the Project Admin (Owner)
 * PRD Mapping: FR-12, FR-13, FR-14, FR-15, FR-19, FR-21, FR-28
 */
const requireProjectAdmin = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
        errors: [],
      });
    }

    const ownerId = project.owner._id ? project.owner._id.toString() : project.owner.toString();
    if (ownerId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Only the Project Admin can perform this action.',
        errors: [],
      });
    }

    req.project = project;
    req.isProjectAdmin = true;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Ensures authenticated user is the Admin of the task's parent project
 * PRD Mapping: FR-21, FR-28
 */
const requireTaskAdmin = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
        errors: [],
      });
    }

    const project = await Project.findById(task.project);
    const ownerId = project && (project.owner._id ? project.owner._id.toString() : project.owner.toString());
    if (!project || ownerId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Only the Project Admin can modify or delete tasks.',
        errors: [],
      });
    }

    req.task = task;
    req.project = project;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Ensures user is either the Project Admin OR an assigned member of this specific task
 * PRD Mapping: FR-27, BR-10, AC-07
 */
const requireTaskAssigneeOrAdmin = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
        errors: [],
      });
    }

    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Associated project not found',
        errors: [],
      });
    }

    const userId = req.user._id.toString();
    const ownerId = project.owner._id ? project.owner._id.toString() : project.owner.toString();
    const isOwner = ownerId === userId;
    const isAssignee = task.assignees.some(
      (assigneeId) => (assigneeId._id ? assigneeId._id.toString() : assigneeId.toString()) === userId
    );

    if (!isOwner && !isAssignee) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only update the status of tasks assigned to you.',
        errors: [],
      });
    }

    req.task = task;
    req.project = project;
    req.isProjectAdmin = isOwner;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Ensures authenticated user is a confirmed member (Owner or Collaborator) of the task's parent project
 * PRD Mapping: FR-20, BR-09
 */
const requireTaskMember = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
        errors: [],
      });
    }

    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Associated project not found',
        errors: [],
      });
    }

    const userId = req.user._id.toString();
    const ownerId = project.owner._id ? project.owner._id.toString() : project.owner.toString();
    const isOwner = ownerId === userId;
    const isCollaborator = project.collaborators.some(
      (collabId) => (collabId._id ? collabId._id.toString() : collabId.toString()) === userId
    );

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this project.',
        errors: [],
      });
    }

    req.task = task;
    req.project = project;
    req.isProjectAdmin = isOwner;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  requireProjectMember,
  requireProjectAdmin,
  requireTaskAdmin,
  requireTaskAssigneeOrAdmin,
  requireTaskMember,
};
