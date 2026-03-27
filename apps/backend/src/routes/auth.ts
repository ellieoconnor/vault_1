import { prisma } from "../index.js";
import argon2 from "argon2";
import { validateBody } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../schemas/auth.js";
import { Router } from "express";

const router = Router();

router.post(
  "/register",
  validateBody(registerSchema),
  async (req, res, next) => {
    try {
      const { username, password } = req.body;
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
        data: { username, passwordHash },
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

export default router;
