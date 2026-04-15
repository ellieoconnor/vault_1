/**
 * Integration tests: Auth routes
 *
 * Uses supertest to make HTTP requests against the Express app without
 * starting a real server. Requires a real database (Neon dev/test branch).
 *
 * Prerequisites:
 *   1. Export `app` from src/index.ts (or a separate src/app.ts):
 *        export { app };
 *   2. Install test dependencies:
 *        npm install -D vitest supertest @types/supertest
 *   3. Copy .env.test.example to .env.test with real test-env values.
 *
 * Run:
 *   cd apps/backend && npx vitest run tests/api/auth.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

// TODO: export `app` from src/index.ts to enable these tests.
// import { app } from '../../src/index.js';

// Placeholder until app is exported — remove when real import is wired up.
const app = null as unknown as import('express').Express;

const uniqueUsername = () => `testuser_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

describe('POST /api/auth/register', () => {
  it('creates a new user and returns 201', async () => {
    const username = uniqueUsername();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username, email: `${username}@test.com`, password: 'TestPassword123!' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ username });
    expect(res.body.id).toBeDefined();
  });

  it('returns 409 when username is already taken', async () => {
    const username = uniqueUsername();
    await request(app)
      .post('/api/auth/register')
      .send({ username, password: 'TestPassword123!' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ username, password: 'TestPassword123!' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('USERNAME_TAKEN');
  });
});

describe('POST /api/auth/login', () => {
  const username = uniqueUsername();
  const password = 'TestPassword123!';

  beforeAll(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username, password });
  });

  it('returns 200 and sets session cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username, password });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ username });
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username, password: 'WrongPassword!' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('INVALID_CREDENTIALS');
  });

  it('returns 401 for unknown username', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'doesnotexist', password });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('INVALID_CREDENTIALS');
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('UNAUTHENTICATED');
  });

  it('returns user when session cookie is present', async () => {
    const username = uniqueUsername();
    await request(app)
      .post('/api/auth/register')
      .send({ username, password: 'TestPassword123!' });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username, password: 'TestPassword123!' });

    const cookie = loginRes.headers['set-cookie'] as string[];

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookie);

    expect(meRes.status).toBe(200);
    expect(meRes.body).toMatchObject({ username });
  });
});

describe('POST /api/auth/forgot-password', () => {
  it('always returns 200 regardless of whether user exists (prevents enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ username: 'nosuchuser' });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain("If an account");
  });
});
