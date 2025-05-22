const express = require('express');
const router = express.Router();
const {
  createClient,
  getClients,
  getClient,
  updateClient,
  deleteClient
} = require('./client.controller');
const { protect } = require('../../middleware/authMiddleware');

router.use(protect)

router.post('/',  createClient);
router.get('/',  getClients);
router.get('/:id',  getClient);
router.put('/:id', updateClient);
router.delete('/:id',  deleteClient);

module.exports = router; 