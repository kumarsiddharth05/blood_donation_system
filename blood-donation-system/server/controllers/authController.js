const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/db');

/**
 * POST /api/auth/register
 * Creates a user + donor or recipient profile in one transaction.
 */
const register = async (req, res) => {
  const {
    name, email, password, role,
    // Donor-specific fields
    blood_group, dob, phone, address,
    // Recipient-specific fields
    blood_group_needed, medical_condition,
  } = req.body;

  // Validate required fields
  if (!name || !email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: 'name, email, password, and role are required.',
      data: null,
    });
  }

  if (!['donor', 'recipient', 'admin'].includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Role must be donor, recipient, or admin.',
      data: null,
    });
  }

  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    // Check if email is already in use
    const [existing] = await conn.query(
      'SELECT user_id FROM users WHERE email = ?',
      [email]
    );
    if (existing.length > 0) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: 'Email already registered.',
        data: null,
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert into users
    const [userResult] = await conn.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, password_hash, role]
    );
    const userId = userResult.insertId;

    // Create role-specific profile
    if (role === 'donor') {
      if (!blood_group || !dob || !phone || !address) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: 'Donor profile requires blood_group, dob, phone, and address.',
          data: null,
        });
      }
      await conn.query(
        'INSERT INTO donors (user_id, blood_group, dob, phone, address) VALUES (?, ?, ?, ?, ?)',
        [userId, blood_group, dob, phone, address]
      );
    } else if (role === 'recipient') {
      if (!phone || !address) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: 'Recipient profile requires phone and address.',
          data: null,
        });
      }
      await conn.query(
        'INSERT INTO recipients (user_id, phone, address) VALUES (?, ?, ?)',
        [userId, phone, address]
      );
    }
    // admin role: no extra profile table

    await conn.commit();

    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: { user_id: userId, name, email, role },
    });
  } catch (err) {
    if (conn) {
      await conn.rollback();
    }
    console.error('Register error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration.',
      data: err.message || null,
    });
  } finally {
    if (conn) {
      conn.release();
    }
  }
};

/**
 * POST /api/auth/login
 * Validates credentials and returns a signed JWT.
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required.',
      data: null,
    });
  }

  try {
    const [rows] = await db.query(
      'SELECT user_id, name, email, password_hash, role FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        data: null,
      });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        data: null,
      });
    }

    // Fetch profile_id for donor/recipient
    let profileId = null;
    if (user.role === 'donor') {
      const [d] = await db.query(
        'SELECT donor_id FROM donors WHERE user_id = ?',
        [user.user_id]
      );
      if (d.length > 0) profileId = d[0].donor_id;
    } else if (user.role === 'recipient') {
      const [r] = await db.query(
        'SELECT recipient_id FROM recipients WHERE user_id = ?',
        [user.user_id]
      );
      if (r.length > 0) profileId = r[0].recipient_id;
    }

    const payload = {
      user_id:    user.user_id,
      name:       user.name,
      role:       user.role,
      profile_id: profileId,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: { token, ...payload },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during login.',
      data: null,
    });
  }
};

module.exports = { register, login };
