import { z } from 'zod';

export const step1Schema = z
    .object({
        measurementSystem: z.enum(['metric', 'imperial']),
        weightInput: z.coerce.number().positive('Weight is required'),
        heightInputPrimary: z.coerce.number().positive('Height is required'),
        heightInputSecondary: z.string().optional(),
        age: z.coerce
            .number()
            .int()
            .min(13, 'Must be at least 13')
            .max(120, 'Must be 120 or under'),
        sex: z.enum(['male', 'female'], { message: 'Please select a biological sex' }),
        activityLevel: z.enum(
            ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'],
            { message: 'Please select an activity level' }
        ),
    })
    .superRefine((data, ctx) => {
        if (data.measurementSystem === 'imperial') {
            const inches = Number(data.heightInputSecondary);
            if (
                data.heightInputSecondary === '' ||
                data.heightInputSecondary === undefined ||
                inches < 0 ||
                inches > 11
            ) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Inches must be between 0 and 11',
                    path: ['heightInputSecondary'],
                });
            }
        }
    });

export type Step1Data = z.infer<typeof step1Schema>;

export const step2Schema = z.object({
    goalType: z.enum(['lose', 'maintain', 'build'], { message: 'Please select a goal type' }),
});

export type Step2Data = z.infer<typeof step2Schema>;

export const step3Schema = z.object({
    calorieTarget: z.coerce.number().int().min(1200, 'Minimum calorie target is 1,200 cal'),
    proteinTarget: z.coerce.number().int().positive('Protein target is required'),
    stepsTarget: z.coerce.number().int().positive('Steps target is required'),
});

export type Step3Data = z.infer<typeof step3Schema>;
