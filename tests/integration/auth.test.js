const request = require('supertest');
const app = require('../../server');
const TestDBHelper = require('../helpers/dbHelper');
const { testUsers } = require('../fixtures/testData');

describe('Authentication Routes', () => {
  beforeAll(async () => {
    await TestDBHelper.setupTestDB();
  });

  beforeEach(async () => {
    await TestDBHelper.truncateAllTables();
  });

  afterAll(async () => {
    await TestDBHelper.cleanupTestDB();
    await TestDBHelper.closeConnection();
  });

  describe('POST /api/signup', () => {
    test('should create a new user successfully', async () => {
      const response = await request(app)
        .post('/api/signup')
        .send(testUsers.validUser)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'User created successfully');
      expect(response.body).toHaveProperty('userId');
      expect(typeof response.body.userId).toBe('number');
    });

    test('should return error for duplicate username', async () => {
      // Create user first
      await request(app)
        .post('/api/signup')
        .send(testUsers.validUser);

      // Try to create same user again
      const response = await request(app)
        .post('/api/signup')
        .send(testUsers.validUser)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Username already exists');
    });

    test('should return error for missing required fields', async () => {
      const incompleteUser = { username: 'testuser' }; // missing password and role

      const response = await request(app)
        .post('/api/signup')
        .send(incompleteUser)
        .expect(500); // This might vary based on your validation

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/login', () => {
    beforeEach(async () => {
      // Create test user before each login test
      await TestDBHelper.createTestUser(testUsers.validUser);
    });

    test('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          username: testUsers.validUser.username,
          password: testUsers.validUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('username', testUsers.validUser.username);
      expect(response.body.user).toHaveProperty('role', testUsers.validUser.role);
    });

    test('should return error for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          username: testUsers.validUser.username,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    test('should return error for non-existent user', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          username: 'nonexistentuser',
          password: 'somepassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });
  });

  describe('GET /api/check-session', () => {
    test('should return invalid session when not logged in', async () => {
      const response = await request(app)
        .get('/api/check-session')
        .expect(401);

      expect(response.body).toHaveProperty('valid', false);
    });

    test('should return valid session after login', async () => {
      await TestDBHelper.createTestUser(testUsers.validUser);
      
      // Login first
      const agent = request.agent(app);
      await agent
        .post('/api/login')
        .send({
          username: testUsers.validUser.username,
          password: testUsers.validUser.password
        });

      // Check session
      const response = await agent
        .get('/api/check-session')
        .expect(200);

      expect(response.body).toHaveProperty('valid', true);
    });
  });

  describe('GET /api/profile', () => {
    test('should return user profile when authenticated', async () => {
      await TestDBHelper.createTestUser(testUsers.validUser);
      
      // Login first
      const agent = request.agent(app);
      await agent
        .post('/api/login')
        .send({
          username: testUsers.validUser.username,
          password: testUsers.validUser.password
        });

      // Get profile
      const response = await agent
        .get('/api/profile')
        .expect(200);

      expect(response.body).toHaveProperty('username', testUsers.validUser.username);
      expect(response.body).toHaveProperty('role', testUsers.validUser.role);
    });

    test('should return error when not authenticated', async () => {
      const response = await request(app)
        .get('/api/profile')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Not authenticated');
    });
  });

  describe('POST /api/logout', () => {
    test('should logout successfully', async () => {
      await TestDBHelper.createTestUser(testUsers.validUser);
      
      // Login first
      const agent = request.agent(app);
      await agent
        .post('/api/login')
        .send({
          username: testUsers.validUser.username,
          password: testUsers.validUser.password
        });

      // Logout
      const response = await agent
        .post('/api/logout')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Logged out successfully');

      // Verify session is invalid after logout
      await agent
        .get('/api/check-session')
        .expect(401);
    });
  });
});
