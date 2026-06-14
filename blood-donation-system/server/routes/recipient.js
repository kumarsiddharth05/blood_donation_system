const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');
const {
  createRequest,
  getMyRequests,
  matchBlood,
  getBanks,
  getProfile,
  updateProfile,
} = require('../controllers/recipientController');

// All routes require authentication + recipient role
router.use(verifyToken);
router.use(checkRole('recipient'));

// POST /api/recipient/request
router.post('/request', createRequest);

// GET /api/recipient/requests/:id
router.get('/requests/:id', getMyRequests);

// GET /api/recipient/match/:id
router.get('/match/:id', matchBlood);

// GET /api/recipient/banks
router.get('/banks', getBanks);

// GET /api/recipient/profile/:id
router.get('/profile/:id', getProfile);

// PUT /api/recipient/profile/:id
router.put('/profile/:id', updateProfile);

module.exports = router;

