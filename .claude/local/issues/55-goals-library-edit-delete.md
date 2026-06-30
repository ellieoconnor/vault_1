# #55 — Goals Library: Edit & Delete (Story 3.2)

## What to build

Add edit and delete capabilities to the goals library. `PATCH /api/goals/:id` updates name, type, and targetFrequency. `DELETE /api/goals/:id` removes the goal permanently.

Frontend: each goal card gets edit and delete actions. Edit opens an inline form. Delete shows a confirmation dialog.

**Note on the active-goal delete guard:** The spec requires a warning when deleting a goal that's currently in the week's active selection. This guard requires the `WeeklyPlan` model which doesn't exist until #56 ships. The guard will be wired up as part of #56 — implement basic delete here without it.

## Key files

- `apps/backend/src/routes/goals.ts` — add `PATCH /api/goals/:id`, `DELETE /api/goals/:id`
- `apps/backend/src/schemas/goalSchemas.ts` — add update schema
- `apps/frontend/src/components/goals/GoalCard.tsx` — add edit/delete actions
- `apps/frontend/src/components/goals/GoalForm.tsx` — support edit (pre-filled) mode
- `apps/frontend/src/api/useGoals.ts` — add mutation hooks for PATCH and DELETE

## Acceptance criteria

- [ ] `PATCH /api/goals/:id` updates name, type, and/or targetFrequency; validates with Zod
- [ ] `DELETE /api/goals/:id` removes the goal; returns 204
- [ ] Frontend: edit form pre-filled with current goal values; saves on submit
- [ ] Frontend: delete shows a confirmation dialog before proceeding
- [ ] Tapping Cancel on delete leaves the goal unchanged
- [ ] Updated goal name/type appears immediately after save (TanStack Query invalidation)
- [ ] Deleted goal disappears immediately from the list

## Blocked by

- #54 (Goals Library: Create & View)
