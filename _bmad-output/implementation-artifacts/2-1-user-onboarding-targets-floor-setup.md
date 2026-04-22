# Story 2.1: User Onboarding — Targets & Floor Setup

Status: ready-for-dev

## Why This Story Matters

This is the first thing Elizabeth sees after registering. If the dashboard loads with no targets set, every progress bar shows zero and means nothing. The floor-based zone model — the core emotional and functional promise of the app — can't work without targets. Story 2.1 is the bridge from "account created" to "my Vault is alive." The first dashboard must feel personal and live, not empty.

> **Before You Start**
>
> ⚠️ **Tailwind CSS v4 + shadcn/ui must be set up before implementing this story.** Run the tech-spec at `_bmad-output/implementation-artifacts/tech-spec-tailwind-v4-shadcn-setup.md` first (via `/quick-dev`). This story's frontend components use Tailwind utility classes and may use shadcn form primitives.
>
> ⚠️ **`UserConfig` does not exist in the Prisma schema yet.** This story creates it. You will run `prisma migrate dev` as part of implementation.
>
> ⚠️ **Architecture doc shows `client/` and `server/` paths — those are wrong.** Actual paths are `apps/frontend/` and `apps/backend/`. Always use the actual paths.

---

## Story

As Elizabeth,
I want to enter my daily targets for calories, protein, and steps during first-time setup and see my floors calculated automatically,
so that the dashboard is meaningful from day one with thresholds that feel achievable.

## Acceptance Criteria

**AC 1:** Given I've just registered and been redirected to `/onboarding`, when the onboarding screen loads, then I see input fields for calorie target, protein target (g), and steps target.

**AC 2:** Given I enter valid targets (e.g. 1800 cal, 130g protein, 8000 steps), when I submit the onboarding form, then the system calculates and saves my floors: calories = target − 250, protein = target × 0.8, steps = target × 0.5.

**AC 3:** Given targets are saved, when I'm redirected to the dashboard, then my targets and floors are persisted in the `UserConfig` table associated with my account.

**AC 4:** Given I enter a non-numeric or negative value, when Zod validation runs client-side, then I see a field-level error before submission.

**AC 5:** Given I've completed onboarding, when I visit `/onboarding` again, then I'm redirected to the dashboard (onboarding only runs once).

---

## Tasks / Subtasks

- [ ] Task 1: Add `UserConfig` model to Prisma schema and run migration (AC: #2, #3)
  - [ ] 1.1 Add `UserConfig` model to `apps/backend/prisma/schema.prisma` (see Dev Notes for exact schema)
  - [ ] 1.2 Add `userConfig UserConfig?` relation to the existing `User` model in schema.prisma
  - [ ] 1.3 Run `npx prisma migrate dev --name add_user_config` from `apps/backend/`
  - [ ] 1.4 Verify migration created the `user_config` table in Neon without errors

- [ ] Task 2: Backend — Create `/api/users/config` route (AC: #2, #3, #5)
  - [ ] 2.1 Create `apps/backend/src/schemas/userConfigSchemas.ts` — Zod schema for target input (see Dev Notes)
  - [ ] 2.2 Create `apps/backend/src/routes/users.ts` — `POST /config` and `GET /config` handlers (see Dev Notes)
  - [ ] 2.3 Mount the new router in `apps/backend/src/index.ts` as `app.use('/api/users', usersRouter)` — before `app.use(errorHandler)`
  - [ ] 2.4 Import and add `requireAuth` to both routes (users must be logged in to set config)

- [ ] Task 3: Frontend — Create `floorCalculator.ts` pure function (AC: #2)
  - [ ] 3.1 Create `apps/frontend/src/lib/floorCalculator.ts` — exports `calculateFloors(targets)` (see Dev Notes)
  - [ ] 3.2 Create `apps/frontend/src/lib/floorCalculator.test.ts` — tests for all three metrics including edge cases (see Dev Notes)

- [ ] Task 4: Frontend — Create `useUserConfig.ts` API hook (AC: #2, #5)
  - [ ] 4.1 Create `apps/frontend/src/api/useUserConfig.ts` — `useUserConfig()` query + `useSetUserConfig()` mutation (see Dev Notes)

- [ ] Task 5: Frontend — Implement `OnboardingPage.tsx` (AC: #1, #2, #4, #5)
  - [ ] 5.1 Replace the placeholder `<div>Onboarding</div>` in `apps/frontend/src/pages/OnboardingPage.tsx` with the real form
  - [ ] 5.2 On mount: call `useUserConfig()` — if config already exists, redirect to `/` immediately (AC 5)
  - [ ] 5.3 Form: three numeric inputs (calorie target, protein target, steps target) with Zod client-side validation
  - [ ] 5.4 On submit: call `useSetUserConfig()` mutation — on success, redirect to `/`
  - [ ] 5.5 Show field-level validation errors (AC 4)
  - [ ] 5.6 All form inputs minimum 16px font size (prevents iOS Safari auto-zoom)
  - [ ] 5.7 All interactive targets minimum 44×44px (NFR-A4)

---

## Dev Notes

### What Already Exists — Do NOT Recreate

- **Session middleware + `requireAuth`** — `apps/backend/src/middleware/auth.ts`. Import and use on all new routes.
- **`errorHandler`** — already mounted last in `apps/backend/src/index.ts`. Do NOT add another one.
- **`prisma`** — exported from `apps/backend/src/index.ts`. Import as: `import { prisma } from '../index.js'`
- **`validateBody` middleware** — `apps/backend/src/middleware/validate.ts`. Use this for Zod validation on POST bodies.
- **`useAuth` hook** — `apps/frontend/src/api/useAuth.ts`. Already handles session check. Do not modify.
- **`AuthGuard`** — `apps/frontend/src/components/shared/AuthGuard.tsx`. No changes needed.
- **`QueryClientProvider`** — already wrapping the app in `apps/frontend/src/main.tsx`.
- **`react-router-dom`, `@tanstack/react-query`, `zod`** — already installed.
- **`OnboardingPage.tsx`** — EXISTS at `apps/frontend/src/pages/OnboardingPage.tsx` but is a placeholder. REPLACE its contents — do not create a new file.

### Prisma Schema Changes

Add to `apps/backend/prisma/schema.prisma`:

```prisma
model UserConfig {
  id            String   @id @default(cuid())
  userId        String   @unique @map("user_id")
  calorieTarget Int      @map("calorie_target")
  proteinTarget Int      @map("protein_target")
  stepsTarget   Int      @map("steps_target")
  calorieFloor  Int      @map("calorie_floor")
  proteinFloor  Int      @map("protein_floor")
  stepsFloor    Int      @map("steps_floor")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_config")
}
```

Also add to the existing `User` model (one-to-one relation):
```prisma
userConfig UserConfig?
```

### Backend: Zod Schema

Create `apps/backend/src/schemas/userConfigSchemas.ts`:

```typescript
import { z } from 'zod'

export const setTargetsSchema = z.object({
  calorieTarget: z.number().int().positive(),
  proteinTarget: z.number().int().positive(),
  stepsTarget: z.number().int().positive(),
})

export type SetTargetsInput = z.infer<typeof setTargetsSchema>
```

### Backend: Users Router

Create `apps/backend/src/routes/users.ts`:

```typescript
import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { validateBody } from '../middleware/validate.js'
import { setTargetsSchema } from '../schemas/userConfigSchemas.js'
import { prisma } from '../index.js'

const router = Router()

// GET /api/users/config — returns current config or 404
router.get('/config', requireAuth, async (req, res, next) => {
  try {
    const config = await prisma.userConfig.findUnique({
      where: { userId: req.session.userId },
    })
    if (!config) return res.status(404).json({ error: 'NOT_FOUND', message: 'No config set' })
    return res.json(config)
  } catch (err) {
    next(err)
  }
})

// POST /api/users/config — create config (onboarding only; Story 2.7 handles updates)
router.post('/config', requireAuth, validateBody(setTargetsSchema), async (req, res, next) => {
  try {
    const { calorieTarget, proteinTarget, stepsTarget } = req.body as {
      calorieTarget: number
      proteinTarget: number
      stepsTarget: number
    }

    // Floor calculation — server-side (do not trust client-calculated floors)
    const calorieFloor = calorieTarget - 250
    const proteinFloor = Math.round(proteinTarget * 0.8)
    const stepsFloor = Math.round(stepsTarget * 0.5)

    const config = await prisma.userConfig.create({
      data: {
        userId: req.session.userId!,
        calorieTarget,
        proteinTarget,
        stepsTarget,
        calorieFloor,
        proteinFloor,
        stepsFloor,
      },
    })

    return res.status(201).json(config)
  } catch (err) {
    next(err)
  }
})

export default router
```

**Note on `validateBody`:** Check `apps/backend/src/middleware/validate.ts` to confirm the exact function signature — it may be exported as `validateBody`, `validate`, or similar. Use what already exists.

**Why floors are calculated server-side:** The client `floorCalculator.ts` is used for real-time UI updates (progress bar previews in future stories). The server ALWAYS recalculates floors independently — never trust client-submitted floor values.

### Backend: Mount the Router

In `apps/backend/src/index.ts`, add after the existing auth router mount:

```typescript
import usersRouter from './routes/users.js'
// ...
app.use('/api/users', usersRouter)
```

### Frontend: `floorCalculator.ts`

Create `apps/frontend/src/lib/floorCalculator.ts`:

```typescript
export interface UserTargets {
  calorieTarget: number
  proteinTarget: number
  stepsTarget: number
}

export interface UserFloors {
  calorieFloor: number
  proteinFloor: number
  stepsFloor: number
}

export function calculateFloors(targets: UserTargets): UserFloors {
  return {
    calorieFloor: targets.calorieTarget - 250,
    proteinFloor: Math.round(targets.proteinTarget * 0.8),
    stepsFloor: Math.round(targets.stepsTarget * 0.5),
  }
}
```

**This is a pure function — no React, no side effects, no imports from other app modules.** It can be used from both frontend components and (if ever needed) server-side without modification.

### Frontend: `floorCalculator.test.ts`

Create `apps/frontend/src/lib/floorCalculator.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { calculateFloors } from './floorCalculator'

describe('calculateFloors', () => {
  it('calculates calorie floor as target minus 250', () => {
    const result = calculateFloors({ calorieTarget: 1800, proteinTarget: 130, stepsTarget: 8000 })
    expect(result.calorieFloor).toBe(1550)
  })

  it('calculates protein floor as target × 0.8 (rounded)', () => {
    const result = calculateFloors({ calorieTarget: 1800, proteinTarget: 130, stepsTarget: 8000 })
    expect(result.proteinFloor).toBe(104)
  })

  it('calculates steps floor as target × 0.5 (rounded)', () => {
    const result = calculateFloors({ calorieTarget: 1800, proteinTarget: 130, stepsTarget: 8000 })
    expect(result.stepsFloor).toBe(4000)
  })

  it('rounds protein floor correctly for fractional values', () => {
    const result = calculateFloors({ calorieTarget: 2000, proteinTarget: 135, stepsTarget: 10000 })
    expect(result.proteinFloor).toBe(108) // 135 × 0.8 = 108.0
  })

  it('rounds steps floor correctly for odd targets', () => {
    const result = calculateFloors({ calorieTarget: 2000, proteinTarget: 130, stepsTarget: 7000 })
    expect(result.stepsFloor).toBe(3500)
  })

  it('handles minimum realistic targets without negative floors', () => {
    // Calorie floor can be low but should be positive for realistic inputs
    const result = calculateFloors({ calorieTarget: 500, proteinTarget: 50, stepsTarget: 1000 })
    expect(result.calorieFloor).toBe(250)
    expect(result.proteinFloor).toBe(40)
    expect(result.stepsFloor).toBe(500)
  })
})
```

**Test runner:** Check `apps/frontend/package.json` for the test script. If Vitest is not configured, add it: `npm install -D vitest` and add `"test": "vitest"` to scripts. Co-locate test file next to source per architecture standards.

### Frontend: `useUserConfig.ts`

Create `apps/frontend/src/api/useUserConfig.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const API_URL = import.meta.env.VITE_API_URL

interface UserConfig {
  id: string
  userId: string
  calorieTarget: number
  proteinTarget: number
  stepsTarget: number
  calorieFloor: number
  proteinFloor: number
  stepsFloor: number
  createdAt: string
  updatedAt: string
}

interface SetTargetsInput {
  calorieTarget: number
  proteinTarget: number
  stepsTarget: number
}

export function useUserConfig() {
  return useQuery<UserConfig | null>({
    queryKey: ['userConfig'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/users/config`, {
        credentials: 'include',
      })
      if (res.status === 404) return null
      if (!res.ok) throw await res.json()
      return res.json()
    },
  })
}

export function useSetUserConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: SetTargetsInput) => {
      const res = await fetch(`${API_URL}/api/users/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(input),
      })
      if (!res.ok) throw await res.json()
      return res.json() as Promise<UserConfig>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userConfig'] })
    },
  })
}
```

### Frontend: `OnboardingPage.tsx`

Replace the entire file `apps/frontend/src/pages/OnboardingPage.tsx`:

```tsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'    // ← only if react-hook-form is installed; see note below
import { z } from 'zod'
import { useUserConfig, useSetUserConfig } from '@/api/useUserConfig'

const targetsSchema = z.object({
  calorieTarget: z.number({ invalid_type_error: 'Must be a number' }).int().positive('Must be positive'),
  proteinTarget: z.number({ invalid_type_error: 'Must be a number' }).int().positive('Must be positive'),
  stepsTarget: z.number({ invalid_type_error: 'Must be a number' }).int().positive('Must be positive'),
})

type TargetsForm = z.infer<typeof targetsSchema>

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { data: config, isPending: isLoadingConfig } = useUserConfig()
  const setConfig = useSetUserConfig()

  // AC 5: redirect if onboarding already completed
  useEffect(() => {
    if (!isLoadingConfig && config !== null && config !== undefined) {
      navigate('/', { replace: true })
    }
  }, [config, isLoadingConfig, navigate])

  // Simple controlled form state (no react-hook-form dependency needed for 3 fields)
  // Use native form + Zod manual validation
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = {
      calorieTarget: Number((form.elements.namedItem('calorieTarget') as HTMLInputElement).value),
      proteinTarget: Number((form.elements.namedItem('proteinTarget') as HTMLInputElement).value),
      stepsTarget: Number((form.elements.namedItem('stepsTarget') as HTMLInputElement).value),
    }

    const result = targetsSchema.safeParse(data)
    if (!result.success) {
      // Surface errors — see note on error display
      return
    }

    await setConfig.mutateAsync(result.data)
    navigate('/')
  }

  if (isLoadingConfig) return <div>Loading...</div>

  return (
    <div>
      <h1>Set Your Targets</h1>
      <p>These set your daily goals and calculate your floor thresholds.</p>
      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="calorieTarget">Daily Calorie Target</label>
          <input
            id="calorieTarget"
            name="calorieTarget"
            type="number"
            min="1"
            required
            style={{ fontSize: '16px' }}  {/* prevents iOS Safari auto-zoom */}
          />
        </div>
        <div>
          <label htmlFor="proteinTarget">Daily Protein Target (g)</label>
          <input
            id="proteinTarget"
            name="proteinTarget"
            type="number"
            min="1"
            required
            style={{ fontSize: '16px' }}
          />
        </div>
        <div>
          <label htmlFor="stepsTarget">Daily Steps Target</label>
          <input
            id="stepsTarget"
            name="stepsTarget"
            type="number"
            min="1"
            required
            style={{ fontSize: '16px' }}
          />
        </div>
        {setConfig.isError && (
          <p role="alert">Failed to save targets. Please try again.</p>
        )}
        <button type="submit" disabled={setConfig.isPending}>
          {setConfig.isPending ? 'Saving...' : 'Set My Targets'}
        </button>
      </form>
    </div>
  )
}
```

**Note on form approach:** This uses a simple native form to avoid adding `react-hook-form` as a new dependency for 3 fields. If you prefer a more structured approach, you may use `react-hook-form` + `@hookform/resolvers/zod` — but check `apps/frontend/package.json` first; if not installed, use the native form approach above to keep deps lean. The priority is working validation (AC 4), not form library choice.

**Error display:** The code above has a placeholder comment for surfacing Zod field errors. You must add visible error messages per field. At minimum: set `useState` for errors object, update it in `safeParse` failure branch, render `<p role="alert">` under each field. Exact styling deferred to Epic 2 UI polish (Tailwind classes will be added as the dashboard takes shape).

### Import Extension Rule (CRITICAL — Backend)

The backend uses `"module": "NodeNext"`. ALL local imports in `apps/backend/src/` MUST use `.js` extension:

```typescript
// ✅ Correct
import { requireAuth } from '../middleware/auth.js'
import { prisma } from '../index.js'

// ❌ Wrong
import { requireAuth } from '../middleware/auth'
```

### `@/` Alias (Frontend)

All internal frontend imports MUST use `@/` alias (configured in Tailwind setup story):

```typescript
// ✅ Correct
import { useUserConfig } from '@/api/useUserConfig'
import { calculateFloors } from '@/lib/floorCalculator'

// ❌ Wrong
import { useUserConfig } from '../api/useUserConfig'
```

### Project Structure Notes

```
apps/backend/
├── prisma/
│   └── schema.prisma              ← MODIFY: add UserConfig model + User relation
├── src/
│   ├── routes/
│   │   ├── auth.ts               ← EXISTS (no changes)
│   │   └── users.ts              ← CREATE NEW
│   ├── schemas/
│   │   ├── auth.ts               ← EXISTS (no changes)
│   │   └── userConfigSchemas.ts  ← CREATE NEW
│   └── index.ts                  ← MODIFY: mount usersRouter

apps/frontend/
└── src/
    ├── api/
    │   ├── useAuth.ts            ← EXISTS (no changes)
    │   └── useUserConfig.ts      ← CREATE NEW
    ├── lib/
    │   ├── floorCalculator.ts    ← CREATE NEW
    │   └── floorCalculator.test.ts ← CREATE NEW
    └── pages/
        └── OnboardingPage.tsx    ← MODIFY: replace placeholder
```

**No new routes needed in `App.tsx`** — `/onboarding` is already registered and wrapped in `AuthGuard`.

### Architecture Compliance

- ✅ Route handler calls `next(err)` — never `res.status(500).json(...)` directly
- ✅ Zod validation via `validateBody` middleware before business logic
- ✅ `requireAuth` on all `/api/users/*` routes
- ✅ Floors calculated server-side (cannot trust client-submitted values)
- ✅ `floorCalculator.ts` is a pure function — no React, no imports from API layer
- ✅ TanStack Query for server state — no Zustand for config data
- ✅ `@/` alias in all frontend imports
- ✅ Test file co-located with source: `floorCalculator.test.ts` next to `floorCalculator.ts`
- ✅ API success response: direct object, no envelope wrapper
- ✅ API error response format: `{ error: "CODE", message: "..." }`

### Key Learnings from Epic 1

- **Express v5 is installed** — async errors in route handlers propagate to `next(err)` automatically, but callback-based APIs (like Prisma's are not — always use try/catch and call `next(err)`)
- **`credentials: 'include'`** on every frontend `fetch` — required for cross-origin session cookies
- **`react-query` 404 handling** — return `null` (not throw) for expected "not found" states so `isPending`/`isError` don't trigger unnecessarily; this is used in `useUserConfig` for the "not yet onboarded" state
- **Session type** — `req.session.userId` is typed via `apps/backend/src/types/session.d.ts` (already exists from Story 1.2)
- **`@prisma/adapter-pg`** — Prisma uses the pg adapter (not the default). `prisma.$connect()` is not needed — connection is managed via the pool.

### References

- Story ACs: [Source: `_bmad-output/planning-artifacts/epics.md` → Story 2.1]
- FR6, FR7: [Source: `_bmad-output/planning-artifacts/epics.md` → Requirements Inventory]
- Floor formula: calories = target − 250, protein = target × 0.8, steps = target × 0.5 [Source: `_bmad-output/planning-artifacts/epics.md` → FR7]
- `floorCalculator.ts` as priority test target: [Source: `_bmad-output/planning-artifacts/architecture.md` → Priority Test Targets]
- API response format: [Source: `_bmad-output/planning-artifacts/architecture.md` → Format Patterns]
- Error handling pattern: [Source: `_bmad-output/planning-artifacts/architecture.md` → Process Patterns]
- iOS Safari font-size 16px rule: [Source: `_bmad-output/planning-artifacts/epics.md` → UX Design requirements]
- `validateBody` middleware: [Source: `apps/backend/src/middleware/validate.ts`]
- Prisma naming conventions: [Source: `_bmad-output/planning-artifacts/architecture.md` → Naming Patterns]

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
