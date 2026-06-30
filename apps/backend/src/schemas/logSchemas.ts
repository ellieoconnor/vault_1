import { z } from 'zod';

export const upsertLogSchema = z.object({
    logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'logDate must be YYYY-MM-DD'),
    calories: z.number().int().min(0).nullable().optional(),
    protein: z.number().int().min(0).nullable().optional(),
    steps: z.number().int().min(0).nullable().optional(),
    workoutDone: z.boolean().optional(),
    dayComplete: z.literal(true).optional(),
    mood: z
        .enum(['crushing-it', 'solid', 'powered-up', 'okay', 'scattered', 'drained', 'rough'])
        .nullable()
        .optional(),
});

export type UpsertLogInput = z.infer<typeof upsertLogSchema>;
