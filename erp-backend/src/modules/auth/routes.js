const express = require('express');
const router = express.Router();
const controller = require('./auth.controller');
const { validateLogin, validateRegister, validatePasswordUpdate } = require('./validation');
const { protect, authorize } = require('../../middleware/authMiddleware');

// router.use(authorize('ERP System Administrator','IT Manager','Project Manager','HR Manager','Admin'))
// Public routes
router.post('/login', validateLogin, controller.login);
router.post('/forgot-password', controller.forgotPassword);

// Protected routes
router.use(protect);

// Routes accessible to all authenticated users
router.get('/me', controller.getMe);
router.put('/update-password', validatePasswordUpdate, controller.updatePassword);
router.get('/logout', controller.logout);

// Routes accessible only to administrators
router.post(
    '/register',
    authorize('ERP System Administrator', 'HR Manager'),
    validateRegister,
    controller.register
);

module.exports = router; 