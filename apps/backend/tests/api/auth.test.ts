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

import crypto from 'node:crypto';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

import { app, prisma } from '../../src/index.js';


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

  it('returns 200 even when user exists with email on file', async () => {
    const username = uniqueUsername();
    await request(app)
      .post('/api/auth/register')
      .send({ username, email: `${username}@test.com`, password: 'TestPassword123!' });

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ username });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain("If an account");
  });
});

// Helper: seed a PasswordResetToken directly in the DB for testing reset routes.
// This bypasses the email flow so we can test token validation without a real email.
async function seedResetToken(userId: string, overrides: {
  expiresAt?: Date;
  usedAt?: Date | null;
} = {}) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = overrides.expiresAt ?? new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await prisma.passwordResetToken.create({
    data: { userId, token, expiresAt, usedAt: overrides.usedAt ?? null },
  });
  return token;
}

describe('GET /api/auth/reset-password/:token', () => {
  let userId: string;

  beforeAll(async () => {
    const username = uniqueUsername();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username, password: 'TestPassword123!' });
    userId = res.body.id;
  });

  afterAll(async () => {
    await prisma.passwordResetToken.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
  });

  it('returns 200 for a valid token', async () => {
    const token = await seedResetToken(userId);
    const res = await request(app).get(`/api/auth/reset-password/${token}`);
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
  });

  it('returns 400 TOKEN_NOT_FOUND for a token that does not exist', async () => {
    const res = await request(app).get('/api/auth/reset-password/doesnotexist');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('TOKEN_NOT_FOUND');
  });

  it('returns 400 TOKEN_EXPIRED for an expired token', async () => {
    const token = await seedResetToken(userId, {
      expiresAt: new Date(Date.now() - 1000), // already expired
    });
    const res = await request(app).get(`/api/auth/reset-password/${token}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('TOKEN_EXPIRED');
  });

  it('returns 400 TOKEN_ALREADY_USED for a used token', async () => {
    const token = await seedResetToken(userId, {
      usedAt: new Date(),
    });
    const res = await request(app).get(`/api/auth/reset-password/${token}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('TOKEN_ALREADY_USED');
  });
});

describe('POST /api/auth/reset-password/:token', () => {
  let userId: string;
  let username: string;

  beforeAll(async () => {
    username = uniqueUsername();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username, password: 'OldPassword123!' });
    userId = res.body.id;
  });

  afterAll(async () => {
    await prisma.passwordResetToken.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
  });

  it('resets the password and returns 200 with user + session cookie', async () => {
    const token = await seedResetToken(userId);
    const res = await request(app)
      .post(`/api/auth/reset-password/${token}`)
      .send({ password: 'NewPassword456!' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ username });
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('can log in with the new password after reset', async () => {
    const token = await seedResetToken(userId);
    await request(app)
      .post(`/api/auth/reset-password/${token}`)
      .send({ password: 'NewerPassword789!' });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username, password: 'NewerPassword789!' });

    expect(loginRes.status).toBe(200);
  });

  it('returns 400 TOKEN_ALREADY_USED when the same token is submitted twice', async () => {
    const token = await seedResetToken(userId);
    await request(app)
      .post(`/api/auth/reset-password/${token}`)
      .send({ password: 'Password111!' });

    const res = await request(app)
      .post(`/api/auth/reset-password/${token}`)
      .send({ password: 'Password222!' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('TOKEN_ALREADY_USED');
  });

  it('returns 400 TOKEN_EXPIRED for an expired token', async () => {
    const token = await seedResetToken(userId, {
      expiresAt: new Date(Date.now() - 1000),
    });
    const res = await request(app)
      .post(`/api/auth/reset-password/${token}`)
      .send({ password: 'NewPassword456!' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('TOKEN_EXPIRED');
  });

  it('returns 400 TOKEN_NOT_FOUND for a token that does not exist', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password/doesnotexist')
      .send({ password: 'NewPassword456!' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('TOKEN_NOT_FOUND');
  });

  it('returns 400 validation error for a password shorter than 8 characters', async () => {
    const token = await seedResetToken(userId);
    const res = await request(app)
      .post(`/api/auth/reset-password/${token}`)
      .send({ password: 'short' });

    expect(res.status).toBe(400);
  });
});
