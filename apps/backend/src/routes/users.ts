import { Router } from 'express';
import { Prisma } from '../generated/prisma/client.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { setTargetsSchema } from '../schemas/userConfigSchemas.js';
import { prisma } from '../index.js';

const router = Router();

// GET /api/users/config — returns current config or 404
router.get('/config', requireAuth, async (req, res, next) => {
    try {
        const config = await prisma.userConfig.findUnique({
            where: { userId: req.session.userId },
        });
        if (!config) {
            return res.status(404).json({ error: 'NOT_FOUND', message: 'No config set' });
        }
        return res.json(config);
    } catch (err) {
        next(err);
    }
});

// POST /api/users/config — create config (onboarding only; Story 2.7 handles updates via PATCH)
router.post('/config', requireAuth, validateBody(setTargetsSchema), async (req, res, next) => {
    try {
        const {
            measurementSystem,
            weightInput,
            heightInputPrimary,
            heightInputSecondary,
            age,
            sex,
            activityLevel,
            goalType,
            calorieTarget,
            proteinTarget,
            stepsTarget,
        } = req.body;

        // Convert to metric (canonical representation)
        const weightKg = measurementSystem === 'imperial' ? weightInput * 0.453592 : weightInput;

        const heightCm =
            measurementSystem === 'imperial'
                ? heightInputPrimary * 30.48 + (heightInputSecondary ?? 0) * 2.54
                : heightInputPrimary;

        // BMR via Mifflin-St Jeor
        const bmrBase = 10 * weightKg + 6.25 * heightCm - 5 * age;
        const bmr = Math.round(sex === 'male' ? bmrBase + 5 : bmrBase - 161);

        // Floor / ceiling derivation
        const calorieFloor = bmr;
        const calorieCeiling = calorieTarget + 200;
        const proteinFloor = Math.round(proteinTarget * 0.8);
        const stepsFloor = Math.round(stepsTarget * 0.5);

        const config = await prisma.userConfig.create({
            data: {
                userId: req.session.userId!,
                measurementSystem,
                weightKg,
                heightCm,
                age,
                sex,
                activityLevel,
                goalType,
                calorieTarget,
                calorieFloor,
                calorieCeiling,
                proteinTarget,
                proteinFloor,
                stepsTarget,
                stepsFloor,
            },
        });

        return res.status(201).json(config);
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
            return res.status(409).json({ error: 'CONFLICT', message: 'Config already exists' });
        }
        next(err);
    }
});

export default router;
