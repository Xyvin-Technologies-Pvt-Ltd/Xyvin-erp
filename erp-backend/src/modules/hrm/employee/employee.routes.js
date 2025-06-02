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
  getCurrentEmployee,
  updateCurrentEmployee,
  getNextEmployeeId,
  getEmployeeDocuments,
  downloadDocument,
  deleteDocument
} = require('./employee.controller');
const { protect, authorize } = require('../../../middleware/authMiddleware');
const upload = require('../../../middleware/upload');

router.use(protect);
// router.use(authorize('ERP System Administrator','IT Manager','Project Manager','HR Manager'));

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
router.post('/:id/profile-picture', upload.single('profilePicture'), (req, res, next) => {
  try {
    updateProfilePicture(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Delete employee
router.delete('/:id', deleteEmployee);

// Get employee documents
router.get('/:id/documents', (req, res, next) => {
  console.log('Fetching documents for employee:', req.params.id);
  getEmployeeDocuments(req, res, next);
});

// Download employee document
router.get('/:employeeId/documents/:documentId/download', (req, res, next) => {
  console.log('Downloading document:', req.params);
  downloadDocument(req, res, next);
});

// Delete employee document
router.delete('/:employeeId/documents/:documentId', (req, res, next) => {
  console.log('Deleting document:', req.params);
  deleteDocument(req, res, next);
});

// Upload document
router.post('/:id/documents', upload.single('document'), (req, res, next) => {
  console.log('Document upload request received');
  console.log('Request file:', req.file);
  console.log('Request body:', req.body);
  
  if (!req.file) {
    console.error('No file in request');
    return res.status(400).json({
      status: 'error',
      message: 'No file uploaded'
    });
  }
  
  uploadDocument(req, res, next);
});

module.exports = router; 