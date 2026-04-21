import { type AuthProvider } from '@seontechnologies/playwright-utils/auth-session';

/**
 * Auth provider for vault_1's session-cookie based authentication.
 *
 * The backend uses HttpOnly session cookies via express-session.
 * Playwright captures the Set-Cookie header from the login response
 * and stores it in its storageState format so it can be reused
 * across test runs without re-logging in each time.
 */
const authProvider: AuthProvider = {
  getEnvironment: (options) => options.environment ?? 'local',
  getUserIdentifier: (options) => options.userIdentifier ?? 'default-user',

  extractToken: (storageState) => {
    // Session is identified by the connect.sid cookie
    const sessionCookie = storageState.cookies.find((c) => c.name === 'connect.sid');
    return sessionCookie?.value;
  },

  isTokenExpired: (storageState) => {
    // express-session cookies don't have expiry by default (session cookies).
    // If no cookie found, treat as expired so we re-authenticate.
    const sessionCookie = storageState.cookies.find((c) => c.name === 'connect.sid');
    return !sessionCookie;
  },

  manageAuthToken: async (request, options) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    const apiUrl = process.env.API_URL ?? 'http://localhost:3000';

    if (!email || !password) {
      throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.test');
    }

    const response = await request.post(`${apiUrl}/api/auth/login`, {
      data: { email, password },
    });

    if (!response.ok()) {
      throw new Error(`Login failed (${response.status()}): ${await response.text()}`);
    }

    // Playwright automatically captures Set-Cookie headers into the request context.
    // Return a minimal storage state; cookies are already stored on the request context.
    return {
      cookies: [],
      origins: [],
    };
  },
};

export default authProvider;
