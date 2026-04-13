import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPasswordSchema } from "../schemas/auth";

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: async (data: { username: string }) => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/forgot-password`,
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
    onSuccess: () => setSubmitted(true),
    onError: (err: { message?: string }) => {
      setFormError(err.message ?? "Something went wrong. Please try again.");
    },
  });

  if (submitted) {
    return (
      <div>
        <h1>Check your email</h1>
        <p>
          If an account with that username has an email on file, you'll receive
          a reset link shortly.
        </p>
        <p>
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const result = forgotPasswordSchema.safeParse({ username });
    if (!result.success) {
      setFormError("Please enter your username");
      return;
    }
    mutation.mutate(result.data);
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Reset your password</h1>
      <p>
        Enter your username and we'll send a reset link to the email on your
        account.
      </p>
      {formError && <p role="alert">{formError}</p>}
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoComplete="username"
      />
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Sending..." : "Send reset link"}
      </button>
      <p>
        <Link to="/login">Back to login</Link>
      </p>
    </form>
  );
}
