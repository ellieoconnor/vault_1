# #54 — Goals Library: Create & View (Story 3.1)

## What to build

Add a `Goal` Prisma model and the create/read API endpoints. Wire up the `/goals` frontend route with a personal library and a starter library.

**Schema design decision (must be settled before writing routes):** The `Goal` model needs to handle two fundamentally different types:
- `daily_metric` — progress auto-derived by comparing today's logged value against a threshold (e.g. "Calorie floor" checks `calories >= calorieFloor`)
- `weekly_frequency` — progress is a count of days the user marked the goal done (e.g. "Walk 3 days/week")

This distinction affects how `WeeklyGoalSelection` tracks progress in #56, and how `roughDay` is calculated in #57. The `Goal` model must include `type` and, for frequency goals, `targetFrequency` (days/week). Define these fields before writing any routes.

**Starter library:** Implement as static/seed data, not a separate DB table — simpler for a single-user app. Suggested starters: "Calorie floor" (daily_metric), "Protein floor" (daily_metric), "Walk 3 days/week" (weekly_frequency, targetFrequency: 3).

## Key files

- `apps/backend/prisma/schema.prisma` — add `Goal` model
- `apps/backend/src/routes/goals.ts` — new file: `GET /api/goals`, `POST /api/goals`
- `apps/backend/src/schemas/goalSchemas.ts` — new file: Zod schemas
- `apps/backend/src/index.ts` — register goals router
- `apps/frontend/src/pages/GoalsLibraryPage.tsx` — new file
- `apps/frontend/src/api/useGoals.ts` — new file: TanStack Query hooks
- `apps/frontend/src/components/goals/` — GoalCard, GoalForm, GoalLibrary components
- `apps/frontend/src/App.tsx` — add `/goals` route

## Acceptance criteria

- [ ] `Goal` Prisma model: `id`, `userId`, `name`, `type` (daily_metric | weekly_frequency), `targetFrequency` (nullable Int), `createdAt`, `updatedAt`
- [ ] `GET /api/goals` returns the user's personal goals
- [ ] `POST /api/goals` creates a new goal (validates type and targetFrequency with Zod)
- [ ] Frontend `/goals` route exists and is accessible from nav
- [ ] Page shows personal goals library and a starter library section
- [ ] Starter goals are visible and addable to personal library but not editable/deletable
- [ ] Create form accepts name and type; frequency goals show a target frequency input
- [ ] New goals appear immediately after creation (TanStack Query invalidation)
- [ ] No more than 5 items in the primary action area at once (NFR-A5)

## Blocked by

None — can start immediately.
