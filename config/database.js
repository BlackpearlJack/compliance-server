const mysql = require('mysql2/promise');

// MySQL Database configuration
const dbConfig = {
  host: 'localhost',
  port: 3306,        // MySQL server port - this is the port where MySQL is listening
  user: 'root',
  password: 'root',
  database: 'compliance'
};

// Create database connection pool
const pool = mysql.createPool(dbConfig);

module.exports = {
  dbConfig,
  pool
};
