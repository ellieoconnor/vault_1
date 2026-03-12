---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
---

# vault_1 - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for vault_1, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: User can create an account with a username and password
FR2: User can log in with username and password
FR3: User can remain logged in across app sessions without re-authenticating
FR4: User can reset their password
FR5: User can log out
FR6: User can set daily targets for calories, protein, and steps
FR7: The system automatically calculates floor values when targets are set (calories: target−250, protein: target×0.8, steps: target×0.5)
FR8: User can update their targets at any time
FR9: User can create up to 3 Cheat Codes (coaching strategy reminders)
FR10: User can edit and delete existing Cheat Codes
FR11: User can log daily values for calories, protein, steps, and workout completion
FR12: User can view their current day's progress as color-coded progress bars reflecting floor-based zones
FR13: The system applies a calorie-asymmetric color zone model to the calorie progress bar (below-floor: amber-low; floor→target: green; target→threshold: amber-over; above threshold: orange)
FR14: The system applies a standard color zone model to protein and steps progress bars (below-floor: amber; floor→target: green; above-target: blue)
FR15: User can view their Cheat Codes on the daily dashboard at all times, without any navigation required
FR16: User can press Day Complete at any time regardless of whether daily metrics were achieved
FR17: User can select a mood tag when pressing Day Complete
FR18: The system prompts the user to complete the previous day if it was not closed at login
FR19: The system records a `roughDay` flag at Day Complete time (derived: fewer than 50% of active goals achieved that day)
FR20: User can create goals in a personal goals library
FR21: User can specify a goal type (daily metric-based or weekly frequency-based)
FR22: User can edit goals in their library
FR23: User can delete goals from their library
FR24: The system provides a starter library of pre-defined goals available during onboarding and goal selection
FR25: User can select 3–5 active goals per week from their goals library
FR26: The system enforces a minimum of 3 and maximum of 5 concurrently active goals
FR27: User can view their active goals and per-goal progress on the daily dashboard
FR28: User can access a weekly planning view
FR29: User can view the prior week's results per active goal (days achieved vs. total days)
FR30: User can view their weekly consistency percentage
FR31: The system displays a tier label corresponding to weekly consistency % (60–74%: "Surviving the Wasteland"; 75–89%: "Thriving"; 90%+: "Elite")
FR32: The system suggests which goals to keep, drop, or add based on prior week performance
FR33: User can select active goals for the upcoming week (3–5 enforced)
FR34: User can start a new week, which resets the dashboard to the newly selected active goal set
FR35: User can edit Cheat Codes from within the weekly planning view
FR36: User can perform core logging actions (calories, protein, steps, workout, Day Complete) while offline
FR37: The system queues offline actions and syncs them automatically when connectivity is restored
FR38: The system retains local records until server sync is confirmed — no silent data loss on failed sync
FR39: User's data (daily logs, goals, configuration, weekly history) persists reliably across sessions
FR40: User can install the app to their mobile device home screen
FR41: The app is accessible and functional across iOS Safari (P1), Chrome mobile, and desktop browsers
FR42: The app layout adapts responsively for mobile (320px–768px primary) and desktop viewports
FR43: The system records login timestamps to support login gap monitoring
FR44: The system calculates weekly consistency % as active goal days achieved divided by total possible active goal days for the current week

### NonFunctional Requirements

NFR-P1: Dashboard (daily view) is interactive within 3 seconds on a mid-range mobile device on 4G connectivity
NFR-P2: User-initiated tracking actions (log food, mark habit, complete day) provide visual feedback within 300ms; full save completes within 1 second under normal conditions
NFR-P3: App shell loads from service worker cache within 1 second on repeat visits (offline or online)
NFR-P4: Offline-to-online transition is transparent — queued actions show no error state; sync happens silently in the background
NFR-S1: All data transmitted between client and server uses HTTPS/TLS
NFR-S2: Personal health and behavioral data stored server-side is encrypted at rest
NFR-S3: Authentication sessions persist across visits (remember-me); users can sign out and invalidate the session
NFR-S4: Each user's data is strictly isolated — no cross-user data access is possible at any layer
NFR-S5: Password reset is available via standard email-based recovery
NFR-R1: All tracking actions performed offline are queued locally and synced when connectivity is restored — no data is silently lost
NFR-R2: Sync failures retry automatically (minimum 3 attempts with exponential backoff) before surfacing a non-blocking notification to the user
NFR-R3: All core tracking features function fully in offline mode; only sync-dependent features are unavailable offline
NFR-R4: App data is not lost during PWA updates or service worker refreshes
NFR-A1: All user-facing interfaces meet WCAG 2.1 Level AA standards
NFR-A2: All interactive elements are keyboard navigable and screen reader compatible
NFR-A3: Color is never the sole means of conveying information — status indicators include text labels or icons alongside color
NFR-A4: All interactive tap/click targets are minimum 44×44px
NFR-A5: Primary action areas display no more than 5 items — cognitive load reduction is a first-class design constraint

### Additional Requirements

**From Architecture:**
- **Starter Template (impacts Epic 1 Story 1):** Project uses Vite React TypeScript + Express TypeScript monorepo. Init commands: `npm create vite@latest client -- --template react-ts`, Express server scaffolding, Prisma ORM with Neon PostgreSQL. This is the first implementation story.
- Monorepo structure with `/client` (Vite React PWA) and `/server` (Express TypeScript API) packages
- Prisma schema-first ORM with `prisma migrate dev` (dev) and `prisma migrate deploy` (CI/CD)
- Session-based authentication using `express-session` + `connect-pg-simple` (PostgreSQL-backed sessions)
- Password hashing with Argon2 (`argon2` npm package)
- Email-based password reset using Resend service (`resend` npm package)
- Offline queue implemented with Dexie.js (IndexedDB) — stores queued write actions with type, payload, timestamp, retry count, status
- TanStack Query v5 for server state management; Zustand for UI-only state
- React Router v7 with routes: `/` (dashboard), `/week`, `/goals`, `/settings`, `/onboarding`
- Tailwind CSS v4 with Vault-Tec theme via CSS custom properties (color tokens for zone model)
- All zone colors sourced ONLY from `lib/zoneConstants.ts` — no inline color values
- Zod validation shared between client forms and server request validation
- Floor/Zone Calculation Engine must be isolated in `lib/zoneCalculator.ts` before any progress bar is built
- Consistency calculation logic in `lib/consistencyCalc.ts` — drives tier labels, goal suggestions, roughDay flag
- GitHub Actions CI/CD: type-check + lint on PR; `prisma migrate deploy` + Vercel deploy on main
- REST API with `/api/` prefix; no versioning for MVP
- CORS restricted to Vercel frontend origin in production
- Data model uses HealthKit-compatible shapes (steps as integer, workouts as boolean/duration) for future Phase 3 compatibility
- Tests co-located with source files (`*.test.ts` next to the file)

**From UX Design:**
- Responsive layout: 320px–768px primary, content max-width 480px centered on larger screens, no horizontal scroll at any viewport
- ADHD UX invariants must be enforced architecturally: no red states anywhere, no streak counters, amber = neutral (never "failed/missed"), Day Complete always pressable
- All color zones paired with text labels ("Below floor," "On track," "Bonus," "Heads up") — color never sole indicator
- Touch targets minimum 44×44px (iOS HIG + WCAG); form input font size minimum 16px to prevent iOS Safari auto-zoom
- shadcn/ui (Radix UI primitives) for accessible component patterns — copied into project as owned code
- Motion/animation: minimal — subtle Day Complete confirmation, progress bar fills on load; no heavy animations
- Progress bar ARIA: `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label` with zone description
- Mood selection at Day Complete is always optional — timeout closes the day without it
- Live zone color update on metric input (character-by-character update of progress bar as user types)
- Sync status indicator (SyncStatusBar) visible for offline/queue state without blocking core interactions

### FR Coverage Map

FR1: Epic 1 — Account creation
FR2: Epic 1 — Login
FR3: Epic 1 — Persistent sessions
FR4: Epic 1 — Password reset
FR5: Epic 1 — Logout
FR6: Epic 2 — Daily target setup (calories, protein, steps)
FR7: Epic 2 — Automatic floor calculation
FR8: Epic 2 — Update targets
FR9: Epic 2 — Create Cheat Codes
FR10: Epic 2 — Edit/delete Cheat Codes
FR11: Epic 2 — Log daily values
FR12: Epic 2 — Floor-based progress bars
FR13: Epic 2 — Calorie-asymmetric color zone model
FR14: Epic 2 — Standard color zone model (protein/steps)
FR15: Epic 2 — Cheat Codes always visible on dashboard
FR16: Epic 2 — Day Complete always pressable
FR17: Epic 2 — Mood tag at Day Complete
FR18: Epic 2 — Yesterday completion prompt on login
FR19: Epic 2 — roughDay flag at Day Complete
FR20: Epic 3 — Create goals in library
FR21: Epic 3 — Goal type specification (daily/weekly)
FR22: Epic 3 — Edit goals
FR23: Epic 3 — Delete goals
FR24: Epic 3 — Starter goal library
FR25: Epic 3 — Select 3–5 active goals per week
FR26: Epic 3 — Enforce min 3 / max 5 active goals
FR27: Epic 3 — Active goals + per-goal progress on dashboard
FR28: Epic 4 — Weekly planning view
FR29: Epic 4 — Prior week per-goal results
FR30: Epic 4 — Weekly consistency percentage
FR31: Epic 4 — Tier labels (Surviving/Thriving/Elite)
FR32: Epic 4 — Goal suggestions (keep/drop/add)
FR33: Epic 4 — Active goal selection for next week
FR34: Epic 4 — Start new week / dashboard reset
FR35: Epic 4 — Edit Cheat Codes from planning view
FR36: Epic 5 — Offline core logging actions
FR37: Epic 5 — Offline queue auto-sync on reconnect
FR38: Epic 5 — No silent data loss on failed sync
FR39: Epic 5 — Data persistence across sessions
FR40: Epic 5 — PWA installable to home screen
FR41: Epic 5 — Cross-browser support (iOS Safari P1)
FR42: Epic 5 — Responsive layout (320px–768px primary)
FR43: Epic 4 — Login timestamp recording
FR44: Epic 4 — Weekly consistency % calculation

## Epic List

### Epic 1: Foundation & Authentication
Users can access a working, secure app on their phone — register, log in, stay logged in, reset their password, and log out.
**FRs covered:** FR1, FR2, FR3, FR4, FR5
**Note:** Includes project scaffolding (Vite + Express + Prisma + Neon setup) as Story 1.1 — the prerequisite for all feature work.

### Epic 2: Daily Tracking Core
Users can track their day using the Win the Day dashboard — the core product hypothesis. Set up targets and Cheat Codes, see floor-based progress bars, log daily values, and press Day Complete any time regardless of how the day went.
**FRs covered:** FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR17, FR18, FR19, FR27

### Epic 3: Goals Management
Users can build and manage a personal goals library, and select 3–5 active goals per week to track on the dashboard.
**FRs covered:** FR20, FR21, FR22, FR23, FR24, FR25, FR26, FR27

### Epic 4: Weekly Planning Ritual
Users can complete the Sunday planning ritual — review last week's results, check consistency % with tier labels, get goal suggestions, update Cheat Codes, and start the new week with their chosen active goals.
**FRs covered:** FR28, FR29, FR30, FR31, FR32, FR33, FR34, FR35, FR43, FR44

### Epic 5: Offline & PWA
Users can log during their commute with no connectivity, install the app to their home screen, and trust that no data is ever silently lost.
**FRs covered:** FR36, FR37, FR38, FR39, FR40, FR41, FR42

---

## Epic 1: Foundation & Authentication

Users can access a working, secure app on their phone — register, log in, stay logged in, reset their password, and log out.

### Story 1.1: Project Scaffolding & CI/CD

As a developer,
I want the project initialized with Vite React TypeScript + Express TypeScript + Prisma connected to Neon PostgreSQL, deployed to Vercel with a working health check and GitHub Actions CI/CD,
So that all subsequent feature stories have a working, deployable foundation to build on.

**Acceptance Criteria:**

**Given** the monorepo is initialized
**When** the frontend dev server runs (`npm run dev` in `/client`)
**Then** the Vite React app loads at `localhost:5173` with no errors

**Given** the backend is running (`npm run dev` in `/server`)
**When** I hit `GET /api/health`
**Then** it returns `200 OK`

**Given** Prisma is configured with `DATABASE_URL` pointing to Neon
**When** I run `prisma migrate dev`
**Then** migrations apply to the Neon database without error

**Given** a push to the `main` branch
**When** GitHub Actions CI runs
**Then** TypeScript type-check and lint both pass, and Vercel deploys successfully

**Given** the deployed Vercel URL
**When** I visit it in a browser
**Then** the app is served over HTTPS and displays a placeholder "Vault 1" page

---

### Story 1.2: User Registration

As Elizabeth,
I want to create an account with a username and password,
So that my data is stored securely and tied to my identity.

**Acceptance Criteria:**

**Given** I'm on the registration page
**When** I submit a valid username (3–30 chars) and password (8+ chars)
**Then** my account is created and I'm redirected to `/onboarding`

**Given** a successful registration
**When** my password is stored
**Then** it is hashed with Argon2 — plaintext never persists anywhere

**Given** I submit a username that already exists
**When** the form is submitted
**Then** I see the error "Username already taken"

**Given** I submit a password under 8 characters
**When** Zod validation runs
**Then** I see a field-level validation error before the request is sent

**Given** successful registration
**When** I'm redirected to onboarding
**Then** a session cookie is set (HttpOnly, Secure, SameSite=Strict)

---

### Story 1.3: User Login & Persistent Session

As Elizabeth,
I want to log in with my username and password and stay logged in across visits,
So that I can open the app on my phone without re-authenticating every time.

**Acceptance Criteria:**

**Given** I enter valid credentials
**When** I submit the login form
**Then** I'm redirected to the dashboard and a session cookie is set

**Given** I enter invalid credentials
**When** I submit
**Then** I see "Invalid username or password" (no hint which field is wrong)

**Given** I'm logged in and close then reopen the browser
**When** I visit the app URL
**Then** I'm still authenticated — no login required

**Given** I'm not authenticated
**When** I navigate to any protected route (`/`, `/week`, `/goals`, `/settings`)
**Then** I'm redirected to `/login`

**Given** any request between client and server
**When** transmitted
**Then** it uses HTTPS/TLS (NFR-S1)

---

### Story 1.4: Password Reset via Email

As Elizabeth,
I want to reset my password via email if I forget it,
So that I can regain access without losing my data.

**Acceptance Criteria:**

**Given** I'm on the login page and click "Forgot password"
**When** I submit my username
**Then** a password reset email is sent via Resend with a time-limited link

**Given** I receive the reset email and click the link within 1 hour
**When** I submit a valid new password
**Then** my password is updated (Argon2 hashed) and I'm logged in

**Given** a reset link older than 1 hour
**When** I visit it
**Then** I see "This link has expired — request a new one"

**Given** a reset link that's already been used
**When** I visit it again
**Then** I see "This link has already been used"

---

### Story 1.5: Logout

As Elizabeth,
I want to log out of the app,
So that my session is properly ended.

**Acceptance Criteria:**

**Given** I'm logged in
**When** I tap the logout button
**Then** my session is invalidated server-side and I'm redirected to `/login`

**Given** I've just logged out
**When** I navigate to a protected route
**Then** I'm redirected to `/login` (session is truly gone, not just client-side cleared)

**Given** I've logged out
**When** a request is made with the old session cookie
**Then** the server responds with `401 Unauthorized`

---

## Epic 2: Daily Tracking Core

Users can track their day using the Win the Day dashboard — the core product hypothesis. Set up targets and Cheat Codes, see floor-based progress bars, log daily values, and press Day Complete any time regardless of how the day went.

### Story 2.1: User Onboarding — Targets & Floor Setup

As Elizabeth,
I want to enter my daily targets for calories, protein, and steps during first-time setup and see my floors calculated automatically,
So that the dashboard is meaningful from day one with thresholds that feel achievable.

**Acceptance Criteria:**

**Given** I've just registered and been redirected to `/onboarding`
**When** the onboarding screen loads
**Then** I see input fields for calorie target, protein target (g), and steps target

**Given** I enter valid targets (e.g. 1800 cal, 130g protein, 8000 steps)
**When** I submit the onboarding form
**Then** the system calculates and saves my floors: calories = target − 250, protein = target × 0.8, steps = target × 0.5

**Given** targets are saved
**When** I'm redirected to the dashboard
**Then** my targets and floors are persisted in the `UserConfig` table associated with my account

**Given** I enter a non-numeric or negative value
**When** Zod validation runs client-side
**Then** I see a field-level error before submission

**Given** I've completed onboarding
**When** I visit `/onboarding` again
**Then** I'm redirected to the dashboard (onboarding only runs once)

---

### Story 2.2: Cheat Codes Setup

As Elizabeth,
I want to create up to 3 Cheat Codes (short coaching reminders) and be able to edit or delete them,
So that my coaching strategies are captured in the app and ready to surface on my dashboard.

**Acceptance Criteria:**

**Given** I'm in the Cheat Codes section (onboarding or settings)
**When** I type a Cheat Code and save it
**Then** it is stored and appears in my Cheat Codes list

**Given** I already have 3 Cheat Codes
**When** I try to add a fourth
**Then** the "Add" button is disabled and I see "Maximum 3 Cheat Codes"

**Given** an existing Cheat Code
**When** I edit its text and save
**Then** the updated text is persisted and shown immediately

**Given** an existing Cheat Code
**When** I delete it
**Then** it is removed from the list and I can add a new one

**Given** a Cheat Code text input
**When** I submit an empty string
**Then** I see a validation error — blank Cheat Codes are not allowed

---

### Story 2.3: Zone Calculation Engine

As a developer,
I want a tested, isolated zone calculation library (`lib/zoneCalculator.ts`) that computes color zones and labels for all three metrics given a value and user targets,
So that all progress bar components source their zone logic from a single authoritative place with no magic values.

**Acceptance Criteria:**

**Given** `lib/zoneConstants.ts` exists
**When** imported
**Then** it exports `ZONE_COLORS`, `TIER_LABELS`, and `FLOOR_OFFSETS` constants — no inline color values exist anywhere else in the codebase

**Given** a calorie value below the floor
**When** `getZoneColor('calories', value, targets)` is called
**Then** it returns `zone-amber-low` with label "Below floor"

**Given** a calorie value between floor and target
**When** `getZoneColor('calories', value, targets)` is called
**Then** it returns `zone-green` with label "On track"

**Given** a calorie value between target and target + threshold (200 kcal)
**When** `getZoneColor('calories', value, targets)` is called
**Then** it returns `zone-amber-over` with label "Heads up"

**Given** a calorie value above target + threshold
**When** `getZoneColor('calories', value, targets)` is called
**Then** it returns `zone-orange` with label "Rad Zone"

**Given** a protein or steps value above the target
**When** `getZoneColor('protein' | 'steps', value, targets)` is called
**Then** it returns `zone-blue` with label "Bonus"

**Given** `lib/zoneCalculator.test.ts` exists
**When** the test suite runs
**Then** all zone boundary conditions pass (below floor, at floor, between floor–target, at target, above target+threshold)

---

### Story 2.4: Win the Day Dashboard — Progress Bars & Daily Log

As Elizabeth,
I want to see my daily progress as color-coded floor-based progress bars and be able to log my calories, protein, steps, and workout from the dashboard,
So that I can check in at any point in the day and see where I stand without judgment.

**Acceptance Criteria:**

**Given** I'm logged in and on the dashboard
**When** the page loads
**Then** I see three progress bars (calories, protein, steps) and a workout checkbox, all sourcing zone colors from `lib/zoneCalculator.ts`

**Given** I have no log entry for today
**When** the dashboard loads
**Then** all progress bars start at zero in their below-floor (amber) zone state

**Given** I enter a value in the calorie input
**When** I type each character
**Then** the calorie progress bar updates in real time with the correct zone color and label (live zone update)

**Given** a calorie value at 1,850 with a target of 1,800 and threshold of +200
**When** the bar renders
**Then** it shows `zone-amber-over` "Heads up" — not red, not a failure state

**Given** my Cheat Codes exist
**When** the dashboard is displayed
**Then** all Cheat Codes are visible without any navigation required (FR15)

**Given** the dashboard
**When** rendered on a 320px–375px viewport
**Then** all progress bars, inputs, and Cheat Codes are visible with no horizontal scroll

**Given** each progress bar
**When** rendered
**Then** it has `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and `aria-label` with zone description (NFR-A2, NFR-A3)

**Given** the active goals section of the dashboard
**When** no goals have been set up yet (pre-Epic 3)
**Then** a placeholder message is shown: "Set up your weekly goals to track them here"

---

### Story 2.5: Day Complete & Mood Tag

As Elizabeth,
I want to press Day Complete at any time regardless of how my metrics look, and optionally tag my mood,
So that every day gets closed — even rough ones — without the button ever being locked behind achievement.

**Acceptance Criteria:**

**Given** I'm on the dashboard
**When** the Day Complete button is visible
**Then** it is always pressable — never disabled, never locked, regardless of metric values

**Given** I press Day Complete
**When** the mood selection appears
**Then** I see mood options (e.g. "solid", "okay", "rough") and a skip/timeout path that closes the day without a selection

**Given** I select a mood and confirm
**When** Day Complete is saved
**Then** the day's log is marked complete with the selected mood and a `roughDay` flag derived from: (active goals achieved / total active goals) < 0.5

**Given** no active goals are set yet (pre-Epic 3)
**When** Day Complete is pressed
**Then** `roughDay` defaults to `false` — the flag only applies once goals exist

**Given** Day Complete is saved
**When** I return to the dashboard
**Then** today shows as completed and the Day Complete button is replaced by a closed-day state

**Given** the Day Complete confirmation
**When** displayed
**Then** no streak counter, streak warning, or "X days in a row" language appears anywhere

---

### Story 2.6: Yesterday Completion Prompt

As Elizabeth,
I want to be prompted to close yesterday's log when I open the app in the morning,
So that I can retroactively complete the previous day without guilt or friction.

**Acceptance Criteria:**

**Given** I log in and yesterday's day was not closed
**When** the dashboard loads
**Then** I see a prompt: "Yesterday isn't closed yet — want to complete it now?"

**Given** the yesterday prompt is shown
**When** I tap "Yes, complete it"
**Then** I'm taken to a condensed log view for yesterday where I can enter values and press Day Complete

**Given** I complete yesterday's log
**When** Day Complete is saved for that date
**Then** the prompt disappears and today's dashboard is shown

**Given** the yesterday prompt is shown
**When** I tap "Skip"
**Then** the prompt is dismissed and today's dashboard is shown — yesterday remains unclosed with no penalty

**Given** yesterday was already closed
**When** I log in
**Then** no prompt appears

---

### Story 2.7: Update Targets

As Elizabeth,
I want to update my calorie, protein, and steps targets at any time from settings,
So that my floors and progress bars stay accurate as my goals evolve.

**Acceptance Criteria:**

**Given** I navigate to `/settings`
**When** the page loads
**Then** I see my current targets pre-filled in the target form

**Given** I update one or more target values and save
**When** the form is submitted
**Then** new targets and recalculated floors are persisted and immediately reflected in the dashboard progress bars

**Given** I enter an invalid value (non-numeric or zero)
**When** Zod validation runs
**Then** I see a field-level error and the form does not submit

**Given** updated targets
**When** I view the dashboard after saving
**Then** the progress bars recalculate against the new targets — today's logged values are re-evaluated against the new zones

---

## Epic 3: Goals Management

Users can build and manage a personal goals library, and select 3–5 active goals per week to track on the dashboard.

### Story 3.1: Goals Library — Create & View

As Elizabeth,
I want to create goals in my personal library and browse a starter set of pre-defined goals,
So that I have a collection ready to choose from each week without starting from scratch.

**Acceptance Criteria:**

**Given** I navigate to `/goals`
**When** the page loads
**Then** I see my personal goals library and a starter library of pre-defined goals (e.g. "Calorie floor", "Protein floor", "Walk 3 days/week")

**Given** I tap "Add goal"
**When** I enter a goal name and select a type (daily metric-based or weekly frequency-based) and save
**Then** the new goal appears in my personal library

**Given** I create a weekly frequency-based goal
**When** I save it
**Then** I can specify a target frequency (e.g. "3 days/week") that is stored alongside the goal

**Given** the goals library
**When** displayed
**Then** each goal shows its name and type — no more than 5 items visible in the primary action area at once (NFR-A5)

**Given** the starter library goals
**When** I'm viewing them
**Then** they are available to add to my personal library but are not editable or deletable by me

---

### Story 3.2: Goals Library — Edit & Delete

As Elizabeth,
I want to edit and delete goals in my library,
So that my goal collection stays relevant as my focus evolves.

**Acceptance Criteria:**

**Given** an existing goal in my library
**When** I tap edit
**Then** I can modify the goal name and type and save the changes

**Given** I save an edited goal
**When** the save completes
**Then** the updated name and type are shown immediately in the library

**Given** an existing goal
**When** I tap delete and confirm
**Then** the goal is removed from my library permanently

**Given** a goal that is currently in the active weekly goals
**When** I attempt to delete it
**Then** I see a warning: "This goal is active this week — remove it from your weekly goals first"
**And** the delete does not proceed until the warning is acknowledged

**Given** a delete confirmation prompt
**When** I tap "Cancel"
**Then** the goal remains unchanged

---

### Story 3.3: Weekly Active Goal Selection

As Elizabeth,
I want to select 3–5 goals from my library as my active goals for the current week,
So that I have a focused set of goals driving my daily tracking.

**Acceptance Criteria:**

**Given** I'm in the active goal selection screen (reached from onboarding or a dashboard prompt when no goals are set)
**When** I tap a goal from my library
**Then** it is added to my selection for this week

**Given** I have selected 5 goals
**When** I attempt to select a 6th
**Then** the selection is blocked and I see "Maximum 5 active goals reached"

**Given** I have fewer than 3 goals selected
**When** I try to confirm my selection
**Then** I see "Select at least 3 goals to continue" and the confirm action is blocked

**Given** I select 3–5 goals and confirm
**When** the selection is saved
**Then** a `WeeklyPlan` record is created associating my selected goals with the current week start date

**Given** a `WeeklyPlan` already exists for the current week
**When** I visit the goal selector
**Then** my currently active goals are shown as already selected

---

### Story 3.4: Active Goals on Dashboard

As Elizabeth,
I want to see my active goals and per-goal progress on the daily dashboard,
So that I always know what I'm tracking this week and how each goal is going today.

**Acceptance Criteria:**

**Given** I have active goals set for the current week
**When** the dashboard loads
**Then** the active goals section shows all 3–5 goals, replacing the placeholder from Story 2.4

**Given** a daily metric-based goal (e.g. "Calorie floor")
**When** the dashboard renders
**Then** it shows whether today's logged value meets the goal criterion (e.g. green checkmark if calories ≥ floor)

**Given** a weekly frequency-based goal (e.g. "Walk 3 days/week")
**When** the dashboard renders
**Then** it shows days completed this week vs. target (e.g. "2 / 3 days")

**Given** Day Complete is pressed with active goals set
**When** `roughDay` is calculated
**Then** it uses actual goal achievement: goals met today ÷ total active goals < 0.5 = `roughDay: true` (completing Story 2.5's deferred logic)

**Given** the active goals section
**When** rendered
**Then** it contains no more than 5 items — cognitive load constraint enforced (NFR-A5)

---

## Epic 4: Weekly Planning Ritual

Users can complete the Sunday planning ritual — review last week's results, check consistency % with tier labels, get goal suggestions, update Cheat Codes, and start the new week with their chosen active goals.

> **Note:** Detailed acceptance criteria for Epic 4 stories to be written before Epic 4 implementation begins (rolling wave planning).

### Story 4.1: Consistency Calculation Engine

As a developer,
I want `lib/consistencyCalc.ts` isolated and tested with the weekly % formula, tier label logic, and roughDay aggregation,
So that all weekly planning UI has a single authoritative calculation source with no magic values.

### Story 4.2: Weekly Planning View — Prior Week Summary

As Elizabeth,
I want to open `/week` and see last week's per-goal results in a simple grid (days achieved vs. total),
So that I can review my week at a glance before planning the next one.

### Story 4.3: Consistency % & Tier Labels

As Elizabeth,
I want to see my weekly consistency percentage and its Fallout tier label ("Surviving the Wasteland", "Thriving", "Elite") on the planning view,
So that I get honest, non-judgmental feedback on how my week went.

### Story 4.4: Goal Suggestions

As Elizabeth,
I want the app to suggest which goals to keep, drop, or add based on last week's results,
So that my Sunday planning ritual takes under 10 minutes without requiring much deliberate decision-making.

### Story 4.5: Goal Selection & Week Start

As Elizabeth,
I want to select 3–5 goals for the upcoming week and press "Start Week",
So that my dashboard resets with the new active goal set and Monday begins with a clean slate.

### Story 4.6: Edit Cheat Codes from Planning View

As Elizabeth,
I want to edit my Cheat Codes directly from the weekly planning view,
So that I can update coaching strategies while I'm in a reflective planning mindset without navigating to settings.

---

## Epic 5: Offline & PWA

Users can log during their commute with no connectivity, install the app to their home screen, and trust that no data is ever silently lost.

> **Note:** Detailed acceptance criteria for Epic 5 stories to be written before Epic 5 implementation begins (rolling wave planning).

### Story 5.1: Offline Logging Queue

As Elizabeth,
I want core logging actions (calories, protein, steps, workout, Day Complete) to work with no connectivity and queue locally via Dexie.js,
So that I can log during my underground commute without any errors or data loss.

### Story 5.2: Offline Queue Auto-Sync & Retry

As Elizabeth,
I want queued actions to sync automatically when connectivity is restored, with up to 3 retries and exponential backoff before surfacing a non-blocking error,
So that my data reliably reaches the server without any manual intervention.

### Story 5.3: PWA Manifest & Home Screen Install

As Elizabeth,
I want to install Vault 1 to my iPhone home screen via "Add to Home Screen" and have it launch as a full-screen app,
So that it feels native and opens instantly from my home screen.

### Story 5.4: Responsive Layout & Cross-Browser

As Elizabeth,
I want the full app to work correctly on iOS Safari (P1), Chrome mobile, and desktop browsers at all viewports from 320px up,
So that I can use it reliably on whatever device or browser I'm on.
