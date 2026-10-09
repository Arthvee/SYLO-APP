const Project = require("../Models/project");
const Task = require("../Models/task");
const User = require("../Models/user");
const ErrorHandler = require("../utils/errorHandler");

exports.getProjects = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Get projects where user is owner or collaborator
        const projects = await Project.find({
            $or: [
                { owner: userId },
                { collaborators: userId }
            ]
        })
            .populate("owner", "firstName lastName username email")
            .populate("collaborators", "firstName lastName username email")
            .sort({ createdAt: -1 });

        // Enrich with task counts and progress
        const projectsWithStats = await Promise.all(
            projects.map(async (project) => {
                const tasks = await Task.find({ project: project._id });
                const completedTasks = tasks.filter(t => t.status === "completed").length;
                const totalTasks = tasks.length;
                const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

                return {
                    ...project.toObject(),
                    taskCount: totalTasks,
                    completedTasks,
                    progress,
                    userRole: project.owner._id.toString() === userId ? "owner" : "collaborator"
                };
            })
        );

        res.status(200).json({
            success: true,
            message: "Projects retrieved successfully",
            projects: projectsWithStats
        });
    } catch (error) {
        next(error);
    }
};

exports.createProject = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { name, description, deadline } = req.body;

        if (!name) {
            return next(new ErrorHandler("Project name is required", 400));
        }

        const project = await Project.create({
            name,
            description,
            deadline,
            owner: userId
        });

        const populatedProject = await project.populate("owner", "firstName lastName username email");

        res.status(201).json({
            success: true,
            message: "Project created successfully",
            project: {
                ...populatedProject.toObject(),
                taskCount: 0,
                completedTasks: 0,
                progress: 0,
                userRole: "owner"
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getProjectById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const project = await Project.findById(id)
            .populate("owner", "firstName lastName username email")
            .populate("collaborators", "firstName lastName username email");

        if (!project) {
            return next(new ErrorHandler("Project not found", 404));
        }

        // Check if user has access
        const isOwner = project.owner._id.toString() === userId;
        const isCollaborator = project.collaborators.some(c => c._id.toString() === userId);

        if (!isOwner && !isCollaborator) {
            return next(new ErrorHandler("You do not have access to this project", 403));
        }

        // Get tasks and calculate progress
        const tasks = await Task.find({ project: id })
            .populate("assignees", "firstName lastName username email")
            .populate("createdBy", "firstName lastName username email");

        const completedTasks = tasks.filter(t => t.status === "completed").length;
        const totalTasks = tasks.length;
        const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

        let projectState = "Active";
        if (progress >= 75 && progress <= 99) projectState = "Almost Done";
        if (progress === 100) projectState = "Completed";

        res.status(200).json({
            success: true,
            message: "Project retrieved successfully",
            project: {
                ...project.toObject(),
                tasks,
                taskCount: totalTasks,
                completedTasks,
                progress,
                projectState,
                userRole: isOwner ? "owner" : "collaborator"
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.updateProject = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { name, description, deadline } = req.body;

        const project = await Project.findById(id);

        if (!project) {
            return next(new ErrorHandler("Project not found", 404));
        }

        // Check if user is owner
        if (project.owner.toString() !== userId) {
            return next(new ErrorHandler("Only project owner can update the project", 403));
        }

        if (name) project.name = name;
        if (description !== undefined) project.description = description;
        if (deadline !== undefined) project.deadline = deadline;

        await project.save();

        const updatedProject = await Project.findById(id)
            .populate("owner", "firstName lastName username email")
            .populate("collaborators", "firstName lastName username email");

        res.status(200).json({
            success: true,
            message: "Project updated successfully",
            project: updatedProject
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteProject = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const project = await Project.findById(id);

        if (!project) {
            return next(new ErrorHandler("Project not found", 404));
        }

        if (project.owner.toString() !== userId) {
            return next(new ErrorHandler("Only project owner can delete the project", 403));
        }

        // Delete all tasks associated with this project
        await Task.deleteMany({ project: id });

        // Delete the project
        await Project.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Project deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

exports.addCollaborator = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { username } = req.body;

        if (!username) {
            return next(new ErrorHandler("Username is required", 400));
        }

        const project = await Project.findById(id);

        if (!project) {
            return next(new ErrorHandler("Project not found", 404));
        }

        if (project.owner.toString() !== userId) {
            return next(new ErrorHandler("Only project owner can add collaborators", 403));
        }

        // Find user by username
        const collaborator = await User.findOne({ username: username.toLowerCase() });

        if (!collaborator) {
            return next(new ErrorHandler("User not found", 404));
        }

        // Check if user is already owner
        if (project.owner.toString() === collaborator._id.toString()) {
            return next(new ErrorHandler("User is already the project owner", 409));
        }

        // Check if user is already a collaborator
        if (project.collaborators.includes(collaborator._id)) {
            return next(new ErrorHandler("User is already a collaborator", 409));
        }

        // Add collaborator
        project.collaborators.push(collaborator._id);
        await project.save();

        const updatedProject = await Project.findById(id)
            .populate("owner", "firstName lastName username email")
            .populate("collaborators", "firstName lastName username email");

        res.status(200).json({
            success: true,
            message: "Collaborator added successfully",
            project: updatedProject
        });
    } catch (error) {
        next(error);
    }
};

exports.removeCollaborator = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { collaboratorId } = req.body;

        if (!collaboratorId) {
            return next(new ErrorHandler("Collaborator ID is required", 400));
        }

        const project = await Project.findById(id);

        if (!project) {
            return next(new ErrorHandler("Project not found", 404));
        }

        if (project.owner.toString() !== userId) {
            return next(new ErrorHandler("Only project owner can remove collaborators", 403));
        }

        // Check if collaborator exists in project
        if (!project.collaborators.includes(collaboratorId)) {
            return next(new ErrorHandler("Collaborator not found in project", 404));
        }

        // Remove from project collaborators
        project.collaborators = project.collaborators.filter(
            c => c.toString() !== collaboratorId
        );
        await project.save();

        // Remove from all task assignments in this project
        await Task.updateMany(
            { project: id },
            { $pull: { assignees: collaboratorId } }
        );

        const updatedProject = await Project.findById(id)
            .populate("owner", "firstName lastName username email")
            .populate("collaborators", "firstName lastName username email");

        res.status(200).json({
            success: true,
            message: "Collaborator removed successfully",
            project: updatedProject
        });
    } catch (error) {
        next(error);
    }
};

exports.leaveProject = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const project = await Project.findById(id);

        if (!project) {
            return next(new ErrorHandler("Project not found", 404));
        }

        // Cannot leave if owner
        if (project.owner.toString() === userId) {
            return next(new ErrorHandler("Project owner cannot leave the project", 403));
        }

        // Check if user is collaborator
        if (!project.collaborators.includes(userId)) {
            return next(new ErrorHandler("You are not a collaborator of this project", 404));
        }

        // Remove from project
        project.collaborators = project.collaborators.filter(
            c => c.toString() !== userId
        );
        await project.save();

        // Remove from all task assignments
        await Task.updateMany(
            { project: id },
            { $pull: { assignees: userId } }
        );

        res.status(200).json({
            success: true,
            message: "You have left the project successfully"
        });
    } catch (error) {
        next(error);
    }
};

