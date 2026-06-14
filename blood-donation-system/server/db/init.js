/**
 * server/db/init.js
 * ─────────────────────────────────────────────────────────────────
 * Fully initializes the database — SAFE TO RE-RUN ANY TIME.
 * Drops and recreates blood_donation_db for a clean slate.
 *
 * Usage (from the server/ directory):
 *   npm run init
 * ─────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const mysql  = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// Connect WITHOUT specifying a database first (so we can DROP/CREATE it)
const DB_CONFIG = {
  host:     process.env.DB_HOST || 'localhost',
  user:     process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port:     Number(process.env.DB_PORT) || 3306,
  // SSL required for cloud databases (Aiven, etc.)
  ...(process.env.DB_SSL === 'true' && { ssl: { rejectUnauthorized: false } }),
};

async function run() {
  let conn;
  try {
    conn = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected to MySQL\n');

    // ── Drop & recreate database for a clean run ─────────────────────
    console.log('🗑️  Dropping existing database (clean slate)...');
    await conn.query(`DROP DATABASE IF EXISTS blood_donation_db`);
    await conn.query(`CREATE DATABASE blood_donation_db`);
    await conn.query(`USE blood_donation_db`);
    console.log('✅ Database created\n');

    // ── Create all tables ────────────────────────────────────────────
    console.log('📦 Creating tables...');

    await conn.query(`
      CREATE TABLE users (
        user_id       INT AUTO_INCREMENT PRIMARY KEY,
        name          VARCHAR(100) NOT NULL,
        email         VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role          ENUM('donor','recipient','admin') NOT NULL,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE donors (
        donor_id           INT AUTO_INCREMENT PRIMARY KEY,
        user_id            INT NOT NULL,
        blood_group        ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
        dob                DATE NOT NULL,
        phone              VARCHAR(15) NOT NULL,
        address            TEXT NOT NULL,
        last_donation_date DATE DEFAULT NULL,
        is_eligible        BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE recipients (
        recipient_id       INT AUTO_INCREMENT PRIMARY KEY,
        user_id            INT NOT NULL,
        blood_group_needed ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') DEFAULT NULL,
        phone              VARCHAR(15) DEFAULT NULL,
        address            TEXT DEFAULT NULL,
        medical_condition  VARCHAR(255) DEFAULT NULL,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE blood_banks (
        bank_id  INT AUTO_INCREMENT PRIMARY KEY,
        name     VARCHAR(150) NOT NULL,
        location VARCHAR(255) NOT NULL,
        phone    VARCHAR(15)  NOT NULL
      )
    `);

    await conn.query(`
      CREATE TABLE admins (
        admin_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id  INT NOT NULL,
        bank_id  INT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (bank_id) REFERENCES blood_banks(bank_id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE blood_inventory (
        inventory_id    INT AUTO_INCREMENT PRIMARY KEY,
        bank_id         INT NOT NULL,
        blood_group     ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
        units_available INT DEFAULT 0,
        last_updated    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (bank_id) REFERENCES blood_banks(bank_id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE donations (
        donation_id   INT AUTO_INCREMENT PRIMARY KEY,
        donor_id      INT NOT NULL,
        bank_id       INT NOT NULL,
        donation_date DATE NOT NULL,
        units_donated INT NOT NULL DEFAULT 1,
        status        ENUM('pending','completed','rejected') DEFAULT 'pending',
        FOREIGN KEY (donor_id) REFERENCES donors(donor_id) ON DELETE CASCADE,
        FOREIGN KEY (bank_id)  REFERENCES blood_banks(bank_id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE blood_requests (
        request_id   INT AUTO_INCREMENT PRIMARY KEY,
        recipient_id INT NOT NULL,
        bank_id      INT NOT NULL,
        blood_group  ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
        units_needed INT NOT NULL,
        urgency      ENUM('low','medium','high') DEFAULT 'medium',
        status       ENUM('pending','approved','rejected') DEFAULT 'pending',
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (recipient_id) REFERENCES recipients(recipient_id) ON DELETE CASCADE,
        FOREIGN KEY (bank_id)      REFERENCES blood_banks(bank_id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE blood_compatibility (
        donor_group     ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
        recipient_group ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
        PRIMARY KEY (donor_group, recipient_group)
      )
    `);

    console.log('✅ Tables created\n');

    // ── Seed blood bank ──────────────────────────────────────────────
    await conn.query(`
      INSERT INTO blood_banks (name, location, phone)
      VALUES ('City Blood Bank', 'Davanagere, Karnataka', '9876500001')
    `);
    console.log('✅ Blood bank seeded');

    // ── Seed inventory ───────────────────────────────────────────────
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    for (const bg of bloodGroups) {
      await conn.query(
        `INSERT INTO blood_inventory (bank_id, blood_group, units_available) VALUES (1, ?, 10)`,
        [bg]
      );
    }
    console.log('✅ Inventory seeded (10 units each)');

    // ── Seed compatibility matrix ────────────────────────────────────
    const pairs = [
      ['O-','O-'],['O-','O+'],['O-','A-'],['O-','A+'],['O-','B-'],['O-','B+'],['O-','AB-'],['O-','AB+'],
      ['O+','O+'],['O+','A+'],['O+','B+'],['O+','AB+'],
      ['A-','A-'],['A-','A+'],['A-','AB-'],['A-','AB+'],
      ['A+','A+'],['A+','AB+'],
      ['B-','B-'],['B-','B+'],['B-','AB-'],['B-','AB+'],
      ['B+','B+'],['B+','AB+'],
      ['AB-','AB-'],['AB-','AB+'],
      ['AB+','AB+'],
    ];
    for (const [donor, recipient] of pairs) {
      await conn.query(
        `INSERT INTO blood_compatibility (donor_group, recipient_group) VALUES (?, ?)`,
        [donor, recipient]
      );
    }
    console.log('✅ Compatibility matrix seeded\n');

    // ── Hash passwords ───────────────────────────────────────────────
    console.log('🔐 Hashing passwords...');
    const [adminHash, donorHash, recipientHash] = await Promise.all([
      bcrypt.hash('admin123',     10),
      bcrypt.hash('donor123',     10),
      bcrypt.hash('recipient123', 10),
    ]);
    console.log('✅ Passwords hashed\n');

    // ── Seed admin user ──────────────────────────────────────────────
    const [adminRes] = await conn.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      ['Admin', 'admin@biet.ac.in', adminHash, 'admin']
    );

    await conn.query(
      `INSERT INTO admins (user_id, bank_id) VALUES (?, ?)`,
      [adminRes.insertId, 1]
    );

    // ── Seed donor users ─────────────────────────────────────────────
    const [r1] = await conn.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      ['Rajesh Kumar', 'rajesh@example.com', donorHash, 'donor']
    );
    const [r2] = await conn.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      ['Priya Sharma', 'priya@example.com', donorHash, 'donor']
    );

    // Donor profiles
    await conn.query(
      `INSERT INTO donors (user_id, blood_group, dob, phone, address, last_donation_date, is_eligible)
       VALUES (?, 'O+', '1990-06-15', '9876500002', '12, MG Road, Davanagere', NULL, TRUE)`,
      [r1.insertId]
    );
    await conn.query(
      `INSERT INTO donors (user_id, blood_group, dob, phone, address, last_donation_date, is_eligible)
       VALUES (?, 'A+', '1995-03-22', '9876500003', '45, Station Road, Davanagere', '2024-11-10', TRUE)`,
      [r2.insertId]
    );

    // Get donor_ids just inserted
    const [[d1]] = await conn.query(`SELECT donor_id FROM donors WHERE user_id = ?`, [r1.insertId]);
    const [[d2]] = await conn.query(`SELECT donor_id FROM donors WHERE user_id = ?`, [r2.insertId]);

    // ── Seed recipient users ─────────────────────────────────────────
    const [r3] = await conn.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      ['Suresh Patel', 'suresh@example.com', recipientHash, 'recipient']
    );
    const [r4] = await conn.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      ['Anita Reddy', 'anita@example.com', recipientHash, 'recipient']
    );

    // Recipient profiles
    await conn.query(
      `INSERT INTO recipients (user_id, blood_group_needed, phone, address, medical_condition)
       VALUES (?, 'O+', '9876500004', '78, 4th Cross, Davanagere', 'Anemia')`,
      [r3.insertId]
    );
    await conn.query(
      `INSERT INTO recipients (user_id, blood_group_needed, phone, address, medical_condition)
       VALUES (?, 'A+', '9876500005', '23, Park Avenue, Davanagere', 'Thalassemia')`,
      [r4.insertId]
    );

    // Get recipient_ids just inserted
    const [[rc1]] = await conn.query(`SELECT recipient_id FROM recipients WHERE user_id = ?`, [r3.insertId]);
    const [[rc2]] = await conn.query(`SELECT recipient_id FROM recipients WHERE user_id = ?`, [r4.insertId]);

    // ── Seed sample donations ────────────────────────────────────────
    await conn.query(
      `INSERT INTO donations (donor_id, bank_id, donation_date, units_donated, status)
       VALUES (?, 1, '2025-05-01', 1, 'pending')`,
      [d1.donor_id]
    );
    await conn.query(
      `INSERT INTO donations (donor_id, bank_id, donation_date, units_donated, status)
       VALUES (?, 1, '2025-04-15', 1, 'completed')`,
      [d2.donor_id]
    );

    // ── Seed sample blood requests ───────────────────────────────────
    await conn.query(
      `INSERT INTO blood_requests (recipient_id, bank_id, blood_group, units_needed, urgency, status)
       VALUES (?, 1, 'O+', 2, 'high', 'pending')`,
      [rc1.recipient_id]
    );
    await conn.query(
      `INSERT INTO blood_requests (recipient_id, bank_id, blood_group, units_needed, urgency, status)
       VALUES (?, 1, 'A+', 1, 'medium', 'approved')`,
      [rc2.recipient_id]
    );

    console.log('✅ Users, donors, recipients, donations, requests seeded\n');

    // ── Triggers ─────────────────────────────────────────────────────
    console.log('⚙️  Triggers creation skipped (not supported on TiDB Cloud Serverless)');

    // ── Views ─────────────────────────────────────────────────────────
    await conn.query(`
      CREATE VIEW available_donors AS
      SELECT d.donor_id, u.name, u.email, d.blood_group,
             d.phone, d.last_donation_date, d.is_eligible
      FROM donors d
      JOIN users u ON d.user_id = u.user_id
      WHERE d.is_eligible = TRUE
    `);

    await conn.query(`
      CREATE VIEW low_inventory_alert AS
      SELECT b.name AS bank_name, b.location, i.blood_group, i.units_available
      FROM blood_inventory i
      JOIN blood_banks b ON i.bank_id = b.bank_id
      WHERE i.units_available < 5
    `);

    console.log('✅ Views created');

    // ── Stored Procedure ─────────────────────────────────────────────
    console.log('⚙️  Stored procedure creation skipped (not supported on TiDB Cloud Serverless)');


    // ── Done ──────────────────────────────────────────────────────────
    console.log('\n🎉 Database initialization COMPLETE!\n');
    console.log('📋 Demo Credentials:');
    console.log('   Admin:       admin@biet.ac.in    → admin123');
    console.log('   Donor 1:     rajesh@example.com  → donor123');
    console.log('   Donor 2:     priya@example.com   → donor123');
    console.log('   Recipient 1: suresh@example.com  → recipient123');
    console.log('   Recipient 2: anita@example.com   → recipient123');
    console.log('\n▶  Now run: npm run dev\n');

  } catch (err) {
    console.error('\n❌ Initialization failed:', err.message);
    console.error('\nCheck:');
    console.error('  • DB_PASSWORD in server/.env matches your MySQL root password');
    console.error('  • MySQL service is running');
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

run();
