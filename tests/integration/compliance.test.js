const request = require('supertest');
const app = require('../../server');
const TestDBHelper = require('../helpers/dbHelper');
const { testUsers, testLicensee, testComplianceForm } = require('../fixtures/testData');

describe('Compliance Routes', () => {
  let authenticatedAgent;
  let licenseeId;

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

    // Create test licensee
    licenseeId = await TestDBHelper.createTestLicensee(testLicensee);
  });

  afterAll(async () => {
    await TestDBHelper.cleanupTestDB();
    await TestDBHelper.closeConnection();
  });

  describe('POST /api/submit-compliance', () => {
    test('should submit compliance form successfully', async () => {
      const complianceData = {
        ...testLicensee,
        ...testComplianceForm
      };

      const response = await authenticatedAgent
        .post('/api/submit-compliance')
        .send(complianceData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Compliance form submitted successfully');
      expect(response.body).toHaveProperty('formId');
      expect(typeof response.body.formId).toBe('number');
    });

    test('should return error when not authenticated', async () => {
      const response = await request(app)
        .post('/api/submit-compliance')
        .send(testComplianceForm)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Not authenticated');
    });

    test('should handle submission with minimal data', async () => {
      const minimalData = {
        licenseeName: testLicensee.licenseeName,
        licenseNo: testLicensee.licenseNo,
        financialQuarter: 'Q1 2024',
        fiscalYearStartDate: '2024-01-01',
        fiscalYearEndDate: '2024-12-31',
        submissionName: 'Test User',
        submissionTitle: 'Compliance Officer',
        submissionDate: '2024-06-24'
      };

      const response = await authenticatedAgent
        .post('/api/submit-compliance')
        .send(minimalData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Compliance form submitted successfully');
    });

    test('should handle submission with complex employment data', async () => {
      const complexEmploymentData = {
        ...testLicensee,
        ...testComplianceForm,
        employment: {
          technical: {
            permanent: {
              local_cumulative: 10,
              expat_cumulative: 2,
              local_new: 1,
              expat_new: 0,
              local_total: 11,
              expat_total: 2
            },
            term: {
              local_cumulative: 5,
              expat_cumulative: 1,
              local_new: 0,
              expat_new: 0,
              local_total: 5,
              expat_total: 1
            }
          },
          non_technical: {
            permanent: {
              local_cumulative: 20,
              expat_cumulative: 3,
              local_new: 2,
              expat_new: 1,
              local_total: 22,
              expat_total: 4
            }
          },
          total: {
            local_cumulative: 35,
            expat_cumulative: 6,
            local_new: 3,
            expat_new: 1,
            local_total: 38,
            expat_total: 7
          }
        }
      };

      const response = await authenticatedAgent
        .post('/api/submit-compliance')
        .send(complexEmploymentData)
        .expect(200);

      expect(response.body).toHaveProperty('formId');
    });

    test('should handle submission with arrays data (exports, imports, etc.)', async () => {
      const arrayData = {
        ...testLicensee,
        ...testComplianceForm,
        exports: [
          { goods: 'Product A', units: 100, price: 50, total: 5000 },
          { goods: 'Product B', units: 200, price: 25, total: 5000 }
        ],
        imports: [
          { goods: 'Raw Material X', units: 500, price: 10, total: 5000 }
        ],
        domesticSales: [
          { goods: 'Product A', units: 50, price: 60, total: 3000 }
        ],
        localPurchases: [
          { goods: 'Local Service', units: 1, price: 2000, total: 2000 }
        ]
      };

      const response = await authenticatedAgent
        .post('/api/submit-compliance')
        .send(arrayData)
        .expect(200);

      expect(response.body).toHaveProperty('formId');
    });
  });

  describe('GET /api/my-submissions', () => {
    test('should return user submissions', async () => {
      // Submit a compliance form first
      await authenticatedAgent
        .post('/api/submit-compliance')
        .send({ ...testLicensee, ...testComplianceForm });

      const response = await authenticatedAgent
        .get('/api/my-submissions')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('financial_quarter');
    });

    test('should return empty array for user with no submissions', async () => {
      const response = await authenticatedAgent
        .get('/api/my-submissions')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    test('should return error when not authenticated', async () => {
      const response = await request(app)
        .get('/api/my-submissions')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Not authenticated');
    });
  });

  describe('GET /api/submission-status/:submissionId', () => {
    let submissionId;

    beforeEach(async () => {
      // Create a submission
      const response = await authenticatedAgent
        .post('/api/submit-compliance')
        .send({ ...testLicensee, ...testComplianceForm });
      
      submissionId = response.body.formId;
    });

    test('should return submission status', async () => {
      const response = await request(app)
        .get(`/api/submission-status/${submissionId}`)
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('pending'); // Default status
    });

    test('should return 404 for non-existent submission', async () => {
      const response = await request(app)
        .get('/api/submission-status/99999')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Submission not found');
    });

    test('should return error for invalid submission ID', async () => {
      const response = await request(app)
        .get('/api/submission-status/invalid')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });
});
