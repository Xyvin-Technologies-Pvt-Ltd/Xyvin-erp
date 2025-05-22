const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  assignTeam,
  getProjectDetails,
  testProjectAccess
} = require('./project.controller');
const { protect, authorize } = require('../../middleware/authMiddleware');
const { hasProjectAccess } = require('../../middleware/projectAccessMiddleware');

// All routes require authentication
router.use(protect);

// Routes that don't need project-specific access control
router.post('/', authorize('ERP System Administrator', 'Project Manager'), createProject);
router.get('/', getProjects); // Will be filtered in controller based on user role

// Routes that need project-specific access control
router.get('/:id', hasProjectAccess, getProject);
router.get('/:id/details', hasProjectAccess, getProjectDetails);
router.put('/:id', hasProjectAccess, updateProject);
router.delete('/:id', authorize('ERP System Administrator', 'Project Manager'), hasProjectAccess, deleteProject);
router.post('/:id/assign-team', authorize('ERP System Administrator', 'Project Manager'), hasProjectAccess, assignTeam);

// Test route for project access
router.get('/:id/test-access', hasProjectAccess, testProjectAccess);

module.exports = router; 