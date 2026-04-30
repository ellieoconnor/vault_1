import { z } from 'zod';

const cheatCodeTextField = z.string().trim().min(1, 'Cheat Code cannot be blank').max(200);

// sortOrder is NOT accepted from the client - server assigns it
export const createCheatCodeSchema = z.object({ text: cheatCodeTextField });
export const updateCheatCodeSchema = z.object({ text: cheatCodeTextField });

export type CreateCheatCodeInput = z.infer<typeof createCheatCodeSchema>;
export type UpdateCheatCodeInput = z.infer<typeof updateCheatCodeSchema>;
