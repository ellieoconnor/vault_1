/**
 * Integration tests: Daily Log routes (Story 2.5)
 *
 * Tests GET /api/daily-logs/today and POST /api/daily-logs, including
 * the dayComplete and mood fields added in Story 2.5.
 *
 * Run:
 *   cd apps/backend && npx vitest run tests/api/logs.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, prisma } from '../../src/index.js';

const uniqueUsername = () => `testuser_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

async function createAuthenticatedUser() {
    const username = uniqueUsername();
    const password = 'TestPassword123!';
    const registerRes = await request(app).post('/api/auth/register').send({ username, password });
    const loginRes = await request(app).post('/api/auth/login').send({ username, password });
    return {
        userId: registerRes.body.id as string,
        cookie: loginRes.headers['set-cookie'] as unknown as string[],
    };
}

const today = new Date().toISOString().split('T')[0];

// ---------------------------------------------------------------------------
// GET /api/daily-logs/today
// ---------------------------------------------------------------------------

describe('GET /api/daily-logs/today', () => {
    it('returns 401 when not authenticated', async () => {
        const res = await request(app).get('/api/daily-logs/today');
        expect(res.status).toBe(401);
    });

    describe('authenticated user', () => {
        let userId: string;
        let cookie: string[];

        beforeAll(async () => {
            ({ userId, cookie } = await createAuthenticatedUser());
        });

        afterAll(async () => {
            await prisma.dailyLog.deleteMany({ where: { userId } });
            await prisma.user.delete({ where: { id: userId } });
        });

        it('returns null for a new user with no log today', async () => {
            const res = await request(app).get('/api/daily-logs/today').set('Cookie', cookie);
            expect(res.status).toBe(200);
            expect(res.body).toBeNull();
        });

        it('returns the log after it is created', async () => {
            await request(app)
                .post('/api/daily-logs')
                .set('Cookie', cookie)
                .send({ logDate: today, calories: 2000 });

            const res = await request(app).get('/api/daily-logs/today').set('Cookie', cookie);
            expect(res.status).toBe(200);
            expect(res.body.calories).toBe(2000);
            expect(res.body.userId).toBe(userId);
        });
    });
});

// ---------------------------------------------------------------------------
// POST /api/daily-logs — basic logging
// ---------------------------------------------------------------------------

describe('POST /api/daily-logs', () => {
    it('returns 401 when not authenticated', async () => {
        const res = await request(app)
            .post('/api/daily-logs')
            .send({ logDate: today, calories: 2000 });
        expect(res.status).toBe(401);
    });

    describe('authenticated user — basic fields', () => {
        let userId: string;
        let cookie: string[];

        beforeAll(async () => {
            ({ userId, cookie } = await createAuthenticatedUser());
        });

        afterAll(async () => {
            await prisma.dailyLog.deleteMany({ where: { userId } });
            await prisma.user.delete({ where: { id: userId } });
        });

        it('creates a log with calories, protein, steps, workoutDone', async () => {
            const res = await request(app)
                .post('/api/daily-logs')
                .set('Cookie', cookie)
                .send({
                    logDate: today,
                    calories: 1800,
                    protein: 140,
                    steps: 8000,
                    workoutDone: true,
                });

            expect(res.status).toBe(200);
            expect(res.body.calories).toBe(1800);
            expect(res.body.protein).toBe(140);
            expect(res.body.steps).toBe(8000);
            expect(res.body.workoutDone).toBe(true);
        });

        it('upserts when a log already exists for the same date', async () => {
            await request(app)
                .post('/api/daily-logs')
                .set('Cookie', cookie)
                .send({ logDate: today, calories: 1500 });

            const res = await request(app)
                .post('/api/daily-logs')
                .set('Cookie', cookie)
                .send({ logDate: today, calories: 2200 });

            expect(res.status).toBe(200);
            expect(res.body.calories).toBe(2200);
        });

        it('returns 400 when logDate is missing', async () => {
            const res = await request(app)
                .post('/api/daily-logs')
                .set('Cookie', cookie)
                .send({ calories: 2000 });
            expect(res.status).toBe(400);
        });

        it('returns 400 for an invalid logDate format', async () => {
            const res = await request(app)
                .post('/api/daily-logs')
                .set('Cookie', cookie)
                .send({ logDate: '29-06-2026', calories: 2000 });
            expect(res.status).toBe(400);
        });

        it('returns 400 when calories is negative', async () => {
            const res = await request(app)
                .post('/api/daily-logs')
                .set('Cookie', cookie)
                .send({ logDate: today, calories: -100 });
            expect(res.status).toBe(400);
        });
    });
});

// ---------------------------------------------------------------------------
// POST /api/daily-logs — dayComplete + mood (Story 2.5)
// ---------------------------------------------------------------------------

describe('POST /api/daily-logs — dayComplete + mood', () => {
    describe('authenticated user', () => {
        let userId: string;
        let cookie: string[];

        beforeAll(async () => {
            ({ userId, cookie } = await createAuthenticatedUser());
        });

        afterAll(async () => {
            await prisma.dailyLog.deleteMany({ where: { userId } });
            await prisma.user.delete({ where: { id: userId } });
        });

        it('marks the day complete with a mood and sets roughDay to false', async () => {
            const res = await request(app)
                .post('/api/daily-logs')
                .set('Cookie', cookie)
                .send({ logDate: today, dayComplete: true, mood: 'solid' });

            expect(res.status).toBe(200);
            expect(res.body.dayComplete).toBe(true);
            expect(res.body.mood).toBe('solid');
            expect(res.body.roughDay).toBe(false);
        });

        it('marks the day complete with null mood when the picker is skipped', async () => {
            const res = await request(app)
                .post('/api/daily-logs')
                .set('Cookie', cookie)
                .send({ logDate: today, dayComplete: true, mood: null });

            expect(res.status).toBe(200);
            expect(res.body.dayComplete).toBe(true);
            expect(res.body.mood).toBeNull();
            expect(res.body.roughDay).toBe(false);
        });

        it('accepts all 7 valid mood values', async () => {
            const moods = [
                'crushing-it',
                'solid',
                'powered-up',
                'okay',
                'scattered',
                'drained',
                'rough',
            ] as const;

            for (const mood of moods) {
                const res = await request(app)
                    .post('/api/daily-logs')
                    .set('Cookie', cookie)
                    .send({ logDate: today, dayComplete: true, mood });
                expect(res.status).toBe(200);
                expect(res.body.mood).toBe(mood);
            }
        });

        it('returns 400 for an invalid mood value', async () => {
            const res = await request(app)
                .post('/api/daily-logs')
                .set('Cookie', cookie)
                .send({ logDate: today, dayComplete: true, mood: 'amazing' });
            expect(res.status).toBe(400);
        });
    });

    describe('roughDay is not set when dayComplete is omitted', () => {
        let userId: string;
        let cookie: string[];

        beforeAll(async () => {
            ({ userId, cookie } = await createAuthenticatedUser());
        });

        afterAll(async () => {
            await prisma.dailyLog.deleteMany({ where: { userId } });
            await prisma.user.delete({ where: { id: userId } });
        });

        it('roughDay stays null on a plain metrics save', async () => {
            const res = await request(app)
                .post('/api/daily-logs')
                .set('Cookie', cookie)
                .send({ logDate: today, calories: 2000 });

            expect(res.status).toBe(200);
            expect(res.body.dayComplete).toBeFalsy();
            expect(res.body.roughDay).toBeNull();
        });
    });
});
