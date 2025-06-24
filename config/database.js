require('dotenv').config(); // Load environment variables from .env file
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'compliance_db',
  port: process.env.DB_PORT || 3306,
  // Add other MySQL configuration options as needed
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// Create database connection pool
const pool = mysql.createPool(dbConfig);

module.exports = {
  dbConfig,
  pool
};
