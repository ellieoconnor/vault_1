import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

async function fetchMe() {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
        credentials: 'include',
    });
    if (!res.ok) {
        return null;
    }
    return res.json() as Promise<{ id: string; username: string }>;
}

export function useAuth() {
    const {
        data: user,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['auth', 'me'],
        queryFn: fetchMe,
        retry: false,
        staleTime: 5 * 60 * 1000,
    });
    return { user: user ?? null, isLoading, isError, isAuthenticated: !!user };
}

export function useLogout() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            });
            if (!res.ok) {
                const err = await res.json();
                throw err;
            }
            return res.json();
        },
        onSuccess: () => {
            // Clear the auth cache - AuthGuard will see isAuthenticated: false and redirect to /login
            queryClient.removeQueries({ queryKey: ['auth', 'me'] });
            navigate('/login');
        },
        onError: () => {
            // Force clear local auth state even if the server request failed,
            // so the user is not stuck in a logged-in UI state
            queryClient.removeQueries({ queryKey: ['auth', 'me'] });
            navigate('/login');
        },
    });
}
