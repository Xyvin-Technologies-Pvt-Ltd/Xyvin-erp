const express = require('express');
const router = express.Router();
const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  uploadDocument,
  updateProfilePicture,
  upload,
  getCurrentEmployee,
  updateCurrentEmployee,
  getNextEmployeeId
} = require('./employee.controller');
const { protect, authorize } = require('../../../middleware/authMiddleware');

router.use(protect);
router.use(authorize('ERP System Administrator','IT Manager','Project Manager','HR Manager'));

// Get next employee ID - Move this route to the top
router.get('/next-id',  getNextEmployeeId);

// Get current employee profile
router.get('/me',  getCurrentEmployee);

// Update current employee profile
router.patch('/me',  updateCurrentEmployee);

// Update current employee profile picture
router.post('/me/profile-picture',  upload.single('profilePicture'), (req, res, next) => {
  try {
    updateProfilePicture(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Get all employees
router.get('/',   getAllEmployees);

// Get employee by ID
router.get('/:id',  getEmployeeById);

// Create new employee
router.post('/',  createEmployee);

// Update employee - allow self update or admin
// CORRECT IMPLEMENTATION
router.route('/:id')
  .put((req, res, next) => {
    if (req.user._id.toString() === req.params.id) {
      return updateCurrentEmployee(req, res, next);
    }
    return updateEmployee(req, res, next); // Directly call the function
  })
  .patch((req, res, next) => {
    if (req.user._id.toString() === req.params.id) {
      return updateCurrentEmployee(req, res, next);
    }
    return updateEmployee(req, res, next); // Directly call the function
  });

// Update employee profile picture - allow self update or admin
router.post('/:id/profile-picture',  (req, res, next) => {
  if (req.user._id.toString() === req.params.id) {
    return upload.single('profilePicture')(req, res, () => updateProfilePicture(req, res, next));
  }
  return (req, res, () => {
    upload.single('profilePicture')(req, res, () => updateProfilePicture(req, res, next));
  });
});

// Delete employee
router.delete('/:id', deleteEmployee);

// Upload document
router.post('/:id/documents',  uploadDocument);

module.exports = router; 