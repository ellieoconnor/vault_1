import { Router } from 'express';
import { Prisma } from '../generated/prisma/client.js';
import { prisma } from '../index.js';
import { requireAuth } from '../middleware/auth.js';
import { createCheatCodeSchema, updateCheatCodeSchema } from '../schemas/cheatCodeSchemas.js';
import { SortOrder } from '../generated/prisma/internal/prismaNamespace.js';

const router = Router();

// GET /api/cheat-codes returns user's codes ordered
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
        const count = await prisma.cheatCode.count({ where: { userId } });
        if (count >= 3) {
            return res.status(400).json({
                error: 'MAX_CHEAT_CODES',
                message: 'Maximum 3 Cheat Codes allowed',
            });
        }
        // Use MAX(sortOrder) + 1 - NOT count - to avoid duplicates after deletes
        const maxResult = await prisma.cheatCode.aggregate({
            where: { userId },
            _max: { sortOrder: true },
        });
        const nextSortOrder = (maxResult._max.sortOrder ?? -1) + 1;

        const code = await prisma.cheatCode.create({
            data: {
                userId,
                text: req.body.text,
                SortOrder: nextSortOrder,
            },
        });
        return res.status(201).json(code);
    } catch (err) {
        next(err);
    }
});
