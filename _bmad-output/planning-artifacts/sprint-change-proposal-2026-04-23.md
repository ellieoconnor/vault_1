# Sprint Change Proposal
**Date:** 2026-04-23
**Triggered by:** Story 2.1 implementation
**Scope:** Moderate
**Status:** Approved

---

## Section 1: Issue Summary

### Problem Statement

Story 2.1 (User Onboarding — Targets & Floor Setup) was designed around a 3-field form with fixed floor offsets (`calories = target − 250`, `protein = target × 0.8`, `steps = target × 0.5`). During implementation, two compounding issues were identified:

1. **The floor formula was always an oversimplification.** A flat offset produces a floor that has no relationship to the person's body. The correct floor is BMR — the biological minimum calorie requirement for that specific person. Without biometrics, this calculation is impossible.

2. **New product decisions were made.** A set of deliberate design decisions (recorded in `docs/product-decisions-floor-ceiling-ai-coach.md`, 2026-04-22) defined the complete floor/ceiling system, the required onboarding flow, a hard calorie minimum, and a long-term semantic database architecture for AI coaching.

### When/How Discovered

During Story 2.1 implementation. The `UserConfig` migration ran successfully with the old schema. The backend route (`apps/backend/src/routes/users.ts`) was partially implemented before the decision was made to correct course.

### Evidence

- `docs/product-decisions-floor-ceiling-ai-coach.md` — explicit decision record with formulas, onboarding flow, and rationale
- `apps/backend/src/routes/users.ts` — partial implementation on old schema; contains a live bug (dead `res.json(config)` unreachable after 404 branch)
- `_bmad-output/implementation-artifacts/2-1-user-onboarding-targets-floor-setup.md` — story written around old formula; Tasks 3–5 not yet started

---

## Section 2: Impact Analysis

### Epic Impact

| Epic | Impact |
|---|---|
| **Epic 2: Daily Tracking Core** | Story 2.1 requires major rewrite. Stories 2.3 and 2.7 require targeted updates. Stories 2.2, 2.4, 2.5, 2.6 unaffected. |
| **Epic 3: Goals Management** | Clean separation confirmed — "goal type" (lose/maintain/build) lives in `UserConfig`, not the goals library. No impact. |
| **Epics 4, 5** | No impact. |
| **Future AI Coaching Epic** | New future epic identified. Pgvector on Neon, three-tier goal model, structured Goal entities. Post-MVP, no immediate action. |

### Story Impact

| Story | Impact | Severity |
|---|---|---|
| **2.1** Onboarding | Major rewrite — 3-step form, biometrics, BMR calculation, TDEE suggestion, imperial/metric toggle, 1,400 hard min | High |
| **2.3** Zone Calc Engine | `FLOOR_OFFSETS` removed; `HARD_MIN_CALORIES` + `CALORIE_CEILING_BUFFER` added; `targets` object updated | Moderate |
| **2.7** Update Targets | Settings must expose biometrics; PATCH endpoint added; ceiling recalculates on target change | Moderate |
| **2.2, 2.4, 2.5, 2.6** | No changes required | None |

### Artifact Conflicts

| Artifact | Conflict |
|---|---|
| `_bmad-output/planning-artifacts/prd.md` | FR6, FR7 wrong; Journey 4 onboarding description references old formula |
| `_bmad-output/planning-artifacts/architecture.md` | Priority test targets section references old `floorCalculator.ts` signature; pgvector decision unrecorded |
| `_bmad-output/planning-artifacts/ux-design-specification.md` | Journey 4 onboarding description references old formula |
| `_bmad-output/implementation-artifacts/2-1-user-onboarding-targets-floor-setup.md` | ACs, tasks, dev notes all based on old design |
| `apps/backend/prisma/schema.prisma` | `UserConfig` missing biometrics fields; additive migration required |
| `apps/backend/src/routes/users.ts` | Partial implementation with live bug |

### Technical Impact

- **Additive Prisma migration required** — first migration (`add_user_config`) already ran in Neon; new migration (`add_user_config_biometrics`) adds columns to existing table
- **`lib/floorCalculator.ts`** — signature changes; now a thin assembler over `bmrCalculator.ts`
- **New pure functions:** `unitConverter.ts`, `bmrCalculator.ts` — both priority test targets
- **`zoneConstants.ts`** — `FLOOR_OFFSETS` removed; two new constants added
- **`zoneCalculator.ts`** — `targets` object extended to include `calorieCeiling` from `UserConfig`

---

## Section 3: Recommended Approach

### Option Selected: Direct Adjustment

Revise Story 2.1 in place, update Stories 2.3 and 2.7 to reflect the new model, update all affected artifacts, and run an additive migration. No rollback needed — the partial work is salvageable.

**Rationale:**
- The migration that ran is not wasted — it established the table; the additive migration extends it
- Nothing shipped or merged yet — all changes are pre-implementation or partial-implementation
- The change is fully contained within Epic 2 with known downstream ripples
- The pgvector/AI coaching work is explicitly post-MVP — requires only documentation now

**Effort:** Medium
**Risk:** Low — additive migration is the only technically sensitive step; all other changes are planning and partial-route fixes
**Timeline impact:** Story 2.1 expands in scope; no other stories blocked or deferred

---

## Section 4: Detailed Change Proposals

### Proposal 1 — Story 2.1: Acceptance Criteria

**Story: [2.1] User Onboarding — Targets & Floor Setup**

**REPLACE all ACs with:**

**AC1:** Given I've just registered and been redirected to `/onboarding`, when Step 1 loads, then I see required inputs: weight, height, age, biological sex (radio: Male / Female), and activity level (select: Sedentary / Lightly Active / Moderately Active / Very Active / Extra Active). I first see a measurement system toggle: "Metric (kg, cm)" / "Imperial (lbs, ft + in)" — my selection determines input labels and units. Imperial height uses two fields (feet + inches). I cannot advance without completing all fields.

**AC2:** Given I complete Step 1 and advance to Step 2, when Step 2 loads, then I see three goal type options: "Lose weight", "Maintain", "Build". I must select one before advancing.

**AC3:** Given I select a goal type and advance to Step 3, when Step 3 loads, then I see two paths:
- Option A: "Suggest a target for me" — app calculates and pre-fills a TDEE-based calorie recommendation that I can edit before confirming
- Option B: "I'll enter my own" — a blank numeric input

In both cases: I can freely edit the calorie number before submitting; the 1,400 cal hard minimum applies; I must actively confirm the number. This step also includes protein target (g) and steps target inputs.

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

### Proposal 2 — Story 2.1: Prisma Schema

**REPLACE `UserConfig` model in `apps/backend/prisma/schema.prisma`:**

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

**Migration instruction:**
> ⚠️ The first migration (`add_user_config`) already ran against Neon. Do NOT re-run it.
> Run a second additive migration:
> ```bash
> npx prisma migrate dev --name add_user_config_biometrics
> ```

---

### Proposal 3 — Story 2.1: Tasks

**REPLACE all tasks with:**

```
- [x] Task 1: Add `UserConfig` model to Prisma schema and run migration
    - [x] 1.1 Add `UserConfig` model to schema.prisma (original fields)
    - [x] 1.2 Add `userConfig UserConfig?` relation to User model
    - [x] 1.3 Run `npx prisma migrate dev --name add_user_config`
    - [x] 1.4 Verify migration created `user_config` table in Neon
    - [ ] 1.5 Update `UserConfig` model with biometrics + measurementSystem +
              goalType + calorieCeiling fields (see Dev Notes)
    - [ ] 1.6 Run `npx prisma migrate dev --name add_user_config_biometrics`
    - [ ] 1.7 Verify additive migration applied cleanly in Neon

- [ ] Task 2: Backend — Update `/api/users/config` route
    - [x] 2.1 `userConfigSchemas.ts` exists — update Zod schema to include
              biometrics fields + measurementSystem + goalType
    - [ ] 2.2 Fix bug in existing `users.ts` GET handler (dead `res.json(config)`
              after 404 branch — move it to the else path)
    - [ ] 2.3 Complete POST handler in `users.ts`:
              — add imperial → metric conversion logic
              — add BMR calculation (Mifflin-St Jeor)
              — derive calorieFloor = BMR, calorieCeiling = calorieTarget + 200
              — persist all fields including biometrics and goalType
    - [ ] 2.4 Mount router in `index.ts` if not already done:
              `app.use('/api/users', usersRouter)`

- [ ] Task 3: Frontend — Create pure function library
    - [ ] 3.1 Create `apps/frontend/src/lib/unitConverter.ts`
              — `lbsToKg(lbs)`, `ftInToCm(feet, inches)` pure functions
    - [ ] 3.2 Create `apps/frontend/src/lib/bmrCalculator.ts`
              — `calculateBMR(weightKg, heightCm, age, sex)` using Mifflin-St Jeor
    - [ ] 3.3 Create `apps/frontend/src/lib/bmrCalculator.test.ts`
              — test male and female formulas, boundary values
    - [ ] 3.4 Create `apps/frontend/src/lib/floorCalculator.ts`
              — `calculateFloors(bmr, proteinTarget, stepsTarget)`:
                calorieFloor = bmr, proteinFloor = round(protein × 0.8),
                stepsFloor = round(steps × 0.5)
    - [ ] 3.5 Create `apps/frontend/src/lib/floorCalculator.test.ts`
              — test all three metrics, rounding, BMR passthrough

- [ ] Task 4: Frontend — Create `useUserConfig.ts` API hook
    - [ ] 4.1 Create `useUserConfig()` query + `useSetUserConfig()` mutation
              with updated `UserConfig` type (biometrics, measurementSystem,
              goalType, calorieCeiling)

- [ ] Task 5: Frontend — Implement `OnboardingPage.tsx` as 3-step form
    - [ ] 5.1 Replace placeholder in `OnboardingPage.tsx`
    - [ ] 5.2 On mount: if config exists, redirect to `/` (AC8)
    - [ ] 5.3 Step 1 — Biometrics:
              measurement system toggle (metric / imperial),
              weight + height inputs (labels swap per system),
              imperial height = two fields (feet + inches),
              age, sex radio, activity level select
    - [ ] 5.4 Step 2 — Goal type: three option buttons (lose / maintain / build)
    - [ ] 5.5 Step 3 — Targets:
              "Suggest a target" path: calculate TDEE client-side from biometrics,
              pre-fill calorie input (user-editable);
              "Enter my own" path: blank calorie input;
              protein target (g) and steps target on both paths
    - [ ] 5.6 Enforce 1,400 cal hard minimum on calorie input (AC4)
    - [ ] 5.7 Zod validation on all fields with field-level error display (AC5)
    - [ ] 5.8 On submit: call `useSetUserConfig()` mutation, redirect to `/`
    - [ ] 5.9 All inputs minimum 16px font size (iOS Safari zoom prevention)
    - [ ] 5.10 All interactive targets minimum 44×44px (NFR-A4)
```

---

### Proposal 4 — Story 2.3: Zone Calculation Engine (targeted AC changes)

**UPDATE the following ACs:**

**OLD:**
```
Given `lib/zoneConstants.ts` exists
When imported
Then it exports `ZONE_COLORS`, `TIER_LABELS`, and `FLOOR_OFFSETS` constants
```
**NEW:**
```
Given `lib/zoneConstants.ts` exists
When imported
Then it exports `ZONE_COLORS`, `TIER_LABELS`, `HARD_MIN_CALORIES`, and
`CALORIE_CEILING_BUFFER` constants —
no inline color values or magic numbers exist anywhere else in the codebase
(FLOOR_OFFSETS is removed — floors are no longer fixed offsets)
```

**OLD:**
```
Given a calorie value between target and target + threshold (200 kcal)
When `getZoneColor('calories', value, targets)` is called
Then it returns `zone-amber-over` with label "Heads up"

Given a calorie value above target + threshold
When `getZoneColor('calories', value, targets)` is called
Then it returns `zone-orange` with label "Rad Zone"
```
**NEW:**
```
Given a calorie value between calorieTarget and calorieCeiling
When `getZoneColor('calories', value, targets)` is called
(where targets includes { calorieFloor, calorieTarget, calorieCeiling })
Then it returns `zone-amber-over` with label "Heads up"

Given a calorie value above calorieCeiling
When `getZoneColor('calories', value, targets)` is called
Then it returns `zone-orange` with label "Rad Zone"
```

**OLD:**
```
Given `lib/zoneCalculator.test.ts` exists
When the test suite runs
Then all zone boundary conditions pass (below floor, at floor,
between floor–target, at target, above target+threshold)
```
**NEW:**
```
Given `lib/zoneCalculator.test.ts` exists
When the test suite runs
Then all zone boundary conditions pass including:
  - below HARD_MIN_CALORIES
  - at calorieFloor (= BMR)
  - between calorieFloor and calorieTarget
  - between calorieTarget and calorieCeiling
  - above calorieCeiling
```

**zoneConstants.ts exports change:**
```typescript
// REMOVE
export const FLOOR_OFFSETS = { ... }

// ADD
export const HARD_MIN_CALORIES = 1400
export const CALORIE_CEILING_BUFFER = 200
```

**targets object change:**
```typescript
// OLD
{ calorieTarget, proteinTarget, stepsTarget }

// NEW — floors + ceiling come from UserConfig (calculated server-side at onboarding)
{ calorieFloor, calorieTarget, calorieCeiling, proteinFloor, proteinTarget, stepsFloor, stepsTarget }
```

---

### Proposal 5 — Story 2.7: Update Targets (AC changes)

**REPLACE all ACs with:**

**AC1:** Given I navigate to `/settings`, when the page loads, then I see two pre-filled sections:
- Biometrics: weight, height, age, sex, activity level, goal type (displayed in my chosen measurement system)
- Targets: calorie target, protein target, steps target

**AC2:** Given I update biometrics only and save, when the form is submitted, then the server recalculates BMR from the new biometrics, updates calorieFloor = new BMR, and persists all changes.

**AC3:** Given I update calorie target only and save, when the form is submitted, then the server recalculates calorieCeiling = new calorieTarget + 200 and persists all changes.

**AC4:** Given I enter a calorie target below 1,400, when Zod validation runs, then I see a field-level error and the form does not submit.

**AC5:** Given I enter an invalid value (non-numeric or zero) for any field, when Zod validation runs, then I see a field-level error and the form does not submit.

**AC6:** Given any valid update is saved, when I return to the dashboard, then progress bars immediately reflect the new floors and ceiling — today's logged values are re-evaluated against the updated zones.

**Backend note:** This story requires `PATCH /api/users/config` — the POST in Story 2.1 is onboarding-only. Same BMR recalculation logic applies; imperial inputs converted to metric before calculation.

---

### Proposal 6 — Artifact Updates

#### 6a — PRD: FR6 and FR7

**OLD:**
```
FR6: User can set daily targets for calories, protein, and steps
FR7: The system automatically calculates floor values when targets are set
     (calories: target−250, protein: target×0.8, steps: target×0.5)
```
**NEW:**
```
FR6: User can provide biometrics (weight, height, age, biological sex, activity
     level) and set daily targets for calories, protein, and steps during onboarding

FR7: The system automatically calculates floor and ceiling values from biometrics
     and targets:
       calorieFloor   = BMR calculated via Mifflin-St Jeor equation
       calorieCeiling = calorieTarget + 200
       proteinFloor   = round(proteinTarget × 0.8)
       stepsFloor     = round(stepsTarget × 0.5)
     Calorie entries below 1,400 cal are rejected at input regardless of
     calculated floor
```

#### 6b — PRD: Journey 4 "Requirements revealed"

**OLD:**
```
Requirements revealed: Account creation (username + password), target entry,
automatic floor calculation (cal: target − 250, protein: target × 0.8,
steps: target × 0.5), Cheat Code entry (max 3), starter goal library,
goal selection, first-run dashboard state.
```
**NEW:**
```
Requirements revealed: Account creation (username + password), biometrics
collection (weight, height, age, sex, activity level, measurement system
preference), goal type selection (lose/maintain/build), calorie target with
TDEE-based suggestion option, 1,400 cal hard minimum, BMR-based floor
calculation, ceiling = target + 200, protein and steps target entry,
Cheat Code entry (max 3), starter goal library, goal selection,
first-run dashboard state.
```

#### 6c — Architecture doc: Priority Test Targets

**REPLACE the `floorCalculator.ts` row with three rows:**

```
| `apps/frontend/src/lib/bmrCalculator.ts` | BMR is the calorie floor —
  wrong BMR = wrong floor = wrong emotional signal on every dashboard load |
  Mifflin-St Jeor male/female formulas, boundary values, rounding |

| `apps/frontend/src/lib/unitConverter.ts` | Conversion errors silently
  corrupt BMR inputs — a 10lb error produces a meaningfully wrong floor |
  lbs→kg, ft+in→cm, round-trip accuracy |

| `apps/frontend/src/lib/floorCalculator.ts` | Assembles BMR + target inputs
  into floor/ceiling values used by every progress bar |
  BMR passthrough for calorieFloor, ceiling buffer, protein/steps rounding |
```

#### 6d — Architecture doc: pgvector decision record

**ADD under Deferred Decisions (Post-MVP):**

```
**pgvector / AI Coaching (Post-MVP — Future Epic)**
- pgvector will be enabled as an extension on the existing Neon instance
  when the AI Coaching Epic begins — same connection string, same Prisma
  setup, zero infrastructure change
- Goals will be first-class entities (not free text) with a three-tier
  structure: values → outcome → process, with parent-child linking
- Semantic embeddings stored via pgvector for pattern-based queries
  (e.g. "do I tend to struggle on weekends?")
- No separate database, no new service — additive capability on existing stack
- Decision recorded: 2026-04-22
```

#### 6e — UX spec: Journey 4 onboarding flow

**OLD:**
```
She enters her targets: 1,800 cal, 130g protein, 8,000 steps. The app
calculates floors automatically: 1,550 cal floor, 104g protein floor,
4,000 steps floor.
```
**NEW:**
```
She works through three steps: first her biometrics (weight, height, age,
sex, activity level — she picks imperial since she thinks in lbs and feet),
then her goal type ("Lose weight"), then her calorie target — she taps
"Suggest one for me" and sees a TDEE-based number she can edit before
confirming. She also enters her protein and steps targets. The app calculates
her floors: calorie floor = her BMR, protein floor = target × 0.8, steps
floor = target × 0.5. Ceiling = calorie target + 200.
```

---

## Section 5: Implementation Handoff

### Change Scope Classification: Moderate

Backlog reorganization required — Story 2.1 needs rewriting before implementation resumes. The story artifact must be updated before the dev agent picks it up again.

### Handoff Recipients and Responsibilities

| Role | Responsibility |
|---|---|
| **Dev Agent** | Do not resume Story 2.1 implementation until the story artifact is rewritten with updated ACs, tasks, and dev notes from this proposal |
| **SM / Story Writer** | Rewrite `2-1-user-onboarding-targets-floor-setup.md` using Proposals 1–3 above; update Stories 2.3 and 2.7 in `epics.md` using Proposals 4–5; apply artifact changes from Proposal 6 to PRD, architecture doc, and UX spec |
| **Dev Agent (Story 2.3)** | Before writing `zoneCalculator.ts`, confirm the updated `targets` object shape from this proposal — do not use `FLOOR_OFFSETS` |
| **Dev Agent (Story 2.7)** | Note the PATCH endpoint requirement added by this proposal |

### Sequencing

```
1. Rewrite Story 2.1 artifact (this proposal → story file)
2. Update PRD, architecture, UX spec (Proposal 6)
3. Update Stories 2.3 and 2.7 in epics.md (Proposals 4–5)
4. Resume Story 2.1 implementation (additive migration first)
5. Stories 2.3 and 2.7 proceed as normal in Epic 2 sequence
```

### Success Criteria

- [ ] Story 2.1 artifact rewritten and marked `ready-for-dev`
- [ ] Additive migration runs cleanly against Neon
- [ ] BMR calculation matches Mifflin-St Jeor reference values for test cases
- [ ] Imperial/metric conversion round-trips without floating point loss
- [ ] 1,400 cal hard minimum enforced at both client (Zod) and server (schema validation)
- [ ] `FLOOR_OFFSETS` does not appear anywhere in the codebase
- [ ] pgvector decision recorded in architecture doc
