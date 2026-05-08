# Story 2.3: Zone Calculation Engine

Status: done

## Why This Story Matters

The zone calculation engine is the emotional core of Vault 1. Every progress bar, every colour, every label on the dashboard flows through these two files — `lib/zoneConstants.ts` and `lib/zoneCalculator.ts`. If the zones are wrong, Elizabeth gets the wrong emotional signal. If "Heads up" fires when it should say "On track", the whole ADHD-aware design falls apart.

This story creates the single source of truth for zone logic. Story 2.4 (dashboard progress bars) cannot safely be built until this engine exists and is fully tested. The architecture mandates it explicitly: _"Floor/Zone Calculation Engine must be isolated in `lib/zoneCalculator.ts` before any progress bar is built."_

There is no UI, no API, no Prisma migration in this story — just two pure TypeScript files and a comprehensive test suite. That simplicity is the point: these functions must be clean, fast, and correct without any framework dependency.

> **Before You Start**
>
> ⚠️ **Architecture doc shows `client/` and `server/` paths — those are wrong.** Actual paths are `apps/frontend/` and `apps/backend/`. Always use the actual paths.
>
> ⚠️ **Neither `lib/zoneConstants.ts` nor `lib/zoneCalculator.ts` exists yet.** Create both from scratch. Do NOT modify `lib/floorCalculator.ts`, `lib/bmrCalculator.ts`, or `lib/unitConverter.ts` — they are out of scope.
>
> ⚠️ **`FLOOR_OFFSETS` must NOT appear in `zoneConstants.ts`.** Floors are not fixed offsets — they are computed from BMR and targets in Story 2.1 and persisted in `UserConfig`. They are passed to `getZoneColor` as part of the `targets` argument.
>
> ⚠️ **This story is frontend-only.** No backend changes, no Prisma migrations, no API routes.
>
> ⚠️ **Test file is co-located.** Place `zoneCalculator.test.ts` next to `zoneCalculator.ts` at `apps/frontend/src/lib/zoneCalculator.test.ts` — do NOT use a separate `__tests__` folder.
>
> ⚠️ **Test framework is Vitest.** Use `import { describe, it, expect } from 'vitest'` — follow the exact pattern in `apps/frontend/src/lib/bmrCalculator.test.ts`.
>
> ⚠️ **Use `@/` imports.** All imports within `apps/frontend/src/` must use the `@/` alias (e.g. `import { ZONE_COLORS } from '@/lib/zoneConstants'`).

---

## Story

As a developer,
I want a tested, isolated zone calculation library (`lib/zoneCalculator.ts`) that computes color zones and labels for all three metrics given a value and user targets,
so that all progress bar components source their zone logic from a single authoritative place with no magic values.

## Acceptance Criteria

**AC1:** Given `lib/zoneConstants.ts` exists, when imported, then it exports `ZONE_COLORS`, `TIER_LABELS`, `HARD_MIN_CALORIES`, and `CALORIE_CEILING_BUFFER` constants — no inline color values or magic numbers exist anywhere else in the codebase (`FLOOR_OFFSETS` does not exist — floors are not fixed offsets).

**AC2:** Given a calorie value below the floor, when `getZoneColor('calories', value, targets)` is called, then it returns `zone-amber-low` with label "Below floor".

**AC3:** Given a calorie value between floor and target, when `getZoneColor('calories', value, targets)` is called, then it returns `zone-green` with label "On track".

**AC4:** Given a calorie value between calorieTarget and calorieCeiling, when `getZoneColor('calories', value, targets)` is called (where targets includes `{ calorieFloor, calorieTarget, calorieCeiling }`), then it returns `zone-amber-over` with label "Heads up".

**AC5:** Given a calorie value above calorieCeiling, when `getZoneColor('calories', value, targets)` is called, then it returns `zone-orange` with label "Rad Zone".

**AC6:** Given a protein or steps value above the target, when `getZoneColor('protein' | 'steps', value, targets)` is called, then it returns `zone-blue` with label "Bonus".

**AC7:** Given `lib/zoneCalculator.test.ts` exists, when the test suite runs (`npm test` in `apps/frontend/`), then all zone boundary conditions pass including: below `HARD_MIN_CALORIES`, at calorieFloor (= BMR), between calorieFloor and calorieTarget, between calorieTarget and calorieCeiling, above calorieCeiling.

---

## Tasks / Subtasks

- [x] Task 1: Create `apps/frontend/src/lib/zoneConstants.ts`
    - [x] 1.1 Export `ZONE_COLORS` object mapping zone identifiers to their string keys (see Dev Notes for exact shape)
    - [x] 1.2 Export `TIER_LABELS` object for weekly consistency tier labels (values used by `consistencyCalc.ts` in Story 4.1 — define now so they're in place)
    - [x] 1.3 Export `HARD_MIN_CALORIES` constant (value: `1200` — minimum safe calorie floor regardless of BMR; used as a test boundary)
    - [x] 1.4 Export `CALORIE_CEILING_BUFFER` constant (value: `200` — the buffer added to calorieTarget to compute calorieCeiling = calorieTarget + 200)
    - [x] 1.5 Export `ZoneColor` TypeScript type union of all valid zone string identifiers
    - [x] 1.6 Export `ZoneResult` interface `{ color: ZoneColor; label: string }`

- [x] Task 2: Create `apps/frontend/src/lib/zoneCalculator.ts`
    - [x] 2.1 Define `UserTargets` interface with fields: `calorieFloor`, `calorieTarget`, `calorieCeiling`, `proteinFloor`, `proteinTarget`, `stepsFloor`, `stepsTarget` (all `number`)
    - [x] 2.2 Implement `getZoneColor(metric: 'calories' | 'protein' | 'steps', value: number, targets: UserTargets): ZoneResult`
    - [x] 2.3 Calorie logic (asymmetric): `value < calorieFloor` → `zone-amber-low` / "Below floor"; `value >= calorieFloor && value <= calorieTarget` → `zone-green` / "On track"; `value > calorieTarget && value <= calorieCeiling` → `zone-amber-over` / "Heads up"; `value > calorieCeiling` → `zone-orange` / "Rad Zone"
    - [x] 2.4 Protein logic (symmetric): `value < proteinFloor` → `zone-amber` / "Below floor"; `value >= proteinFloor && value <= proteinTarget` → `zone-green` / "On track"; `value > proteinTarget` → `zone-blue` / "Bonus"
    - [x] 2.5 Steps logic (symmetric, identical pattern to protein): `value < stepsFloor` → `zone-amber` / "Below floor"; `value >= stepsFloor && value <= stepsTarget` → `zone-green` / "On track"; `value > stepsTarget` → `zone-blue` / "Bonus"
    - [x] 2.6 No inline color strings — all color values sourced from `ZONE_COLORS` in `zoneConstants.ts`
    - [x] 2.7 No React imports, no side effects — pure function only

- [x] Task 3: Create `apps/frontend/src/lib/zoneCalculator.test.ts`
    - [x] 3.1 Test calorie zone: value below `HARD_MIN_CALORIES` (e.g. 800) → `zone-amber-low`
    - [x] 3.2 Test calorie zone: value at `calorieFloor` exactly (boundary at-floor) → `zone-green` (floor is inclusive lower bound of green zone)
    - [x] 3.3 Test calorie zone: value below `calorieFloor` (e.g. 1 below floor) → `zone-amber-low`
    - [x] 3.4 Test calorie zone: value between floor and target → `zone-green` "On track"
    - [x] 3.5 Test calorie zone: value at `calorieTarget` exactly → `zone-green` (target is inclusive upper bound of green zone)
    - [x] 3.6 Test calorie zone: value 1 above `calorieTarget` → `zone-amber-over` "Heads up"
    - [x] 3.7 Test calorie zone: value between target and ceiling → `zone-amber-over` "Heads up"
    - [x] 3.8 Test calorie zone: value at `calorieCeiling` exactly → `zone-amber-over` (ceiling is inclusive upper bound of amber-over)
    - [x] 3.9 Test calorie zone: value 1 above `calorieCeiling` → `zone-orange` "Rad Zone"
    - [x] 3.10 Test protein zone: below floor → `zone-amber` "Below floor"
    - [x] 3.11 Test protein zone: at floor (inclusive) → `zone-green` "On track"
    - [x] 3.12 Test protein zone: between floor and target → `zone-green` "On track"
    - [x] 3.13 Test protein zone: at target (inclusive) → `zone-green` "On track"
    - [x] 3.14 Test protein zone: above target → `zone-blue` "Bonus"
    - [x] 3.15 Test steps zone: mirrors protein — below floor, at floor, between, at target, above target
    - [x] 3.16 Test label strings are present on every result (never undefined)
    - [x] 3.17 Run `npm test` in `apps/frontend/` and confirm all tests pass

---

## Dev Notes

### What Already Exists — Do NOT Modify

- **`lib/floorCalculator.ts`** — exists, exports `calculateFloors()` and `FloorResult`. Do not touch.
- **`lib/bmrCalculator.ts`** — exists, exports `calculateBMR()` and `calculateTDEE()`. Do not touch.
- **`lib/unitConverter.ts`** — exists. Do not touch.
- **`lib/utils.ts`** — exists (shadcn/ui utility). Do not touch.
- No test runner setup needed — Vitest is already configured; `npm test` runs `vitest run`.

---

### `lib/zoneConstants.ts` — Full Implementation

```typescript
// apps/frontend/src/lib/zoneConstants.ts

export type ZoneColor =
    | 'zone-amber-low'
    | 'zone-green'
    | 'zone-amber-over'
    | 'zone-orange'
    | 'zone-amber'
    | 'zone-blue';

export interface ZoneResult {
    color: ZoneColor;
    label: string;
}

// Zone identifier strings — all zone color values across the app must come from here.
// Components map these to Tailwind classes or CSS custom properties.
export const ZONE_COLORS: Record<ZoneColor, ZoneColor> = {
    'zone-amber-low': 'zone-amber-low', // calorie: below floor
    'zone-green': 'zone-green', // all metrics: floor → target (on track)
    'zone-amber-over': 'zone-amber-over', // calorie: target → ceiling (heads up, not failure)
    'zone-orange': 'zone-orange', // calorie: above ceiling (rad zone)
    'zone-amber': 'zone-amber', // protein/steps: below floor (neutral, not failure)
    'zone-blue': 'zone-blue', // protein/steps: above target (bonus)
};

// Weekly consistency tier labels (used by consistencyCalc.ts in Story 4.1)
export const TIER_LABELS = {
    STANDING: 'Still Standing',           // <60%
    SURVIVING: 'Surviving the Wasteland', // 60–74%
    VETERAN: 'Wasteland Veteran',         // 75–89%
    CHOSEN: 'The Chosen One',             // 90%+
} as const;

// Absolute calorie minimum — used as test boundary for zone calculator.
// Below this value, the calorie zone is always zone-amber-low regardless of floor.
export const HARD_MIN_CALORIES = 1200;

// Buffer added to calorieTarget to compute calorieCeiling.
// calorieCeiling = calorieTarget + CALORIE_CEILING_BUFFER
export const CALORIE_CEILING_BUFFER = 200;
```

---

### `lib/zoneCalculator.ts` — Full Implementation

```typescript
// apps/frontend/src/lib/zoneCalculator.ts

import { ZONE_COLORS, type ZoneResult } from '@/lib/zoneConstants';

// Shape of user targets as persisted in UserConfig.
// All floor and ceiling values are pre-computed server-side:
//   calorieFloor  = BMR (Mifflin-St Jeor, calculated in Story 2.1)
//   calorieCeiling = calorieTarget + 200
//   proteinFloor  = round(proteinTarget × 0.8)
//   stepsFloor    = round(stepsTarget × 0.5)
export interface UserTargets {
    calorieFloor: number;
    calorieTarget: number;
    calorieCeiling: number;
    proteinFloor: number;
    proteinTarget: number;
    stepsFloor: number;
    stepsTarget: number;
}

// Returns the zone color identifier and display label for a given metric value.
// All callers must use this function — no inline zone logic anywhere in the app.
export function getZoneColor(
    metric: 'calories' | 'protein' | 'steps',
    value: number,
    targets: UserTargets
): ZoneResult {
    if (metric === 'calories') {
        return getCalorieZone(value, targets);
    }
    if (metric === 'protein') {
        return getSymmetricZone(value, targets.proteinFloor, targets.proteinTarget);
    }
    return getSymmetricZone(value, targets.stepsFloor, targets.stepsTarget);
}

// Calorie zone model is asymmetric — over-target is amber-over (neutral heads-up),
// not green. Above ceiling is orange (Rad Zone). Neither is a failure state.
function getCalorieZone(value: number, targets: UserTargets): ZoneResult {
    if (value < targets.calorieFloor) {
        return { color: ZONE_COLORS['zone-amber-low'], label: 'Below floor' };
    }
    if (value <= targets.calorieTarget) {
        return { color: ZONE_COLORS['zone-green'], label: 'On track' };
    }
    if (value <= targets.calorieCeiling) {
        return { color: ZONE_COLORS['zone-amber-over'], label: 'Heads up' };
    }
    return { color: ZONE_COLORS['zone-orange'], label: 'Rad Zone' };
}

// Protein and steps use the symmetric model:
//   below floor → amber (neutral, not failure)
//   floor → target → green (on track)
//   above target → blue (bonus)
function getSymmetricZone(value: number, floor: number, target: number): ZoneResult {
    if (value < floor) {
        return { color: ZONE_COLORS['zone-amber'], label: 'Below floor' };
    }
    if (value <= target) {
        return { color: ZONE_COLORS['zone-green'], label: 'On track' };
    }
    return { color: ZONE_COLORS['zone-blue'], label: 'Bonus' };
}
```

---

### `lib/zoneCalculator.test.ts` — Test Guidance

Follow the exact structure of `apps/frontend/src/lib/bmrCalculator.test.ts`:

- `import { describe, it, expect } from 'vitest'`
- `import { getZoneColor, type UserTargets } from '@/lib/zoneCalculator'`
- `import { HARD_MIN_CALORIES } from '@/lib/zoneConstants'`

Use a shared `targets` fixture for most tests:

```typescript
const targets: UserTargets = {
    calorieFloor: 1600, // represents BMR
    calorieTarget: 1900,
    calorieCeiling: 2100, // calorieTarget + 200
    proteinFloor: 120, // round(150 × 0.8)
    proteinTarget: 150,
    stepsFloor: 5000, // round(10000 × 0.5)
    stepsTarget: 10000,
};
```

Critical boundary tests to include:

- Calorie at exactly `calorieFloor` (e.g. 1600) → `zone-green` (floor is inclusive green lower bound)
- Calorie at exactly `calorieTarget` (e.g. 1900) → `zone-green` (target is inclusive green upper bound)
- Calorie at `calorieTarget + 1` (e.g. 1901) → `zone-amber-over`
- Calorie at exactly `calorieCeiling` (e.g. 2100) → `zone-amber-over` (ceiling is inclusive amber-over upper bound)
- Calorie at `calorieCeiling + 1` (e.g. 2101) → `zone-orange`
- Calorie below `HARD_MIN_CALORIES` (e.g. 800) → `zone-amber-low`
- Value of 0 for all three metrics → lowest zone

---

### Zone Label Copy — ADHD UX Invariants

These label strings are non-negotiable. Never use "Missed", "Failed", "Below target", or any negative language:

| Zone              | Label         |
| ----------------- | ------------- |
| `zone-amber-low`  | "Below floor" |
| `zone-green`      | "On track"    |
| `zone-amber-over` | "Heads up"    |
| `zone-orange`     | "Rad Zone"    |
| `zone-amber`      | "Below floor" |
| `zone-blue`       | "Bonus"       |

"Below floor" is intentionally used for both amber zones — it is data-neutral language, not failure language.

---

### Architecture Compliance

- ✅ Pure TypeScript functions — no React, no Zustand, no fetch, no side effects
- ✅ All zone color values come from `ZONE_COLORS` in `zoneConstants.ts` — no inline strings
- ✅ `FLOOR_OFFSETS` absent — floors are persisted values from UserConfig, not fixed deltas
- ✅ Tests co-located at `src/lib/zoneCalculator.test.ts` (not in `__tests__/`)
- ✅ `@/` imports used for all internal references
- ✅ `UserTargets` interface matches UserConfig fields in Prisma schema exactly

### Project Structure Notes

```
apps/frontend/src/lib/
├── bmrCalculator.ts        ← EXISTS (no changes)
├── bmrCalculator.test.ts   ← EXISTS (no changes) — use as test template
├── floorCalculator.ts      ← EXISTS (no changes)
├── floorCalculator.test.ts ← EXISTS (no changes)
├── unitConverter.ts        ← EXISTS (no changes)
├── unitConverter.test.ts   ← EXISTS (no changes)
├── utils.ts                ← EXISTS (no changes)
├── zoneConstants.ts        ← CREATE NEW (Task 1)
├── zoneCalculator.ts       ← CREATE NEW (Task 2)
└── zoneCalculator.test.ts  ← CREATE NEW (Task 3)
```

No other files need to be created or modified in this story.

### References

- Zone model specification: [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3]
- Architecture zone constraint: [Source: _bmad-output/planning-artifacts/architecture.md#Critical Conflict Points]
- ADHD UX invariants: [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- Test co-location pattern: [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns]
- Calorie zone diagram (asymmetric): [Source: _bmad-output/planning-artifacts/epics.md#FR13]
- UserConfig schema fields: [Source: apps/backend/prisma/schema.prisma lines 62–70]

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

- `apps/frontend/src/lib/zoneConstants.ts` — created
- `apps/frontend/src/lib/zoneCalculator.ts` — created
- `apps/frontend/src/lib/zoneCalculator.test.ts` — created
