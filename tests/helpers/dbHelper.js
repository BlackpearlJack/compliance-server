const { pool } = require('../../config/database');
const { initializeDatabase } = require('../../database/init');

// Database test utilities
class TestDBHelper {
  static async setupTestDB() {
    try {
      // Initialize test database
      await initializeDatabase();
      console.log('Test database initialized');
    } catch (error) {
      console.error('Failed to setup test database:', error);
      throw error;
    }
  }

  static async cleanupTestDB() {
    try {
      // Clean up test data
      await this.truncateAllTables();
      console.log('Test database cleaned up');
    } catch (error) {
      console.error('Failed to cleanup test database:', error);
      throw error;
    }
  }

  static async truncateAllTables() {
    const tables = [
      'uploads',
      'utilities',
      'investors',
      'infrastructure_checklist',
      'compliance_checklist',
      'local_purchases',
      'imports',
      'domestic_sales',
      'exports',
      'employment_details',
      'goods_services',
      'compliance_forms',
      'notifications',
      'sessions',
      'licensees',
      'users'
    ];

    // Disable foreign key checks
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');

    // Truncate all tables
    for (const table of tables) {
      try {
        await pool.query(`TRUNCATE TABLE ${table}`);
      } catch (error) {
        console.warn(`Warning: Could not truncate table ${table}:`, error.message);
      }
    }

    // Re-enable foreign key checks
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
  }

  static async createTestUser(userData) {
    const { username, password, role } = userData;
    const [result] = await pool.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, password, role]
    );
    return result.insertId;
  }

  static async createTestLicensee(licenseeData) {
    const [result] = await pool.query(`
      INSERT INTO licensees (
        name, license_no, date_licensed, other_licenses, domiciled_zone,
        zone, street_road, building_name, postal_address, postal_code,
        tel_no, mobile_no, email, web_address, ceo_name_title,
        contact_person_name, contact_mobile, contact_email
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      licenseeData.licenseeName,
      licenseeData.licenseNo,
      licenseeData.dateLicensed,
      licenseeData.otherLicenses,
      licenseeData.domiciledZone,
      licenseeData.zone,
      licenseeData.streetRoad,
      licenseeData.buildingName,
      licenseeData.postalAddress,
      licenseeData.postalCode,
      licenseeData.telNo,
      licenseeData.mobileNo,
      licenseeData.emailAddress,
      licenseeData.webAddress,
      licenseeData.ceoNameTitle,
      licenseeData.contactPersonName,
      licenseeData.contactMobile,
      licenseeData.contactEmail
    ]);
    return result.insertId;
  }

  static async closeConnection() {
    if (pool) {
      await pool.end();
    }
  }
}

module.exports = TestDBHelper;
