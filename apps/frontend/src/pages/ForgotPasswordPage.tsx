import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPasswordSchema } from "../schemas/auth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Check your email</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              If an account with that username has an email on file, you'll
              receive a reset link shortly.
            </p>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-center w-full">
              <Link to="/login">Back to login</Link>
            </p>
          </CardFooter>
        </Card>
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit}>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Reset your password</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your username and we'll send a reset link to the email on
              your account.
            </p>
            {formError && (
              <p role="alert" className="text-destructive text-sm mb-4">
                {formError}
              </p>
            )}
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Sending..." : "Send reset link"}
            </Button>
            <p className="text-sm text-center w-full">
              <Link to="/login">Back to login</Link>
            </p>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
