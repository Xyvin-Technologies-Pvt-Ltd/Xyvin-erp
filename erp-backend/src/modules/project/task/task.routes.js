const express = require('express');
const router = express.Router();
const {
  createTask,
  getProjectTasks,
  updateTaskStatus,
  addComment,
  addAttachment,
  updateTask,
  deleteTask
} = require('./task.controller');
const { protect } = require('../../../middleware/authMiddleware');

router.use(protect)

// Task routes
router.post('/',  createTask);
router.get('/project/:projectId',  getProjectTasks);
router.patch('/:taskId/status',  updateTaskStatus);
router.post('/:taskId/comments',  addComment);
router.post('/:taskId/attachments',  addAttachment);
router.patch('/:taskId',  updateTask);
router.delete('/:taskId',  deleteTask);

module.exports = router; 