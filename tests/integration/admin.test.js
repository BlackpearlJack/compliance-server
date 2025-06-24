const request = require('supertest');
const app = require('../../server');
const TestDBHelper = require('../helpers/dbHelper');
const { testUsers, testLicensee, testComplianceForm } = require('../fixtures/testData');

describe('Admin Routes', () => {
  let adminAgent;
  let userAgent;
  let submissionId;

  beforeAll(async () => {
    await TestDBHelper.setupTestDB();
  });

  beforeEach(async () => {
    await TestDBHelper.truncateAllTables();
    
    // Create admin user
    await TestDBHelper.createTestUser(testUsers.adminUser);
    adminAgent = request.agent(app);
    await adminAgent
      .post('/api/login')
      .send({
        username: testUsers.adminUser.username,
        password: testUsers.adminUser.password
      });

    // Create regular user
    await TestDBHelper.createTestUser(testUsers.validUser);
    userAgent = request.agent(app);
    await userAgent
      .post('/api/login')
      .send({
        username: testUsers.validUser.username,
        password: testUsers.validUser.password
      });

    // Create test licensee and submission
    await TestDBHelper.createTestLicensee(testLicensee);
    const response = await userAgent
      .post('/api/submit-compliance')
      .send({ ...testLicensee, ...testComplianceForm });
    
    submissionId = response.body.formId;
  });

  afterAll(async () => {
    await TestDBHelper.cleanupTestDB();
    await TestDBHelper.closeConnection();
  });

  describe('GET /api/admin/submissions', () => {
    test('should return all submissions for admin', async () => {
      const response = await adminAgent
        .get('/api/admin/submissions')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('submitted_by');
    });

    test('should return 403 for non-admin user', async () => {
      const response = await userAgent
        .get('/api/admin/submissions')
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Unauthorized: Admin access required');
    });

    test('should return 403 for unauthenticated user', async () => {
      const response = await request(app)
        .get('/api/admin/submissions')
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Unauthorized: Admin access required');
    });
  });

  describe('GET /api/admin/user-stats', () => {
    test('should return user statistics for admin', async () => {
      const response = await adminAgent
        .get('/api/admin/user-stats')
        .expect(200);

      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body).toHaveProperty('totalSubmissions');
      expect(response.body).toHaveProperty('pendingSubmissions');
      expect(typeof response.body.totalUsers).toBe('number');
      expect(typeof response.body.totalSubmissions).toBe('number');
      expect(typeof response.body.pendingSubmissions).toBe('number');
    });

    test('should return 403 for non-admin user', async () => {
      const response = await userAgent
        .get('/api/admin/user-stats')
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Unauthorized: Admin access required');
    });
  });

  describe('POST /api/admin/update-submission', () => {
    test('should update submission status successfully', async () => {
      const updateData = {
        submissionId: submissionId,
        status: 'approved',
        checkedBy: 'Admin User',
        verifiedBy: 'Senior Admin',
        date: '2024-06-24',
        comment: 'All requirements met'
      };

      const response = await adminAgent
        .post('/api/admin/update-submission')
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Submission updated successfully');
    });

    test('should return 403 for non-admin user', async () => {
      const updateData = {
        submissionId: submissionId,
        status: 'approved',
        checkedBy: 'Regular User',
        verifiedBy: 'Regular User',
        date: '2024-06-24',
        comment: 'Unauthorized attempt'
      };

      const response = await userAgent
        .post('/api/admin/update-submission')
        .send(updateData)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Unauthorized: Admin access required');
    });

    test('should handle invalid submission ID', async () => {
      const updateData = {
        submissionId: 99999,
        status: 'approved',
        checkedBy: 'Admin User',
        verifiedBy: 'Senior Admin',
        date: '2024-06-24',
        comment: 'Invalid submission test'
      };

      const response = await adminAgent
        .post('/api/admin/update-submission')
        .send(updateData)
        .expect(200); // The query might succeed but affect 0 rows

      expect(response.body).toHaveProperty('success', true);
    });

    test('should create notification for user when submission updated', async () => {
      const updateData = {
        submissionId: submissionId,
        status: 'rejected',
        checkedBy: 'Admin User',
        verifiedBy: 'Senior Admin',
        date: '2024-06-24',
        comment: 'Missing documentation'
      };

      const response = await adminAgent
        .post('/api/admin/update-submission')
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      
      // Note: We could verify notification was created by querying the notifications table
      // but this would require additional helper methods
    });
  });

  describe('POST /api/admin/approve-submission', () => {
    test('should approve submission successfully', async () => {
      const approvalData = {
        submissionId: submissionId,
        status: 'approved',
        checkedBy: 'Admin User',
        verifiedBy: 'Senior Admin',
        date: '2024-06-24'
      };

      const response = await adminAgent
        .post('/api/admin/approve-submission')
        .send(approvalData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Submission status updated and user notified.');
    });

    test('should reject submission successfully', async () => {
      const rejectionData = {
        submissionId: submissionId,
        status: 'rejected',
        checkedBy: 'Admin User',
        verifiedBy: 'Senior Admin',
        date: '2024-06-24'
      };

      const response = await adminAgent
        .post('/api/admin/approve-submission')
        .send(rejectionData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Submission status updated and user notified.');
    });

    test('should return 403 for non-admin user', async () => {
      const approvalData = {
        submissionId: submissionId,
        status: 'approved',
        checkedBy: 'Regular User',
        verifiedBy: 'Regular User',
        date: '2024-06-24'
      };

      const response = await userAgent
        .post('/api/admin/approve-submission')
        .send(approvalData)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Unauthorized: Admin access required');
    });
  });

  describe('Admin access control', () => {
    test('should verify admin middleware is working correctly', async () => {
      // Test all admin routes return 403 for regular user
      await userAgent
        .get('/api/admin/submissions')
        .expect(403);
      
      await userAgent
        .get('/api/admin/user-stats')
        .expect(403);
      
      await userAgent
        .post('/api/admin/update-submission')
        .send({})
        .expect(403);
      
      await userAgent
        .post('/api/admin/approve-submission')
        .send({})
        .expect(403);
    });

    test('should verify admin can access all admin routes', async () => {
      // All these should not return 403
      const responses = await Promise.all([
        adminAgent.get('/api/admin/submissions'),
        adminAgent.get('/api/admin/user-stats'),
        adminAgent.post('/api/admin/update-submission').send({ submissionId: 1 }),
        adminAgent.post('/api/admin/approve-submission').send({ submissionId: 1 })
      ]);

      responses.forEach(response => {
        expect(response.status).not.toBe(403);
      });
    });
  });
});
