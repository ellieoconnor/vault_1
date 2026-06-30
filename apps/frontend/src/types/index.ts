export interface DailyLog {
    id: string;
    userId: string;
    logDate: string; // "YYYY-MM-DD"
    calories: number | null;
    protein: number | null;
    steps: number | null;
    workoutDone: boolean;
    dayComplete: boolean;
    mood: string | null;
    roughDay: boolean | null;
    createdAt: string;
    updatedAt: string;
}

export interface UpsertLogInput {
    logDate: string;
    calories?: number | null;
    protein?: number | null;
    steps?: number | null;
    workoutDone?: boolean;
    dayComplete?: boolean;
    mood?: string | null;
}
