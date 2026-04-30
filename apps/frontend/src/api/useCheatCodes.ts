import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL;

export interface CheatCode {
    id: string;
    userId: string;
    text: string;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}

export function useCheatCodes() {
    return useQuery<CheatCode[]>({
        queryKey: ['cheatCodes'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/cheat-codes`, {
                credentials: 'include',
            });
            if (!res.ok) throw await res.json();
            return res.json();
        },
    });
}

export function useCreateCheatCode() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (text: string) => {
            const res = await fetch(`${API_URL}/api/cheat-codes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ text }),
            });
            if (!res.ok) throw await res.json();
            return res.json() as Promise<CheatCode>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cheatCodes'] });
        },
    });
}

export function useUpdateCheatCode() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, text }: { id: string; text: string }) => {
            const res = await fetch(`${API_URL}/api/cheat-codes/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ text }),
            });
            if (!res.ok) throw await res.json();
            return res.json() as Promise<CheatCode>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cheatCodes'] });
        },
    });
}

export function useDeleteCheatCode() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`${API_URL}/api/cheat-codes/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (!res.ok) throw await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cheatCodes'] });
        },
    });
}
