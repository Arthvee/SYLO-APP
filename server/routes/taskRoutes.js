const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const {
  requireTaskMember,
  requireTaskAdmin,
  requireTaskAssigneeOrAdmin,
} = require('../middleware/projectAuth');
const {
  updateTaskValidator,
  updateTaskStatusValidator,
} = require('../middleware/validate');
const {
  getTaskById,
  updateTask,
  deleteTask,
  updateTaskStatus,
} = require('../controllers/taskController');

// All task routes require valid authentication session
router.use(authenticate);

// Individual Task Mutation Endpoints
router.get('/:id', requireTaskMember, getTaskById);
router.put('/:id', requireTaskAdmin, updateTaskValidator, updateTask);
router.delete('/:id', requireTaskAdmin, deleteTask);
router.patch('/:id/status', requireTaskAssigneeOrAdmin, updateTaskStatusValidator, updateTaskStatus);

module.exports = router;
