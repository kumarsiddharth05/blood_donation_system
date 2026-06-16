const db = require('../db/db');

/**
 * POST /api/recipient/request
 * Creates a new blood request.
 * Body: { recipient_id, bank_id, blood_group, units_needed, urgency }
 */
const createRequest = async (req, res) => {
  const { recipient_id, bank_id, blood_group, units_needed, urgency } = req.body;

  if (!recipient_id || !bank_id || !blood_group || !units_needed) {
    return res.status(400).json({
      success: false,
      message: 'recipient_id, bank_id, blood_group, and units_needed are required.',
      data: null,
    });
  }

  try {
    // Verify recipient exists
    const [recRows] = await db.query(
      'SELECT recipient_id FROM recipients WHERE recipient_id = ?',
      [recipient_id]
    );
    if (recRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found.',
        data: null,
      });
    }

    // Verify bank exists
    const [bankRows] = await db.query(
      'SELECT bank_id FROM blood_banks WHERE bank_id = ?',
      [bank_id]
    );
    if (bankRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Blood bank not found.',
        data: null,
      });
    }

    const [result] = await db.query(
      `INSERT INTO blood_requests (recipient_id, bank_id, blood_group, units_needed, urgency, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [recipient_id, bank_id, blood_group, units_needed, urgency || 'medium']
    );

    return res.status(201).json({
      success: true,
      message: 'Blood request submitted successfully.',
      data: { request_id: result.insertId },
    });
  } catch (err) {
    console.error('createRequest error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error creating blood request.',
      data: null,
    });
  }
};

/**
 * GET /api/recipient/requests/:id
 * Returns all blood requests for the given recipient_id.
 */
const getMyRequests = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT r.request_id, r.blood_group, r.units_needed, r.urgency, r.status, r.requested_at,
              b.name AS bank_name, b.location AS bank_location
       FROM blood_requests r
       JOIN blood_banks b ON r.bank_id = b.bank_id
       WHERE r.recipient_id = ?
       ORDER BY r.requested_at DESC`,
      [id]
    );
    return res.status(200).json({
      success: true,
      message: 'Requests fetched.',
      data: rows,
    });
  } catch (err) {
    console.error('getMyRequests error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching requests.',
      data: null,
    });
  }
};

/**
 * GET /api/recipient/match/:id
 * Calls the match_blood stored procedure to find compatible blood banks.
 */
const matchBlood = async (req, res) => {
  const { id } = req.params;
  const { group } = req.query;
  try {
    // Verify recipient exists
    const [recRows] = await db.query(
      'SELECT recipient_id FROM recipients WHERE recipient_id = ?',
      [id]
    );
    if (recRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found.',
        data: null,
      });
    }

    if (group) {
      // Dynamic match bypassing stored procedure
      const [matches] = await db.query(
        `SELECT b.name AS bank_name, b.location, b.phone AS bank_phone, i.blood_group AS available_blood_group, i.units_available
         FROM blood_inventory i
         JOIN blood_banks b ON i.bank_id = b.bank_id
         WHERE i.blood_group = ?
         AND i.units_available > 0
         ORDER BY i.units_available DESC`,
        [group]
      );
      return res.status(200).json({
        success: true,
        message: 'Compatible blood sources found.',
        data: matches,
      });
    } else {
      // Direct SQL query instead of stored procedure (TiDB compatibility)
      const [matches] = await db.query(
        `SELECT b.name AS bank_name, b.location, b.phone AS bank_phone,
                i.blood_group AS available_blood_group, i.units_available
         FROM blood_inventory i
         JOIN blood_banks b ON i.bank_id = b.bank_id
         WHERE i.blood_group IN (
           SELECT donor_group FROM blood_compatibility
           WHERE recipient_group = (SELECT blood_group_needed FROM recipients WHERE recipient_id = ?)
         )
         AND i.units_available > 0
         ORDER BY i.units_available DESC`,
        [id]
      );

      return res.status(200).json({
        success: true,
        message: 'Compatible blood sources found.',
        data: matches,
      });
    }
  } catch (err) {
    console.error('matchBlood error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error matching compatible blood sources.',
      data: null,
    });
  }
};

/**
 * GET /api/recipient/banks
 * Returns all blood banks for request form dropdown.
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

/**
 * GET /api/recipient/profile/:id
 * Returns the recipient's profile details.
 */
const getProfile = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT r.recipient_id, r.blood_group_needed, r.phone, r.address,
              u.name, u.email, u.created_at
       FROM recipients r
       JOIN users u ON r.user_id = u.user_id
       WHERE r.recipient_id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Recipient not found.', data: null });
    }
    return res.status(200).json({ success: true, message: 'Profile fetched.', data: rows[0] });
  } catch (err) {
    console.error('getProfile error:', err);
    return res.status(500).json({ success: false, message: 'Server error.', data: null });
  }
};

/**
 * PUT /api/recipient/profile/:id
 * Updates the recipient profile (blood_group_needed, phone, address, medical_condition).
 */
const updateProfile = async (req, res) => {
  const { id } = req.params;
  const { blood_group_needed, phone, address } = req.body;

  if (!phone || !address) {
    return res.status(400).json({
      success: false,
      message: 'phone, and address are required.',
      data: null,
    });
  }

  try {
    const [result] = await db.query(
      `UPDATE recipients
       SET blood_group_needed = ?, phone = ?, address = ?
       WHERE recipient_id = ?`,
      [blood_group_needed, phone, address, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Recipient not found.', data: null });
    }
    return res.status(200).json({ success: true, message: 'Profile updated successfully.', data: null });
  } catch (err) {
    console.error('updateProfile error:', err);
    return res.status(500).json({ success: false, message: 'Server error.', data: null });
  }
};

module.exports = { createRequest, getMyRequests, matchBlood, getBanks, getProfile, updateProfile };
