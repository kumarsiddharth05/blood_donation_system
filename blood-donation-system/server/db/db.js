const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               Number(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  connectTimeout:     10000, // 10 seconds — fail fast with a clear error
  // SSL required for cloud databases (Aiven, PlanetScale, etc.)
  ...(process.env.DB_SSL === 'true' && { ssl: { rejectUnauthorized: false } }),
});

// Test the connection on startup
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ MySQL connection error:', err.message);
    console.error('   → Check DB_PASSWORD and DB_HOST in server/.env');
    console.error('   → Make sure MySQL service is running');
  } else {
    console.log('✅ MySQL connected successfully');
    connection.release();
  }
});

module.exports = pool.promise();

