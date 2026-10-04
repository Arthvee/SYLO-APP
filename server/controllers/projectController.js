const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { calculateProjectMetrics } = require('../utils/projectMetrics');

/**
 * Create a new project (FR-09, FR-10, BR-02, AC-03)
 */
const createProject = async (req, res, next) => {
  try {
    const { title, description, deadline } = req.body;

    const project = await Project.create({
      title,
      description: description || '',
      owner: req.user._id,
      collaborators: [],
      deadline: deadline || null,
      progress: 0,
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: {
        id: project._id,
        title: project.title,
        description: project.description,
        owner: {
          id: req.user._id,
          name: req.user.name,
          username: req.user.username,
        },
        collaborators: [],
        deadline: project.deadline,
        progress: 0,
        status: 'Active',
        isOverdue: project.isOverdue,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all projects where the authenticated user is Owner or Collaborator (FR-11, FR-34)
 */
const getUserProjects = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { status, search } = req.query;

    const query = {
      $or: [{ owner: userId }, { collaborators: userId }],
    };

    if (search) {
      query.$or = [
        { owner: userId, title: { $regex: search, $options: 'i' } },
        { collaborators: userId, title: { $regex: search, $options: 'i' } },
        { owner: userId, description: { $regex: search, $options: 'i' } },
        { collaborators: userId, description: { $regex: search, $options: 'i' } },
      ];
    }

    const projects = await Project.find(query)
      .populate('owner', 'name username email')
      .populate('collaborators', 'name username email')
      .sort({ createdAt: -1 });

    const formattedProjects = await Promise.all(
      projects.map(async (project) => {
        const metrics = await calculateProjectMetrics(project._id);
        const isOwner = project.owner._id.toString() === userId.toString();

        return {
          id: project._id,
          title: project.title,
          description: project.description,
          role: isOwner ? 'Admin' : 'Collaborator',
          owner: {
            id: project.owner._id,
            name: project.owner.name,
            username: project.owner.username,
          },
          collaboratorCount: project.collaborators ? project.collaborators.length : 0,
          taskCount: metrics.totalTasks,
          completedTaskCount: metrics.completedTasks,
          progress: metrics.progress,
          status: metrics.status,
          deadline: project.deadline,
          isOverdue: project.isOverdue,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        };
      })
    );

    // Apply status filter if provided (Active, Almost Done, Completed)
    const filteredProjects = status
      ? formattedProjects.filter((p) => p.status.toLowerCase() === status.toLowerCase())
      : formattedProjects;

    res.status(200).json({
      success: true,
      message: 'Projects fetched successfully',
      data: {
        projects: filteredProjects,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get project details with full metrics breakdown (FR-11, FR-20, AC-08)
 */
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.project._id)
      .populate('owner', 'name username email')
      .populate('collaborators', 'name username email');

    const metrics = await calculateProjectMetrics(project._id);
    const isOwner = project.owner._id.toString() === req.user._id.toString();

    res.status(200).json({
      success: true,
      message: 'Project details retrieved',
      data: {
        project: {
          id: project._id,
          title: project.title,
          description: project.description,
          role: isOwner ? 'Admin' : 'Collaborator',
          owner: {
            id: project.owner._id,
            name: project.owner.name,
            username: project.owner.username,
            email: project.owner.email,
          },
          collaborators: project.collaborators.map((c) => ({
            id: c._id,
            name: c.name,
            username: c.username,
            email: c.email,
          })),
          deadline: project.deadline,
          metrics,
          isOverdue: project.isOverdue,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update project details (Admin only, FR-12)
 */
const updateProject = async (req, res, next) => {
  try {
    const { title, description, deadline } = req.body;
    const project = req.project;

    if (title !== undefined) project.title = title;
    if (description !== undefined) project.description = description;
    if (deadline !== undefined) project.deadline = deadline || null;

    await project.save();

    const metrics = await calculateProjectMetrics(project._id);

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: {
        project: {
          id: project._id,
          title: project.title,
          description: project.description,
          deadline: project.deadline,
          progress: metrics.progress,
          status: metrics.status,
          isOverdue: project.isOverdue,
          updatedAt: project.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete project and cascade delete all child tasks (Admin only, FR-13, BR-03)
 */
const deleteProject = async (req, res, next) => {
  try {
    const projectId = req.project._id;

    // Cascade delete all tasks belonging to this project
    await Task.deleteMany({ project: projectId });
    await Project.deleteOne({ _id: projectId });

    res.status(200).json({
      success: true,
      message: 'Project and all associated tasks deleted permanently',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add collaborator by username (Admin only, FR-14, BR-16, AC-04)
 */
const addCollaborator = async (req, res, next) => {
  try {
    const { username } = req.body;
    const project = req.project;

    const userToAdd = await User.findOne({ username: username.toLowerCase() });
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: `User with username "${username}" not found`,
        errors: [],
      });
    }

    if (project.owner.toString() === userToAdd._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'User is already the project owner',
        errors: [],
      });
    }

    const alreadyCollaborator = project.collaborators.some(
      (c) => (c._id ? c._id.toString() : c.toString()) === userToAdd._id.toString()
    );

    if (alreadyCollaborator) {
      return res.status(400).json({
        success: false,
        message: 'User is already a collaborator on this project',
        errors: [],
      });
    }

    project.collaborators.push(userToAdd._id);
    await project.save();

    res.status(200).json({
      success: true,
      message: 'Collaborator added successfully',
      data: {
        collaborator: {
          id: userToAdd._id,
          name: userToAdd.name,
          username: userToAdd.username,
          email: userToAdd.email,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove collaborator and atomically unassign from all project tasks (Admin only, FR-15, FR-16, BR-07, AC-10)
 */
const removeCollaborator = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const project = req.project;

    const isCollaborator = project.collaborators.some(
      (c) => (c._id ? c._id.toString() : c.toString()) === userId.toString()
    );

    if (!isCollaborator) {
      return res.status(404).json({
        success: false,
        message: 'User is not a collaborator on this project',
        errors: [],
      });
    }

    // Remove from project collaborators
    project.collaborators = project.collaborators.filter(
      (c) => (c._id ? c._id.toString() : c.toString()) !== userId.toString()
    );
    await project.save();

    // Atomic cascade unassignment from all tasks within this project (BR-07)
    await Task.updateMany(
      { project: project._id, assignees: userId },
      { $pull: { assignees: userId } }
    );

    res.status(200).json({
      success: true,
      message: 'Collaborator removed and unassigned from all project tasks',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Leave project action (Collaborator only, FR-18, BR-04, AC-12)
 */
const leaveProject = async (req, res, next) => {
  try {
    const project = req.project;
    const userId = req.user._id;

    if (project.owner.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Project owner cannot leave the project. Please delete the project or transfer ownership.',
        errors: [],
      });
    }

    // Remove user from collaborators
    project.collaborators = project.collaborators.filter(
      (c) => (c._id ? c._id.toString() : c.toString()) !== userId.toString()
    );
    await project.save();

    // Atomic unassignment from all tasks in this project
    await Task.updateMany(
      { project: project._id, assignees: userId },
      { $pull: { assignees: userId } }
    );

    res.status(200).json({
      success: true,
      message: 'You have left the project',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addCollaborator,
  removeCollaborator,
  leaveProject,
};
