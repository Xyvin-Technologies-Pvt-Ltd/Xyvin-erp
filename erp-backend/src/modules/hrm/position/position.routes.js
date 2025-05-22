const express = require('express');
const router = express.Router();
const positionController = require('./positionController');
const { protect } = require('../../../middleware/authMiddleware');

router.use(protect)

// Get all positions
router.get('/',  positionController.getAllPositions);

// Get single position
router.get('/:id',  positionController.getPosition);

// Create position
router.post('/',   positionController.createPosition);

// Update position
router.put('/:id',   positionController.updatePosition);

// Delete position
router.delete('/:id',   positionController.deletePosition);

// Add this route before other routes to avoid conflicts with ID parameters
router.get('/code/next', positionController.getNextPositionCode);

module.exports = router; 