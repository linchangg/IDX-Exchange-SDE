require('dotenv').config();
const mysql = require('mysql2/promise'); // Using the promise-based wrapper

// Create the connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10, // Maximum number of connections to create at once
  queueLimit: 0        // Unlimited queueing when connectionLimit is reached
});

// Export the pool for use in other files
module.exports = pool;