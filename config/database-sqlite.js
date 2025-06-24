const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// SQLite Database configuration
const dbPath = path.join(__dirname, '..', 'data', 'compliance.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Promisify database operations for async/await support
const dbAsync = {
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },
  
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  
  query: async (sql, params = []) => {
    // For compatibility with MySQL pool.query format
    const result = await dbAsync.all(sql, params);
    return [result]; // Return in MySQL format [rows, fields]
  },

  getConnection: () => {
    // Mock connection for transaction support
    return {
      beginTransaction: () => dbAsync.run('BEGIN TRANSACTION'),
      commit: () => dbAsync.run('COMMIT'),
      rollback: () => dbAsync.run('ROLLBACK'),
      release: () => Promise.resolve(),
      query: dbAsync.query,
      run: dbAsync.run,
      get: dbAsync.get,
      all: dbAsync.all
    };
  }
};

module.exports = {
  db,
  dbAsync,
  pool: dbAsync // For compatibility with existing code
};
