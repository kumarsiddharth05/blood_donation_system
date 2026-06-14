const db = require('../db/db');

/**
 * GET /api/donor/history/:id
 * Returns all donations for a given donor_id.
 */
const getDonationHistory = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT d.donation_id, d.donation_date, d.units_donated, d.status,
              b.name AS bank_name, b.location AS bank_location
       FROM donations d
       JOIN blood_banks b ON d.bank_id = b.bank_id
       WHERE d.donor_id = ?
       ORDER BY d.donation_date DESC`,
      [id]
    );
    return res.status(200).json({
      success: true,
      message: 'Donation history fetched.',
      data: rows,
    });
  } catch (err) {
    console.error('getDonationHistory error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching donation history.',
      data: null,
    });
  }
};

/**
 * GET /api/donor/eligibility/:id
 * Returns eligibility status and last donation date for a donor.
 */
const getEligibility = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT d.is_eligible, d.last_donation_date, d.blood_group,
              u.name, u.email, d.phone, d.address, d.dob
       FROM donors d
       JOIN users u ON d.user_id = u.user_id
       WHERE d.donor_id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found.',
        data: null,
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Eligibility data fetched.',
      data: rows[0],
    });
  } catch (err) {
    console.error('getEligibility error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching eligibility.',
      data: null,
    });
  }
};

/**
 * GET /api/donor/inventory
 * Returns all blood inventory entries across all banks.
 */
const getInventory = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT i.inventory_id, i.blood_group, i.units_available, i.last_updated,
              b.bank_id, b.name AS bank_name, b.location, b.phone AS bank_phone
       FROM blood_inventory i
       JOIN blood_banks b ON i.bank_id = b.bank_id
       ORDER BY b.name, i.blood_group`
    );
    return res.status(200).json({
      success: true,
      message: 'Inventory fetched.',
      data: rows,
    });
  } catch (err) {
    console.error('getInventory error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching inventory.',
      data: null,
    });
  }
};

/**
 * POST /api/donor/donate
 * Creates a new donation record with status 'pending'.
 * Body: { donor_id, bank_id, donation_date, units_donated }
 */
const registerDonation = async (req, res) => {
  const { donor_id, bank_id, donation_date, units_donated } = req.body;

  if (!donor_id || !bank_id || !donation_date) {
    return res.status(400).json({
      success: false,
      message: 'donor_id, bank_id, and donation_date are required.',
      data: null,
    });
  }

  // Only allow today or future dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = new Date(donation_date);
  selectedDate.setHours(0, 0, 0, 0);
  if (selectedDate < today) {
    return res.status(400).json({
      success: false,
      message: 'Donation date must be today or a future date.',
      data: null,
    });
  }

  try {
    // Check donor eligibility
    const [eligRows] = await db.query(
      'SELECT is_eligible FROM donors WHERE donor_id = ?',
      [donor_id]
    );
    if (eligRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found.',
        data: null,
      });
    }
    if (!eligRows[0].is_eligible) {
      return res.status(400).json({
        success: false,
        message: 'Donor is currently not eligible to donate.',
        data: null,
      });
    }

    const units = units_donated || 1;
    const [result] = await db.query(
      'INSERT INTO donations (donor_id, bank_id, donation_date, units_donated, status) VALUES (?, ?, ?, ?, ?)',
      [donor_id, bank_id, donation_date, units, 'pending']
    );

    return res.status(201).json({
      success: true,
      message: 'Donation registered successfully. Status: pending.',
      data: { donation_id: result.insertId },
    });
  } catch (err) {
    console.error('registerDonation error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error registering donation.',
      data: null,
    });
  }
};

/**
 * GET /api/donor/banks
 * Returns all blood banks (used in donation form dropdown).
 */
const getBanks = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM blood_banks ORDER BY name');
    return res.status(200).json({
      success: true,
      message: 'Blood banks fetched.',
      data: rows,
    });
  } catch (err) {
    console.error('getBanks error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching banks.',
      data: null,
    });
  }
};

module.exports = {
  getDonationHistory,
  getEligibility,
  getInventory,
  registerDonation,
  getBanks,
};
