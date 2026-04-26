import { z } from 'zod';

export const createCheatCodeSchema = z.object({
    text: z.string().min(1, 'Cheat Code cannot be blank').max(200),
    // sortOrder is NOT accepted from the client - server assigns it
});

export const updateCheatCodeSchema = z.object({
    text: z.string().min(1, 'Cheat Code cannot be blank').max(200),
});

export type CreateCheatCodeInput = z.infer<typeof createCheatCodeSchema>;
export type UpdateCheatCodeInput = z.infer<typeof updateCheatCodeSchema>;
