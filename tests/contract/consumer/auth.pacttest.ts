/**
 * Consumer CDC test: Auth login contract
 *
 * Tests that the frontend's login fetch call matches what the backend provides.
 *
 * IMPORTANT: Consumer tests must call REAL consumer code (your actual API function),
 * not raw fetch(). This validates that the consumer code works with the contract.
 *
 * The frontend currently calls fetch() inline inside LoginPage's mutationFn.
 * Before these tests are meaningful, extract that call to a standalone function:
 *
 *   // src/api/auth-client.ts
 *   let _baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
 *   export const setApiUrl = (url: string) => { _baseUrl = url; };
 *
 *   export const loginUser = async (credentials: { username: string; password: string }) => {
 *     const res = await fetch(`${_baseUrl}/api/auth/login`, {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       credentials: 'include',
 *       body: JSON.stringify(credentials),
 *     });
 *     if (!res.ok) throw await res.json();
 *     return res.json() as Promise<{ id: string; username: string }>;
 *   };
 *
 * Then update LoginPage to use loginUser() and import setApiUrl here.
 */

import { MatchersV3 } from '@pact-foundation/pact';
import type { V3MockServer } from '@pact-foundation/pact';
import { createProviderState, setJsonBody, setJsonContent } from '../support/consumer-helpers';
import { userExists } from '../support/provider-states';
import { createPact } from '../support/pact-config';

// TODO: import real consumer code once extracted:
// import { loginUser, setApiUrl } from '../../../apps/frontend/src/api/auth-client';

const { like, string } = MatchersV3;

const pact = createPact();

describe('Auth API Consumer Contract', () => {
  it('POST /api/auth/login — valid credentials returns user', async () => {
    const testUser = { username: 'testuser', email: 'test@example.com' };
    const [stateName, stateParams] = createProviderState(userExists(testUser));

    await pact
      .addInteraction()
      .given(stateName, stateParams)
      .uponReceiving('a login request with valid credentials')
      .withRequest(
        'POST',
        '/api/auth/login',
        setJsonContent({
          headers: { 'Content-Type': 'application/json' },
          body: { username: 'testuser', password: 'TestPassword123!' },
        }),
      )
      .willRespondWith(
        200,
        setJsonContent({
          headers: { 'Content-Type': 'application/json' },
          body: like({
            id: string('user-id-123'),
            username: string('testuser'),
          }),
        }),
      )
      .executeTest(async (mockServer: V3MockServer) => {
        // TODO: replace raw fetch with real consumer code once extracted:
        // setApiUrl(mockServer.url);
        // const user = await loginUser({ username: 'testuser', password: 'TestPassword123!' });
        // expect(user.username).toBe('testuser');

        const res = await fetch(`${mockServer.url}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'testuser', password: 'TestPassword123!' }),
        });
        const body = await res.json();
        expect(res.status).toBe(200);
        expect(body.username).toBe('testuser');
      });
  });

  it('POST /api/auth/login — invalid credentials returns 401', async () => {
    await pact
      .addInteraction()
      .given('No user exists with the given credentials')
      .uponReceiving('a login request with invalid credentials')
      .withRequest(
        'POST',
        '/api/auth/login',
        setJsonContent({
          headers: { 'Content-Type': 'application/json' },
          body: { username: 'wronguser', password: 'wrongpassword' },
        }),
      )
      .willRespondWith(
        401,
        setJsonBody({
          error: 'INVALID_CREDENTIALS',
          message: like('Invalid username or password'),
          details: {},
        }),
      )
      .executeTest(async (mockServer: V3MockServer) => {
        const res = await fetch(`${mockServer.url}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'wronguser', password: 'wrongpassword' }),
        });
        expect(res.status).toBe(401);
      });
  });
});
