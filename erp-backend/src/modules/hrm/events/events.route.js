// routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const { protect , authorize} = require('../../../middleware/authMiddleware');
const {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent
} = require('./events.controller');



// Apply authentication middleware to all routes
router.use(protect);
router.use(authorize('ERP System Administrator','IT Manager','Project Manager','HR Manager', 'Admin'));

router.route('/')
  .post(createEvent)
  .get(getEvents);

router.route('/:id')
  .get(getEvent)
  .put(updateEvent)
  .delete(deleteEvent);

module.exports = router;