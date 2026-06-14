const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');
const {
  getInventory,
  updateInventory,
  getAllRequests,
  updateRequestStatus,
  getAllDonors,
  updateDonorEligibility,
  getAllDonations,
  updateDonationStatus,
  getSummary,
  getLowInventory,
} = require('../controllers/adminController');

// All routes require authentication + admin role
router.use(verifyToken);
router.use(checkRole('admin'));

// Inventory
router.get('/inventory', getInventory);
router.put('/inventory/update', updateInventory);

// Blood Requests
router.get('/requests', getAllRequests);
router.put('/requests/:id/status', updateRequestStatus);

// Donors
router.get('/donors', getAllDonors);
router.put('/donors/:id/eligibility', updateDonorEligibility);

// Donations
router.get('/donations', getAllDonations);
router.put('/donations/:id/status', updateDonationStatus);

// Reports
router.get('/reports/summary', getSummary);
router.get('/low-inventory', getLowInventory);

module.exports = router;
