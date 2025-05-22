const express = require('express');
const router = express.Router();
const departmentController = require('./department.controller');
const { protect, authorize } = require('../../../middleware/authMiddleware');


router.use(protect);
router.use(authorize('ERP System Administrator','IT Manager','Project Manager','HR Manager'));

// Place the next-code route first (before ID routes)
router.get('/code/next', departmentController.getNextDepartmentCode);

// Department routes
router.route('/')
    .get( departmentController.getAllDepartments)
    .post( departmentController.createDepartment);

router.route('/:id')
    .get( departmentController.getDepartment)
    .put( departmentController.updateDepartment)
    .delete( departmentController.deleteDepartment);

module.exports = router; 