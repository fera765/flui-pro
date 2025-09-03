import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Global test setup
beforeAll(() => {
  // Set test environment
  (process.env as any)['NODE_ENV'] = 'test';
});

afterAll(() => {
  // Cleanup
});