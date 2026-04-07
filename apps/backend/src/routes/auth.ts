import { prisma } from "../index.js";
import argon2 from "argon2";
import { validateBody } from "../middleware/validate.js";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../schemas/auth.js";
import { Router } from "express";
import crypto from "node:crypto";
import { sendPasswordResetEmail } from "../services/emailService.js";

const router = Router();

/**
 * Route to register a new user
 */
router.post(
  "/register",
  validateBody(registerSchema),
  async (req, res, next) => {
    try {
      const { username, email, password } = req.body;
      const existing = await prisma.user.findUnique({ where: { username } });

      if (existing) {
        return res.status(409).json({
          error: "USERNAME_TAKEN",
          message: "Username already taken",
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
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code: string }).code === "P2002"
      ) {
        return res.status(409).json({
          error: "USERNAME_TAKEN",
          message: "Username already taken",
          details: {},
        });
      }
      next(err);
    }
  },
);

/**
 * Route for user login
 */
router.post("/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({
        error: "INVALID_CREDENTIALS",
        message: "Invalid username or password",
        details: {},
      });
    }

    const validPassword = await argon2.verify(user.passwordHash, password);
    if (!validPassword) {
      return res.status(401).json({
        error: "INVALID_CREDENTIALS",
        message: "Invalid username or password",
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
 * Route for homepage?
 * todo: find out what this goes to
 */
router.get("/me", async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        error: "UNAUTHENTICATED",
        message: "Not authenticated",
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
        error: "UNAUTHENTICATED",
        message: "Not authenticated",
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
router.post(
  "/forgot-password",
  validateBody(forgotPasswordSchema),
  async (req, res, next) => {
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
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.create({
        data: { userId: user.id, token, expiresAt },
      });

      const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
      const resetUrl = `${clientOrigin}/reset-password/${token}`;

      await sendPasswordResetEmail(user.email, resetUrl);

      return res.status(200).json({
        message:
          "If an account with that username has an email on file, you'll receive a reset link shortly.",
      });
    } catch (err) {
      next(err);
    }
  },
);
export default router;
