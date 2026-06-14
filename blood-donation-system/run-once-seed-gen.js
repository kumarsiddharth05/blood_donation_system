/**
 * run-once-seed-gen.js
 * ---------------------------------------------------------------
 * Run this ONCE after `npm install` in the server folder to
 * generate seed.sql with the correct bcrypt hashes.
 *
 * Usage (from the blood-donation-system root):
 *   node run-once-seed-gen.js
 *
 * It will print the correct INSERT lines — paste them into seed.sql
 * replacing the users section.
 * ---------------------------------------------------------------
 */
const bcrypt = require('./server/node_modules/bcryptjs');

async function main() {
  const [adminHash, donorHash, recipientHash] = await Promise.all([
    bcrypt.hash('admin123',     10),
    bcrypt.hash('donor123',     10),
    bcrypt.hash('recipient123', 10),
  ]);

  console.log('\n-- Paste these INTO seed.sql (replace the users INSERT blocks):\n');

  console.log(`-- Admin (password: admin123)`);
  console.log(`INSERT INTO users (name, email, password_hash, role) VALUES`);
  console.log(`('Admin', 'admin@biet.ac.in', '${adminHash}', 'admin');\n`);

  console.log(`-- Donors (password: donor123)`);
  console.log(`INSERT INTO users (name, email, password_hash, role) VALUES`);
  console.log(`('Rajesh Kumar', 'rajesh@example.com', '${donorHash}', 'donor'),`);
  console.log(`('Priya Sharma', 'priya@example.com',  '${donorHash}', 'donor');\n`);

  console.log(`-- Recipients (password: recipient123)`);
  console.log(`INSERT INTO users (name, email, password_hash, role) VALUES`);
  console.log(`('Suresh Patel', 'suresh@example.com', '${recipientHash}', 'recipient'),`);
  console.log(`('Anita Reddy',  'anita@example.com',  '${recipientHash}', 'recipient');\n`);
}

main().catch(console.error);
