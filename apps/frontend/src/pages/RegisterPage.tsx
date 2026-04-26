import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { registerSchema } from "../schemas/auth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string[];
    email?: string[];
    password?: string[];
  }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: async (data: {
      username: string;
      email?: string;
      password: string;
    }) => {
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
      } else {
        setGeneralError("Something went wrong");
      }
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = registerSchema.safeParse({
      username,
      email: email || undefined,
      password,
    });
    if (!result.success) {
      const validationErrors = z.flattenError(result.error).fieldErrors;
      setFieldErrors(validationErrors);
      return;
    }

    mutation.mutate({ username, email: email || undefined, password }); // calls mutationFn in the useMutation
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit}>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Create account</CardTitle>
          </CardHeader>
          <CardContent>
            {generalError && (
              <span role="alert" className="text-destructive text-sm">
                {generalError}
              </span>
            )}
            <div className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="username" className="text-sm font-medium">
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  autoComplete="username"
                />
                {fieldErrors.username?.[0] && (
                  <span
                    role="alert"
                    className="text-destructive text-sm mt-1 block"
                  >
                    {fieldErrors.username?.[0]}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-medium">
                  Email{" "}
                  <span className="font-normal text-sm text-muted-foreground">
                    (optional — needed for password reset)
                  </span>
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  autoComplete="email"
                />
                {fieldErrors.email?.[0] && (
                  <span className="text-destructive text-sm mt-1 block">
                    {fieldErrors.email?.[0]}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="new-password"
                />
                {fieldErrors.password?.[0] && (
                  <span className="text-destructive text-sm mt-1 block">
                    {fieldErrors.password?.[0]}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={mutation.isPending}
            >
              Register
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
