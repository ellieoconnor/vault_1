import { prisma } from '../index.js';
import argon2 from 'argon2';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import {
    forgotPasswordSchema,
    loginSchema,
    registerSchema,
    resetPasswordSchema,
} from '../schemas/auth.js';
import { Router, Request } from 'express';
import crypto from 'node:crypto';
import { sendPasswordResetEmail } from '../services/emailService.js';

const router = Router();

/**
 * Route to register a new user
 */
router.post('/register', validateBody(registerSchema), async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        const existing = await prisma.user.findUnique({ where: { username } });

        if (existing) {
            return res.status(409).json({
                error: 'USERNAME_TAKEN',
                message: 'Username already taken',
                details: {},
            });
        }

        const passwordHash = await argon2.hash(password);
        const user = await prisma.user.create({
            data: { username, email: email ?? null, passwordHash },
        });

        req.session.userId = user.id;
        req.session.save((saveErr) => {
            if (saveErr) return next(saveErr);
            res.status(201).json({ id: user.id, username: user.username });
        });
    } catch (err: unknown) {
        // Handle concurrent registration race condition: if two requests slip past
        // the findUnique check simultaneously, Prisma throws P2002 (unique constraint).
        if (
            typeof err === 'object' &&
            err !== null &&
            'code' in err &&
            (err as { code: string }).code === 'P2002'
        ) {
            return res.status(409).json({
                error: 'USERNAME_TAKEN',
                message: 'Username already taken',
                details: {},
            });
        }
        next(err);
    }
});

/**
 * Route for user login
 */
router.post('/login', validateBody(loginSchema), async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
            return res.status(401).json({
                error: 'INVALID_CREDENTIALS',
                message: 'Invalid username or password',
                details: {},
            });
        }

        const validPassword = await argon2.verify(user.passwordHash, password);
        if (!validPassword) {
            return res.status(401).json({
                error: 'INVALID_CREDENTIALS',
                message: 'Invalid username or password',
                details: {},
            });
        }

        req.session.userId = user.id;
        req.session.save((saveErr) => {
            if (saveErr) return next(saveErr);
            res.status(200).json({ id: user.id, username: user.username });
        });
    } catch (err) {
        next(err);
    }
});

/**
 * Route to check current session — returns the authenticated user or 401
 */
router.get('/me', async (req, res, next) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({
                error: 'UNAUTHENTICATED',
                message: 'Not authenticated',
                details: {},
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.session.userId },
            select: { id: true, username: true },
        });

        if (!user) {
            req.session.destroy(() => {});
            return res.status(401).json({
                error: 'UNAUTHENTICATED',
                message: 'Not authenticated',
                details: {},
            });
        }
        res.status(200).json(user);
    } catch (err) {
        next(err);
    }
});

/**
 * Route to forgot password
 * find by username → if user exists AND has email on file, generate secure token
 * create PasswordResetToken in DB (1 hr expiry)
 * Send reset email via emailService
 */
router.post('/forgot-password', validateBody(forgotPasswordSchema), async (req, res, next) => {
    try {
        const { username } = req.body;
        const user = await prisma.user.findUnique({ where: { username } });
        // Always return 200 - never reveal whether user/email exists
        if (!user || !user.email) {
            return res.status(200).json({
                message:
                    "If an account with that username has an email on file, you'll receive a reset link shortly.",
            });
        }

        // Clean up expired tokens for this user
        await prisma.passwordResetToken.deleteMany({
            where: { userId: user.id, expiresAt: { lt: new Date() } },
        });

        // Generate token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await prisma.passwordResetToken.create({
            data: { userId: user.id, token, expiresAt },
        });

        const clientOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';
        const resetUrl = `${clientOrigin}/reset-password/${token}`;

        await sendPasswordResetEmail(user.email, resetUrl);

        return res.status(200).json({
            message:
                "If an account with that username has an email on file, you'll receive a reset link shortly.",
        });
    } catch (err) {
        next(err);
    }
});

/**
 * Route to GET password reset
 * Validate token exists, isn't expired, and not used
 * Return 200 (valid) or 400 with specific error code
 */
router.get('/reset-password/:token', async (req, res, next) => {
    try {
        const { token } = req.params;
        const record = await prisma.passwordResetToken.findUnique({
            where: { token },
        });

        if (!record) {
            return res.status(400).json({
                error: 'TOKEN_NOT_FOUND',
                message: 'This reset link is invalid.',
                details: {},
            });
        }

        if (record.usedAt) {
            return res.status(400).json({
                error: 'TOKEN_ALREADY_USED',
                message: 'This link has already been used.',
                details: {},
            });
        }

        if (record.expiresAt < new Date()) {
            return res.status(400).json({
                error: 'TOKEN_EXPIRED',
                message: 'This link has expired — request a new one.',
                details: {},
            });
        }

        return res.status(200).json({ valid: true });
    } catch (err) {
        next(err);
    }
});

/**
 * Route to POST that an forgot password token was used
 * Validate token, hash new password with Argon2
 * Update User.passwordHash
 * Mark token as usedAt = now,
 * create new session (req.session.userId = user.id + req.session.save())
 * return 200 with user
 */
router.post(
    '/reset-password/:token',
    validateBody(resetPasswordSchema),
    async (req: Request<{ token: string }>, res, next) => {
        try {
            // 1. get data from the request (params, body, etc.)
            const { token } = req.params;
            const { password } = req.body;
            // 2. do the work (DB queries, logic)
            const record = await prisma.passwordResetToken.findUnique({
                where: { token },
                include: { user: true },
            });
            // 3. send a response
            if (!record) {
                return res.status(400).json({
                    error: 'TOKEN_NOT_FOUND',
                    message: 'This reset link is invalid.',
                    details: {},
                });
            }

            if (record.usedAt) {
                return res.status(400).json({
                    error: 'TOKEN_ALREADY_USED',
                    message: 'This link has already been used.',
                    details: {},
                });
            }

            if (record.expiresAt < new Date()) {
                return res.status(400).json({
                    error: 'TOKEN_EXPIRED',
                    message: 'This link has expired — request a new one.',
                    details: {},
                });
            }

            // Hash new password and update user in a transaction
            const passwordHash = await argon2.hash(password);
            await prisma.$transaction([
                prisma.user.update({
                    where: { id: record.userId },
                    data: { passwordHash },
                }),
                prisma.passwordResetToken.update({
                    where: { id: record.id },
                    data: { usedAt: new Date() },
                }),
            ]);

            // Invalidate the old session before creating a new one
            req.session.regenerate((regenErr) => {
                if (regenErr) return next(regenErr);
                req.session.userId = record.userId;
                req.session.save((saveErr) => {
                    if (saveErr) return next(saveErr);
                    res.status(200).json({ id: record.user.id, username: record.user.username });
                });
            });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * POST to logout
 */
router.post('/logout', requireAuth, (req, res, next) => {
    req.session.destroy((err) => {
        if (err) return next(err);
        //Clear the session cookie on the client
        res.clearCookie('connect.sid'); // default express-session cookie name
        return res.status(200).json({ message: 'Logged out' });
    });
});

export default router;
