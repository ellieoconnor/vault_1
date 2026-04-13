# Story 1.4: Password Reset via Email

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Elizabeth,
I want to reset my password via email if I forget it,
So that I can regain access without losing my data.

## Acceptance Criteria

**Given** I'm on the login page and click "Forgot password"
**When** I submit my username
**Then** a password reset email is sent via Resend with a time-limited link (if an email is on file)

**Given** I receive the reset email and click the link within 1 hour
**When** I submit a valid new password (8+ chars)
**Then** my password is updated (Argon2 hashed) and I'm logged in automatically

**Given** a reset link older than 1 hour
**When** I visit it
**Then** I see "This link has expired — request a new one"

**Given** a reset link that's already been used
**When** I visit it again
**Then** I see "This link has already been used"

## Tasks / Subtasks

- [x] Task 1: Add optional email to registration (prerequisite for password reset)
  - [x] 1.1 ADD optional `email` field to `registerSchema` in `apps/backend/src/schemas/auth.ts` — `z.string().email().optional()`
  - [x] 1.2 Update the register route in `apps/backend/src/routes/auth.ts` — destructure `email` from `req.body` and pass `email: email ?? null` to `prisma.user.create`
  - [x] 1.3 ADD optional `email` field to `registerSchema` in `apps/frontend/src/schemas/auth.ts` — `z.string().email("Please enter a valid email address").optional().or(z.literal(''))`
  - [x] 1.4 Add optional email input to `apps/frontend/src/pages/RegisterPage.tsx` — label it "Email (needed for password reset)" so the purpose is clear; include it in the `mutation.mutate()` call only if non-empty

- [x] Task 2: Backend — Prisma migration — add PasswordResetToken model (AC: all)
  - [x] 2.1 Add `PasswordResetToken` model to `apps/backend/prisma/schema.prisma` (see Dev Notes for full model definition)
  - [x] 2.2 Run `npx prisma migrate dev --name add-password-reset-token` from `apps/backend/`
  - [x] 2.3 Verify generated client includes `PasswordResetToken` via `npx prisma generate` (auto-runs on migrate, but confirm)

- [x] Task 3: Backend — Install Resend and create emailService (AC: #1)
  - [x] 3.1 Install resend: `npm install resend` in `apps/backend/`
  - [x] 3.2 Add `RESEND_API_KEY=` and `RESEND_FROM_EMAIL=` to `apps/backend/.env` and `apps/backend/.env.example`
  - [x] 3.3 Create `apps/backend/src/services/` directory (does not exist yet)
  - [x] 3.4 Create `apps/backend/src/services/emailService.ts` — exports `sendPasswordResetEmail(to, resetUrl)` (see Dev Notes for full implementation)

- [x] Task 4: Backend — Auth schemas for forgot/reset (AC: all)
  - [x] 4.1 ADD to `apps/backend/src/schemas/auth.ts` — `forgotPasswordSchema` and `resetPasswordSchema` (do NOT replace existing schemas)

- [x] Task 5: Backend — Forgot password route (AC: #1)
  - [x] 5.1 ADD `POST /api/auth/forgot-password` to `apps/backend/src/routes/auth.ts`
  - [x] 5.2 Route: find user by username → if user exists AND has email on file, generate secure token (crypto.randomBytes), create PasswordResetToken in DB (1 hour expiry), send reset email via emailService
  - [x] 5.3 ALWAYS return 200 with generic message regardless of whether user/email found — never reveal account existence
  - [x] 5.4 Clean up expired tokens when a new one is requested for the same user (delete where userId matches AND expiresAt < now)

- [x] Task 6: Backend — Reset password routes (AC: #2, #3, #4)
  - [x] 6.1 ADD `GET /api/auth/reset-password/:token` — validate token exists, not expired, not used; return 200 (valid) or 400 with specific error code
  - [x] 6.2 ADD `POST /api/auth/reset-password/:token` — validate token, hash new password with Argon2, update User.passwordHash, mark token as usedAt = now, create new session (req.session.userId = user.id + req.session.save()), return 200 with user
  - [x] 6.3 Error responses must use specific codes: `TOKEN_EXPIRED`, `TOKEN_ALREADY_USED`, `TOKEN_NOT_FOUND`

- [ ] Task 7: Frontend — Forgot password page (AC: #1)
  - [ ] 7.1 Create `apps/frontend/src/pages/ForgotPasswordPage.tsx` — form with username field, calls `POST /api/auth/forgot-password`, shows generic success message on completion (regardless of whether email was sent)
  - [ ] 7.2 Add "Forgot password?" link to `apps/frontend/src/pages/LoginPage.tsx` (link to `/forgot-password`)
  - [ ] 7.3 ADD `forgotPasswordSchema` to `apps/frontend/src/schemas/auth.ts` (do NOT replace existing schemas)

- [ ] Task 8: Frontend — Reset password page (AC: #2, #3, #4)
  - [ ] 8.1 Create `apps/frontend/src/pages/ResetPasswordPage.tsx` — reads token from URL params, validates token via `GET /api/auth/reset-password/:token` on mount, shows expired/used error or new-password form; form calls `POST /api/auth/reset-password/:token`
  - [ ] 8.2 On successful reset, invalidate `['auth', 'me']` TanStack Query cache and navigate to `/`
  - [ ] 8.3 ADD `resetPasswordSchema` to `apps/frontend/src/schemas/auth.ts` — ADD only, do not replace

- [ ] Task 9: Frontend — Wire new routes in App.tsx (AC: all)
  - [ ] 9.1 ADD to `apps/frontend/src/App.tsx`: `<Route path="/forgot-password" element={<ForgotPasswordPage />} />` (public, no AuthGuard)
  - [ ] 9.2 ADD to `apps/frontend/src/App.tsx`: `<Route path="/reset-password/:token" element={<ResetPasswordPage />} />` (public, no AuthGuard)

## Dev Notes

### What Already Exists — Do NOT Recreate

Built in Stories 1.2 and 1.3 — import and use these:

- **Session middleware** — fully configured in `apps/backend/src/index.ts` (express-session + connect-pg-simple, HttpOnly/Secure/SameSite=Strict). Do not touch session config.
- **`req.session.userId` type augmentation** — `apps/backend/src/types/session.d.ts`. Do not recreate.
- **`validateBody` middleware** — `apps/backend/src/middleware/validate.ts`. Use for forgot-password and reset-password routes.
- **`errorHandler` middleware** — `apps/backend/src/middleware/errorHandler.ts`. Already mounted last in index.ts. Do NOT add error middleware again.
- **`registerSchema` + `loginSchema`** — `apps/backend/src/schemas/auth.ts`. ADD new schemas to this file. Do NOT replace existing ones.
- **`argon2`** — already installed in `apps/backend`. Import directly for password hashing.
- **`prisma`** — exported from `apps/backend/src/index.ts`. Import as: `import { prisma } from '../index.js'`
- **`requireAuth`** — `apps/backend/src/middleware/auth.ts`. NOT needed for reset routes (they're public).
- **`react-router-dom`, `@tanstack/react-query`, `zod`** — already installed in `apps/frontend`.
- **`useAuth` hook** — `apps/frontend/src/api/useAuth.ts`. Reuse to invalidate session after reset.
- **`QueryClientProvider`** — already wrapping the app in `apps/frontend/src/main.tsx`.
- **`loginSchema` (frontend)** — `apps/frontend/src/schemas/auth.ts`. ADD `forgotPasswordSchema` and `resetPasswordSchema` to this file. Do NOT replace.

### Email Field: Registration Update (Task 1)

The User model already has `email String? @unique` in Prisma, but registration (Story 1.2) did not collect email. This story adds email as an **optional** field to registration — additive, won't break anything.

**Backend — add to `registerSchema` in `apps/backend/src/schemas/auth.ts`:**

```typescript
export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(30),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
  email: z.string().email().optional(), // ADD this line
});
```

**Backend — update register route in `apps/backend/src/routes/auth.ts`:**

```typescript
// In the register handler, destructure email and pass it to create:
const { username, password, email } = req.body;
// ...
const user = await prisma.user.create({
  data: { username, passwordHash, email: email ?? null }, // ADD email
});
```

**Frontend — add to `registerSchema` in `apps/frontend/src/schemas/auth.ts`:**

```typescript
export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(30),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")), // ADD this line
});
```

**Frontend — update `apps/frontend/src/pages/RegisterPage.tsx`:**

Add email state alongside existing username/password state:

```tsx
const [email, setEmail] = useState("");
const [fieldErrors, setFieldErrors] = useState<{
  username?: string[];
  password?: string[];
  email?: string[]; // ADD
}>({});
```

Add email field to the form (after password, before submit button):

```tsx
<label>
  Email{" "}
  <span style={{ fontWeight: "normal", fontSize: "0.875rem" }}>
    (optional — needed for password reset)
  </span>
  <input
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    autoComplete="email"
  />
</label>;
{
  fieldErrors.email?.[0] && <span>{fieldErrors.email[0]}</span>;
}
```

Update the `mutation.mutate()` call to include email:

```tsx
// In handleSubmit, change:
const result = registerSchema.safeParse({
  username,
  password,
  email: email || undefined,
});
// ...
mutation.mutate(result.data); // result.data now includes email if provided
```

Update the mutationFn type signature:

```tsx
mutationFn: async (data: { username: string; password: string; email?: string }) => {
  // body JSON.stringify(data) — email is already in data, nothing else changes
```

> **Existing user (Elizabeth):** After Task 1 is done, set her email directly in Prisma Studio (`npx prisma studio` in `apps/backend/`) before testing the full reset flow.

### Backend: Prisma PasswordResetToken Model

Add to `apps/backend/prisma/schema.prisma` (after the User model):

```prisma
model PasswordResetToken {
  id        String    @id @default(cuid())
  userId    String    @map("user_id")
  token     String    @unique
  expiresAt DateTime  @map("expires_at")
  usedAt    DateTime? @map("used_at")
  createdAt DateTime  @default(now()) @map("created_at")

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("password_reset_tokens")
}
```

Also add to the User model (so Prisma knows about the relation):

```prisma
model User {
  // ... existing fields ...
  passwordResetTokens PasswordResetToken[]
}
```

> **NodeNext import rule:** The generated client path is `./generated/prisma/client.js`. Prisma is already set up in `apps/backend/src/index.ts` — just import `{ prisma }` as usual.

### Backend: emailService.ts

```typescript
// apps/backend/src/services/emailService.ts — NEW FILE
// Install first: npm install resend (in apps/backend/)
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "noreply@yourdomain.com";

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
): Promise<void> {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Vault 1 — Reset your password",
    html: `
      <p>You requested a password reset for your Vault 1 account.</p>
      <p><a href="${resetUrl}">Click here to reset your password</a></p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  });
}
```

> **`RESEND_API_KEY`** is already documented in the architecture as a required env var. Get an API key from resend.com (free tier: 3,000 emails/month).

> **`RESEND_FROM_EMAIL`** — must be a verified sender in your Resend account. For development, Resend allows sending from `onboarding@resend.dev` on the free tier without domain verification.

### Backend: Zod Schemas

```typescript
// apps/backend/src/schemas/auth.ts — ADD to existing file (do NOT replace)

export const forgotPasswordSchema = z.object({
  username: z.string().min(1),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});
```

### Backend: Forgot Password Route

```typescript
// apps/backend/src/routes/auth.ts — ADD to existing router
import crypto from "node:crypto";
import { sendPasswordResetEmail } from "../services/emailService.js";
import { forgotPasswordSchema, resetPasswordSchema } from "../schemas/auth.js";

router.post(
  "/forgot-password",
  validateBody(forgotPasswordSchema),
  async (req, res, next) => {
    try {
      const { username } = req.body;

      const user = await prisma.user.findUnique({ where: { username } });

      // Always return 200 — never reveal whether user/email exists
      if (!user || !user.email) {
        return res.status(200).json({
          message:
            "If an account with that username has an email on file, you'll receive a reset link shortly.",
        });
      }

      // Clean up expired tokens for this user
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, expiresAt: { lt: new Date() } },
      });

      // Generate token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.create({
        data: { userId: user.id, token, expiresAt },
      });

      const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
      const resetUrl = `${clientOrigin}/reset-password/${token}`;

      await sendPasswordResetEmail(user.email, resetUrl);

      return res.status(200).json({
        message:
          "If an account with that username has an email on file, you'll receive a reset link shortly.",
      });
    } catch (err) {
      next(err);
    }
  },
);
```

### Backend: Reset Password Routes

```typescript
// apps/backend/src/routes/auth.ts — ADD to existing router

// GET — validate token before showing the form
router.get("/reset-password/:token", async (req, res, next) => {
  try {
    const { token } = req.params;

    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!record) {
      return res.status(400).json({
        error: "TOKEN_NOT_FOUND",
        message: "This reset link is invalid.",
        details: {},
      });
    }

    if (record.usedAt) {
      return res.status(400).json({
        error: "TOKEN_ALREADY_USED",
        message: "This link has already been used.",
        details: {},
      });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({
        error: "TOKEN_EXPIRED",
        message: "This link has expired — request a new one.",
        details: {},
      });
    }

    return res.status(200).json({ valid: true });
  } catch (err) {
    next(err);
  }
});

// POST — perform the password reset
router.post(
  "/reset-password/:token",
  validateBody(resetPasswordSchema),
  async (req, res, next) => {
    try {
      const { token } = req.params;
      const { password } = req.body;

      const record = await prisma.passwordResetToken.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!record) {
        return res.status(400).json({
          error: "TOKEN_NOT_FOUND",
          message: "This reset link is invalid.",
          details: {},
        });
      }

      if (record.usedAt) {
        return res.status(400).json({
          error: "TOKEN_ALREADY_USED",
          message: "This link has already been used.",
          details: {},
        });
      }

      if (record.expiresAt < new Date()) {
        return res.status(400).json({
          error: "TOKEN_EXPIRED",
          message: "This link has expired — request a new one.",
          details: {},
        });
      }

      // Hash new password and update user in a transaction
      const passwordHash = await argon2.hash(password);

      await prisma.$transaction([
        prisma.user.update({
          where: { id: record.userId },
          data: { passwordHash },
        }),
        prisma.passwordResetToken.update({
          where: { id: record.id },
          data: { usedAt: new Date() },
        }),
      ]);

      // Log the user in after reset
      req.session.userId = record.userId;
      req.session.save((saveErr) => {
        if (saveErr) return next(saveErr);
        res
          .status(200)
          .json({ id: record.user.id, username: record.user.username });
      });
    } catch (err) {
      next(err);
    }
  },
);
```

> **`prisma.$transaction`** — both updates (password + token usedAt) run atomically. If either fails, both roll back. Use this pattern for any multi-table atomic operation.

> **Token check order:** Always check `usedAt` before `expiresAt`. An already-used token should return `TOKEN_ALREADY_USED`, not `TOKEN_EXPIRED`, even if it's also expired.

### Frontend: Zod Schemas

```typescript
// apps/frontend/src/schemas/auth.ts — ADD to existing file (do NOT replace)

export const forgotPasswordSchema = z.object({
  username: z.string().min(1, "Username is required"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
```

### Frontend: ForgotPasswordPage Pattern

```typescript
// apps/frontend/src/pages/ForgotPasswordPage.tsx — NEW FILE
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { forgotPasswordSchema } from '../schemas/auth'

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const mutation = useMutation({
    mutationFn: async (data: { username: string }) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw err
      }
      return res.json()
    },
    onSuccess: () => setSubmitted(true),
    onError: (err: { message?: string }) => {
      setFormError(err.message ?? 'Something went wrong. Please try again.')
    },
  })

  if (submitted) {
    return (
      <div>
        <h1>Check your email</h1>
        <p>If an account with that username has an email on file, you'll receive a reset link shortly.</p>
        <p><Link to="/login">Back to login</Link></p>
      </div>
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    const result = forgotPasswordSchema.safeParse({ username })
    if (!result.success) {
      setFormError('Please enter your username')
      return
    }
    mutation.mutate(result.data)
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Reset your password</h1>
      <p>Enter your username and we'll send a reset link to the email on your account.</p>
      {formError && <p role="alert">{formError}</p>}
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        autoComplete="username"
      />
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Sending...' : 'Send reset link'}
      </button>
      <p><Link to="/login">Back to login</Link></p>
    </form>
  )
}
```

### Frontend: ResetPasswordPage Pattern

```typescript
// apps/frontend/src/pages/ResetPasswordPage.tsx — NEW FILE
import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { resetPasswordSchema } from '../schemas/auth'

const API = import.meta.env.VITE_API_URL

async function validateToken(token: string) {
  const res = await fetch(`${API}/api/auth/reset-password/${token}`, { credentials: 'include' })
  if (!res.ok) {
    const err = await res.json()
    throw err
  }
  return res.json()
}

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  // Validate token on mount — shows appropriate error if expired/used
  const { isLoading, isError, error } = useQuery({
    queryKey: ['reset-token', token],
    queryFn: () => validateToken(token!),
    retry: false,
    enabled: !!token,
  })

  const mutation = useMutation({
    mutationFn: async (data: { password: string }) => {
      const res = await fetch(`${API}/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: data.password }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw err
      }
      return res.json()
    },
    onSuccess: () => {
      // Invalidate auth cache — user is now logged in after reset
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      navigate('/')
    },
    onError: (err: { message?: string }) => {
      setFormError(err.message ?? 'Something went wrong. Please request a new reset link.')
    },
  })

  if (!token) return <p>Invalid reset link.</p>

  if (isLoading) return <div>Validating reset link...</div>

  if (isError) {
    const errObj = error as { error?: string; message?: string }
    const msg = errObj?.error === 'TOKEN_EXPIRED'
      ? 'This link has expired — request a new one.'
      : errObj?.error === 'TOKEN_ALREADY_USED'
        ? 'This link has already been used.'
        : 'This reset link is invalid.'
    return (
      <div>
        <h1>Link unavailable</h1>
        <p role="alert">{msg}</p>
        <Link to="/forgot-password">Request a new reset link</Link>
      </div>
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    const result = resetPasswordSchema.safeParse({ password, confirmPassword })
    if (!result.success) {
      setFormError(result.error.errors[0]?.message ?? 'Invalid password')
      return
    }
    mutation.mutate({ password: result.data.password })
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Set a new password</h1>
      {formError && <p role="alert">{formError}</p>}
      <input
        type="password"
        placeholder="New password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        autoComplete="new-password"
      />
      <input
        type="password"
        placeholder="Confirm password"
        value={confirmPassword}
        onChange={e => setConfirmPassword(e.target.value)}
        autoComplete="new-password"
      />
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving...' : 'Set new password'}
      </button>
    </form>
  )
}
```

> **`useQuery` for token validation** — validates the token before showing the form. `retry: false` is critical (same as `useAuth`) — a 400 is expected for bad tokens, don't retry it.

> **`queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })`** after successful reset is mandatory — same pattern as login. Without it, AuthGuard won't see the new session.

### Frontend: Add "Forgot password?" link to LoginPage

In `apps/frontend/src/pages/LoginPage.tsx`, add a link after the submit button:

```tsx
<p>
  <Link to="/forgot-password">Forgot your password?</Link>
</p>
```

### Import Extension Rule (CRITICAL)

The backend uses `"module": "NodeNext"` in tsconfig. ALL local imports in `apps/backend/src/` MUST use `.js` extension:

```typescript
// ✅ Correct
import { prisma } from "../index.js";
import { sendPasswordResetEmail } from "../services/emailService.js";
import { forgotPasswordSchema, resetPasswordSchema } from "../schemas/auth.js";

// ❌ Wrong — fails at runtime with NodeNext
import { prisma } from "../index";
```

Also note: `crypto` is a Node.js built-in. Import as `import crypto from 'node:crypto';` (the `node:` prefix is best practice in modern Node.js).

### Project Structure Notes

**Actual directory structure** (confirmed from codebase — `apps/` prefix, NOT `client/server/` as the architecture doc shows):

```
apps/
├── backend/src/
│   ├── middleware/
│   │   ├── errorHandler.ts   ← EXISTS
│   │   ├── validate.ts       ← EXISTS
│   │   └── auth.ts           ← EXISTS (requireAuth)
│   ├── routes/
│   │   └── auth.ts           ← MODIFY (add forgot-password + reset-password routes)
│   ├── schemas/
│   │   └── auth.ts           ← MODIFY (add forgotPasswordSchema + resetPasswordSchema)
│   ├── services/             ← CREATE THIS DIRECTORY (does not exist yet)
│   │   └── emailService.ts   ← NEW
│   ├── types/
│   │   └── session.d.ts      ← EXISTS
│   └── index.ts              ← EXISTS (do not touch)
│
└── frontend/src/
    ├── api/
    │   └── useAuth.ts        ← EXISTS (reuse for cache invalidation)
    ├── components/shared/
    │   └── AuthGuard.tsx     ← EXISTS
    ├── pages/
    │   ├── LoginPage.tsx         ← MODIFY (add "Forgot password?" link)
    │   ├── ForgotPasswordPage.tsx ← NEW
    │   └── ResetPasswordPage.tsx  ← NEW
    ├── schemas/
    │   └── auth.ts           ← MODIFY (add forgotPassword + resetPassword schemas)
    └── App.tsx               ← MODIFY (add /forgot-password + /reset-password/:token routes)
```

> **Architecture doc mismatch:** Architecture shows `client/` and `server/` paths, and also references `authSchemas.ts` (plural). The ACTUAL file is `apps/backend/src/schemas/auth.ts` (singular). Always use the actual paths above, not the architecture doc paths.

> **No `services/` directory exists yet** — this story creates it. The architecture planned for `authService.ts` and `emailService.ts` in `server/src/services/`. Actual equivalent path: `apps/backend/src/services/`. Only `emailService.ts` is in scope for this story.

### Previous Story Learnings (Story 1.3)

Patterns established that MUST be followed in this story:

- **Express v5** — async errors auto-forward to `next(err)`. Wrap handlers in try/catch for clarity.
- **`req.session.save(callback)` pattern** — call after setting `req.session.userId`. See existing login route for exact pattern. POST `/reset-password/:token` must follow this exactly.
- **`prisma` import** — `import { prisma } from '../index.js'` (with `.js`)
- **No shared package** — Zod schemas are deliberately duplicated between frontend and backend (same shape, separate files). Do not attempt to share.
- **`credentials: 'include'`** on every frontend `fetch` call — required for cross-origin session cookies. All reset endpoints need this.
- **`queryClient.invalidateQueries`** after session-changing mutations — see LoginPage for the pattern. ResetPasswordPage must do the same after successful reset.
- **`retry: false`** on TanStack Query hooks that expect 4xx responses — see `useAuth`. Token validation query must use this.

### Environment Variables

Add to `apps/backend/.env` and `apps/backend/.env.example`:

```
RESEND_API_KEY=re_your_key_here
RESEND_FROM_EMAIL=onboarding@resend.dev  # or your verified sender
CLIENT_ORIGIN=http://localhost:5173       # Already exists, used for reset URL construction
```

> `CLIENT_ORIGIN` is already in `.env` from story 1.1 (used for CORS). Reuse it for building the reset URL so the link goes to the correct frontend URL in both dev and production.

### References

- Story ACs: [Source: _bmad-output/planning-artifacts/epics.md#Story-1.4]
- FR4 (password reset), NFR-S5 (password reset via email): [Source: _bmad-output/planning-artifacts/epics.md#Requirements-Inventory]
- Email service decision (Resend): [Source: _bmad-output/planning-artifacts/architecture.md#Authentication-Security]
- `emailService.ts` file placement: [Source: _bmad-output/planning-artifacts/architecture.md#Complete-Project-Directory-Structure]
- API error format: [Source: _bmad-output/planning-artifacts/architecture.md#API-Communication-Patterns]
- Naming conventions (PasswordResetToken model): [Source: _bmad-output/planning-artifacts/architecture.md#Naming-Patterns]
- Auth error handling pattern: [Source: _bmad-output/implementation-artifacts/1-3-user-login-persistent-session.md#Backend-Login-Route-Pattern]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Tasks 1–6 implemented: email field on registration, PasswordResetToken Prisma model, Resend emailService, forgot-password and reset-password routes
- Token validation order: usedAt checked before expiresAt (TOKEN_ALREADY_USED takes priority over TOKEN_EXPIRED)
- Atomic transaction used for password hash update + token usedAt mark
- req.session.save() callback pattern followed for POST /reset-password/:token login-after-reset

### File List

- apps/backend/prisma/schema.prisma
- apps/backend/src/schemas/auth.ts
- apps/backend/src/services/emailService.ts
- apps/backend/src/routes/auth.ts
- apps/frontend/src/schemas/auth.ts
- apps/frontend/src/pages/RegisterPage.tsx
