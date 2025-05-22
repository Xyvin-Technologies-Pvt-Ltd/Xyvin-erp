const express = require('express');
const router = express.Router();
const {
  getAllAttendance,
  getAttendance,
  createAttendance,
  createBulkAttendance,
  checkOut,
  deleteAttendance,
  getAttendanceStats,
  updateAttendance,
  getEmployeeAttendance,
  getAttendanceByEmployeeId
} = require('./attendance.controller');
const { protect } = require('../../../middleware/authMiddleware');

router.use(protect);

// Employee attendance routes (must come before /:id routes)
router.get('/my-attendance', getEmployeeAttendance);

// Get attendance by employee ID
router.get('/employee/:employeeId',  getAttendanceByEmployeeId);

// Bulk attendance route
router.post('/bulk',  createBulkAttendance);

// Statistics route
router.get('/stats',  getAttendanceStats);

// Basic routes
router.route('/')
  .get( getAllAttendance)
  .post( createAttendance);

// ID-based routes should come last
router.route('/:id')
  .get( getAttendance)
  .put( updateAttendance)
  .delete( deleteAttendance);

// Checkout route
router.post('/:id/checkout',  checkOut);

module.exports = router; 