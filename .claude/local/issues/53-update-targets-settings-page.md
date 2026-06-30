# #53 — Update Targets / Settings Page (Story 2.7)

## What to build

Add `PATCH /api/users/config` to update biometrics and/or targets. When biometrics change, recalculate `calorieFloor` (BMR via Mifflin-St Jeor). When `calorieTarget` changes, recalculate `calorieCeiling = calorieTarget + 200`. The BMR calculation logic is already written in `POST /api/users/config` — reuse it.

Frontend: SettingsPage (`/settings`) with two pre-filled sections — Biometrics (weight, height, age, sex, activity level, goal type) and Targets (calorie target, protein target, steps target). Each section saves independently.

Note: `apps/backend/src/routes/users.ts` already has a comment flagging this story as the home for `PATCH`.

## Key files

- `apps/backend/src/routes/users.ts` — add `PATCH /api/users/config`
- `apps/backend/src/schemas/userConfigSchemas.ts` — add patch schema (partial of existing)
- `apps/frontend/src/pages/SettingsPage.tsx` — add biometrics + targets sections
- `apps/frontend/src/api/useUserConfig.ts` — add mutation hook for PATCH

## Acceptance criteria

- [ ] `PATCH /api/users/config` accepts partial updates (biometrics only, targets only, or both)
- [ ] Updating biometrics recalculates `calorieFloor` from new BMR
- [ ] Updating `calorieTarget` recalculates `calorieCeiling = calorieTarget + 200`
- [ ] Entering `calorieTarget` below 1,400 is rejected with a field-level error
- [ ] Invalid values (non-numeric, zero) are rejected with field-level errors (Zod)
- [ ] SettingsPage shows pre-filled biometrics section and targets section
- [ ] Each section has its own save action
- [ ] Values are shown in the user's chosen measurement system (imperial/metric)
- [ ] After saving, dashboard progress bars reflect updated floors/ceiling immediately

## Blocked by

None — can start immediately.
