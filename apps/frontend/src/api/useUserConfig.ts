import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL;

export interface UserConfig {
    id:               string;
    userId:           string;
    measurementSystem: 'metric' | 'imperial';
    weightKg:         number;
    heightCm:         number;
    age:              number;
    sex:              'male' | 'female';
    activityLevel:    string;
    goalType:         'lose' | 'maintain' | 'build';
    calorieTarget:    number;
    calorieFloor:     number;
    calorieCeiling:   number;
    proteinTarget:    number;
    proteinFloor:     number;
    stepsTarget:      number;
    stepsFloor:       number;
    createdAt:        string;
    updatedAt:        string;
}

export interface SetTargetsInput {
    measurementSystem:     'metric' | 'imperial';
    weightInput:           number;
    heightInputPrimary:    number;
    heightInputSecondary?: number;
    age:                   number;
    sex:                   'male' | 'female';
    activityLevel:         string;
    goalType:              'lose' | 'maintain' | 'build';
    calorieTarget:         number;
    proteinTarget:         number;
    stepsTarget:           number;
}

export function useUserConfig() {
    return useQuery<UserConfig | null>({
        queryKey: ['userConfig'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/users/config`, {
                credentials: 'include',
            });
            if (res.status === 404) return null;
            if (!res.ok) throw await res.json();
            return res.json();
        },
    });
}

export function useSetUserConfig() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: SetTargetsInput) => {
            const res = await fetch(`${API_URL}/api/users/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(input),
            });
            if (!res.ok) throw await res.json();
            return res.json() as Promise<UserConfig>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userConfig'] });
        },
    });
}
