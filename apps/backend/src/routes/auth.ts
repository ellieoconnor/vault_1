import { prisma } from "../index.js";
import argon2 from "argon2";
import { validateBody } from "../middleware/validate.js";
import { registerSchema } from "../schemas/auth.js";
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
      res.status(201).json({ id: user.id, username: user.username });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
