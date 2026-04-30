/**
 * Integration tests: Cheat Code routes
 *
 * Tests GET/POST/PATCH/DELETE /api/cheat-codes.
 * Uses supertest against the real Express app + Neon test DB.
 *
 * Run:
 *   cd apps/backend && npx vitest run tests/api/cheat-codes.test.ts
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

// ---------------------------------------------------------------------------
// GET /api/cheat-codes
// ---------------------------------------------------------------------------

describe('GET /api/cheat-codes', () => {
    it('returns 401 when not authenticated', async () => {
        const res = await request(app).get('/api/cheat-codes');
        expect(res.status).toBe(401);
    });

    describe('authenticated user', () => {
        let userId: string;
        let cookie: string[];

        beforeAll(async () => {
            ({ userId, cookie } = await createAuthenticatedUser());
        });

        afterAll(async () => {
            await prisma.cheatCode.deleteMany({ where: { userId } });
            await prisma.user.delete({ where: { id: userId } });
        });

        it('returns empty array for a new user', async () => {
            const res = await request(app).get('/api/cheat-codes').set('Cookie', cookie);

            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });
    });
});

// ---------------------------------------------------------------------------
// POST /api/cheat-codes
// ---------------------------------------------------------------------------

describe('POST /api/cheat-codes', () => {
    it('returns 401 when not authenticated', async () => {
        const res = await request(app).post('/api/cheat-codes').send({ text: 'Focus' });
        expect(res.status).toBe(401);
    });

    describe('authenticated user — create', () => {
        let userId: string;
        let cookie: string[];

        beforeAll(async () => {
            ({ userId, cookie } = await createAuthenticatedUser());
        });

        afterAll(async () => {
            await prisma.cheatCode.deleteMany({ where: { userId } });
            await prisma.user.delete({ where: { id: userId } });
        });

        it('returns 201 and creates a cheat code', async () => {
            const res = await request(app)
                .post('/api/cheat-codes')
                .set('Cookie', cookie)
                .send({ text: 'Focus on what matters' });

            expect(res.status).toBe(201);
            expect(res.body.text).toBe('Focus on what matters');
            expect(res.body.userId).toBe(userId);
            expect(res.body.sortOrder).toBe(0);
            expect(res.body.id).toBeDefined();
        });

        it('returns 400 when text is empty', async () => {
            const res = await request(app)
                .post('/api/cheat-codes')
                .set('Cookie', cookie)
                .send({ text: '' });

            expect(res.status).toBe(400);
        });

    });

    describe('authenticated user — max 3 enforcement', () => {
        let userId: string;
        let cookie: string[];

        beforeAll(async () => {
            ({ userId, cookie } = await createAuthenticatedUser());
            // Seed 3 codes
            await request(app).post('/api/cheat-codes').set('Cookie', cookie).send({ text: 'Code 1' });
            await request(app).post('/api/cheat-codes').set('Cookie', cookie).send({ text: 'Code 2' });
            await request(app).post('/api/cheat-codes').set('Cookie', cookie).send({ text: 'Code 3' });
        });

        afterAll(async () => {
            await prisma.cheatCode.deleteMany({ where: { userId } });
            await prisma.user.delete({ where: { id: userId } });
        });

        it('returns 400 MAX_CHEAT_CODES when 3 already exist', async () => {
            const res = await request(app)
                .post('/api/cheat-codes')
                .set('Cookie', cookie)
                .send({ text: 'Code 4' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('MAX_CHEAT_CODES');
        });
    });
});

// ---------------------------------------------------------------------------
// PATCH /api/cheat-codes/:id
// ---------------------------------------------------------------------------

describe('PATCH /api/cheat-codes/:id', () => {
    it('returns 401 when not authenticated', async () => {
        const res = await request(app).patch('/api/cheat-codes/some-id').send({ text: 'Updated' });
        expect(res.status).toBe(401);
    });

    describe('authenticated user — update', () => {
        let userId: string;
        let cookie: string[];
        let codeId: string;

        beforeAll(async () => {
            ({ userId, cookie } = await createAuthenticatedUser());
            const createRes = await request(app)
                .post('/api/cheat-codes')
                .set('Cookie', cookie)
                .send({ text: 'Original text' });
            codeId = createRes.body.id;
        });

        afterAll(async () => {
            await prisma.cheatCode.deleteMany({ where: { userId } });
            await prisma.user.delete({ where: { id: userId } });
        });

        it('returns 200 and updates the text', async () => {
            const res = await request(app)
                .patch(`/api/cheat-codes/${codeId}`)
                .set('Cookie', cookie)
                .send({ text: 'Updated text' });

            expect(res.status).toBe(200);
            expect(res.body.text).toBe('Updated text');
            expect(res.body.id).toBe(codeId);
        });

        it('returns 400 when update text is empty', async () => {
            const res = await request(app)
                .patch(`/api/cheat-codes/${codeId}`)
                .set('Cookie', cookie)
                .send({ text: '' });

            expect(res.status).toBe(400);
        });
    });

    describe('authenticated user — ownership check', () => {
        let userId: string;
        let cookie: string[];
        let otherUserId: string;
        let otherCookie: string[];
        let otherCodeId: string;

        beforeAll(async () => {
            ({ userId, cookie } = await createAuthenticatedUser());
            ({ userId: otherUserId, cookie: otherCookie } = await createAuthenticatedUser());

            const createRes = await request(app)
                .post('/api/cheat-codes')
                .set('Cookie', otherCookie)
                .send({ text: "Other user's code" });
            otherCodeId = createRes.body.id;
        });

        afterAll(async () => {
            await prisma.cheatCode.deleteMany({ where: { userId: otherUserId } });
            await prisma.user.delete({ where: { id: otherUserId } });
            await prisma.user.delete({ where: { id: userId } });
        });

        it("returns 404 when patching another user's code", async () => {
            const res = await request(app)
                .patch(`/api/cheat-codes/${otherCodeId}`)
                .set('Cookie', cookie)
                .send({ text: 'Hijacked' });

            expect(res.status).toBe(404);
            expect(res.body.error).toBe('NOT_FOUND');
        });
    });
});

// ---------------------------------------------------------------------------
// DELETE /api/cheat-codes/:id
// ---------------------------------------------------------------------------

describe('DELETE /api/cheat-codes/:id', () => {
    it('returns 401 when not authenticated', async () => {
        const res = await request(app).delete('/api/cheat-codes/some-id');
        expect(res.status).toBe(401);
    });

    describe('authenticated user — delete', () => {
        let userId: string;
        let cookie: string[];
        let codeId: string;

        beforeAll(async () => {
            ({ userId, cookie } = await createAuthenticatedUser());
            const createRes = await request(app)
                .post('/api/cheat-codes')
                .set('Cookie', cookie)
                .send({ text: 'To be deleted' });
            codeId = createRes.body.id;
        });

        afterAll(async () => {
            await prisma.cheatCode.deleteMany({ where: { userId } });
            await prisma.user.delete({ where: { id: userId } });
        });

        it('returns 204 and removes the code', async () => {
            const res = await request(app)
                .delete(`/api/cheat-codes/${codeId}`)
                .set('Cookie', cookie);

            expect(res.status).toBe(204);

            // Confirm it's gone
            const getRes = await request(app).get('/api/cheat-codes').set('Cookie', cookie);
            expect(getRes.body.find((c: { id: string }) => c.id === codeId)).toBeUndefined();
        });
    });

    describe('authenticated user — ownership check', () => {
        let userId: string;
        let cookie: string[];
        let otherUserId: string;
        let otherCookie: string[];
        let otherCodeId: string;

        beforeAll(async () => {
            ({ userId, cookie } = await createAuthenticatedUser());
            ({ userId: otherUserId, cookie: otherCookie } = await createAuthenticatedUser());

            const createRes = await request(app)
                .post('/api/cheat-codes')
                .set('Cookie', otherCookie)
                .send({ text: "Other user's code" });
            otherCodeId = createRes.body.id;
        });

        afterAll(async () => {
            await prisma.cheatCode.deleteMany({ where: { userId: otherUserId } });
            await prisma.user.delete({ where: { id: otherUserId } });
            await prisma.user.delete({ where: { id: userId } });
        });

        it("returns 404 when deleting another user's code", async () => {
            const res = await request(app)
                .delete(`/api/cheat-codes/${otherCodeId}`)
                .set('Cookie', cookie);

            expect(res.status).toBe(404);
            expect(res.body.error).toBe('NOT_FOUND');
        });
    });
});
