import { Router } from 'express';
import { prisma } from '../index.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { upsertLogSchema } from '../schemas/logSchemas.js';

const router = Router();

// GET /today
/* 
1. Who is asking? Get the user's ID from the session
2. What's today's date?
3. Look in the database for a log row where userId = this user AND logDate = today
4. Send back whatever we found - could be a log object, could be null (no log yet). Both are fine
*/
router.get('/today', requireAuth, async (req, res, next) => {
    try {
        const userId = req.session.userId!;
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
        const userId = req.session.userId!;
        const { logDate, calories, protein, steps, workoutDone, dayComplete, mood } = req.body;
        // convert logDate string into a Date object
        const logDateObj = new Date(logDate);

        // roughDay is computed server-side
        // Pre-Epic 3: no active goals exist, so roughDay is always false when day completes.
        // Epic 3 will replace this with: (goals met today) / (total active goals) < 0.5
        const roughDay = dayComplete === true ? false : undefined;

        const log = await prisma.dailyLog.upsert({
            where: { userId_logDate: { userId, logDate: logDateObj } },
            create: {
                userId: userId,
                logDate: logDateObj,
                calories: calories,
                protein: protein,
                steps: steps,
                workoutDone: workoutDone,
                dayComplete: dayComplete,
                mood: mood,
                ...(roughDay !== undefined && { roughDay }),
            },
            update: {
                calories: calories,
                protein: protein,
                steps: steps,
                workoutDone: workoutDone,
                dayComplete: dayComplete,
                mood: mood,
                ...(roughDay !== undefined && { roughDay }),
            },
        });
        return res.json(log);
    } catch (err) {
        next(err);
    }
});

export default router;
