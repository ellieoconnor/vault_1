import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { resetPasswordSchema } from "../schemas/auth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// read the token from the URL
// React router hook `useParams` to grab the :token part from the URL path
// Ask backend is this token still valid (on page load)
// GET /api/auth/reset-password/:token call
// Handle form submission
// when user types new password and hits submit, call POST /api/auth/reset-password/:token
const API = import.meta.env.VITE_API_URL;

async function validateToken(token: string) {
  const res = await fetch(`${API}/api/auth/reset-password/${token}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json();
    throw err;
  }
  return res.json();
}

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Validate token on mount - shows appropriate error if expired/used
  const { isLoading, isError, error } = useQuery({
    queryKey: ["reset-token", token],
    queryFn: () => validateToken(token!),
    retry: false,
    enabled: !!token,
  });

  const mutation = useMutation({
    mutationFn: async (data: { password: string }) => {
      const res = await fetch(`${API}/api/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: data.password }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw err;
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate auth cache - user is now logged in after reset
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      navigate("/");
    },
    onError: (err: { message?: string }) => {
      setFormError(
        err.message ?? "Something went wrong. Please request a new reset link.",
      );
    },
  });

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent>
            <p>Invalid reset link.</p>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-center w-full">
              <Link to="/forgot-password">Request a new reset link</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent>
            <p>Validating reset link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    const errObj = error as { error?: string; message?: string };
    const msg =
      errObj?.error === "TOKEN_EXPIRED"
        ? "This link has expired — request a new one."
        : errObj?.error === "TOKEN_ALREADY_USED"
          ? "This link has already been used."
          : "This reset link is invalid.";
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Link unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <p role="alert" className="text-destructive text-sm">
              {msg}
            </p>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-center w-full">
              <Link to="/forgot-password">Request a new reset link</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const result = resetPasswordSchema.safeParse({ password, confirmPassword });

    if (!result.success) {
      setFormError(result.error.issues[0].message ?? "Invalid password");
      return;
    }
    mutation.mutate({ password: result.data.password });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit}>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Set a new password</CardTitle>
          </CardHeader>
          <CardContent>
            {formError && (
              <p role="alert" className="text-destructive text-sm mb-4">
                {formError}
              </p>
            )}
            <div className="space-y-4">
              <Input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <Input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="off"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving..." : "Set new password"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
