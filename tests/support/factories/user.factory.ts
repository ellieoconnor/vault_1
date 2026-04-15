import { faker } from '@faker-js/faker';

export type TestUser = {
  email: string;
  password: string;
  username: string;
};

/**
 * Creates a test user payload with sensible defaults.
 * Override any field by passing a partial object.
 *
 * Usage:
 *   const user = createUser();
 *   const adminUser = createUser({ username: 'admin' });
 */
export const createUser = (overrides: Partial<TestUser> = {}): TestUser => ({
  email: faker.internet.email().toLowerCase(),
  password: 'TestPassword123!',
  username: faker.internet.username().replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 20),
  ...overrides,
});
