import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginSchema } from "../schemas/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(data),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw err;
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate auth cache so AuthGuard sees the new session immediately
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      navigate("/");
    },
    onError: (err: { message?: string }) => {
      setFormError(err.message ?? "Invalid username or password");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const result = loginSchema.safeParse({ username, password });
    if (!result.success) {
      setFormError("Please enter your username and password");
      return;
    }

    mutation.mutate(result.data);
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Log In</h1>
      {formError && <p role="alert">{formError}</p>}
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoComplete="username"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
      />
      <button disabled={mutation.isPending} type="submit">
        {mutation.isPending ? "Logging in..." : "Log In"}
      </button>
      <p>
        <Link to="/forgot-password">Forgot your password?</Link>
      </p>
      <p>
        <Link to="/register">Don't have an account? Register</Link>
      </p>
    </form>
  );
}
