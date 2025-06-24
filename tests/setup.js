// Global test setup
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'compliance_test';
process.env.WEB_PORT = 3002; // Use different port for testing

// Increase test timeout for database operations
jest.setTimeout(30000);

// Mock console.log in tests to reduce noise
global.console = {
  ...console,
  // Uncomment to suppress logs during testing
  // log: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};
