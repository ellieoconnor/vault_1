import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { registerSchema } from "../schemas/auth";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string[];
    password?: string[];
  }>({});

  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/register`,
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
    onSuccess: () => navigate("/onboarding"),
    onError: (err: { error: string }) => {
      if (err.error === "USERNAME_TAKEN") {
        setFieldErrors({ username: ["Username already taken"] });
      }
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = registerSchema.safeParse({ username, password });
    if (!result.success) {
      const validationErrors = z.flattenError(result.error).fieldErrors;
      setFieldErrors(validationErrors);
      return;
    }

    mutation.mutate({ username, password }); // calls mutationFn in the useMutation
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Username
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </label>
      {fieldErrors.username?.[0] && <span>{fieldErrors.username?.[0]}</span>}

      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {fieldErrors.password?.[0] && <span>{fieldErrors.password?.[0]}</span>}
      <button type="submit">Register</button>
    </form>
  );
}
