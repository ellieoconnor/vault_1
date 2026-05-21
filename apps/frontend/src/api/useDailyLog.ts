import type { DailyLog, UpsertLogInput } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL;

export function useTodayLog() {
    return useQuery({
        queryKey: ['log', 'today'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/daily-logs/today`, {
                credentials: 'include',
            });
            if (!res.ok) throw await res.json();
            return res.json() as Promise<DailyLog | null>;
        },
    });
}

export function useUpsertLog() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: UpsertLogInput) => {
            const res = await fetch(`${API_URL}/api/daily-logs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data),
            });
            if (!res.ok) throw await res.json();
            return res.json() as Promise<DailyLog>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['log', 'today'] });
        },
    });
}
