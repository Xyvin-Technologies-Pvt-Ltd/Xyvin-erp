const express = require('express');
const router = express.Router();
const payrollController = require('./payroll.controller');
const { protect } = require('../../../middleware/authMiddleware');

router.use(protect)


// Employee routes (must come before other routes)
router.get('/my-payroll',  payrollController.getMyPayroll);

// Get all payroll records
router.get('/',  payrollController.getAllPayroll);

// Get payroll by ID
router.get('/:id',  payrollController.getPayrollById);

// Get employee salary
router.get('/employee/:employeeId/salary',  payrollController.getEmployeeSalary);

// Create new payroll
router.post('/',  payrollController.createPayroll);

// Update payroll
router.put('/:id',  payrollController.updatePayroll);

// Delete payroll
router.delete('/:id',  payrollController.deletePayroll);

// Generate payroll
router.post('/generate',  payrollController.generatePayroll);

// Download payroll
router.get('/:id/download', payrollController.downloadPayroll);

// The route handler needs to be registered in the main app
module.exports = router; 