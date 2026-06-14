const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');
const {
  getDonationHistory,
  getEligibility,
  getInventory,
  registerDonation,
  getBanks,
} = require('../controllers/donorController');

// All routes require authentication + donor role
router.use(verifyToken);
router.use(checkRole('donor'));

// GET /api/donor/history/:id
router.get('/history/:id', getDonationHistory);

// GET /api/donor/eligibility/:id
router.get('/eligibility/:id', getEligibility);

// GET /api/donor/inventory
router.get('/inventory', getInventory);

// GET /api/donor/banks
router.get('/banks', getBanks);

// POST /api/donor/donate
router.post('/donate', registerDonation);

module.exports = router;
