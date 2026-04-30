import { Router } from 'express';
import { prisma } from '../index.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createCheatCodeSchema, updateCheatCodeSchema } from '../schemas/cheatCodeSchemas.js';

const router = Router();

// GET /api/cheat-codes
router.get('/', requireAuth, async (req, res, next) => {
    try {
        const codes = await prisma.cheatCode.findMany({
            where: { userId: req.session.userId },
            orderBy: { sortOrder: 'asc' },
        });
        return res.json(codes);
    } catch (err) {
        next(err);
    }
});

// POST /api/cheat-codes
router.post('/', requireAuth, validateBody(createCheatCodeSchema), async (req, res, next) => {
    try {
        const userId = req.session.userId!;
        const code = await prisma.$transaction(async (tx) => {
            const count = await tx.cheatCode.count({ where: { userId } });
            if (count >= 3) return null;

            // Use MAX(sortOrder) + 1 - NOT count - to avoid collisions after deletes
            const maxResult = await tx.cheatCode.aggregate({
                where: { userId },
                _max: { sortOrder: true },
            });
            const nextSortOrder = (maxResult._max.sortOrder ?? -1) + 1;

            return tx.cheatCode.create({
                data: { userId, text: req.body.text, sortOrder: nextSortOrder },
            });
        });

        if (!code) {
            return res.status(400).json({
                error: 'MAX_CHEAT_CODES',
                message: 'Maximum 3 Cheat Codes allowed',
            });
        }
        return res.status(201).json(code);
    } catch (err) {
        next(err);
    }
});

// PATCH /api/cheat-codes/:id
router.patch('/:id', requireAuth, validateBody(updateCheatCodeSchema), async (req, res, next) => {
    try {
        const id = req.params.id as string;
        const userId = req.session.userId!;
        const updated = await prisma.$transaction(async (tx) => {
            const result = await tx.cheatCode.updateMany({
                where: { id, userId },
                data: { text: req.body.text },
            });
            if (result.count === 0) return null;
            return tx.cheatCode.findUnique({ where: { id } });
        });
        if (!updated) return res.status(404).json({ error: 'NOT_FOUND', message: 'Cheat Code not found' });
        return res.json(updated);
    } catch (err) {
        next(err);
    }
});

// DELETE /api/cheat-codes/:id
router.delete('/:id', requireAuth, async (req, res, next) => {
    try {
        const id = req.params.id as string;
        const userId = req.session.userId!;
        const result = await prisma.cheatCode.deleteMany({ where: { id, userId } });
        if (result.count === 0)
            return res.status(404).json({ error: 'NOT_FOUND', message: 'Cheat Code not found' });
        return res.status(204).send();
    } catch (err) {
        next(err);
    }
});

export default router;
