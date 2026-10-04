const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const {
  requireProjectMember,
  requireProjectAdmin,
} = require('../middleware/projectAuth');
const {
  createProjectValidator,
  updateProjectValidator,
  addCollaboratorValidator,
  createTaskValidator,
} = require('../middleware/validate');
const {
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addCollaborator,
  removeCollaborator,
  leaveProject,
} = require('../controllers/projectController');
const {
  createTask,
  getProjectTasks,
} = require('../controllers/taskController');

// All project routes require valid authentication session
router.use(authenticate);

// Project Collection CRUD
router.post('/', createProjectValidator, createProject);
router.get('/', getUserProjects);

// Specific Project Operations
router.get('/:id', requireProjectMember, getProjectById);
router.put('/:id', requireProjectAdmin, updateProjectValidator, updateProject);
router.delete('/:id', requireProjectAdmin, deleteProject);

// Collaborator Management
router.post('/:id/collaborators', requireProjectAdmin, addCollaboratorValidator, addCollaborator);
router.delete('/:id/collaborators/:userId', requireProjectAdmin, removeCollaborator);
router.post('/:id/leave', requireProjectMember, leaveProject);

// Nested Task Endpoints on Project
router.post('/:projectId/tasks', requireProjectAdmin, createTaskValidator, createTask);
router.get('/:projectId/tasks', requireProjectMember, getProjectTasks);

module.exports = router;
