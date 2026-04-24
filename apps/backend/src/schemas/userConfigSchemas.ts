import { z } from 'zod';

export const setTargetsSchema = z.object({
    measurementSystem: z.enum(['metric', 'imperial']),
    // Biometrics — raw user input (may be imperial)
    weightInput:  z.number().positive(),
    heightInputPrimary:   z.number().positive(), // kg or feet
    heightInputSecondary: z.number().min(0).max(11).optional(), // inches (imperial only)
    age:          z.number().int().min(13).max(120),
    sex:          z.enum(['male', 'female']),
    activityLevel: z.enum([
        'sedentary',
        'lightly_active',
        'moderately_active',
        'very_active',
        'extra_active',
    ]),
    goalType:     z.enum(['lose', 'maintain', 'build']),
    calorieTarget: z.number().int().min(1400),
    proteinTarget: z.number().int().positive(),
    stepsTarget:   z.number().int().positive(),
});

export type SetTargetsInput = z.infer<typeof setTargetsSchema>;
