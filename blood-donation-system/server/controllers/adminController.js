const db = require('../db/db');

/**
 * GET /api/admin/inventory
 * Returns full blood inventory across all banks.
 */
const getInventory = async (req, res) => {
  const bankId = req.user.profile_id;
  try {
    const [rows] = await db.query(
      `SELECT i.inventory_id, i.blood_group, i.units_available, i.last_updated,
              b.bank_id, b.name AS bank_name, b.location, b.phone AS bank_phone
       FROM blood_inventory i
       JOIN blood_banks b ON i.bank_id = b.bank_id
       WHERE i.bank_id = ?
       ORDER BY i.blood_group`,
      [bankId]
    );
    return res.status(200).json({ success: true, message: 'Inventory fetched.', data: rows });
  } catch (err) {
    console.error('admin getInventory error:', err);
    return res.status(500).json({ success: false, message: 'Server error.', data: null });
  }
};

/**
 * PUT /api/admin/inventory/update
 * Updates units_available for a given inventory_id.
 * Body: { inventory_id, units_available }
 */
const updateInventory = async (req, res) => {
  const { inventory_id, units_available } = req.body;
  if (inventory_id === undefined || units_available === undefined) {
    return res.status(400).json({ success: false, message: 'inventory_id and units_available are required.', data: null });
  }
  if (units_available < 0) {
    return res.status(400).json({ success: false, message: 'units_available cannot be negative.', data: null });
  }
  const bankId = req.user.profile_id;
  try {
    const [result] = await db.query(
      'UPDATE blood_inventory SET units_available = ? WHERE inventory_id = ? AND bank_id = ?',
      [units_available, inventory_id, bankId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Inventory record not found.', data: null });
    }
    return res.status(200).json({ success: true, message: 'Inventory updated.', data: null });
  } catch (err) {
    console.error('updateInventory error:', err);
    return res.status(500).json({ success: false, message: 'Server error.', data: null });
  }
};

/**
 * GET /api/admin/requests
 * Returns all blood requests with recipient and bank info.
 */
const getAllRequests = async (req, res) => {
  const bankId = req.user.profile_id;
  try {
    const [rows] = await db.query(
      `SELECT br.request_id, br.blood_group, br.units_needed, br.urgency,
              br.status, br.requested_at,
              u.name AS recipient_name, u.email AS recipient_email,
              r.phone AS recipient_phone, r.address AS recipient_address,
              b.name AS bank_name, b.location AS bank_location
       FROM blood_requests br
       JOIN recipients r ON br.recipient_id = r.recipient_id
       JOIN users u ON r.user_id = u.user_id
       JOIN blood_banks b ON br.bank_id = b.bank_id
       WHERE br.bank_id = ?
       ORDER BY br.requested_at DESC`,
      [bankId]
    );
    return res.status(200).json({ success: true, message: 'Requests fetched.', data: rows });
  } catch (err) {
    console.error('getAllRequests error:', err);
    return res.status(500).json({ success: false, message: 'Server error.', data: null });
  }
};

/**
 * PUT /api/admin/requests/:id/status
 * Approves or rejects a blood request. Triggers fire on UPDATE.
 * Body: { status: 'approved' | 'rejected' }
 */
const updateRequestStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ success: false, message: "status must be 'approved', 'rejected', or 'pending'.", data: null });
  }
  const bankId = req.user.profile_id;
  try {
    const [result] = await db.query(
      'UPDATE blood_requests SET status = ? WHERE request_id = ? AND bank_id = ?',
      [status, id, bankId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Request not found.', data: null });
    }
    return res.status(200).json({ success: true, message: `Request ${status}.`, data: null });
  } catch (err) {
    console.error('updateRequestStatus error:', err);
    return res.status(500).json({ success: false, message: 'Server error.', data: null });
  }
};

/**
 * GET /api/admin/donors
 * Returns all donors with user info and eligibility.
 */
const getAllDonors = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT d.donor_id, d.blood_group, d.dob, d.phone, d.address,
              d.last_donation_date, d.is_eligible,
              u.user_id, u.name, u.email, u.created_at
       FROM donors d
       JOIN users u ON d.user_id = u.user_id
       ORDER BY u.name`
    );
    return res.status(200).json({ success: true, message: 'Donors fetched.', data: rows });
  } catch (err) {
    console.error('getAllDonors error:', err);
    return res.status(500).json({ success: false, message: 'Server error.', data: null });
  }
};

/**
 * PUT /api/admin/donors/:id/eligibility
 * Toggles or sets is_eligible for a donor.
 * Body: { is_eligible: true | false }
 */
const updateDonorEligibility = async (req, res) => {
  const { id } = req.params;
  const { is_eligible } = req.body;
  if (is_eligible === undefined) {
    return res.status(400).json({ success: false, message: 'is_eligible is required.', data: null });
  }
  try {
    const [result] = await db.query(
      'UPDATE donors SET is_eligible = ? WHERE donor_id = ?',
      [is_eligible ? 1 : 0, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Donor not found.', data: null });
    }
    return res.status(200).json({ success: true, message: `Donor eligibility set to ${is_eligible}.`, data: null });
  } catch (err) {
    console.error('updateDonorEligibility error:', err);
    return res.status(500).json({ success: false, message: 'Server error.', data: null });
  }
};

/**
 * GET /api/admin/donations
 * Returns all donations with donor and bank info.
 */
const getAllDonations = async (req, res) => {
  const bankId = req.user.profile_id;
  try {
    const [rows] = await db.query(
      `SELECT d.donation_id, d.donation_date, d.units_donated, d.status,
              u.name AS donor_name, u.email AS donor_email,
              dn.blood_group,
              b.name AS bank_name, b.location AS bank_location
       FROM donations d
       JOIN donors dn ON d.donor_id = dn.donor_id
       JOIN users u ON dn.user_id = u.user_id
       JOIN blood_banks b ON d.bank_id = b.bank_id
       WHERE d.bank_id = ?
       ORDER BY d.donation_date DESC`,
      [bankId]
    );
    return res.status(200).json({ success: true, message: 'Donations fetched.', data: rows });
  } catch (err) {
    console.error('getAllDonations error:', err);
    return res.status(500).json({ success: false, message: 'Server error.', data: null });
  }
};

/**
 * PUT /api/admin/donations/:id/status
 * Marks a donation as completed or rejected. Triggers fire on UPDATE.
 * Body: { status: 'completed' | 'rejected' | 'pending' }
 */
const updateDonationStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status || !['pending', 'completed', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: "status must be 'pending', 'completed', or 'rejected'.", data: null });
  }
  const bankId = req.user.profile_id;
  try {
    const [result] = await db.query(
      'UPDATE donations SET status = ? WHERE donation_id = ? AND bank_id = ?',
      [status, id, bankId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Donation not found.', data: null });
    }
    return res.status(200).json({ success: true, message: `Donation marked as ${status}.`, data: null });
  } catch (err) {
    console.error('updateDonationStatus error:', err);
    return res.status(500).json({ success: false, message: 'Server error.', data: null });
  }
};

/**
 * GET /api/admin/reports/summary
 * Returns aggregate counts for the admin dashboard summary cards.
 */
const getSummary = async (req, res) => {
  const bankId = req.user.profile_id;
  try {
    const [[{ total_donors }]] = await db.query('SELECT COUNT(*) AS total_donors FROM donors');
    const [[{ total_recipients }]] = await db.query('SELECT COUNT(*) AS total_recipients FROM recipients');
    const [[{ total_donations }]] = await db.query('SELECT COUNT(*) AS total_donations FROM donations WHERE bank_id = ?', [bankId]);
    const [[{ pending_requests }]] = await db.query("SELECT COUNT(*) AS pending_requests FROM blood_requests WHERE status = 'pending' AND bank_id = ?", [bankId]);
    const [[{ low_inventory_count }]] = await db.query("SELECT COUNT(*) AS low_inventory_count FROM blood_inventory WHERE units_available < 5 AND bank_id = ?", [bankId]);
    const [[{ completed_donations }]] = await db.query("SELECT COUNT(*) AS completed_donations FROM donations WHERE status = 'completed' AND bank_id = ?", [bankId]);

    return res.status(200).json({
      success: true,
      message: 'Summary fetched.',
      data: {
        total_donors,
        total_recipients,
        total_donations,
        pending_requests,
        low_inventory_count,
        completed_donations,
      },
    });
  } catch (err) {
    console.error('getSummary error:', err);
    return res.status(500).json({ success: false, message: 'Server error.', data: null });
  }
};

/**
 * GET /api/admin/low-inventory
 * Returns low_inventory_alert view results.
 */
const getLowInventory = async (req, res) => {
  const bankId = req.user.profile_id;
  try {
    const [rows] = await db.query('SELECT * FROM low_inventory_alert WHERE bank_name = (SELECT name FROM blood_banks WHERE bank_id = ?)', [bankId]);
    return res.status(200).json({ success: true, message: 'Low inventory alerts fetched.', data: rows });
  } catch (err) {
    console.error('getLowInventory error:', err);
    return res.status(500).json({ success: false, message: 'Server error.', data: null });
  }
};

module.exports = {
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
};
