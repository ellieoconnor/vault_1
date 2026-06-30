# #52 — Yesterday Completion Prompt (Story 2.6)

## What to build

On dashboard load, check if yesterday's log exists and has `dayComplete: false`, OR doesn't exist at all. If so, show a dismissable banner at the top of the dashboard: "Yesterday isn't closed yet — want to complete it now?"

Tapping "Yes, complete it" opens a condensed log form for yesterday's date (same inputs as today — calories, protein, steps, workout, Day Complete). This uses the existing upsert flow with yesterday's date. Tapping "Skip" dismisses the banner with no penalty and no state change.

Requires generalising the existing hardcoded `GET /api/logs/today` to `GET /api/logs/:date` so any date can be fetched.

## Key files

- `apps/backend/src/routes/logs.ts` — add `GET /api/logs/:date`
- `apps/frontend/src/api/useDailyLog.ts` — add hook for fetching by date
- `apps/frontend/src/pages/DashboardPage.tsx` — add banner + condensed yesterday form
- `apps/frontend/src/components/dashboard/` — new `YesterdayPrompt.tsx` component

## Acceptance criteria

- [ ] `GET /api/logs/:date` endpoint exists and returns the log for that date (or null)
- [ ] On dashboard load, yesterday's log is fetched and checked
- [ ] Banner appears if yesterday is missing or has `dayComplete: false`
- [ ] Banner does not appear if yesterday is already complete
- [ ] Tapping "Yes" opens a condensed form for yesterday's date
- [ ] Completing the condensed form saves via existing upsert + Day Complete flow
- [ ] After completing, banner disappears and today's dashboard is shown
- [ ] Tapping "Skip" dismisses the banner — yesterday remains unclosed with no penalty
- [ ] No streak language, no guilt framing anywhere in the prompt or form

## Blocked by

None — can start immediately.
