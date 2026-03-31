import { useQuery } from "@tanstack/react-query";

async function fetchMe() {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
    credentials: "include",
  });
  if (!res.ok) {
    return null;
  }
  return res.json() as Promise<{ id: string; username: string }>;
}

export function useAuth() {
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
  return { user: user ?? null, isLoading, isError, isAuthenticated: !!user };
}
