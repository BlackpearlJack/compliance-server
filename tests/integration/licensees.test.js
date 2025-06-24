const request = require('supertest');
const app = require('../../server');
const TestDBHelper = require('../helpers/dbHelper');
const { testUsers, testLicensee } = require('../fixtures/testData');

describe('Licensees Routes', () => {
  let authenticatedAgent;

  beforeAll(async () => {
    await TestDBHelper.setupTestDB();
  });

  beforeEach(async () => {
    await TestDBHelper.truncateAllTables();
    
    // Create and login test user
    await TestDBHelper.createTestUser(testUsers.validUser);
    authenticatedAgent = request.agent(app);
    await authenticatedAgent
      .post('/api/login')
      .send({
        username: testUsers.validUser.username,
        password: testUsers.validUser.password
      });
  });

  afterAll(async () => {
    await TestDBHelper.cleanupTestDB();
    await TestDBHelper.closeConnection();
  });

  describe('POST /api/licensees', () => {
    test('should create a new licensee successfully', async () => {
      const response = await authenticatedAgent
        .post('/api/licensees')
        .send(testLicensee)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Licensee submitted');
      expect(response.body).toHaveProperty('id');
      expect(typeof response.body.id).toBe('number');
    });

    test('should return error for missing required fields', async () => {
      const incompleteLicensee = {
        licenseeName: 'Test Company'
        // Missing licenseNo
      };

      const response = await authenticatedAgent
        .post('/api/licensees')
        .send(incompleteLicensee)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid request body. Missing required fields.');
    });

    test('should return error when not authenticated', async () => {
      const response = await request(app)
        .post('/api/licensees')
        .send(testLicensee)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle duplicate license numbers', async () => {
      // Create first licensee
      await authenticatedAgent
        .post('/api/licensees')
        .send(testLicensee);

      // Try to create another with same license number
      const response = await authenticatedAgent
        .post('/api/licensees')
        .send(testLicensee)
        .expect(500);

      expect(response.body).toHaveProperty('details');
    });
  });

  describe('Licensee data validation', () => {
    test('should accept valid licensee data', async () => {
      const validLicensee = {
        ...testLicensee,
        emailAddress: 'valid@email.com',
        telNo: '+1-555-0123',
        postalCode: '12345'
      };

      const response = await authenticatedAgent
        .post('/api/licensees')
        .send(validLicensee)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Licensee submitted');
    });

    test('should handle special characters in names', async () => {
      const specialCharLicensee = {
        ...testLicensee,
        licenseeName: 'Test Company Ltd. & Associates',
        licenseNo: 'TC-001/2024',
        ceoNameTitle: "John O'Connor - CEO"
      };

      const response = await authenticatedAgent
        .post('/api/licensees')
        .send(specialCharLicensee)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Licensee submitted');
    });

    test('should handle empty optional fields', async () => {
      const minimalLicensee = {
        licenseeName: testLicensee.licenseeName,
        licenseNo: testLicensee.licenseNo,
        // All other fields are optional or empty
        dateLicensed: '',
        otherLicenses: '',
        domiciledZone: '',
        zone: '',
        streetRoad: '',
        buildingName: '',
        postalAddress: '',
        postalCode: '',
        telNo: '',
        mobileNo: '',
        emailAddress: '',
        webAddress: '',
        ceoNameTitle: '',
        contactPersonName: '',
        contactMobile: '',
        contactEmail: ''
      };

      const response = await authenticatedAgent
        .post('/api/licensees')
        .send(minimalLicensee)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Licensee submitted');
    });
  });
});
