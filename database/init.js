const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');

// Initialize database
async function initializeDatabase() {
  try {
    console.log('Attempting to connect to MySQL...');
    console.log(`Connection details: host=${dbConfig.host}, port=${dbConfig.port}, user=${dbConfig.user}, database=${dbConfig.database}`);
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      connectTimeout: 10000 // 10 second timeout
    });

    console.log('Creating database if not exists...');
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await connection.query(`USE ${dbConfig.database}`);
    
    console.log('Creating tables...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create notifications table
    await connection.query(`
        CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            type VARCHAR(50) NOT NULL,
            message TEXT NOT NULL,
            related_id INT,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // Create licensees table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS licensees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        license_no VARCHAR(255) NOT NULL UNIQUE,
        date_licensed DATE,
        other_licenses TEXT,
        domiciled_zone VARCHAR(255),
        zone VARCHAR(255),
        street_road VARCHAR(255),
        building_name VARCHAR(255),
        postal_address VARCHAR(255),
        postal_code VARCHAR(255),
        tel_no VARCHAR(255),
        mobile_no VARCHAR(255),
        email VARCHAR(255),
        web_address VARCHAR(255),
        ceo_name_title VARCHAR(255),
        contact_person_name VARCHAR(255),
        contact_mobile VARCHAR(255),
        contact_email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create compliance_forms table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS compliance_forms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        licensee_id INT NOT NULL,
        user_id INT NOT NULL,
        financial_quarter VARCHAR(50),
        reporting_period_start DATE,
        reporting_period_end DATE,
        fiscal_year_start DATE,
        fiscal_year_end DATE,
        capex_preceding DECIMAL(15,2) DEFAULT 0,
        capex_current DECIMAL(15,2) DEFAULT 0,
        capex_cumulative DECIMAL(15,2) DEFAULT 0,
        opex_preceding DECIMAL(15,2) DEFAULT 0,
        opex_current DECIMAL(15,2) DEFAULT 0,
        opex_cumulative DECIMAL(15,2) DEFAULT 0,
        total_local_cumulative INT DEFAULT 0,
        total_expat_cumulative INT DEFAULT 0,
        total_local_new INT DEFAULT 0,
        total_expat_new INT DEFAULT 0,
        total_local_total INT DEFAULT 0,
        total_expat_total INT DEFAULT 0,
        exports_subtotal DECIMAL(15,2) DEFAULT 0,
        domestic_sales_subtotal DECIMAL(15,2) DEFAULT 0,
        quarterly_turnover DECIMAL(15,2) DEFAULT 0,
        imports_subtotal DECIMAL(15,2) DEFAULT 0,
        local_purchases_subtotal DECIMAL(15,2) DEFAULT 0,
        total_inputs DECIMAL(15,2) DEFAULT 0,
        esg_initiatives TEXT,
        waste_management TEXT,
        comments_suggestions TEXT,
        submission_name VARCHAR(255),
        submission_title VARCHAR(255),
        submission_date DATE,
        status VARCHAR(50) DEFAULT 'pending',
        checked_by VARCHAR(255),
        verified_by VARCHAR(255),
        review_date DATE,
        admin_comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (licensee_id) REFERENCES licensees(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create additional tables for related data
    await createAdditionalTables(connection);

    console.log('Database initialization complete');
    await connection.end();
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

async function createAdditionalTables(connection) {
  // Create goods_services table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS goods_services (
      id INT AUTO_INCREMENT PRIMARY KEY,
      form_id INT NOT NULL,
      goods_services_provided VARCHAR(255),
      description TEXT,
      unit_measure VARCHAR(100),
      FOREIGN KEY (form_id) REFERENCES compliance_forms(id) ON DELETE CASCADE
    )
  `);

  // Create employment_details table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS employment_details (
      id INT AUTO_INCREMENT PRIMARY KEY,
      form_id INT NOT NULL,
      category VARCHAR(50),
      type VARCHAR(50),
      local_cumulative INT DEFAULT 0,
      expat_cumulative INT DEFAULT 0,
      local_new INT DEFAULT 0,
      expat_new INT DEFAULT 0,
      local_total INT DEFAULT 0,
      expat_total INT DEFAULT 0,
      FOREIGN KEY (form_id) REFERENCES compliance_forms(id) ON DELETE CASCADE
    )
  `);

  // Create exports table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS exports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      form_id INT NOT NULL,
      goods_services VARCHAR(255),
      units DECIMAL(15,2),
      price DECIMAL(15,2),
      total DECIMAL(15,2),
      FOREIGN KEY (form_id) REFERENCES compliance_forms(id) ON DELETE CASCADE
    )
  `);

  // Create domestic_sales table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS domestic_sales (
      id INT AUTO_INCREMENT PRIMARY KEY,
      form_id INT NOT NULL,
      goods_services VARCHAR(255),
      units DECIMAL(15,2),
      price DECIMAL(15,2),
      total DECIMAL(15,2),
      FOREIGN KEY (form_id) REFERENCES compliance_forms(id) ON DELETE CASCADE
    )
  `);

  // Create imports table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS imports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      form_id INT NOT NULL,
      goods_services VARCHAR(255),
      units DECIMAL(15,2),
      price DECIMAL(15,2),
      total DECIMAL(15,2),
      FOREIGN KEY (form_id) REFERENCES compliance_forms(id) ON DELETE CASCADE
    )
  `);

  // Create local_purchases table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS local_purchases (
      id INT AUTO_INCREMENT PRIMARY KEY,
      form_id INT NOT NULL,
      goods_services VARCHAR(255),
      units DECIMAL(15,2),
      price DECIMAL(15,2),
      total DECIMAL(15,2),
      FOREIGN KEY (form_id) REFERENCES compliance_forms(id) ON DELETE CASCADE
    )
  `);

  // Create compliance_checklist table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS compliance_checklist (
      id INT AUTO_INCREMENT PRIMARY KEY,
      form_id INT NOT NULL,
      item_name VARCHAR(255),
      is_compliant BOOLEAN,
      comments TEXT,
      FOREIGN KEY (form_id) REFERENCES compliance_forms(id) ON DELETE CASCADE
    )
  `);

  // Create infrastructure_checklist table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS infrastructure_checklist (
      id INT AUTO_INCREMENT PRIMARY KEY,
      form_id INT NOT NULL,
      item_name VARCHAR(255),
      status VARCHAR(100),
      completion_percentage DECIMAL(5,2),
      FOREIGN KEY (form_id) REFERENCES compliance_forms(id) ON DELETE CASCADE
    )
  `);

  // Create investors table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS investors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      form_id INT NOT NULL,
      category VARCHAR(100),
      cumulative_preceding INT DEFAULT 0,
      onboarded_current INT DEFAULT 0,
      total_current INT DEFAULT 0,
      FOREIGN KEY (form_id) REFERENCES compliance_forms(id) ON DELETE CASCADE
    )
  `);

  // Create utilities table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS utilities (
      id INT AUTO_INCREMENT PRIMARY KEY,
      form_id INT NOT NULL,
      utility_type VARCHAR(100),
      utility_name VARCHAR(255),
      units_consumed DECIMAL(15,2),
      cost_per_unit DECIMAL(15,2),
      total_cost DECIMAL(15,2),
      FOREIGN KEY (form_id) REFERENCES compliance_forms(id) ON DELETE CASCADE
    )
  `);

  // Create uploads table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS uploads (
      id INT AUTO_INCREMENT PRIMARY KEY,
      form_id INT NOT NULL,
      file_type VARCHAR(100),
      file_name VARCHAR(255),
      file_path VARCHAR(500),
      file_size BIGINT,
      mime_type VARCHAR(100),
      uploaded_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (form_id) REFERENCES compliance_forms(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
}

module.exports = {
  initializeDatabase
};
