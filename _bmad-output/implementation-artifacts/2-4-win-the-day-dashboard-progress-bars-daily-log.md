# Story 2.4: Win the Day Dashboard — Progress Bars & Daily Log

Status: ready-for-dev

## Why This Story Matters

Stories 2.1, 2.2, and 2.3 were pure infrastructure — databases, forms, and pure functions that Elizabeth has never seen. Story 2.4 is the moment she actually uses the app. It is where everything that was built becomes real: a working dashboard that shows her three progress bars colored by zone, her Cheat Codes always visible without navigation, and inline inputs that update the bars live as she types.

The entire design philosophy of Vault 1 — amber is neutral, not red; "below floor" is data, not failure; Day Complete is always pressable — first lands here. If the progress bar shows red, if the zone label says "missed," or if the bar color is wrong, the whole emotional premise collapses on first use.

The `lib/zoneCalculator.ts` engine from Story 2.3 exists precisely for this moment. This story wires it up to real pixels for the first time.

> **Before You Start**
>
> ⚠️ **The zone color CSS tokens in `index.css` are ALL set to `transparent`.** Nothing will look right until you fill them in. Do this first, before building any component. The token values are in the Dev Notes below.
>
> ⚠️ **`--color-zone-amber` is MISSING from `index.css`.** The `zone-amber` color (protein/steps below floor) has no CSS token yet. You must ADD it alongside filling in the others.
>
> ⚠️ **No `DailyLog` Prisma model exists.** The database has no table for daily logs yet. A migration is required before any backend work.
>
> ⚠️ **No `/api/daily-logs` route exists.** Create `apps/backend/src/routes/logs.ts` from scratch.
>
> ⚠️ **`DashboardPage.tsx` is nearly empty** — just a title, a Settings link, and a logout button. This story replaces its entire body. Keep the Settings link and logout button accessible (somewhere on the page).
>
> ⚠️ **Do NOT build Day Complete functionality in this story.** The Day Complete button is Story 2.5. For this story, render a disabled placeholder button with the label "DAY COMPLETE" — it must be visible but non-functional.
>
> ⚠️ **Do NOT build goal tracking in this story.** The Active Goals section is Epic 3. Render a static placeholder: _"Set up your weekly goals to track them here"_.
>
> ⚠️ **Architecture doc paths are wrong.** It shows `client/` and `server/` — actual paths are `apps/frontend/` and `apps/backend/`.

---

## Story

As Elizabeth,
I want to see my daily progress as color-coded floor-based progress bars and be able to log my calories, protein, steps, and workout from the dashboard,
so that I can check in at any point in the day and see where I stand without judgment.

## Acceptance Criteria

**AC1:** Given I'm logged in and on the dashboard, when the page loads, then I see three progress bars (calories, protein, steps) and a workout checkbox, all sourcing zone colors from `lib/zoneCalculator.ts`.

**AC2:** Given I have no log entry for today, when the dashboard loads, then all progress bars start at zero in their below-floor (amber) zone state.

**AC3:** Given I enter a value in the calorie input, when I type each character, then the calorie progress bar updates in real time with the correct zone color and label (live zone update — no save step required for the visual).

**AC4:** Given a calorie value at 1,850 with a target of 1,800 and ceiling of 2,000, when the bar renders, then it shows `zone-amber-over` "Heads up" — not red, not a failure state.

**AC5:** Given my Cheat Codes exist, when the dashboard is displayed, then all Cheat Codes are visible without any navigation required.

**AC6:** Given the dashboard, when rendered on a 320px–375px viewport, then all progress bars, inputs, and Cheat Codes are visible with no horizontal scroll.

**AC7:** Given each progress bar, when rendered, then it has `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and `aria-label` with zone description.

**AC8:** Given the active goals section, when no goals have been set up yet (pre-Epic 3), then a placeholder message is shown: "Set up your weekly goals to track them here."

---

## Tasks / Subtasks

- [x] Task 1: Fill in zone color CSS tokens
    - [x] 1.1 Open `apps/frontend/src/index.css`, find the zone color section (search for `--color-zone-amber-low`)
    - [x] 1.2 Replace all `transparent` values with the hex values from Dev Notes below
    - [x] 1.3 ADD `--color-zone-amber` token (it does not exist yet — add it after `--color-zone-amber-low`)
    - [x] 1.4 Verify in browser that a test element with zone class shows a visible color

- [ ] Task 2: Add `DailyLog` Prisma model and run migration
    - [ ] 2.1 Add `DailyLog` model to `apps/backend/prisma/schema.prisma` (see Dev Notes for exact shape)
    - [ ] 2.2 Add `dailyLogs DailyLog[]` relation to the `User` model
    - [ ] 2.3 Run `npx prisma migrate dev --name add_daily_log` from `apps/backend/`
    - [ ] 2.4 Verify the `daily_logs` table appears in Neon

- [ ] Task 3: Backend — Zod schema for logs
    - [ ] 3.1 Create `apps/backend/src/schemas/logSchemas.ts` with `upsertLogSchema` (see Dev Notes)

- [ ] Task 4: Backend — Create logs route
    - [ ] 4.1 Create `apps/backend/src/routes/logs.ts`
    - [ ] 4.2 `GET /today` — return today's log or `null` (use `requireAuth` middleware)
    - [ ] 4.3 `POST /` — upsert log for the given `logDate` (upsert by `userId` + `logDate`)
    - [ ] 4.4 Follow error handling pattern: always call `next(err)`, never `res.status(500).json(...)` directly
    - [ ] 4.5 Mount in `apps/backend/src/index.ts`: `app.use('/api/daily-logs', logsRouter)`

- [ ] Task 5: Frontend — API hook
    - [ ] 5.1 Create `apps/frontend/src/api/useDailyLog.ts`
    - [ ] 5.2 `useTodayLog()` — `useQuery` for `GET /api/daily-logs/today`, returns `DailyLog | null`
    - [ ] 5.3 `useUpsertLog()` — `useMutation` for `POST /api/daily-logs`, invalidates `['log', 'today']` on success
    - [ ] 5.4 Follow existing hook patterns: `import.meta.env.VITE_API_URL`, `credentials: 'include'`

- [ ] Task 6: Frontend — `ProgressBar` component
    - [ ] 6.1 Create `apps/frontend/src/components/dashboard/ProgressBar.tsx`
    - [ ] 6.2 Props: `value: number | null`, `metric: 'calories' | 'protein' | 'steps'`, `targets: UserTargets`, `label: string`
    - [ ] 6.3 Compute `zoneResult = getZoneColor(metric, value ?? 0, targets)` inside the component
    - [ ] 6.4 Fill percentage: `Math.min(100, Math.round(((value ?? 0) / targets[metricTarget]) * 100))` (see Dev Notes for which target key to use per metric)
    - [ ] 6.5 Draw a floor marker line at `(floor / target) × 100%` position on the track (a thin vertical divider)
    - [ ] 6.6 Apply zone color from CSS token via Tailwind (see Dev Notes for class pattern)
    - [ ] 6.7 Always render zone label text alongside the bar — color is NEVER the sole indicator (NFR-A3)
    - [ ] 6.8 Add ARIA attributes: `role="progressbar"`, `aria-valuenow`, `aria-valuemin={0}`, `aria-valuemax`, `aria-label`
    - [ ] 6.9 Create `apps/frontend/src/components/dashboard/ProgressBar.test.tsx` with the tests in Dev Notes

- [ ] Task 7: Frontend — `CheatCodes` component
    - [ ] 7.1 Create `apps/frontend/src/components/dashboard/CheatCodes.tsx`
    - [ ] 7.2 Use `useCheatCodes()` hook (already exists at `apps/frontend/src/api/useCheatCodes.ts`)
    - [ ] 7.3 Render as ambient band: eyebrow label "⚡ CHEAT CODES" + list of entries + yellow bottom border separator
    - [ ] 7.4 Add `aria-label="Cheat Codes — active coaching strategies"`, each entry as `<li>` in accessible list
    - [ ] 7.5 Handle loading state: show skeleton or nothing while cheat codes load

- [ ] Task 8: Frontend — Rebuild `DashboardPage.tsx`
    - [ ] 8.1 Load `useTodayLog()` for existing log data (may be `null` on first visit)
    - [ ] 8.2 Load `useUserConfig()` for targets/floors/ceilings (used in ProgressBar components)
    - [ ] 8.3 Initialise local state for each metric from the fetched log (or 0/null if no log yet)
    - [ ] 8.4 App header: "WIN THE DAY" (VT323 font, `#FFD700`) + today's date right-aligned
    - [ ] 8.5 Cheat Codes band: `<CheatCodes />` directly below header
    - [ ] 8.6 Today's Metrics panel (Card): `<ProgressBar />` row for each of calories, protein, steps
    - [ ] 8.7 Each metric row: label + current value display + `<ProgressBar />` + inline numeric `<input>`
    - [ ] 8.8 Inline input: controlled by local state, updates progress bar live on every keystroke; persists to server on blur (`useUpsertLog.mutate(...)`)
    - [ ] 8.9 Workout: shadcn `<Checkbox>` toggle — updates server immediately on change (no blur needed)
    - [ ] 8.10 Active Goals panel (Card): static placeholder — `"Set up your weekly goals to track them here"`
    - [ ] 8.11 Day Complete button placeholder: render a disabled `<Button>` with "DAY COMPLETE" label — always visible, always at bottom
    - [ ] 8.12 Keep Settings link and Logout button accessible (small, non-competing with primary layout)
    - [ ] 8.13 Input `font-size` must be `16px` minimum (prevents iOS Safari auto-zoom on focus)
    - [ ] 8.14 All interactive elements minimum `44×44px` touch target (NFR-A4)
    - [ ] 8.15 Layout: single column, max-width 480px centered, no horizontal scroll at 320px

---

## Dev Notes

### Zone Color CSS Tokens — Fill These In First

**File:** `apps/frontend/src/index.css`

Replace the `transparent` values:

```css
--color-zone-amber-low: #a87800; /* calories below BMR floor — muted gold */
--color-zone-green: #22c55e; /* on track (floor → target) */
--color-zone-amber-over: #f97316; /* calories target → ceiling — amber-orange */
--color-zone-orange: #ea580c; /* "Rad Zone" (calories above ceiling) */
--color-zone-blue: #3b82f6; /* bonus (protein/steps above target) */
```

Also ADD this new token immediately after `--color-zone-amber-low` (it is currently MISSING):

```css
--color-zone-amber: #a87800; /* protein/steps below floor — same muted gold */
```

`zone-amber-low` and `zone-amber` are the same visual color — the distinction exists in code for semantic clarity only (calories use `amber-low`, protein/steps use `amber`).

**How to use zone colors in Tailwind v4:** Check whether zone tokens are inside `@theme {}` or `:root {}` in `index.css`. If they're in `@theme`, use `bg-zone-amber-low` syntax. If they're in `:root`, use `bg-[var(--color-zone-amber-low)]` syntax. Look at how existing tokens (e.g. `--color-primary`) are referenced in the existing components to determine which pattern the project uses.

---

### Prisma `DailyLog` Model

Add to `apps/backend/prisma/schema.prisma`:

```prisma
model DailyLog {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")
  logDate     DateTime @db.Date @map("log_date")
  calories    Int?
  protein     Int?
  steps       Int?
  workoutDone Boolean  @default(false) @map("workout_done")
  dayComplete Boolean  @default(false) @map("day_complete")
  mood        String?
  roughDay    Boolean? @map("rough_day")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, logDate])
  @@map("daily_logs")
}
```

Also add to the `User` model:

```prisma
dailyLogs   DailyLog[]
```

`dayComplete`, `mood`, and `roughDay` are Story 2.5 fields — add them to the schema NOW to avoid a second migration, but do not wire them up in this story. The `GET /today` and `POST /` endpoints can safely include them as `null`/`false` in responses.

`@db.Date` stores a date-only value (no time component) in PostgreSQL — this is the correct type for `logDate`. Prisma returns it as an ISO date string `"2026-05-08"` in JSON.

---

### Zod Schema (`apps/backend/src/schemas/logSchemas.ts`)

```typescript
import { z } from 'zod';

export const upsertLogSchema = z.object({
    logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'logDate must be YYYY-MM-DD'),
    calories: z.number().int().min(0).nullable().optional(),
    protein: z.number().int().min(0).nullable().optional(),
    steps: z.number().int().min(0).nullable().optional(),
    workoutDone: z.boolean().optional(),
});

export type UpsertLogInput = z.infer<typeof upsertLogSchema>;
```

---

### Backend Route Pattern (`apps/backend/src/routes/logs.ts`)

Follow the pattern established in `cheatCodes.ts` exactly. Key points:

- Import `requireAuth` from `../middleware/auth.js`
- Import `validate` from `../middleware/validate.js`
- Use `req.session.userId` for the authenticated user ID (same as existing routes)
- Always call `next(err)` for errors — never `res.status(500).json(...)` directly
- `GET /today`: compute today's date as `new Date(new Date().toISOString().split('T')[0])` and query for `{ userId, logDate: today }`. Return `log` or `null` with status `200` (not 404 — `null` is a valid "no log yet" state)
- `POST /` (upsert): use Prisma `upsert` with `where: { userId_logDate: { userId, logDate } }`, `create: { ...data }`, `update: { ...data without userId/logDate }`
- Mount: in `index.ts`, add `import logsRouter from './routes/logs.js'` and `app.use('/api/daily-logs', logsRouter)` before the error handler

---

### Frontend API Hook (`apps/frontend/src/api/useDailyLog.ts`)

Mirror `useCheatCodes.ts` for query pattern, `useUserConfig.ts` for mutation invalidation pattern:

```typescript
// useTodayLog returns DailyLog | null — both are valid states
export function useTodayLog() {
    return useQuery({
        queryKey: ['log', 'today'],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/daily-logs/today`, {
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Failed to fetch today log');
            return res.json() as Promise<DailyLog | null>;
        },
    });
}

// useUpsertLog invalidates ['log', 'today'] on success
export function useUpsertLog() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: UpsertLogInput) => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/daily-logs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to save log');
            return res.json() as Promise<DailyLog>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['log', 'today'] });
        },
    });
}
```

Define a `DailyLog` TypeScript type in `apps/frontend/src/types/index.ts` (file exists — add to it):

```typescript
export interface DailyLog {
    id: string;
    userId: string;
    logDate: string; // "YYYY-MM-DD"
    calories: number | null;
    protein: number | null;
    steps: number | null;
    workoutDone: boolean;
    dayComplete: boolean;
    mood: string | null;
    roughDay: boolean | null;
    createdAt: string;
    updatedAt: string;
}
```

Also define `UpsertLogInput` (or import it from a shared schema file):

```typescript
export interface UpsertLogInput {
    logDate: string;
    calories?: number | null;
    protein?: number | null;
    steps?: number | null;
    workoutDone?: boolean;
}
```

---

### `ProgressBar` Component Design

**File:** `apps/frontend/src/components/dashboard/ProgressBar.tsx`

**Props:**

```typescript
interface ProgressBarProps {
    value: number | null;
    metric: 'calories' | 'protein' | 'steps';
    targets: UserTargets;
    label: string; // "Calories", "Protein", "Steps"
}
```

Import `UserTargets` and `getZoneColor` from `@/lib/zoneCalculator`.

**Fill percentage calculation:**

| Metric   | 100% point       | Formula                                                                    |
| -------- | ---------------- | -------------------------------------------------------------------------- |
| calories | `calorieCeiling` | `Math.min(100, Math.round(((value ?? 0) / targets.calorieCeiling) * 100))` |
| protein  | `proteinTarget`  | `Math.min(100, Math.round(((value ?? 0) / targets.proteinTarget) * 100))`  |
| steps    | `stepsTarget`    | `Math.min(100, Math.round(((value ?? 0) / targets.stepsTarget) * 100))`    |

Using `calorieCeiling` for the calorie bar makes the entire zone range (floor → target → ceiling) visible within the 0–100% visual space. The bar is "full" when calories hit the ceiling.

**Floor marker:** Render a thin `1px` vertical line at the floor percentage position on the track. This gives a visual reference for "below floor zone vs on-track zone":

- Calories: `floorPct = Math.round((targets.calorieFloor / targets.calorieCeiling) * 100)`
- Protein: `floorPct = Math.round((targets.proteinFloor / targets.proteinTarget) * 100)`
- Steps: `floorPct = Math.round((targets.stepsFloor / targets.stepsTarget) * 100)`

**ARIA attributes (required for every progress bar):**

```tsx
<div
  role="progressbar"
  aria-valuenow={value ?? 0}
  aria-valuemin={0}
  aria-valuemax={metric === 'calories' ? targets.calorieCeiling : metric === 'protein' ? targets.proteinTarget : targets.stepsTarget}
  aria-label={`${label}: ${zoneResult.label} — ${value ?? 0} logged`}
>
```

**Zone label copy (non-negotiable — never use "missed", "failed", "below target"):**

| `ZoneColor`       | Label         | Color     |
| ----------------- | ------------- | --------- |
| `zone-amber-low`  | "Below floor" | `#A87800` |
| `zone-amber`      | "Below floor" | `#A87800` |
| `zone-green`      | "On track"    | `#22C55E` |
| `zone-amber-over` | "Heads up"    | `#F97316` |
| `zone-orange`     | "Rad Zone"    | `#EA580C` |
| `zone-blue`       | "Bonus"       | `#3B82F6` |

These labels come from `zoneResult.label` — do NOT hardcode them in the component.

---

### `ProgressBar` Tests (`ProgressBar.test.tsx`)

Place at `apps/frontend/src/components/dashboard/ProgressBar.test.tsx`. Use `@testing-library/react` (check `apps/frontend/package.json` for the correct test library — project uses Vitest). Key tests:

```
- Renders with value=0 → aria-valuenow=0, shows "Below floor" zone label
- Renders calorie value at floor → zone label "On track"
- Renders calorie value above ceiling → zone label "Rad Zone"
- Renders protein value above target → zone label "Bonus"
- ARIA: role="progressbar" is present
- ARIA: aria-label contains the zone description
```

If testing UI components proves complex, prioritize the pure function tests (already done in Story 2.3) over UI component tests. But add at least a smoke test that the component renders without crashing.

---

### `CheatCodes` Component

**File:** `apps/frontend/src/components/dashboard/CheatCodes.tsx`

Uses the existing `useCheatCodes()` hook from `@/api/useCheatCodes`. This hook is already built and tested.

Visual spec (from UX design):

- Eyebrow label: `⚡ CHEAT CODES` (small caps, Share Tech Mono, `#FFD700`)
- List of 0–3 cheat code entries (Share Tech Mono, body text)
- Yellow bottom border separator (`border-b border-[#FFD700]` or equivalent thick separator)
- `aria-label="Cheat Codes — active coaching strategies"` on the container
- Each entry as `<li>` within an `<ul>`

If `useCheatCodes()` returns an empty array (no cheat codes set up yet), render the band with placeholder text: "No Cheat Codes yet — add them in Settings."

---

### `DashboardPage.tsx` — Live Update Pattern

The key UX requirement is: progress bars update character-by-character as values are typed, but the server is only called on blur (not on every keystroke).

```typescript
// Local state mirrors what's shown in the inputs
const [caloriesInput, setCaloriesInput] = useState<string>('');
const [proteinInput, setProteinInput] = useState<string>('');
const [stepsInput, setStepsInput] = useState<string>('');

// When today's log loads, seed local state
useEffect(() => {
    if (todayLog) {
        setCaloriesInput(todayLog.calories?.toString() ?? '');
        setProteinInput(todayLog.protein?.toString() ?? '');
        setStepsInput(todayLog.steps?.toString() ?? '');
    }
}, [todayLog]);

// Pass parsed numeric value to ProgressBar
const caloriesValue = caloriesInput === '' ? null : parseInt(caloriesInput, 10) || 0;

// On blur: save to server
const handleCaloriesBlur = () => {
    upsertLog.mutate({
        logDate: new Date().toISOString().split('T')[0],
        calories: caloriesValue,
    });
};
```

Input type: `type="number"` with `inputMode="decimal"` for mobile keyboard.
Input `min="0"` to prevent negative values.
Font size: `text-[16px]` or `text-base` — must be ≥16px to prevent iOS Safari auto-zoom.

**The `UserTargets` object for `ProgressBar`:** Build it from `userConfig` data:

```typescript
const targets: UserTargets | null = userConfig
    ? {
          calorieFloor: userConfig.calorieFloor,
          calorieTarget: userConfig.calorieTarget,
          calorieCeiling: userConfig.calorieCeiling,
          proteinFloor: userConfig.proteinFloor,
          proteinTarget: userConfig.proteinTarget,
          stepsFloor: userConfig.stepsFloor,
          stepsTarget: userConfig.stepsTarget,
      }
    : null;
```

Render progress bars only when `targets !== null` (i.e., `userConfig` has loaded). Show a loading state while `useUserConfig()` is pending.

---

### What Already Exists — Do NOT Modify

- `apps/frontend/src/lib/zoneConstants.ts` — `ZONE_COLORS`, `ZoneColor`, `ZoneResult`, `TIER_LABELS`, `HARD_MIN_CALORIES`, `CALORIE_CEILING_BUFFER` — all exist and are correct
- `apps/frontend/src/lib/zoneCalculator.ts` — `getZoneColor()`, `UserTargets` interface — already built and tested
- `apps/frontend/src/api/useCheatCodes.ts` — `useCheatCodes()` hook — use it as-is in `CheatCodes.tsx`
- `apps/frontend/src/api/useUserConfig.ts` — `useUserConfig()` hook — use it to get targets/floors
- `apps/frontend/src/api/useAuth.ts` — `useLogout()` hook — keep logout functionality in DashboardPage
- `apps/frontend/src/components/ui/button.tsx` — shadcn/ui Button — use for Day Complete placeholder and workout checkbox
- `apps/frontend/src/components/ui/card.tsx` — shadcn/ui Card — use for metric panels
- `apps/frontend/src/components/ui/input.tsx` — shadcn/ui Input — use for metric inputs
- `apps/backend/src/middleware/auth.js` — `requireAuth` middleware — use on all log endpoints
- `apps/backend/src/middleware/validate.js` — Zod validation middleware — use for POST /api/daily-logs
- `apps/backend/src/middleware/errorHandler.js` — central error handler — always call `next(err)`, never bypass

---

### Project Structure — What to Create

```
apps/frontend/src/
├── api/
│   └── useDailyLog.ts          ← CREATE NEW
├── components/dashboard/
│   ├── ProgressBar.tsx         ← CREATE NEW
│   ├── ProgressBar.test.tsx    ← CREATE NEW
│   └── CheatCodes.tsx          ← CREATE NEW
├── pages/
│   └── DashboardPage.tsx       ← MODIFY (full rebuild of body, keep Settings link + logout)
└── types/
    └── index.ts                ← MODIFY (add DailyLog and UpsertLogInput types)

apps/backend/src/
├── routes/
│   └── logs.ts                 ← CREATE NEW
├── schemas/
│   └── logSchemas.ts           ← CREATE NEW
└── index.ts                    ← MODIFY (mount logsRouter)

apps/backend/prisma/
└── schema.prisma               ← MODIFY (add DailyLog model, add dailyLogs to User)
```

---

### Architecture Compliance

- ✅ Zone colors sourced ONLY from `ZONE_COLORS` in `zoneConstants.ts` via `getZoneColor()` — no inline hex values in components
- ✅ All zone labels come from `zoneResult.label` — no hardcoded strings in components
- ✅ Server state (today's log, user config, cheat codes) owned by TanStack Query — not stored in local state beyond the controlled input values
- ✅ Input state: local `useState` is the controlled-input value (ephemeral, not server state)
- ✅ Backend error handling: `next(err)` pattern — never `res.status(500).json(...)` from route handlers
- ✅ Prisma naming: PascalCase model → snake_case table via `@@map`, camelCase fields → snake_case columns via `@map`
- ✅ API endpoint: `/api/daily-logs` (plural, kebab-case per architecture naming conventions)
- ✅ Component files: PascalCase (`ProgressBar.tsx`)
- ✅ Test co-location: `ProgressBar.test.tsx` next to `ProgressBar.tsx`

### ADHD UX Invariants — Must Not Break

- `zone-amber` and `zone-amber-low` are NEUTRAL states. Zone labels say "Below floor", never "Missed" or "Below target"
- No red (`#FF0000` or any red-family color) appears anywhere on the dashboard
- The "DAY COMPLETE" placeholder button is always visible and renders at bottom of layout
- No streak counter, "X days in a row", or days-missed indicator anywhere on this page
- `zone-amber-over` for calories is labelled "Heads up" — not "Over target", not "Too many"

---

### References

- Story requirements and ACs: [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4]
- Zone color values and visual spec: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Color System]
- Dashboard layout order: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Layout Structure]
- FloorProgressBar component spec: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Custom Components]
- Zone CSS token names: [Source: apps/frontend/src/index.css, lines ~138–147]
- `UserTargets` interface: [Source: apps/frontend/src/lib/zoneCalculator.ts]
- `getZoneColor()` function: [Source: apps/frontend/src/lib/zoneCalculator.ts]
- `useCheatCodes()` hook: [Source: apps/frontend/src/api/useCheatCodes.ts]
- `useUserConfig()` hook: [Source: apps/frontend/src/api/useUserConfig.ts]
- Existing route pattern: [Source: apps/backend/src/routes/cheatCodes.ts]
- API endpoint naming convention: [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns]
- ARIA progressbar requirements: [Source: _bmad-output/planning-artifacts/epics.md#NFR-A2, NFR-A3]
- Live zone update UX pattern: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Live zone update pattern]

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
