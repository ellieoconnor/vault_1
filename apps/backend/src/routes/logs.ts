import { Router } from 'express';
import { prisma } from '../index.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { upsertLogSchema } from '../schemas/logSchemas.js';

const router = Router();

router.get('/today', requireAuth, async (req, res, next) => {
    try {
        const userId = req.session.userId;
        if (!userId) return next(new Error('Unauthorized'));
        const logDate = new Date(new Date().toISOString().split('T')[0]);
        const log = await prisma.dailyLog.findUnique({
            where: { userId_logDate: { userId, logDate } },
        });
        return res.json(log);
    } catch (err) {
        next(err);
    }
});

// `POST /` — upsert log for the given `logDate` (upsert by `userId` + `logDate`)
router.post('/', requireAuth, validateBody(upsertLogSchema), async (req, res, next) => {
    try {
        const userId = req.session.userId;
        if (!userId) return next(new Error('Unauthorized'));
        const { logDate, calories, protein, steps, workoutDone, dayComplete, mood } = req.body;
        const logDateObj = new Date(logDate);

        // Pre-Epic 3: no active goals exist, so roughDay is always false when day completes.
        // Epic 3 will replace this with: (goals met today) / (total active goals) < 0.5
        const roughDay = dayComplete === true ? false : undefined;

        const data = { calories, protein, steps, workoutDone, dayComplete, mood, ...(roughDay !== undefined && { roughDay }) };
        const log = await prisma.dailyLog.upsert({
            where: { userId_logDate: { userId, logDate: logDateObj } },
            create: { userId, logDate: logDateObj, ...data },
            update: data,
        });
        return res.json(log);
    } catch (err) {
        next(err);
    }
});

export default router;
