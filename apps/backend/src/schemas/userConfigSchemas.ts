import { z } from 'zod';

export const setTargetsSchema = z.object({
    calorieTarget: z.number().int().positive(),
    proteinTarget: z.number().int().positive(),
    stepsTarget: z.number().int().positive(),
});

export type SetTargetsInput = z.infer<typeof setTargetsSchema>;
