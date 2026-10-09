const Task = require("../Models/task");
const Project = require("../Models/project");
const User = require("../Models/user");
const ErrorHandler = require("../utils/errorHandler");

exports.getTasks = async (req, res, next) => {
    try {
        const { projectId } = req.query;
        const userId = req.user.id;

        let query = {};

        if (projectId) {
            // Check if user has access to this project
            const project = await Project.findById(projectId);

            if (!project) {
                return next(new ErrorHandler("Project not found", 404));
            }

            const isOwner = project.owner.toString() === userId;
            const isCollaborator = project.collaborators.some(c => c.toString() === userId);

            if (!isOwner && !isCollaborator) {
                return next(new ErrorHandler("You do not have access to this project", 403));
            }

            query.project = projectId;
        }

        const tasks = await Task.find(query)
            .populate("project", "name")
            .populate("assignees", "firstName lastName username email")
            .populate("createdBy", "firstName lastName username email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: "Tasks retrieved successfully",
            tasks
        });
    } catch (error) {
        next(error);
    }
};

exports.createTask = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { title, description, project: projectId, assignees, deadline } = req.body;

        if (!title || !projectId) {
            return next(new ErrorHandler("Title and project are required", 400));
        }

        // Check if project exists
        const project = await Project.findById(projectId);

        if (!project) {
            return next(new ErrorHandler("Project not found", 404));
        }

        // Check if user is owner
        if (project.owner.toString() !== userId) {
            return next(new ErrorHandler("Only project owner can create tasks", 403));
        }

        // Validate assignees if provided
        let validAssignees = [];
        if (assignees && Array.isArray(assignees)) {
            const validUsers = await User.find({ _id: { $in: assignees } });

            // Check if all assignees belong to the project
            for (const assigneeId of assignees) {
                const isOwner = project.owner.toString() === assigneeId;
                const isCollaborator = project.collaborators.some(c => c.toString() === assigneeId);

                if (!isOwner && !isCollaborator) {
                    return next(new ErrorHandler("One or more assignees do not belong to this project", 400));
                }
            }

            validAssignees = assignees;
        }

        const task = await Task.create({
            title,
            description,
            project: projectId,
            assignees: validAssignees,
            deadline,
            createdBy: userId
        });

        const populatedTask = await Task.findById(task._id)
            .populate("project", "name")
            .populate("assignees", "firstName lastName username email")
            .populate("createdBy", "firstName lastName username email");

        res.status(201).json({
            success: true,
            message: "Task created successfully",
            task: populatedTask
        });
    } catch (error) {
        next(error);
    }
};

exports.getTaskById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const task = await Task.findById(id)
            .populate("project")
            .populate("assignees", "firstName lastName username email")
            .populate("createdBy", "firstName lastName username email");

        if (!task) {
            return next(new ErrorHandler("Task not found", 404));
        }

        // Check if user has access to the project
        const project = await Project.findById(task.project._id);
        const isOwner = project.owner.toString() === userId;
        const isCollaborator = project.collaborators.some(c => c.toString() === userId);

        if (!isOwner && !isCollaborator) {
            return next(new ErrorHandler("You do not have access to this task", 403));
        }

        // Check if task is overdue
        const isOverdue = task.deadline && new Date() > new Date(task.deadline) && task.status !== "completed";

        res.status(200).json({
            success: true,
            message: "Task retrieved successfully",
            task: {
                ...task.toObject(),
                isOverdue,
                userCanEdit: isOwner,
                userCanChangeStatus: isOwner || task.assignees.some(a => a._id.toString() === userId)
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.updateTask = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { title, description, assignees, deadline, status } = req.body;

        const task = await Task.findById(id).populate("project");

        if (!task) {
            return next(new ErrorHandler("Task not found", 404));
        }

        const project = await Project.findById(task.project._id);

        if (!project) {
            return next(new ErrorHandler("Project not found", 404));
        }

        // Check permissions
        const isOwner = project.owner.toString() === userId;
        const isAssigned = task.assignees.some(a => a.toString() === userId);

        // Only owner can update title, description, assignees, deadline
        if ((title || description || assignees || deadline) && !isOwner) {
            return next(new ErrorHandler("Only project owner can update task details", 403));
        }

        // Status can be changed by owner or assigned collaborators
        if (status && !isOwner && !isAssigned) {
            return next(new ErrorHandler("You do not have permission to update task status", 403));
        }

        // Validate status
        if (status && !["todo", "in-progress", "completed"].includes(status)) {
            return next(new ErrorHandler("Invalid task status", 400));
        }

        // Update task
        if (title) task.title = title;
        if (description !== undefined) task.description = description;
        if (deadline !== undefined) task.deadline = deadline;
        if (status) task.status = status;

        if (assignees && Array.isArray(assignees)) {
            // Validate all assignees belong to project
            for (const assigneeId of assignees) {
                const isOwner = project.owner.toString() === assigneeId;
                const isCollaborator = project.collaborators.some(c => c.toString() === assigneeId);

                if (!isOwner && !isCollaborator) {
                    return next(new ErrorHandler("One or more assignees do not belong to this project", 400));
                }
            }

            task.assignees = assignees;
        }

        await task.save();

        const updatedTask = await Task.findById(id)
            .populate("project", "name")
            .populate("assignees", "firstName lastName username email")
            .populate("createdBy", "firstName lastName username email");

        res.status(200).json({
            success: true,
            message: "Task updated successfully",
            task: updatedTask
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteTask = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const task = await Task.findById(id).populate("project");

        if (!task) {
            return next(new ErrorHandler("Task not found", 404));
        }

        const project = await Project.findById(task.project._id);

        if (!project) {
            return next(new ErrorHandler("Project not found", 404));
        }

        // Only owner can delete
        if (project.owner.toString() !== userId) {
            return next(new ErrorHandler("Only project owner can delete tasks", 403));
        }

        await Task.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Task deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

exports.updateTaskStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { status } = req.body;

        if (!status) {
            return next(new ErrorHandler("Status is required", 400));
        }

        if (!["todo", "in-progress", "completed"].includes(status)) {
            return next(new ErrorHandler("Invalid task status", 400));
        }

        const task = await Task.findById(id).populate("project");

        if (!task) {
            return next(new ErrorHandler("Task not found", 404));
        }

        const project = await Project.findById(task.project._id);
        const isOwner = project.owner.toString() === userId;
        const isAssigned = task.assignees.some(a => a.toString() === userId);

        // Only owner or assigned user can change status
        if (!isOwner && !isAssigned) {
            return next(new ErrorHandler("You do not have permission to update task status", 403));
        }

        task.status = status;
        await task.save();

        const updatedTask = await Task.findById(id)
            .populate("project", "name")
            .populate("assignees", "firstName lastName username email")
            .populate("createdBy", "firstName lastName username email");

        res.status(200).json({
            success: true,
            message: "Task status updated successfully",
            task: updatedTask
        });
    } catch (error) {
        next(error);
    }
};

