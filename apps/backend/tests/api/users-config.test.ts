/**
 * Integration tests: User config routes
 *
 * Tests GET /api/users/config and POST /api/users/config.
 * Uses supertest against the real Express app + Neon test DB.
 *
 * Run:
 *   cd apps/backend && npx vitest run tests/api/users-config.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, prisma } from '../../src/index.js';

const uniqueUsername = () => `testuser_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// Shared user + session for tests that need auth
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

// Minimal valid metric payload
const metricPayload = {
    measurementSystem: 'metric',
    weightInput: 70, // kg
    heightInputPrimary: 175, // cm
    age: 30,
    sex: 'male',
    activityLevel: 'moderately_active',
    goalType: 'maintain',
    calorieTarget: 2000,
    proteinTarget: 150,
    stepsTarget: 10000,
};

// ---------------------------------------------------------------------------
// GET /api/users/config
// ---------------------------------------------------------------------------

describe('GET /api/users/config', () => {
    it('returns 401 when not authenticated', async () => {
        const res = await request(app).get('/api/users/config');
        expect(res.status).toBe(401);
    });

    describe('authenticated user', () => {
        let userId: string;
        let cookie: string[];

        beforeAll(async () => {
            ({ userId, cookie } = await createAuthenticatedUser());
        });

        afterAll(async () => {
            await prisma.userConfig.deleteMany({ where: { userId } });
            await prisma.user.delete({ where: { id: userId } });
        });

        it('returns 404 when no config exists yet', async () => {
            const res = await request(app).get('/api/users/config').set('Cookie', cookie);

            expect(res.status).toBe(404);
            expect(res.body.error).toBe('NOT_FOUND');
        });

        it('returns 200 with config after one has been created', async () => {
            await request(app).post('/api/users/config').set('Cookie', cookie).send(metricPayload);

            const res = await request(app).get('/api/users/config').set('Cookie', cookie);

            expect(res.status).toBe(200);
            expect(res.body.userId).toBe(userId);
            expect(res.body.weightKg).toBeCloseTo(70, 2);
            expect(res.body.heightCm).toBeCloseTo(175, 2);
        });
    });
});

// ---------------------------------------------------------------------------
// POST /api/users/config
// ---------------------------------------------------------------------------

describe('POST /api/users/config', () => {
    it('returns 401 when not authenticated', async () => {
        const res = await request(app).post('/api/users/config').send(metricPayload);
        expect(res.status).toBe(401);
    });

    describe('authenticated user — validation', () => {
        let userId: string;
        let cookie: string[];

        beforeAll(async () => {
            ({ userId, cookie } = await createAuthenticatedUser());
        });

        afterAll(async () => {
            await prisma.userConfig.deleteMany({ where: { userId } });
            await prisma.user.delete({ where: { id: userId } });
        });

        it('returns 400 when body is missing required fields', async () => {
            const res = await request(app).post('/api/users/config').set('Cookie', cookie).send({});
            expect(res.status).toBe(400);
        });

        it('returns 400 for invalid measurementSystem value', async () => {
            const res = await request(app)
                .post('/api/users/config')
                .set('Cookie', cookie)
                .send({ ...metricPayload, measurementSystem: 'stones' });
            expect(res.status).toBe(400);
        });

        it('returns 400 when age is below minimum (13)', async () => {
            const res = await request(app)
                .post('/api/users/config')
                .set('Cookie', cookie)
                .send({ ...metricPayload, age: 13 });
            expect(res.status).toBe(400);
        });

        it('returns 400 when calorieTarget is below minimum (1199)', async () => {
            const res = await request(app)
                .post('/api/users/config')
                .set('Cookie', cookie)
                .send({ ...metricPayload, calorieTarget: 1199 });
            expect(res.status).toBe(400);
        });
    });

    describe('authenticated user — metric happy path', () => {
        let userId: string;
        let cookie: string[];

        beforeAll(async () => {
            ({ userId, cookie } = await createAuthenticatedUser());
        });

        afterAll(async () => {
            await prisma.userConfig.deleteMany({ where: { userId } });
            await prisma.user.delete({ where: { id: userId } });
        });

        it('returns 201 with correct computed fields (metric, male)', async () => {
            // BMR = 10×70 + 6.25×175 - 5×30 + 5 = 1648.75 → 1649
            // calorieFloor = bmr = 1649
            // calorieCeiling = calorieTarget + 200 = 2200
            // proteinFloor = round(150 × 0.8) = 120
            // stepsFloor = round(10000 × 0.5) = 5000

            const res = await request(app)
                .post('/api/users/config')
                .set('Cookie', cookie)
                .send(metricPayload);

            expect(res.status).toBe(201);
            expect(res.body.userId).toBe(userId);
            expect(res.body.weightKg).toBeCloseTo(70, 2);
            expect(res.body.heightCm).toBeCloseTo(175, 2);
            expect(res.body.calorieFloor).toBe(1649);
            expect(res.body.calorieCeiling).toBe(2200);
            expect(res.body.proteinFloor).toBe(120);
            expect(res.body.stepsFloor).toBe(5000);
        });
    });

    describe('authenticated user — imperial conversion', () => {
        let userId: string;
        let cookie: string[];

        beforeAll(async () => {
            ({ userId, cookie } = await createAuthenticatedUser());
        });

        afterAll(async () => {
            await prisma.userConfig.deleteMany({ where: { userId } });
            await prisma.user.delete({ where: { id: userId } });
        });

        it('returns 201 and converts lbs/ft-in to kg/cm', async () => {
            // 154 lbs → ~69.853 kg
            // 5 ft 9 in → 5×30.48 + 9×2.54 = 152.4 + 22.86 = 175.26 cm

            const res = await request(app).post('/api/users/config').set('Cookie', cookie).send({
                measurementSystem: 'imperial',
                weightInput: 154, // lbs
                heightInputPrimary: 5, // feet
                heightInputSecondary: 9, // inches
                age: 30,
                sex: 'male',
                activityLevel: 'sedentary',
                goalType: 'lose',
                calorieTarget: 1800,
                proteinTarget: 130,
                stepsTarget: 8000,
            });

            expect(res.status).toBe(201);
            expect(res.body.weightKg).toBeCloseTo(69.853, 1);
            expect(res.body.heightCm).toBeCloseTo(175.26, 1);
        });
    });

    describe('authenticated user — female BMR', () => {
        let userId: string;
        let cookie: string[];

        beforeAll(async () => {
            ({ userId, cookie } = await createAuthenticatedUser());
        });

        afterAll(async () => {
            await prisma.userConfig.deleteMany({ where: { userId } });
            await prisma.user.delete({ where: { id: userId } });
        });

        it('applies female offset (-161) in BMR calculation', async () => {
            // Female BMR = 10×60 + 6.25×165 - 5×25 - 161 = 1345.25 → 1345
            const res = await request(app).post('/api/users/config').set('Cookie', cookie).send({
                measurementSystem: 'metric',
                weightInput: 60,
                heightInputPrimary: 165,
                age: 25,
                sex: 'female',
                activityLevel: 'lightly_active',
                goalType: 'maintain',
                calorieTarget: 1800,
                proteinTarget: 120,
                stepsTarget: 8000,
            });

            expect(res.status).toBe(201);
            expect(res.body.calorieFloor).toBe(1345);
        });
    });

    describe('authenticated user — duplicate config', () => {
        let userId: string;
        let cookie: string[];

        beforeAll(async () => {
            ({ userId, cookie } = await createAuthenticatedUser());
            // Create initial config
            await request(app).post('/api/users/config').set('Cookie', cookie).send(metricPayload);
        });

        afterAll(async () => {
            await prisma.userConfig.deleteMany({ where: { userId } });
            await prisma.user.delete({ where: { id: userId } });
        });

        it('returns 409 when config already exists (unique constraint)', async () => {
            const res = await request(app)
                .post('/api/users/config')
                .set('Cookie', cookie)
                .send(metricPayload);

            expect(res.status).toBe(409);
            expect(res.body.error).toBe('CONFLICT');
        });
    });
});
