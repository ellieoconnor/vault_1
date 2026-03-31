# Story 1.3: User Login & Persistent Session

Status: done

## Story

As Elizabeth,
I want to log in with my username and password and stay logged in across visits,
So that I can open the app on my phone without re-authenticating every time.

## Acceptance Criteria

**Given** I enter valid credentials
**When** I submit the login form
**Then** I'm redirected to the dashboard and a session cookie is set

**Given** I enter invalid credentials
**When** I submit
**Then** I see "Invalid username or password" (no hint which field is wrong)

**Given** I'm logged in and close then reopen the browser
**When** I visit the app URL
**Then** I'm still authenticated — no login required

**Given** I'm not authenticated
**When** I navigate to any protected route (`/`, `/week`, `/goals`, `/settings`)
**Then** I'm redirected to `/login`

**Given** any request between client and server
**When** transmitted
**Then** it uses HTTPS/TLS (NFR-S1)

## Tasks / Subtasks

- [x] Task 1: Backend — Add `loginSchema` and login route (AC: #1, #2)
  - [x] 1.1 Add `loginSchema` to `apps/backend/src/schemas/auth.ts` — same shape as registerSchema (username + password fields, no length validation on password to avoid leaking info)
  - [x] 1.2 Add `POST /api/auth/login` to `apps/backend/src/routes/auth.ts` — look up user by username, verify password with `argon2.verify`, set `req.session.userId`, call `req.session.save()`
  - [x] 1.3 Return 401 with `{ error: "INVALID_CREDENTIALS", message: "Invalid username or password", details: {} }` for both user-not-found and wrong-password cases (no field hint)

- [x] Task 2: Backend — Session check endpoint and auth middleware (AC: #3, #4)
  - [x] 2.1 Add `GET /api/auth/me` to `apps/backend/src/routes/auth.ts` — returns `{ id, username }` if session is valid, 401 if not
  - [x] 2.2 Create `apps/backend/src/middleware/auth.ts` — export `requireAuth` middleware that checks `req.session.userId`; calls `next()` if authenticated, returns 401 JSON if not
  - [x] 2.3 Add a placeholder protected route to verify `requireAuth` works (can be removed or repurposed in future stories)

- [x] Task 3: Frontend — Login page (AC: #1, #2)
  - [x] 3.1 Create `apps/frontend/src/schemas/auth.ts` — add `loginSchema` (username: string, password: string — no length validation to match server message)
  - [x] 3.2 Create `apps/frontend/src/pages/LoginPage.tsx` — form with username + password fields, plain `useState` validation (no form library), call `POST /api/auth/login` via TanStack Query `useMutation`
  - [x] 3.3 On success, navigate to `/` (dashboard); on 401 error, display "Invalid username or password" as a form-level error (not field-level)
  - [x] 3.4 Add a "Don't have an account? Register" link to `/register`

- [x] Task 4: Frontend — Auth guard and session persistence (AC: #3, #4)
  - [x] 4.1 Create `apps/frontend/src/api/useAuth.ts` — `useQuery` hook that calls `GET /api/auth/me`; returns `{ user, isLoading, isAuthenticated }`
  - [x] 4.2 Create `apps/frontend/src/components/shared/AuthGuard.tsx` — wraps protected routes; shows loading state while session check is pending; redirects to `/login` if unauthenticated
  - [x] 4.3 Create `apps/frontend/src/pages/DashboardPage.tsx` — placeholder only ("Dashboard — coming in Epic 2")
  - [x] 4.4 Update `apps/frontend/src/App.tsx` — add routes: `/login` (LoginPage), `/` and `/onboarding` wrapped in AuthGuard; add `/week`, `/goals`, `/settings` as AuthGuard-wrapped placeholders

## Dev Notes

### What Already Exists — Do NOT Recreate

The following were built in Story 1.2 and must be reused:

- **Session middleware** — fully configured in `apps/backend/src/index.ts` (express-session + connect-pg-simple, 30-day cookie, HttpOnly/Secure/SameSite=Strict). Do not touch session config.
- **`req.session.userId` type augmentation** — `apps/backend/src/types/session.d.ts`. Do not recreate.
- **`validateBody` middleware** — `apps/backend/src/middleware/validate.ts`. Import and use for login route.
- **`errorHandler` middleware** — `apps/backend/src/middleware/errorHandler.ts`. Already mounted last in index.ts.
- **`registerSchema`** — `apps/backend/src/schemas/auth.ts`. ADD `loginSchema` to this file, do not replace.
- **`argon2`** — already installed in `apps/backend`. Import directly.
- **`prisma`** — exported from `apps/backend/src/index.ts`. Import as: `import { prisma } from '../index.js'`
- **`react-router-dom`, `@tanstack/react-query`, `zod`** — already installed in `apps/frontend`
- **`QueryClientProvider`** — already wrapping the app in `apps/frontend/src/main.tsx`

### Backend: Login Route Pattern

```typescript
// apps/backend/src/schemas/auth.ts  — ADD to existing file
export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});
```

```typescript
// apps/backend/src/routes/auth.ts  — ADD to existing router
import { registerSchema, loginSchema } from "../schemas/auth.js";

router.post("/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({
        error: "INVALID_CREDENTIALS",
        message: "Invalid username or password",
        details: {},
      });
    }

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      return res.status(401).json({
        error: "INVALID_CREDENTIALS",
        message: "Invalid username or password",
        details: {},
      });
    }

    req.session.userId = user.id;
    req.session.save((saveErr) => {
      if (saveErr) return next(saveErr);
      res.status(200).json({ id: user.id, username: user.username });
    });
  } catch (err) {
    next(err);
  }
});
```

> **CRITICAL:** Both user-not-found AND wrong-password return the exact same 401 response. Never reveal which field failed — this is a security requirement.

> **`argon2.verify(hash, password)`** — first arg is the stored hash, second is the plaintext candidate. Order matters.

### Backend: Session Check Endpoint

```typescript
// apps/backend/src/routes/auth.ts  — ADD to existing router
router.get("/me", async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        error: "UNAUTHENTICATED",
        message: "Not authenticated",
        details: {},
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: { id: true, username: true },
    });

    if (!user) {
      // Session has userId but user was deleted — clear and reject
      req.session.destroy(() => {});
      return res.status(401).json({
        error: "UNAUTHENTICATED",
        message: "Not authenticated",
        details: {},
      });
    }

    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
});
```

### Backend: requireAuth Middleware

```typescript
// apps/backend/src/middleware/auth.ts  — NEW FILE
import { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({
      error: "UNAUTHENTICATED",
      message: "Authentication required",
      details: {},
    });
  }
  next();
}
```

> Apply `requireAuth` to all future protected routes: `router.get('/daily-logs', requireAuth, handler)`. NOT needed yet in this story (no protected routes beyond `/api/auth/me` which does its own check).

### Frontend: TanStack Query Auth Hook

```typescript
// apps/frontend/src/api/useAuth.ts
import { useQuery } from "@tanstack/react-query";

async function fetchMe() {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
    credentials: "include", // REQUIRED — sends session cookie cross-origin
  });
  if (!res.ok) return null;
  return res.json() as Promise<{ id: string; username: string }>;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchMe,
    retry: false, // 401 is expected for unauthenticated — don't retry
    staleTime: 5 * 60 * 1000, // cache for 5 min — session doesn't change often
  });

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
  };
}
```

> **`retry: false`** is critical. Without it, TanStack Query retries 401s 3x before giving up, causing slow redirects and extra network requests.

### Frontend: AuthGuard Component

```typescript
// apps/frontend/src/components/shared/AuthGuard.tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../api/useAuth'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div>Loading...</div>  // Prevents redirect flash while session check is pending
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
```

> **The loading state is mandatory.** Without it, the app briefly shows `/login` redirect before the session check returns, even for authenticated users.

### Frontend: App.tsx Update

```typescript
// apps/frontend/src/App.tsx — replace existing content
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthGuard } from './components/shared/AuthGuard'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import OnboardingPage from './pages/OnboardingPage'
import DashboardPage from './pages/DashboardPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route path="/" element={<AuthGuard><DashboardPage /></AuthGuard>} />
        <Route path="/onboarding" element={<AuthGuard><OnboardingPage /></AuthGuard>} />
        {/* Placeholders for future epics — add now so AuthGuard is wired */}
        <Route path="/week" element={<AuthGuard><div>Weekly Plan — coming soon</div></AuthGuard>} />
        <Route path="/goals" element={<AuthGuard><div>Goals — coming soon</div></AuthGuard>} />
        <Route path="/settings" element={<AuthGuard><div>Settings — coming soon</div></AuthGuard>} />
      </Routes>
    </BrowserRouter>
  )
}
```

### Frontend: Login Page Pattern

```typescript
// apps/frontend/src/pages/LoginPage.tsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { loginSchema } from '../schemas/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',  // REQUIRED for session cookies
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw err
      }
      return res.json()
    },
    onSuccess: () => {
      // Invalidate auth cache so AuthGuard sees the new session immediately
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      navigate('/')
    },
    onError: (err: { message?: string }) => {
      setFormError(err.message ?? 'Invalid username or password')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    const result = loginSchema.safeParse({ username, password })
    if (!result.success) {
      setFormError('Please enter your username and password')
      return
    }

    mutation.mutate(result.data)
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Log in</h1>
      {formError && <p role="alert">{formError}</p>}
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        autoComplete="username"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        autoComplete="current-password"
      />
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Logging in...' : 'Log in'}
      </button>
      <p><Link to="/register">Don't have an account? Register</Link></p>
    </form>
  )
}
```

> **`queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })`** after successful login is critical. Without it, `useAuth()` returns the cached `null` value and AuthGuard redirects back to `/login` immediately after logging in.

### Import Extension Rule (CRITICAL)

The backend uses `"module": "NodeNext"` in tsconfig. ALL local imports in `apps/backend/src/` MUST use `.js` extension:

```typescript
// ✅ Correct
import { prisma } from "../index.js";
import { requireAuth } from "../middleware/auth.js";
import { loginSchema } from "../schemas/auth.js";

// ❌ Wrong — will fail at runtime with NodeNext resolution
import { prisma } from "../index";
```

### Project Structure Notes

**Actual directory structure** (confirmed from codebase — note `apps/` prefix, NOT `client/server/`):

```
apps/
├── backend/src/
│   ├── middleware/
│   │   ├── errorHandler.ts  ← EXISTS
│   │   ├── validate.ts      ← EXISTS
│   │   └── auth.ts          ← NEW (requireAuth)
│   ├── routes/
│   │   └── auth.ts          ← MODIFY (add login + me routes)
│   ├── schemas/
│   │   └── auth.ts          ← MODIFY (add loginSchema)
│   ├── types/
│   │   └── session.d.ts     ← EXISTS (req.session.userId typing)
│   └── index.ts             ← EXISTS (do not touch session config)
│
└── frontend/src/
    ├── api/
    │   └── useAuth.ts       ← NEW
    ├── components/shared/
    │   └── AuthGuard.tsx    ← NEW
    ├── pages/
    │   ├── LoginPage.tsx    ← NEW
    │   ├── DashboardPage.tsx ← NEW (placeholder only)
    │   ├── RegisterPage.tsx  ← EXISTS
    │   └── OnboardingPage.tsx ← EXISTS
    ├── schemas/
    │   └── auth.ts          ← MODIFY (add loginSchema)
    └── App.tsx              ← MODIFY (add routes + AuthGuard)
```

> **Architecture doc shows `client/` and `server/`** but the actual repo uses `apps/frontend/` and `apps/backend/`. Always use the actual paths above.

### Previous Story Learnings (Story 1.2)

- **Express v5 is installed** — async errors auto-forward to `next(err)`. Try/catch still acceptable for clarity.
- **Prisma v7 + NodeNext** — import path is `./generated/prisma/client.js` (with `.js`). Already set up in `index.ts`.
- **`req.session.save(callback)`** — call after setting `req.session.userId`. The registration route does this; copy the pattern exactly.
- **`prisma` is exported from `index.ts`** — import as `import { prisma } from '../index.js'` in route files.
- **No shared package** — duplicate Zod schemas deliberately between frontend and backend (same shape, separate files).
- **`credentials: 'include'`** on every frontend `fetch` call — required for cross-origin session cookies.
- **Race condition on register** — handled via P2002 Prisma error catch. Login doesn't have the same race (reads only), but keep the try/catch pattern.

### References

- Story ACs: [Source: _bmad-output/planning-artifacts/epics.md#Story-1.3]
- Auth architecture: [Source: _bmad-output/planning-artifacts/architecture.md#Authentication-Security]
- Frontend architecture: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Architecture]
- API patterns: [Source: _bmad-output/planning-artifacts/architecture.md#API-Communication-Patterns]
- Naming/structure rules: [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns-Consistency-Rules]
- Complete directory structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete-Project-Directory-Structure]
- FR2 (login), FR3 (persistent session): [Source: _bmad-output/planning-artifacts/epics.md#Requirements-Inventory]
- NFR-S1 (HTTPS): [Source: _bmad-output/planning-artifacts/epics.md#NonFunctional-Requirements]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

- `apps/backend/src/middleware/auth.ts` (new — requireAuth middleware)
- `apps/backend/src/routes/auth.ts` (modified — added login + /me routes)
- `apps/backend/src/schemas/auth.ts` (modified — added loginSchema)
- `apps/frontend/src/api/useAuth.ts` (new — useAuth query hook)
- `apps/frontend/src/components/shared/AuthGuard.tsx` (new — route protection wrapper)
- `apps/frontend/src/pages/LoginPage.tsx` (new — login form)
- `apps/frontend/src/pages/DashboardPage.tsx` (new — placeholder dashboard)
- `apps/frontend/src/schemas/auth.ts` (modified — added loginSchema)
- `apps/frontend/src/App.tsx` (modified — added login/protected routes)
