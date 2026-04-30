import { z } from 'zod';

export const registerSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters').max(30),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password must be at most 128 characters'),
    email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
});

export const loginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
    username: z.string().min(1, 'Username is required'),
});

export const resetPasswordSchema = z
    .object({
        password: z.string().min(8, 'Password must be at least 8 characters'),
        confirmPassword: z.string().min(1, 'Please confirm your password'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });
