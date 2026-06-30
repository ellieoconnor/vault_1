# #56 — Weekly Active Goal Selection (Story 3.3)

## What to build

Add the ability to select 3–5 goals as the current week's Active Goals. Introduces two new Prisma models: `WeeklyPlan` (one per week per user) and `WeeklyGoalSelection` (join table).

Backend: `POST /api/weekly-plans` creates a plan with selected goal IDs (validates 3–5). `GET /api/weekly-plans/current` returns current week's plan with selected goals.

Frontend: goal selector screen reachable from the dashboard Active Goals section when no plan exists for the current week. Shows the goals library with multi-select, enforces 3–5, creates WeeklyPlan on confirm.

Also wires up the **active-goal delete guard** deferred from #55: before deleting a goal, `DELETE /api/goals/:id` checks if it's in the current `WeeklyGoalSelection`. If so, returns `409`. Frontend shows: "This goal is active this week — remove it from your weekly goals first."

## Key files

- `apps/backend/prisma/schema.prisma` — add `WeeklyPlan`, `WeeklyGoalSelection` models
- `apps/backend/src/routes/weeklyPlans.ts` — new file
- `apps/backend/src/routes/goals.ts` — update DELETE to check WeeklyGoalSelection
- `apps/backend/src/schemas/weekSchemas.ts` — new file: Zod schemas
- `apps/backend/src/index.ts` — register weekly-plans router
- `apps/frontend/src/pages/GoalSelectorPage.tsx` (or modal) — new file
- `apps/frontend/src/api/useWeeklyPlan.ts` — new file: TanStack Query hooks
- `apps/frontend/src/components/dashboard/` — update Active Goals section to show prompt

## Acceptance criteria

- [ ] `WeeklyPlan` model: `id`, `userId`, `weekStartDate` (Monday), `createdAt`
- [ ] `WeeklyGoalSelection` model: `id`, `weeklyPlanId`, `goalId`
- [ ] `POST /api/weekly-plans` accepts `{ goalIds: string[] }`, validates 3–5 count, creates plan
- [ ] `GET /api/weekly-plans/current` returns current week's plan + selected goals (or 404)
- [ ] Dashboard Active Goals section shows "Set up this week's goals" prompt when no current plan
- [ ] Goal selector enforces minimum 3 / maximum 5 selections with clear feedback
- [ ] Confirming selection creates the WeeklyPlan and dismisses the selector
- [ ] `DELETE /api/goals/:id` returns `409` if the goal is in the current week's selection
- [ ] Frontend shows the warning and blocks delete until acknowledged

## Blocked by

- #54 (Goals Library: Create & View)
