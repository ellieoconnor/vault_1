# #57 — Active Goals on Dashboard (Story 3.4)

## What to build

Replace the Active Goals placeholder in `DashboardPage.tsx` with the real list of current week's active goals and their per-goal progress. Update `roughDay` calculation in `POST /api/logs` from hardcoded `false` to the real formula.

Per-goal progress:
- `daily_metric` goals: green checkmark if today's logged value meets the threshold; amber if not
- `weekly_frequency` goals: "X / Y days" count for the current week

The backend needs to serve per-goal progress with the active goals list — either extend `GET /api/weekly-plans/current` or add a progress endpoint.

**roughDay update:** `POST /api/logs` currently has a comment flagging this story. Replace `roughDay: false` with: `(goals met today / total active goals) < 0.5 → roughDay: true`. For frequency goals, "met today" means the user marked it done today (needs day-level completion tracking — a `WeeklyGoalCompletion` record or a field on `WeeklyGoalSelection`).

## Key files

- `apps/frontend/src/pages/DashboardPage.tsx` — replace Active Goals placeholder
- `apps/frontend/src/components/dashboard/ActiveGoalList.tsx` — new file
- `apps/backend/src/routes/weeklyPlans.ts` — extend with progress data
- `apps/backend/src/routes/logs.ts` — update roughDay calculation
- `apps/backend/prisma/schema.prisma` — add day-level goal completion tracking if needed

## Acceptance criteria

- [ ] Dashboard Active Goals section shows the current week's 3–5 goals (replaces placeholder)
- [ ] `daily_metric` goals show met/unmet status based on today's logged values
- [ ] `weekly_frequency` goals show "X / Y days" progress for the current week
- [ ] Active Goals section contains no more than 5 items (NFR-A5)
- [ ] `POST /api/logs` roughDay uses real goal achievement (not hardcoded false)
- [ ] roughDay is `true` when fewer than 50% of active goals are met at Day Complete time
- [ ] If no WeeklyPlan exists for the current week, shows the "Set up goals" prompt from #56

## Blocked by

- #56 (Weekly Active Goal Selection)
