# Story 2.1: User Onboarding — Targets & Floor Setup

Status: done

## Why This Story Matters

This is the first thing Elizabeth sees after registering. The floor-based zone model — the core emotional promise of the app — cannot work without a calorie floor that means something. A flat offset (`target − 250`) produces a floor with no relationship to her body. The correct floor is her BMR: the biological minimum her body needs regardless of goals. Without biometrics, this number doesn't exist. Story 2.1 is the bridge from "account created" to "my Vault is calibrated to me."

> **Before You Start**
>
> ⚠️ **Tailwind CSS v4 + shadcn/ui must be set up before implementing this story.** Run the tech-spec at `_bmad-output/implementation-artifacts/tech-spec-tailwind-v4-shadcn-setup.md` first. This story's frontend components use Tailwind utility classes and may use shadcn form primitives.
>
> ⚠️ **The first `UserConfig` migration (`add_user_config`) already ran against Neon with the original schema.** Do NOT re-run it. This story adds a second additive migration (`add_user_config_biometrics`). See Task 1.5–1.7.
>
> ⚠️ **`apps/backend/src/routes/users.ts` exists but is incomplete and has a bug.** Do not create a new file — fix and complete the existing one. See Task 2.2.
>
> ⚠️ **Architecture doc shows `client/` and `server/` paths — those are wrong.** Actual paths are `apps/frontend/` and `apps/backend/`. Always use the actual paths.

---

## Story

As Elizabeth,
I want to provide my biometrics and set my daily targets during first-time setup,
so that my floors are calculated from my actual body (not a generic offset) and the dashboard is meaningful from day one.

## Acceptance Criteria

**AC1:** Given I've just registered and been redirected to `/onboarding`, when Step 1 loads, then I see a measurement system toggle ("Metric (kg, cm)" / "Imperial (lbs, ft + in)") followed by required inputs: weight, height (two fields in imperial: feet + inches), age, biological sex (radio: Male / Female), and activity level (select: Sedentary / Lightly Active / Moderately Active / Very Active / Extra Active). My measurement system choice determines input labels and units. I cannot advance without completing all fields.

**AC2:** Given I complete Step 1 and advance to Step 2, when Step 2 loads, then I see three goal type options: "Lose weight", "Maintain", "Build". I must select one before advancing.

**AC3:** Given I select a goal type and advance to Step 3, when Step 3 loads, then I see two paths:

- Option A: "Suggest a target for me" — app calculates and pre-fills a TDEE-based calorie recommendation that I can edit before confirming
- Option B: "I'll enter my own" — a blank numeric input

In both cases: I can freely edit the calorie number before submitting; the 1,400 cal hard minimum applies; I must actively confirm the number (no silent acceptance). This step also includes protein target (g) and steps target inputs.

**AC4:** Given I am entering a calorie target (either path), when I enter or confirm a value below 1,400 cal, then the input is blocked with a clear, non-shaming message and I cannot submit below this threshold.

**AC5:** Given I enter an invalid value for any field, when Zod validation runs client-side, then I see a field-level error before submission.

**AC6:** Given all steps are completed and I submit, when the form submits successfully, then the system:

- Converts imperial inputs to metric if needed (lbs → kg, ft+in → cm) — metric is the internal canonical representation
- Calculates BMR via Mifflin-St Jeor using metric values
- Sets calorieFloor = BMR (rounded to nearest integer)
- Sets calorieCeiling = calorieTarget + 200
- Sets proteinFloor = round(proteinTarget × 0.8)
- Sets stepsFloor = round(stepsTarget × 0.5)
- Persists weightKg, heightCm (canonical metric), measurementSystem, goalType, all targets, floors, and ceiling in UserConfig

**AC7:** Given UserConfig is saved, when I'm redirected to the dashboard, then all values persist across sessions.

**AC8:** Given I've completed onboarding, when I visit `/onboarding` again, then I'm redirected to the dashboard (onboarding only runs once).

---

## Tasks / Subtasks

- [x] Task 1: Prisma schema — additive migration for biometrics fields
    - [x] 1.1 Original `UserConfig` model added to schema.prisma
    - [x] 1.2 `userConfig UserConfig?` relation added to User model
    - [x] 1.3 `npx prisma migrate dev --name add_user_config` ran successfully
    - [x] 1.4 `user_config` table verified in Neon
    - [x] 1.5 Update `UserConfig` model in schema.prisma with biometrics + measurementSystem + goalType + calorieCeiling fields (see Dev Notes for full schema)
    - [x] 1.6 Run `npx prisma migrate dev --name add_user_config_biometrics` from `apps/backend/`
    - [x] 1.7 Verify additive migration applied cleanly in Neon (new columns present, existing data unaffected)

- [x] Task 2: Backend — fix and complete `/api/users/config` route
    - [x] 2.1 `apps/backend/src/schemas/userConfigSchemas.ts` exists — update Zod schema to include biometrics fields + measurementSystem + goalType (see Dev Notes)
    - [x] 2.2 Fix bug in `users.ts` GET handler: move `res.json(config)` out of the 404 branch so it executes when config IS found (currently unreachable)
    - [x] 2.3 Complete POST handler in `users.ts` — add imperial → metric conversion, BMR calculation, floor/ceiling derivation, persist all new fields (see Dev Notes)
    - [x] 2.4 Mount router in `apps/backend/src/index.ts` if not already done: `app.use('/api/users', usersRouter)`

- [x] Task 3: Frontend — create pure function library
    - [x] 3.1 Create `apps/frontend/src/lib/unitConverter.ts` — `lbsToKg(lbs)`, `ftInToCm(feet, inches)` pure functions
    - [x] 3.2 Create `apps/frontend/src/lib/unitConverter.test.ts` — test conversions and round-trip accuracy
    - [x] 3.3 Create `apps/frontend/src/lib/bmrCalculator.ts` — `calculateBMR(weightKg, heightCm, age, sex)` using Mifflin-St Jeor; `calculateTDEE(bmr, activityLevel)` using activity multipliers
    - [x] 3.4 Create `apps/frontend/src/lib/bmrCalculator.test.ts` — test male and female formulas, boundary values, TDEE multipliers
    - [x] 3.5 Create `apps/frontend/src/lib/floorCalculator.ts` — `calculateFloors(bmr, proteinTarget, stepsTarget)` returning calorieFloor = bmr, proteinFloor, stepsFloor
    - [x] 3.6 Create `apps/frontend/src/lib/floorCalculator.test.ts` — test all three metrics, rounding, BMR passthrough

- [x] Task 4: Frontend — create `useUserConfig.ts` API hook
    - [x] 4.1 Create `apps/frontend/src/api/useUserConfig.ts` — `useUserConfig()` query + `useSetUserConfig()` mutation with updated `UserConfig` type (see Dev Notes)

- [x] Task 5: Frontend — implement `OnboardingPage.tsx` as 3-step form
    - [x] 5.1 Replace placeholder in `apps/frontend/src/pages/OnboardingPage.tsx`
    - [x] 5.2 On mount: call `useUserConfig()` — if config exists, redirect to `/` immediately (AC8)
    - [x] 5.3 Step 1 — Biometrics: measurement system toggle; weight + height inputs (labels swap per system, imperial height = two fields: feet + inches); age; sex radio; activity level select
    - [x] 5.4 Step 2 — Goal type: three option buttons (lose / maintain / build)
    - [x] 5.5 Step 3 — Targets: "Suggest a target" pre-fills editable calorie input from `calculateTDEE()`; "I'll enter my own" leaves it blank; protein target (g) and steps target on both paths
    - [x] 5.6 Enforce 1,200 cal hard minimum on calorie input with field-level error (AC4 — minimum updated to 1,200 per product decision 2026-04-24)
    - [x] 5.7 Zod validation on all fields with per-field error display (AC5)
    - [x] 5.8 On submit: call `useSetUserConfig()` mutation, redirect to `/` on success
    - [x] 5.9 All inputs minimum 16px font size (prevents iOS Safari auto-zoom)
    - [x] 5.10 All interactive targets minimum 44×44px (NFR-A4)

---

## Dev Notes

### What Already Exists — Do NOT Recreate

- **Session middleware + `requireAuth`** — `apps/backend/src/middleware/auth.ts`
- **`errorHandler`** — already mounted last in `apps/backend/src/index.ts`. Do NOT add another one.
- **`prisma`** — exported from `apps/backend/src/index.ts`. Import as: `import { prisma } from '../index.js'`
- **`validateBody` middleware** — `apps/backend/src/middleware/validate.ts`
- **`useAuth` hook** — `apps/frontend/src/api/useAuth.ts`. Do not modify.
- **`AuthGuard`** — `apps/frontend/src/components/shared/AuthGuard.tsx`. No changes needed.
- **`QueryClientProvider`** — already wrapping the app in `apps/frontend/src/main.tsx`
- **`react-router-dom`, `@tanstack/react-query`, `zod`** — already installed
- **`OnboardingPage.tsx`** — EXISTS at `apps/frontend/src/pages/OnboardingPage.tsx` as a placeholder. REPLACE its contents — do not create a new file
- **`apps/backend/src/routes/users.ts`** — EXISTS with partial implementation and a bug. FIX AND COMPLETE it — do not create a new file
- **`apps/backend/src/schemas/userConfigSchemas.ts`** — EXISTS with old schema. UPDATE it — do not create a new file

---

### Prisma Schema Changes

Replace the `UserConfig` model in `apps/backend/prisma/schema.prisma`:

```prisma
model UserConfig {
  id                String   @id @default(cuid())
  userId            String   @unique @map("user_id")

  // Measurement preference
  measurementSystem String   @default("metric") @map("measurement_system")
  // "metric" | "imperial"

  // Biometrics (stored in metric — canonical representation)
  weightKg          Float    @map("weight_kg")
  heightCm          Float    @map("height_cm")
  age               Int
  sex               String
  // "male" | "female" — biological sex for BMR calculation
  activityLevel     String   @map("activity_level")
  // "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "extra_active"

  // Goal type
  goalType          String   @map("goal_type")
  // "lose" | "maintain" | "build"

  // Calorie system
  calorieTarget     Int      @map("calorie_target")
  calorieFloor      Int      @map("calorie_floor")    // = BMR
  calorieCeiling    Int      @map("calorie_ceiling")  // = calorieTarget + 200

  // Protein & steps
  proteinTarget     Int      @map("protein_target")
  proteinFloor      Int      @map("protein_floor")    // = round(proteinTarget × 0.8)
  stepsTarget       Int      @map("steps_target")
  stepsFloor        Int      @map("steps_floor")      // = round(stepsTarget × 0.5)

  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_config")
}
```

**⚠️ Migration order matters:**

```bash
# Do NOT re-run this — already ran
# npx prisma migrate dev --name add_user_config

# Run this from apps/backend/
npx prisma migrate dev --name add_user_config_biometrics
```

---

### Mifflin-St Jeor BMR Formula

```
Male:   BMR = (10 × weightKg) + (6.25 × heightCm) − (5 × age) + 5
Female: BMR = (10 × weightKg) + (6.25 × heightCm) − (5 × age) − 161
```

### TDEE Activity Multipliers (for Step 3 suggestion)

```
sedentary:          BMR × 1.2
lightly_active:     BMR × 1.375
moderately_active:  BMR × 1.55
very_active:        BMR × 1.725
extra_active:       BMR × 1.9
```

### Unit Conversion Formulas

```
lbs → kg:    kg = lbs × 0.453592
ft+in → cm:  cm = (feet × 30.48) + (inches × 2.54)
```

---

### Backend: Updated Zod Schema

Update `apps/backend/src/schemas/userConfigSchemas.ts`:

```typescript
import { z } from 'zod';

export const setTargetsSchema = z.object({
    measurementSystem: z.enum(['metric', 'imperial']),
    // Biometrics — raw user input (may be imperial)
    weightInput: z.number().positive(),
    heightInputPrimary: z.number().positive(), // kg or feet
    heightInputSecondary: z.number().min(0).max(11).optional(), // inches (imperial only)
    age: z.number().int().min(13).max(120),
    sex: z.enum(['male', 'female']),
    activityLevel: z.enum([
        'sedentary',
        'lightly_active',
        'moderately_active',
        'very_active',
        'extra_active',
    ]),
    goalType: z.enum(['lose', 'maintain', 'build']),
    calorieTarget: z.number().int().min(1400),
    proteinTarget: z.number().int().positive(),
    stepsTarget: z.number().int().positive(),
});

export type SetTargetsInput = z.infer<typeof setTargetsSchema>;
```

---

### Backend: Fixed and Completed `users.ts`

Replace the entire `apps/backend/src/routes/users.ts`:

```typescript
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { setTargetsSchema } from '../schemas/userConfigSchemas.js';
import { prisma } from '../index.js';

const router = Router();

// GET /api/users/config — returns current config or 404
router.get('/config', requireAuth, async (req, res, next) => {
    try {
        const config = await prisma.userConfig.findUnique({
            where: { userId: req.session.userId },
        });
        if (!config) {
            return res.status(404).json({ error: 'NOT_FOUND', message: 'No config set' });
        }
        return res.json(config);
    } catch (err) {
        next(err);
    }
});

// POST /api/users/config — create config (onboarding only; Story 2.7 handles updates via PATCH)
router.post('/config', requireAuth, validateBody(setTargetsSchema), async (req, res, next) => {
    try {
        const {
            measurementSystem,
            weightInput,
            heightInputPrimary,
            heightInputSecondary,
            age,
            sex,
            activityLevel,
            goalType,
            calorieTarget,
            proteinTarget,
            stepsTarget,
        } = req.body;

        // Convert to metric (canonical representation)
        const weightKg = measurementSystem === 'imperial' ? weightInput * 0.453592 : weightInput;

        const heightCm =
            measurementSystem === 'imperial'
                ? heightInputPrimary * 30.48 + (heightInputSecondary ?? 0) * 2.54
                : heightInputPrimary;

        // BMR via Mifflin-St Jeor
        const bmrBase = 10 * weightKg + 6.25 * heightCm - 5 * age;
        const bmr = Math.round(sex === 'male' ? bmrBase + 5 : bmrBase - 161);

        // Floor / ceiling derivation
        const calorieFloor = bmr;
        const calorieCeiling = calorieTarget + 200;
        const proteinFloor = Math.round(proteinTarget * 0.8);
        const stepsFloor = Math.round(stepsTarget * 0.5);

        const config = await prisma.userConfig.create({
            data: {
                userId: req.session.userId!,
                measurementSystem,
                weightKg,
                heightCm,
                age,
                sex,
                activityLevel,
                goalType,
                calorieTarget,
                calorieFloor,
                calorieCeiling,
                proteinTarget,
                proteinFloor,
                stepsTarget,
                stepsFloor,
            },
        });

        return res.status(201).json(config);
    } catch (err) {
        next(err);
    }
});

export default router;
```

---

### Frontend: `unitConverter.ts`

Create `apps/frontend/src/lib/unitConverter.ts`:

```typescript
export function lbsToKg(lbs: number): number {
    return lbs * 0.453592;
}

export function ftInToCm(feet: number, inches: number): number {
    return feet * 30.48 + inches * 2.54;
}
```

---

### Frontend: `bmrCalculator.ts`

Create `apps/frontend/src/lib/bmrCalculator.ts`:

```typescript
export type ActivityLevel =
    | 'sedentary'
    | 'lightly_active'
    | 'moderately_active'
    | 'very_active'
    | 'extra_active';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extra_active: 1.9,
};

export function calculateBMR(
    weightKg: number,
    heightCm: number,
    age: number,
    sex: 'male' | 'female'
): number {
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    return Math.round(sex === 'male' ? base + 5 : base - 161);
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
    return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}
```

---

### Frontend: `floorCalculator.ts`

Create `apps/frontend/src/lib/floorCalculator.ts`:

```typescript
export interface FloorResult {
    calorieFloor: number; // = bmr
    proteinFloor: number; // = round(proteinTarget × 0.8)
    stepsFloor: number; // = round(stepsTarget × 0.5)
}

export function calculateFloors(
    bmr: number,
    proteinTarget: number,
    stepsTarget: number
): FloorResult {
    return {
        calorieFloor: bmr,
        proteinFloor: Math.round(proteinTarget * 0.8),
        stepsFloor: Math.round(stepsTarget * 0.5),
    };
}
```

**This is a pure function — no React, no side effects, no imports from other app modules.**

---

### Frontend: `useUserConfig.ts`

Create `apps/frontend/src/api/useUserConfig.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL;

export interface UserConfig {
    id: string;
    userId: string;
    measurementSystem: 'metric' | 'imperial';
    weightKg: number;
    heightCm: number;
    age: number;
    sex: 'male' | 'female';
    activityLevel: string;
    goalType: 'lose' | 'maintain' | 'build';
    calorieTarget: number;
    calorieFloor: number;
    calorieCeiling: number;
    proteinTarget: number;
    proteinFloor: number;
    stepsTarget: number;
    stepsFloor: number;
    createdAt: string;
    updatedAt: string;
}

export interface SetTargetsInput {
    measurementSystem: 'metric' | 'imperial';
    weightInput: number;
    heightInputPrimary: number;
    heightInputSecondary?: number;
    age: number;
    sex: 'male' | 'female';
    activityLevel: string;
    goalType: 'lose' | 'maintain' | 'build';
    calorieTarget: number;
    proteinTarget: number;
    stepsTarget: number;
}

export function useUserConfig() {
    return useQuery<UserConfig | null>({
        queryKey: ['userConfig'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/users/config`, {
                credentials: 'include',
            });
            if (res.status === 404) return null;
            if (!res.ok) throw await res.json();
            return res.json();
        },
    });
}

export function useSetUserConfig() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: SetTargetsInput) => {
            const res = await fetch(`${API_URL}/api/users/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(input),
            });
            if (!res.ok) throw await res.json();
            return res.json() as Promise<UserConfig>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userConfig'] });
        },
    });
}
```

---

### Import Extension Rule (CRITICAL — Backend)

ALL local imports in `apps/backend/src/` MUST use `.js` extension:

```typescript
// ✅ Correct
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../index.js';

// ❌ Wrong
import { requireAuth } from '../middleware/auth';
```

### `@/` Alias (Frontend)

ALL internal frontend imports MUST use `@/` alias:

```typescript
// ✅ Correct
import { calculateBMR } from '@/lib/bmrCalculator';
import { useUserConfig } from '@/api/useUserConfig';

// ❌ Wrong
import { calculateBMR } from '../lib/bmrCalculator';
```

---

### Project Structure Notes

```
apps/backend/
├── prisma/
│   └── schema.prisma              ← MODIFY: replace UserConfig model
├── src/
│   ├── routes/
│   │   ├── auth.ts               ← EXISTS (no changes)
│   │   └── users.ts              ← FIX BUG + COMPLETE (do not recreate)
│   ├── schemas/
│   │   ├── auth.ts               ← EXISTS (no changes)
│   │   └── userConfigSchemas.ts  ← UPDATE (do not recreate)
│   └── index.ts                  ← MODIFY: mount usersRouter if not done

apps/frontend/
└── src/
    ├── api/
    │   ├── useAuth.ts            ← EXISTS (no changes)
    │   └── useUserConfig.ts      ← CREATE NEW
    ├── lib/
    │   ├── unitConverter.ts      ← CREATE NEW
    │   ├── unitConverter.test.ts ← CREATE NEW
    │   ├── bmrCalculator.ts      ← CREATE NEW
    │   ├── bmrCalculator.test.ts ← CREATE NEW
    │   ├── floorCalculator.ts    ← CREATE NEW
    │   └── floorCalculator.test.ts ← CREATE NEW
    └── pages/
        └── OnboardingPage.tsx    ← MODIFY: replace placeholder
```

---

### Key Learnings from Epic 1

- **Express v5 is installed** — async errors propagate to `next(err)` automatically in route handlers
- **`credentials: 'include'`** on every frontend `fetch` — required for cross-origin session cookies
- **react-query 404 handling** — return `null` (not throw) for expected "not found" states
- **Session type** — `req.session.userId` is typed via `apps/backend/src/types/session.d.ts` (already exists)
- **`@prisma/adapter-pg`** — Prisma uses the pg adapter; `prisma.$connect()` is not needed

---

### Architecture Compliance

- ✅ Route handler calls `next(err)` — never `res.status(500).json(...)` directly
- ✅ Zod validation via `validateBody` middleware before business logic
- ✅ `requireAuth` on all `/api/users/*` routes
- ✅ BMR + floors calculated server-side — never trust client-submitted floor values
- ✅ `unitConverter.ts`, `bmrCalculator.ts`, `floorCalculator.ts` are pure functions — no React, no side effects
- ✅ TanStack Query for server state — no Zustand for config data
- ✅ `@/` alias in all frontend imports
- ✅ Test files co-located with source
- ✅ API success response: direct object, no envelope wrapper
- ✅ API error response: `{ error: "CODE", message: "..." }`

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Task 5 complete: `OnboardingPage.tsx` implemented as 3-step form with full Zod validation, TDEE pre-fill, imperial/metric toggle, guard redirects, and iOS touch target compliance.
- `apps/frontend/src/schemas/onboarding.ts` created with `step1Schema` (incl. `superRefine` for conditional inches validation), `step2Schema`, `step3Schema`.
- `computeTDEE` extracted as file-scope helper used by both `handleNextStep2` and `handleTargetModeChange`.
- **Product decision 2026-04-24**: calorie minimum changed from 1,400 to 1,200 cal — shorter women can have healthy targets in this range. `step3Schema` and story AC4 updated accordingly.
- Task 1.7: marked complete — migration ran successfully (`20260424004339_add_user_config_biometrics`). Recommend verifying columns in Neon console before marking story done.
- All 24 existing tests pass. TypeScript: no errors.

### File List

- `apps/backend/prisma/schema.prisma` (modified)
- `apps/backend/prisma/migrations/20260424004339_add_user_config_biometrics/migration.sql` (created)
- `apps/backend/src/index.ts` (modified — mounted usersRouter)
- `apps/backend/src/routes/users.ts` (fixed bug + completed)
- `apps/backend/src/schemas/userConfigSchemas.ts` (updated)
- `apps/backend/tests/api/users-config.test.ts` (created)
- `apps/frontend/src/api/useUserConfig.ts` (created)
- `apps/frontend/src/lib/bmrCalculator.ts` (created)
- `apps/frontend/src/lib/bmrCalculator.test.ts` (created)
- `apps/frontend/src/lib/floorCalculator.ts` (created)
- `apps/frontend/src/lib/floorCalculator.test.ts` (created)
- `apps/frontend/src/lib/unitConverter.ts` (created)
- `apps/frontend/src/lib/unitConverter.test.ts` (created)
- `apps/frontend/src/schemas/onboarding.ts` (created)
- `apps/frontend/src/pages/OnboardingPage.tsx` (replaced placeholder)
- `tests/e2e/onboarding.spec.ts` (created)
