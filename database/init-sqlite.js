const { dbAsync } = require('../config/database-sqlite');

// Initialize SQLite database
async function initializeSQLiteDatabase() {
  try {
    console.log('Initializing SQLite database...');
    
    // Create users table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create sessions table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create notifications table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        related_id INTEGER,
        is_read BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create licensees table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS licensees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        license_no TEXT NOT NULL UNIQUE,
        date_licensed DATE,
        other_licenses TEXT,
        domiciled_zone TEXT,
        zone TEXT,
        street_road TEXT,
        building_name TEXT,
        postal_address TEXT,
        postal_code TEXT,
        tel_no TEXT,
        mobile_no TEXT,
        email TEXT,
        web_address TEXT,
        ceo_name_title TEXT,
        contact_person_name TEXT,
        contact_mobile TEXT,
        contact_email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create compliance_forms table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS compliance_forms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        licensee_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        financial_quarter TEXT,
        reporting_period_start DATE,
        reporting_period_end DATE,
        fiscal_year_start DATE,
        fiscal_year_end DATE,
        capex_preceding REAL DEFAULT 0,
        capex_current REAL DEFAULT 0,
        capex_cumulative REAL DEFAULT 0,
        opex_preceding REAL DEFAULT 0,
        opex_current REAL DEFAULT 0,
        opex_cumulative REAL DEFAULT 0,
        total_local_cumulative INTEGER DEFAULT 0,
        total_expat_cumulative INTEGER DEFAULT 0,
        total_local_new INTEGER DEFAULT 0,
        total_expat_new INTEGER DEFAULT 0,
        total_local_total INTEGER DEFAULT 0,
        total_expat_total INTEGER DEFAULT 0,
        exports_subtotal REAL DEFAULT 0,
        domestic_sales_subtotal REAL DEFAULT 0,
        quarterly_turnover REAL DEFAULT 0,
        imports_subtotal REAL DEFAULT 0,
        local_purchases_subtotal REAL DEFAULT 0,
        total_inputs REAL DEFAULT 0,
        esg_initiatives TEXT,
        waste_management TEXT,
        comments_suggestions TEXT,
        submission_name TEXT,
        submission_title TEXT,
        submission_date DATE,
        status TEXT DEFAULT 'pending',
        checked_by TEXT,
        verified_by TEXT,
        review_date DATE,
        admin_comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (licensee_id) REFERENCES licensees(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create additional tables
    await createAdditionalSQLiteTables();

    // Create default admin user if not exists
    const adminUser = await dbAsync.get('SELECT * FROM users WHERE username = ?', ['admin']);
    if (!adminUser) {
      await dbAsync.run(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        ['admin', 'admin123', 'admin']
      );
      console.log('Default admin user created (username: admin, password: admin123)');
    }

    console.log('SQLite database initialization complete');
  } catch (error) {
    console.error('SQLite database initialization error:', error);
    throw error;
  }
}

async function createAdditionalSQLiteTables() {
  // Create goods_services table
  await dbAsync.run(`
    CREATE TABLE IF NOT EXISTS goods_services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      form_id INTEGER NOT NULL,
      goods_services_provided TEXT,
      description TEXT,
      unit_measure TEXT,
      FOREIGN KEY (form_id) REFERENCES compliance_forms(id) ON DELETE CASCADE
    )
  `);

  // Create employment_details table
  await dbAsync.run(`
    CREATE TABLE IF NOT EXISTS employment_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      form_id INTEGER NOT NULL,
      category TEXT,
      type TEXT,
      local_cumulative INTEGER DEFAULT 0,
      expat_cumulative INTEGER DEFAULT 0,
      local_new INTEGER DEFAULT 0,
      expat_new INTEGER DEFAULT 0,
      local_total INTEGER DEFAULT 0,
      expat_total INTEGER DEFAULT 0,
      FOREIGN KEY (form_id) REFERENCES compliance_forms(id) ON DELETE CASCADE
    )
  `);

  // Create exports table
  await dbAsync.run(`
    CREATE TABLE IF NOT EXISTS exports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      form_id INTEGER NOT NULL,
      goods_services TEXT,
      units REAL,
      price REAL,
      total REAL,
      FOREIGN KEY (form_id) REFERENCES compliance_forms(id) ON DELETE CASCADE
    )
  `);

  // Create domestic_sales table
  await dbAsync.run(`
    CREATE TABLE IF NOT EXISTS domestic_sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      form_id INTEGER NOT NULL,
      goods_services TEXT,
      units REAL,
      price REAL,
      total REAL,
      FOREIGN KEY (form_id) REFERENCES compliance_forms(id) ON DELETE CASCADE
    )
  `);

  // Create imports table
  await dbAsync.run(`
    CREATE TABLE IF NOT EXISTS imports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      form_id INTEGER NOT NULL,
      goods_services TEXT,
      units REAL,
      price REAL,
      total REAL,
      FOREIGN KEY (form_id) REFERENCES compliance_forms(id) ON DELETE CASCADE
    )
  `);

  // Create local_purchases table
  await dbAsync.run(`
    CREATE TABLE IF NOT EXISTS local_purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      form_id INTEGER NOT NULL,
      goods_services TEXT,
      units REAL,
      price REAL,
      total REAL,
      FOREIGN KEY (form_id) REFERENCES compliance_forms(id) ON DELETE CASCADE
    )
  `);

  // Create compliance_checklist table
  await dbAsync.run(`
    CREATE TABLE IF NOT EXISTS compliance_checklist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      form_id INTEGER NOT NULL,
      item_name TEXT,
      is_compliant BOOLEAN,
      comments TEXT,
      FOREIGN KEY (form_id) REFERENCES compliance_forms(id) ON DELETE CASCADE
    )
  `);

  // Create infrastructure_checklist table
  await dbAsync.run(`
    CREATE TABLE IF NOT EXISTS infrastructure_checklist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      form_id INTEGER NOT NULL,
      item_name TEXT,
      status TEXT,
      completion_percentage REAL,
      FOREIGN KEY (form_id) REFERENCES compliance_forms(id) ON DELETE CASCADE
    )
  `);

  // Create investors table
  await dbAsync.run(`
    CREATE TABLE IF NOT EXISTS investors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      form_id INTEGER NOT NULL,
      category TEXT,
      cumulative_preceding INTEGER DEFAULT 0,
      onboarded_current INTEGER DEFAULT 0,
      total_current INTEGER DEFAULT 0,
      FOREIGN KEY (form_id) REFERENCES compliance_forms(id) ON DELETE CASCADE
    )
  `);

  // Create utilities table
  await dbAsync.run(`
    CREATE TABLE IF NOT EXISTS utilities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      form_id INTEGER NOT NULL,
      utility_type TEXT,
      utility_name TEXT,
      units_consumed REAL,
      cost_per_unit REAL,
      total_cost REAL,
      FOREIGN KEY (form_id) REFERENCES compliance_forms(id) ON DELETE CASCADE
    )
  `);

  // Create uploads table
  await dbAsync.run(`
    CREATE TABLE IF NOT EXISTS uploads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      form_id INTEGER NOT NULL,
      file_type TEXT,
      file_name TEXT,
      file_path TEXT,
      file_size INTEGER,
      mime_type TEXT,
      uploaded_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (form_id) REFERENCES compliance_forms(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
}

module.exports = {
  initializeSQLiteDatabase
};
