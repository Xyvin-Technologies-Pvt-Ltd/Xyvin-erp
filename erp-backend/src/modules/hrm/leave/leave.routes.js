const express = require('express');
const router = express.Router();
const { 
  getAllLeaves, 
  getLeave, 
  createLeave, 
  updateLeave, 
  deleteLeave, 
  reviewLeave,
  getLeaveStats, 
  getAllMyLeaves,
  viewLeaveReq,
  getUnreadLeavesCount
} = require('./leave.controller');
const { protect } = require('../../../middleware/authMiddleware');

router.use(protect)

// Leave statistics route
router.route('/stats')
  .get( getLeaveStats);

// Leave routes
router.route('/')
  .get(getAllLeaves)
  .post(createLeave);
router.route("/viewLeaveReq").post(viewLeaveReq)
// Route for getting current user's leaves
router.route('/my')
  .get(getAllMyLeaves);
  router.route('/getUnreadLeavesCount')
  .get(getUnreadLeavesCount);
router.route('/:id')
  .get(getLeave)
  .patch( updateLeave)
  .delete( deleteLeave);

// Separate route for reviewing leaves
router.route('/:id/review')
  .patch( reviewLeave);

module.exports = router;