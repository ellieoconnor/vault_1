---
title: 'OnboardingPage — 3-Step Form Dev Notes'
slug: 'onboarding-page-3-step-form-dev-notes'
created: '2026-04-23'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
tech_stack:
    - React 18 + TypeScript
    - Zod (z.coerce.number for numeric inputs, z.flattenError for field errors, superRefine for conditional validation)
    - TanStack Query (useMutation + useQuery via useUserConfig / useSetUserConfig)
    - react-router-dom (useNavigate, Navigate)
    - Tailwind CSS v4
    - shadcn/ui (button component available)
files_to_modify:
    - apps/frontend/src/pages/OnboardingPage.tsx (replace placeholder)
    - apps/frontend/src/schemas/onboarding.ts (create new)
code_patterns:
    - Per-step Zod safeParse on Next/Submit click — NOT real-time
    - z.flattenError(result.error).fieldErrors → stored as Record<string, string[]> → displayed as fieldErrors.field?.[0]
    - Local useState for all form state — no global store
    - useNavigate for redirect on success; <Navigate> inline for config redirect
    - String state for all numeric inputs (HTML inputs return strings) — parsed via z.coerce.number() in Zod
    - Single flat FormState object across all 3 steps for back-navigation preservation
    - Loading states render <div>Loading...</div> (matches AuthGuard pattern)
    - superRefine for conditional field validation
test_patterns:
    - No component tests required for this story
---

# Tech-Spec: OnboardingPage — 3-Step Form Dev Notes

**Created:** 2026-04-23

## Overview

### Problem Statement

Story 2.1 Task 5 has no implementation dev notes for `OnboardingPage.tsx`. The acceptance criteria (AC1–AC8) exist but are insufficient for a dev agent to implement without ambiguity — no guidance on component structure, state shape, per-step validation, TDEE wiring, or conditional rendering.

### Solution

Produce a complete Dev Notes section covering all implementation decisions for `OnboardingPage.tsx`: state shape, step navigation, per-step Zod schema locations, TDEE suggestion logic, iOS requirements, and redirect wiring. Output formatted as markdown ready to paste into the story file.

### Scope

**In Scope:**

- Component structure for 3-step form
- Explicit form state shape definition (`FormState` interface + initial values)
- Per-step Zod validation schemas in `apps/frontend/src/schemas/onboarding.ts`
- Step 1: biometrics fields, measurement toggle (clears fields on switch), conditional imperial height
- Step 2: goal type selection
- Step 3: suggest vs own option cards, TDEE pre-fill computed in handler (not useEffect), calorie minimum blocks submit not typing
- Mount-time redirect check with loading + config-found states (AC8)
- Submit wiring with useSetUserConfig() + navigate('/')
- iOS Safari requirements (min-h-[44px] touch targets, text-[16px] inputs)

**Out of Scope:**

- Writing the actual component code (Dev Story agent's job)
- Backend changes
- Other story tasks (1–4, already complete)

## Context for Development

### Codebase Patterns

**Validation:**

- `zod.safeParse()` called on button click (Next/Submit) — NOT real-time, NOT react-hook-form
- `z.flattenError(result.error).fieldErrors` extracts field-level errors
- Field errors stored as `Record<string, string[]>` (e.g., `{ weightInput?: string[] }`)
- Displayed as `{fieldErrors.weightInput?.[0]}` — first error only
- Separate `fieldErrors` state per step, cleared when advancing or going back

**State:**

- All numeric inputs use `string` state (HTML inputs return strings)
- Numeric fields parsed via `z.coerce.number()` in Zod schemas
- `useState` only — no Zustand, no context

**Navigation:**

- `useNavigate` from react-router-dom → `navigate('/', { replace: true })` on submit success
- `<Navigate to="/" replace />` inline when config already exists (matches AuthGuard pattern)

**Loading states:**

- `if (isLoading) return <div>Loading...</div>` — matches AuthGuard convention

**Imports:**

- `@/` alias required for ALL internal imports (not relative paths)

### Files to Reference

| File                                                | Purpose                                                                                |
| --------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `apps/frontend/src/pages/OnboardingPage.tsx`        | Placeholder — full replacement                                                         |
| `apps/frontend/src/pages/RegisterPage.tsx`          | Field errors pattern: `z.flattenError` + `fieldErrors.field?.[0]` + per-field `<span>` |
| `apps/frontend/src/pages/LoginPage.tsx`             | useNavigate + useMutation pattern                                                      |
| `apps/frontend/src/components/shared/AuthGuard.tsx` | Loading state + `<Navigate>` inline redirect pattern                                   |
| `apps/frontend/src/api/useUserConfig.ts`            | `useUserConfig()`, `useSetUserConfig()`, `SetTargetsInput` type                        |
| `apps/frontend/src/lib/bmrCalculator.ts`            | `calculateBMR()`, `calculateTDEE()`, `ActivityLevel` type                              |
| `apps/frontend/src/schemas/auth.ts`                 | Zod schema file structure to follow                                                    |

### Technical Decisions

1. **Single flat FormState object** — all 3 steps share one state object so back-navigation preserves data. Shape defined explicitly below.
2. **String state for numbers** — all numeric inputs stored as `string`, parsed by `z.coerce.number()` in Zod on Next/Submit.
3. **Per-step field error state** — `step1Errors`, `step2Errors`, `step3Errors` as `Record<string, string[]>`. Cleared when advancing or going back.
4. **Measurement toggle clears fields** — switching metric↔imperial sets `weightInput`, `heightInputPrimary`, `heightInputSecondary` all back to `''`. No conversion.
5. **TDEE computed in handleNextStep2()** — NOT in a `useEffect`. When advancing from Step 2 → Step 3, if `targetMode === 'suggest'`, compute `calculateTDEE(calculateBMR(...), activityLevel)` and set it as `calorieTarget` in state at that moment. This prevents post-render flicker.
6. **1,400 cal minimum blocks submit only** — user can type any value; Step 3 Zod schema enforces `.min(1400, 'Minimum calorie target is 1,400 cal')` on submit.
7. **Loading render during config check** — `if (isLoading) return <div>Loading...</div>` before any form render.
8. **Config-found redirect** — `if (config) return <Navigate to="/" replace />` — inline, not useEffect.
9. **Conditional heightInputSecondary validation** — Step 1 schema uses `.superRefine()` to require and validate `heightInputSecondary` (0–11 inches) only when `measurementSystem === 'imperial'`. Metric users: field is ignored.
10. **Step 3 target mode UI** — two clickable option cards (radio-style buttons). Default: `'suggest'`. Switching `'suggest'` → `'own'` clears `calorieTarget` to `''` so Elizabeth must actively enter a value. Switching `'own'` → `'suggest'` recomputes TDEE and sets it.
11. **sex field** — radio buttons, `male` and `female` options. Initial state `''`. Neither pre-selected. `z.enum(['male', 'female'])` rejects `''` with message `'Please select a biological sex'`.
12. **`unitConverter.ts` used in component for TDEE pre-computation only** — `lbsToKg` and `ftInToCm` are imported and called in `handleNextStep2` and `handleTargetModeChange` to convert imperial inputs to metric before passing to `calculateBMR`. This is the only use. The payload sent to the backend via `SetTargetsInput` always contains raw display values + `measurementSystem` — the backend performs the canonical conversion.
13. **`floorCalculator.ts` NOT used in component** — floor/ceiling computation is server-side only.

## Implementation Plan

### FormState Shape (explicit)

```typescript
interface FormState {
    // Step 1 — Biometrics
    measurementSystem: 'metric' | 'imperial';
    weightInput: string; // lbs or kg display value
    heightInputPrimary: string; // cm (metric) or feet (imperial)
    heightInputSecondary: string; // inches only — imperial mode
    age: string;
    sex: '' | 'male' | 'female';
    activityLevel:
        | ''
        | 'sedentary'
        | 'lightly_active'
        | 'moderately_active'
        | 'very_active'
        | 'extra_active';
    // Step 2 — Goal
    goalType: '' | 'lose' | 'maintain' | 'build';
    // Step 3 — Targets
    targetMode: 'suggest' | 'own';
    calorieTarget: string;
    proteinTarget: string;
    stepsTarget: string;
}

const initialFormState: FormState = {
    measurementSystem: 'metric',
    weightInput: '',
    heightInputPrimary: '',
    heightInputSecondary: '',
    age: '',
    sex: '',
    activityLevel: '',
    goalType: '',
    targetMode: 'suggest',
    calorieTarget: '',
    proteinTarget: '',
    stepsTarget: '',
};
```

### Zod Schemas (`apps/frontend/src/schemas/onboarding.ts`)

**step1Schema** — validates all Step 1 biometric fields. Uses `.superRefine()` for conditional inches validation:

- `measurementSystem`: `z.enum(['metric', 'imperial'])`
- `weightInput`: `z.coerce.number().positive('Weight is required')` — `z.coerce.number()` coerces `''` to `0`; `.positive()` rejects `0` and negative values with the given message. `invalid_type_error` is NOT useful here because HTML inputs always produce strings that coerce successfully — the `.positive()` message covers both empty and zero/negative cases.
- `heightInputPrimary`: `z.coerce.number().positive('Height is required')`
- `heightInputSecondary`: `z.string().optional()` in base schema; validated in `.superRefine()` — check `data.measurementSystem === 'imperial'` FIRST, then check `Number(data.heightInputSecondary)` is a valid number between 0 and 11 inclusive. Guard order matters: metric users have `heightInputSecondary: ''` which `Number('')` coerces to `0` — without the imperial guard checked first, metric users would incorrectly fail validation.
- `age`: `z.coerce.number().int().min(13, 'Must be at least 13').max(120, 'Must be 120 or under')` — empty input coerces to `0`, fails `.min(13)` with "Must be at least 13"
- `sex`: `z.enum(['male', 'female'], { message: 'Please select a biological sex' })`
- `activityLevel`: `z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'], { message: 'Please select an activity level' })`

**step2Schema** — validates Step 2:

- `goalType`: `z.enum(['lose', 'maintain', 'build'], { message: 'Please select a goal type' })`

**step3Schema** — validates Step 3:

- `calorieTarget`: `z.coerce.number().int().min(1400, 'Minimum calorie target is 1,400 cal')`
- `proteinTarget`: `z.coerce.number().int().positive('Protein target is required')`
- `stepsTarget`: `z.coerce.number().int().positive('Steps target is required')`

### Tasks

- [x] Task 5.1: Create `apps/frontend/src/schemas/onboarding.ts`
    - File: `apps/frontend/src/schemas/onboarding.ts` (new)
    - Action: Export `step1Schema`, `step2Schema`, `step3Schema` as described above. Export inferred types: `Step1Data = z.infer<typeof step1Schema>` etc.
    - Notes: Follow `auth.ts` structure. `step1Schema` must use `.superRefine()` for conditional `heightInputSecondary`.

- [x] Task 5.2: Implement `OnboardingPage.tsx` — foundation
    - File: `apps/frontend/src/pages/OnboardingPage.tsx` (replace)
    - Action: Add all imports at the top of the file: `useNavigate` and `Navigate` from `react-router-dom`; `useState` from `react`; `useUserConfig` and `useSetUserConfig` from `@/api/useUserConfig`; `calculateBMR`, `calculateTDEE`, and `ActivityLevel` from `@/lib/bmrCalculator`; `lbsToKg` and `ftInToCm` from `@/lib/unitConverter`; `step1Schema`, `step2Schema`, `step3Schema` from `@/schemas/onboarding`; `z` from `zod`. Define `FormState` interface and `initialFormState`. Set up component with `step` state (1–3), `form` state, and three separate error states (`step1Errors`, `step2Errors`, `step3Errors`).
    - Notes: All imports use `@/` alias. Establish all imports in this task so subsequent tasks can reference them without hunting for missing dependencies.

- [x] Task 5.3: Add mount redirect + loading/error guards
    - File: `apps/frontend/src/pages/OnboardingPage.tsx`
    - Action: Call `useUserConfig()` and `useSetUserConfig()` at top of component. Add guards in this exact order: `if (isLoading) return <div>Loading...</div>` first. `if (isError) return <div>Something went wrong. Please refresh the page.</div>` second (matches AuthGuard error pattern). `if (config) return <Navigate to="/" replace />` third. Form only renders when config is null, not loading, and not errored (AC8).
    - Notes: `isError` prevents a network failure from silently rendering the form as if no config exists — which could let a returning user re-submit onboarding.

- [x] Task 5.4: Implement Step 1 — Biometrics
    - File: `apps/frontend/src/pages/OnboardingPage.tsx`
    - Action: Render a step progress indicator ("Step 1 of 3") at the top of the form — present on all three steps with the current step number updated. Render measurement system toggle (two buttons: Metric / Imperial). Render weight input (label swaps: "Weight (kg)" vs "Weight (lbs)"). Render height inputs: metric = one field ("Height (cm)"); imperial = two fields ("Feet" + "Inches"). Render age input. Render sex radio buttons (Male / Female, neither pre-selected). Render activity level select (five options). All inputs: `style={{ fontSize: '16px' }}` and min-height 44px. "Next" button calls `handleNextStep1`.
    - Notes: Measurement toggle calls a handler that updates `measurementSystem` AND clears `weightInput`, `heightInputPrimary`, `heightInputSecondary` to `''`. Step progress indicator is a simple text label — no library needed.

- [x] Task 5.5: Implement `handleNextStep1`
    - File: `apps/frontend/src/pages/OnboardingPage.tsx`
    - Action: Run `step1Schema.safeParse(form)`. If fail: `setStep1Errors(z.flattenError(result.error).fieldErrors)` and return. If pass: `setStep1Errors({})` to clear any previous errors, then advance `setStep(2)`.
    - Notes: Also implement the Back button on Step 2 that calls `setStep(1)` and `setStep2Errors({})` — back-navigation clears the destination step's errors so the user never sees stale error state from a previous forward attempt.

- [x] Task 5.6: Implement Step 2 — Goal Type
    - File: `apps/frontend/src/pages/OnboardingPage.tsx`
    - Action: Render step progress indicator ("Step 2 of 3"). Render three option buttons (radio-style): "Lose weight", "Maintain", "Build". Selected state driven by `form.goalType`. Back button calls `setStep(1)` AND `setStep1Errors({})` to clear any stale Step 1 errors. "Next" calls `handleNextStep2`.
    - Notes: All buttons min-height 44px. The back handler clears `step1Errors` — the user hasn't re-triggered Step 1 validation so they should not see old errors on return.

- [x] Task 5.7: Implement `handleNextStep2` and `computeTDEE` helper
    - File: `apps/frontend/src/pages/OnboardingPage.tsx`
    - Action: Extract a `computeTDEE(form: FormState): number` helper (local to the file, not exported) that computes TDEE from current form state. Inside: if `form.measurementSystem === 'imperial'`, derive `weightKg = lbsToKg(Number(form.weightInput))` and `heightCm = ftInToCm(Number(form.heightInputPrimary), Number(form.heightInputSecondary))`; otherwise `weightKg = Number(form.weightInput)` and `heightCm = Number(form.heightInputPrimary)`. Then return `calculateTDEE(calculateBMR(weightKg, heightCm, Number(form.age), form.sex as 'male' | 'female'), form.activityLevel as ActivityLevel)`.
    - In `handleNextStep2`: run `step2Schema.safeParse({ goalType: form.goalType })`. If fail: `setStep2Errors(z.flattenError(result.error).fieldErrors)` and return. If pass and `form.targetMode === 'suggest'` (read from `form` state, not schema output): call `computeTDEE(form)` and `setForm(f => ({ ...f, calorieTarget: String(tdee) }))`. Then `setStep2Errors({})` and `setStep(3)`.
    - Notes: `targetMode` is read from `form.targetMode` — it is NOT part of `step2Schema`. `computeTDEE` is also called by `handleTargetModeChange` (Task 5.8a) to avoid duplicating conversion logic.

- [x] Task 5.8a: Implement `handleTargetModeChange`
    - File: `apps/frontend/src/pages/OnboardingPage.tsx`
    - Action: Create handler `handleTargetModeChange(mode: 'suggest' | 'own')`. If `mode === 'own'`: `setForm(f => ({ ...f, targetMode: 'own', calorieTarget: '' }))`. If `mode === 'suggest'`: compute `const tdee = computeTDEE(form)` then `setForm(f => ({ ...f, targetMode: 'suggest', calorieTarget: String(tdee) }))`.
    - Notes: Uses the `computeTDEE` helper from Task 5.7. This is a dedicated handler — do not inline this logic into the JSX onClick.

- [x] Task 5.8b: Implement Step 3 — Targets render
    - File: `apps/frontend/src/pages/OnboardingPage.tsx`
    - Action: Render step progress indicator ("Step 3 of 3"). Render two option cards: "Suggest a target for me" and "I'll enter my own" — each calls `handleTargetModeChange` with the appropriate mode; active card visually highlighted based on `form.targetMode`. Render calorie target input (value = `form.calorieTarget`, editable regardless of mode). Render protein target input (g). Render steps target input. Back button sets `setStep(2)` and `setStep3Errors({})`. "Save & Continue" button calls `handleSubmit`; disable when `setUserConfig.isPending`.
    - Notes: All inputs `style={{ fontSize: '16px' }}`, min-height 44px. Display `step3Errors.calorieTarget?.[0]` below calorie input for 1,400 min enforcement error. Display `step3Errors.form?.[0]` (general submit error) near the submit button.

- [x] Task 5.9: Implement `handleSubmit`
    - File: `apps/frontend/src/pages/OnboardingPage.tsx`
    - Action: Run `step3Schema.safeParse({ calorieTarget: form.calorieTarget, proteinTarget: form.proteinTarget, stepsTarget: form.stepsTarget })`. If fail: `setStep3Errors(z.flattenError(result.error).fieldErrors)` and return. If pass: build `SetTargetsInput` payload — `weightInput: Number(form.weightInput)`, `heightInputPrimary: Number(form.heightInputPrimary)`, `heightInputSecondary: form.measurementSystem === 'imperial' ? Number(form.heightInputSecondary) : undefined`, `age: Number(form.age)`, `sex: form.sex as 'male' | 'female'`, `activityLevel: form.activityLevel`, `measurementSystem`, `goalType: form.goalType as 'lose' | 'maintain' | 'build'`, `calorieTarget: Number(form.calorieTarget)`, `proteinTarget: Number(form.proteinTarget)`, `stepsTarget: Number(form.stepsTarget)`. Call `setUserConfig.mutate(payload, { onSuccess: () => navigate('/', { replace: true }), onError: () => setStep3Errors({ form: ['Something went wrong. Please try again.'] }) })`.
    - Notes: Backend handles all metric conversion — send raw display values + `measurementSystem`. `heightInputSecondary` must be `undefined` (not `0`, not `''`) for metric users. Submit button must be `disabled={setUserConfig.isPending}` to prevent double-submission on mobile.

### Acceptance Criteria

- [ ] AC-T1: Given `useUserConfig()` is loading, when `OnboardingPage` renders, then `<div>Loading...</div>` is shown and no form is rendered.
- [ ] AC-T1b: Given `useUserConfig()` returns an error, when `OnboardingPage` renders, then an error message is shown and no form is rendered.
- [ ] AC-T2: Given `useUserConfig()` returns an existing config, when `OnboardingPage` renders, then the user is redirected to `/` immediately (AC8).
- [ ] AC-T3: Given `useUserConfig()` returns null and no error, when `OnboardingPage` renders, then Step 1 form is shown with a "Step 1 of 3" indicator.
- [ ] AC-T4: Given Step 1 is shown, when the user clicks "Next" with any field empty or invalid, then per-field error messages appear and step does not advance (AC1, AC5).
- [ ] AC-T5: Given Step 1 is shown with "Metric" selected, when the user switches to "Imperial", then weight and height fields are cleared.
- [ ] AC-T6: Given Step 1 is shown in Imperial mode, when the user clicks "Next" without entering inches, then an error appears on the inches field.
- [ ] AC-T7: Given Step 1 is complete and Step 2 is shown, when the user clicks "Back", then Step 1 is shown with all previously entered values preserved.
- [ ] AC-T8: Given Step 2 is shown, when the user clicks "Next" without selecting a goal type, then an error appears and step does not advance (AC2).
- [ ] AC-T9: Given Step 2 is complete with "Suggest a target" mode, when Step 3 loads, then the calorie target input is pre-filled with the TDEE-based recommendation (AC3).
- [ ] AC-T10: Given Step 3 is shown with "Suggest" mode, when the user switches to "I'll enter my own", then the calorie target field is cleared.
- [ ] AC-T11: Given Step 3 is shown, when the user enters or confirms a calorie value below 1,400, then a field-level error appears and submit is blocked (AC4).
- [ ] AC-T12: Given all steps are complete and valid, when the user submits, then `useSetUserConfig()` is called with the raw form values + `measurementSystem`, and on success the user is redirected to `/` (AC6, AC7).
- [ ] AC-T12b: Given the user taps "Save & Continue" while a submission is in flight, then the button is disabled and a second request is not fired.
- [ ] AC-T12c: Given `useSetUserConfig()` returns an error, when submission fails, then a general error message appears near the submit button and the user remains on Step 3.
- [ ] AC-T13: Given the form is on any step, when any input is rendered, then font size is at least 16px and touch targets are at least 44px tall.

## Additional Context

### Dependencies

All dependencies already installed and implemented:

- `useUserConfig`, `useSetUserConfig` — `@/api/useUserConfig`
- `calculateBMR`, `calculateTDEE`, `ActivityLevel` — `@/lib/bmrCalculator`
- `lbsToKg`, `ftInToCm` — `@/lib/unitConverter` (needed in component for TDEE pre-computation only)
- `zod` — already installed
- `react-router-dom` — already installed

### Testing Strategy

No component tests required for this story. Manual testing steps:

1. Register a new account → verify redirect to `/onboarding`
2. Test metric path: enter kg/cm values, complete all steps, verify redirect to `/`
3. Test imperial path: enter lbs/ft+in values, verify inches validation, complete flow
4. Test back navigation: verify data preserved on all steps
5. Test "I'll enter my own" path: verify calorie field is blank, 1,400 min enforced
6. Test revisit: log in with completed config, navigate to `/onboarding`, verify redirect to `/`

### Notes

- **`computeTDEE` helper** — extract as a local file-scope function (not exported), used by both `handleNextStep2` and `handleTargetModeChange`. Takes `FormState`, returns `number`. Handles metric/imperial branching internally using `lbsToKg`/`ftInToCm`.
- **Mode switch discards typed calorie — deliberate** — if Elizabeth types a custom calorie value then switches back to `'suggest'`, her value is overwritten by TDEE. If she then switches to `'own'` again, the field is cleared. This is intentional: AC3 requires active confirmation of the number, not preservation of a discarded entry. The dev agent should not add a "restore previous value" mechanism.
- **`floorCalculator.ts` not used in component** — floors are computed server-side.
- **`heightInputSecondary` for metric** — send as `undefined` in `SetTargetsInput` payload; do not send `0` or `''`.
- **General submit error** — stored as `step3Errors.form?.[0]`, displayed near the submit button. Not a field-level error.
- **Back-navigation clears destination step errors** — when going back from Step 2 → Step 1, call `setStep2Errors({})`. When going back from Step 3 → Step 2, call `setStep3Errors({})`. This prevents stale errors appearing when the user returns to a step they haven't interacted with yet.
- **`isError` guard required** — `useUserConfig()` can fail on network error. Without the `isError` guard, a failed check silently renders the form as if no config exists, allowing re-onboarding for users who completed it.
