// Database configuration switcher
const DB_TYPE = process.env.DB_TYPE || 'mysql'; // Default to SQLite

let dbConfig, pool, initializeDatabase;

if (DB_TYPE === 'mysql') {
  // Use MySQL configuration
  const mysqlConfig = require('./database');
  const { initializeDatabase: initMySQL } = require('../database/init');
  
  dbConfig = mysqlConfig.dbConfig;
  pool = mysqlConfig.pool;
  initializeDatabase = initMySQL;
  
  console.log('Using MySQL database');
} else {
  // Use SQLite configuration
  const sqliteConfig = require('./database-sqlite');
  const { initializeSQLiteDatabase } = require('../database/init-sqlite');
  
  pool = sqliteConfig.pool;
  initializeDatabase = initializeSQLiteDatabase;
  
  console.log('Using SQLite database');
}

module.exports = {
  dbConfig,
  pool,
  initializeDatabase
};
