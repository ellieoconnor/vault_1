$$
# Story 1.2: User Registration

Status: review

## Story

As Elizabeth,
I want to create an account with a username and password,
So that my data is stored securely and tied to my identity.

## Acceptance Criteria

**Given** I'm on the registration page
**When** I submit a valid username (3–30 chars) and password (8+ chars)
**Then** my account is created and I'm redirected to `/onboarding`

**Given** a successful registration
**When** my password is stored
**Then** it is hashed with Argon2 — plaintext never persists anywhere

**Given** I submit a username that already exists
**When** the form is submitted
**Then** I see the error "Username already taken"

**Given** I submit a password under 8 characters
**When** Zod validation runs
**Then** I see a field-level validation error before the request is sent

**Given** successful registration
**When** I'm redirected to onboarding
**Then** a session cookie is set (HttpOnly, Secure, SameSite=Strict)

## Tasks / Subtasks

- [x] Task 1: Install backend dependencies
  - [x] 1.1 In `apps/backend`, install runtime deps: `argon2 express-session connect-pg-simple zod cors cookie-parser`
  - [x] 1.2 Install type deps: `@types/express-session @types/cookie-parser @types/cors @types/connect-pg-simple`
  - [x] 1.3 Add `SESSION_SECRET` to `apps/backend/.env` (generate a random 32+ char string)

- [x] Task 2: Backend middleware setup
  - [x] 2.1 Create `apps/backend/src/middleware/validate.ts` — Zod validation middleware factory
  - [x] 2.2 Create `apps/backend/src/middleware/errorHandler.ts` — central Express error handler
  - [x] 2.3 Update `apps/backend/src/index.ts`: add `cors`, `cookie-parser`, `express-session` with `connect-pg-simple`; mount error handler last

- [x] Task 3: Registration endpoint
  - [x] 3.1 Create `apps/backend/src/routes/auth.ts` with `POST /api/auth/register`
  - [x] 3.2 Register the auth router in `apps/backend/src/index.ts` under `/api/auth`
  - [x] 3.3 Confirm `POST /api/auth/register` with valid body returns 201 and sets session cookie
  - [x] 3.4 Confirm duplicate username returns `{ "error": "USERNAME_TAKEN", "message": "Username already taken", "details": {} }`

- [x] Task 4: Install frontend dependencies
  - [x] 4.1 In `apps/frontend`, install: `react-router-dom @tanstack/react-query zod`
  - [x] 4.2 Add `VITE_API_URL=http://localhost:3000` to `apps/frontend/.env.local`

- [x] Task 5: Frontend routing and providers
  - [x] 5.1 Wrap `apps/frontend/src/main.tsx` with `QueryClientProvider` (TanStack Query)
  - [x] 5.2 Update `apps/frontend/src/App.tsx` — add `BrowserRouter` + routes: `/register`, `/onboarding` (placeholder page)

- [x] Task 6: Registration form
  - [x] 6.1 Create `apps/frontend/src/pages/RegisterPage.tsx` — form with username and password fields
  - [x] 6.2 Add Zod schema: username 3–30 chars, password 8+ chars; show field-level errors before submission
  - [x] 6.3 On submit, call `POST /api/auth/register`; on success redirect to `/onboarding`
  - [x] 6.4 On duplicate username error from server, display "Username already taken" inline on the username field
  - [x] 6.5 Create `apps/frontend/src/pages/OnboardingPage.tsx` — placeholder only (full implementation in Story 2.1)

## Dev Notes

### New Dependencies Required (MUST install — none present yet)

**Backend (`apps/backend`):**
```bash
npm install argon2 express-session connect-pg-simple zod cors cookie-parser
$$npm install -D @types/express-session @types/cookie-parser @types/cors @types/connect-pg-simple
```

**Frontend (`apps/frontend`):**
```bash
npm install react-router-dom @tanstack/react-query zod
```

> ⚠️ `argon2` has native bindings — it compiles on install. This is normal and expected; not an error.

### Session Configuration (MUST get this right)

Architecture specifies `express-session` + `connect-pg-simple`. The existing `pg.Pool` in `index.ts` is already available — pass it directly to `connect-pg-simple`.

```typescript
// apps/backend/src/index.ts
import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'

const PgSession = connectPgSimple(session)

app.use(session({
  store: new PgSession({
    pool,                          // reuse the existing Pool
    createTableIfMissing: true,    // auto-creates "session" table in Neon
  }),
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',  // HTTPS only in prod
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,  // 30 days
  },
}))
```

> **`secure: process.env.NODE_ENV === 'production'`** — this means cookies work over HTTP locally but require HTTPS in production. Do NOT set `secure: true` unconditionally or local dev will break.

> **Session table** — `createTableIfMissing: true` means `connect-pg-simple` creates the `session` table directly in Neon on first startup. This table is NOT in the Prisma schema (intentional — Prisma does not manage it).

### Registration Route Pattern (MUST follow)

Route handlers never send error responses directly — always call `next(err)`. The central error handler (Task 2.2) handles all errors.

```typescript
// apps/backend/src/routes/auth.ts
import { Router } from 'express'
import argon2 from 'argon2'
import { prisma } from '../index.js'         // export prisma from index.ts
import { validateBody } from '../middleware/validate.js'
import { registerSchema } from '../schemas/auth.js'

const router = Router()

router.post('/register', validateBody(registerSchema), async (req, res, next) => {
  try {
    const { username, password } = req.body

    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      return res.status(409).json({
        error: 'USERNAME_TAKEN',
        message: 'Username already taken',
        details: {},
      })
    }

    const passwordHash = await argon2.hash(password)
    const user = await prisma.user.create({
      data: { username, passwordHash },
    })

    req.session.userId = user.id
    res.status(201).json({ id: user.id, username: user.username })
  } catch (err) {
    next(err)
  }
})

export default router
```

> **Session typing** — TypeScript will complain that `req.session.userId` doesn't exist. Fix with a declaration merge in a type definition file:
> ```typescript
> // apps/backend/src/types/session.d.ts
> import 'express-session'
> declare module 'express-session' {
>   interface SessionData {
>     userId: string
>   }
> }
> ```

### Zod Validation Middleware Pattern

```typescript
// apps/backend/src/middleware/validate.ts
import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid request body',
        details: result.error.flatten().fieldErrors,
      })
    }
    req.body = result.data
    next()
  }
}
```

### Zod Schema (shared pattern — define in `src/schemas/auth.ts`)

```typescript
// apps/backend/src/schemas/auth.ts
import { z } from 'zod'

export const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(30),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
```

Use the same shape on the client (can duplicate deliberately — no shared package in this monorepo):
```typescript
// apps/frontend/src/schemas/auth.ts  (same shape)
import { z } from 'zod'
export const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(30),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
```

### Error Handler Pattern (errorHandler.ts)

```typescript
// apps/backend/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express'

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  console.error(err)
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    details: {},
  })
}
```

Mount it last in `index.ts` — **after all routes**: `app.use(errorHandler)`

### CORS Configuration

The frontend runs on `localhost:5173` in dev. Configure CORS to allow it:

```typescript
import cors from 'cors'
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,  // required for session cookies
}))
```

> `credentials: true` is REQUIRED. Without it, the browser blocks the session cookie.

Add `CLIENT_URL` to `.env` if needed for production (e.g., Vercel URL).

### Frontend: TanStack Query + Registration Call

```typescript
// apps/frontend/src/pages/RegisterPage.tsx
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useForm } from '...'  // use plain React state or react-hook-form (not installed — use plain state for now)
```

> **No form library installed.** Use plain `useState` + Zod `.safeParse()` for client-side validation. Do NOT add `react-hook-form` — that's not in the architecture for this story.

```typescript
const navigate = useNavigate()

const mutation = useMutation({
  mutationFn: async (data: { username: string; password: string }) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',   // send/receive cookies
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw err
    }
    return res.json()
  },
  onSuccess: () => navigate('/onboarding'),
})
```

> `credentials: 'include'` on every `fetch` call is REQUIRED for session cookies to work cross-origin in dev.

### Export prisma from index.ts

The route file needs access to `prisma`. Export it from `index.ts`:

```typescript
// At the top of apps/backend/src/index.ts, after creating the client:
export { prisma }
```

Or move prisma client creation to its own file `src/lib/prisma.ts` and import from there — either approach is acceptable.

### Project Structure Notes

Files to create in this story:
```
apps/backend/src/
├── middleware/
│   ├── validate.ts       ← NEW
│   └── errorHandler.ts   ← NEW
├── routes/
│   └── auth.ts           ← NEW
├── schemas/
│   └── auth.ts           ← NEW
├── types/
│   └── session.d.ts      ← NEW
└── index.ts              ← MODIFIED

apps/frontend/src/
├── pages/
│   ├── RegisterPage.tsx  ← NEW
│   └── OnboardingPage.tsx ← NEW (placeholder)
├── schemas/
│   └── auth.ts           ← NEW
└── App.tsx               ← MODIFIED
    main.tsx              ← MODIFIED
```

### Previous Story Learnings (Story 1.1)

- Prisma v7: connection managed via `prisma.config.ts` — do NOT add `url` to `schema.prisma`
- Prisma generator output is `../src/generated/prisma` — import path is `./generated/prisma/client.js` (with `.js` extension, required for NodeNext module resolution)
- Express v5 is installed (not v4) — route handler async error handling works differently: in Express v5, async errors are automatically forwarded to `next(err)` without explicit `try/catch`. You may still use try/catch for clarity.
- Backend uses `"module": "NodeNext"` in tsconfig — all local imports MUST use `.js` extension (e.g., `import { router } from './routes/auth.js'`)
- `.env` is in `apps/backend/` (not root) — already gitignored

### References

- Epics: Story 1.2 ACs [Source: _bmad-output/planning-artifacts/epics.md#Story-1.2]
- Architecture: Authentication & Security [Source: _bmad-output/planning-artifacts/architecture.md#Authentication-Security]
- Architecture: API patterns [Source: _bmad-output/planning-artifacts/architecture.md#API-Communication-Patterns]
- Architecture: Implementation Patterns [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns-Consistency-Rules]
- Architecture: File structure [Source: _bmad-output/planning-artifacts/architecture.md#Complete-Project-Directory-Structure]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
$$
