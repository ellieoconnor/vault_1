---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-vault_1-2026-03-06.md
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2026-03-11'
project_name: 'vault_1'
user_name: 'Developer'
date: '2026-03-09'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
44 FRs across 8 areas: Account/Auth (FR1–5), Setup & Config (FR6–10), Daily Tracking (FR11–19), Goals Management (FR20–27), Weekly Planning (FR28–35), Data Integrity & Offline (FR36–39), PWA (FR40–42), System Tracking (FR43–44).

The core architectural driver is the daily tracking loop: local-first writes, floor-based zone calculation, Day Complete ritual, and offline sync queue. Every other capability depends on this loop functioning reliably on mobile with poor connectivity.

**Non-Functional Requirements:**
- Performance: <3s TTI on 4G; <300ms visual feedback on actions; <1s app shell from cache; <250KB gzipped bundle
- Security: HTTPS/TLS; encrypted at rest; HttpOnly session cookies; bcrypt/Argon2 passwords
- Reliability: Offline queue with 3-retry exponential backoff; no silent data loss; data survives PWA updates/service worker refreshes
- Accessibility: WCAG 2.1 Level AA; 44px touch targets; color never sole indicator; max 5 items in primary action areas

**Scale & Complexity:**

- Primary domain: Full-stack SPA PWA (mobile-first)
- Complexity level: Low-Medium
- Estimated architectural components: ~7 (Auth, Daily Log, Goals, Weekly Planner, Sync Queue, Zone Calculation Engine, PWA Shell)
- Single user, single device — no multi-tenancy, no concurrent session conflicts

### Technical Constraints & Dependencies

- iOS Safari (P1): Service worker support exists but is limited — offline strategy must be validated on actual iOS before dependent features are built
- PWA install: Requires HTTPS + valid manifest + service worker; "Add to Home Screen" behavior differs between iOS and Android
- No SSR: All content behind auth, no SEO needs — pure CSR simplifies deployment
- HealthKit future constraint: Data model must use HealthKit-compatible shapes now (steps: integer, workouts: boolean/duration) to avoid Phase 3 migration cost
- Authentication: Username + password only (no OAuth in MVP); persistent sessions via HttpOnly cookies
- Deployment: Static hosting (Vercel/Netlify) + separate API server

### Cross-Cutting Concerns Identified

1. **Offline/Sync Management** — affects daily log, goals, Day Complete, week start; requires consistent queue/retry pattern across all write actions
2. **Floor & Zone Calculation Engine** — calorie-asymmetric model is novel; must be isolated, testable, and centrally defined to prevent inconsistency across components
3. **Weekly Consistency Calculation** — drives tier labels, goal suggestions, and roughDay flag; calculation logic must be authoritative and shared
4. **ADHD-Aware UX Constraints** — no red states, no streaks, amber = neutral not failure; these are design-level invariants that must be enforced architecturally, not left to individual component decisions
5. **PWA Lifecycle** — service worker updates, cache invalidation, and offline/online transitions must not cause data loss or disorienting UI state changes

## Starter Template Evaluation

### Primary Technology Domain

Full-stack SPA PWA: React (TypeScript) frontend + Node/Express (TypeScript) backend, deployed as two separate services with a shared PostgreSQL database.

### Technical Preferences Established

- **Language:** TypeScript (frontend + backend)
- **Frontend framework:** React
- **Backend framework:** Node.js + Express
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Database hosting:** Neon (free tier, serverless PostgreSQL)
- **Deployment:** Vercel (frontend + backend)
- **Skill context:** Learning project — architecture favors clarity and documentation over cleverness

### Project Structure Decision: Monorepo

Two packages in a single repository:
- `/client` — React TypeScript PWA (Vite)
- `/server` — Express TypeScript API

Monorepo keeps everything in one place (single git repo, shared types possible), without the complexity of a full monorepo toolchain (no Turborepo/Nx needed at this scale).

### Starter Options Evaluated

| Option | Verdict |
|---|---|
| create-react-app | Deprecated — do not use |
| Next.js | SSR not needed; adds complexity without benefit |
| T3 Stack | Next.js-based; not Express-compatible |
| React Native / Expo | Rejected — PWA confirmed; single codebase simpler for learning context |
| Vite react-ts + vite-plugin-pwa | ✅ Selected — minimal, current, PWA-ready |

### Selected Starter: Vite React TypeScript + Express TypeScript

**Rationale:** No single full-stack starter cleanly combines Vite PWA + Express without opinionated choices that don't fit this project. Two focused starters give cleaner control and are appropriate for a learning context. PWA confirmed over React Native — single codebase, one deployment target, appropriate for this interaction model and skill level.

**Initialization Commands:**

```bash
# Frontend (run from project root)
npm create vite@latest client -- --template react-ts
cd client
npm install -D vite-plugin-pwa workbox-window

# Backend (run from project root)
mkdir server && cd server
npm init -y
npm install express cors cookie-parser
npm install -D typescript @types/express @types/node @types/cors @types/cookie-parser tsx
npx tsc --init

# ORM + Database
npm install @prisma/client
npm install -D prisma
npx prisma init
```

**Architectural Decisions Provided by This Setup:**

- **Language & Runtime:** TypeScript throughout; Node.js 20+ LTS
- **Build Tooling:** Vite 7 — fast dev server, <250KB bundle targets achievable
- **PWA:** vite-plugin-pwa v1.2.0 — service worker + manifest; Workbox for caching strategy
- **Backend runtime:** tsx — runs TypeScript directly in development, no separate build step
- **ORM:** Prisma — schema-first, automatic migrations, beginner-friendly, full TypeScript types
- **Database:** Neon (free tier) — serverless PostgreSQL, Vercel integration, scales to zero
- **Styling:** Tailwind CSS v4 — to be added; best fit for PWA mobile-first + Vault-Tec theme customization

**Code Organization:**

```
vault_1/
├── client/                  # Vite React PWA
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── stores/          # Zustand state
│   │   ├── lib/             # calculation engine, utilities
│   │   └── service-worker/
│   └── vite.config.ts
├── server/                  # Express API
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── index.ts
│   └── prisma/
│       └── schema.prisma
└── package.json
```

**Development Experience:**
- Vite HMR: instant feedback on React changes
- tsx watch mode: Express restarts on file change
- Prisma Studio: visual database browser (free, local)

**Note:** Project initialization using these commands should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Session-based authentication strategy (express-session + Argon2)
- Offline queue storage (Dexie.js / IndexedDB)
- Server state management (TanStack Query)
- Client routing (React Router v7)
- Input validation library (Zod — both sides)

**Important Decisions (Shape Architecture):**
- UI state management (Zustand)
- Styling system (Tailwind CSS v4)
- CI/CD pipeline (GitHub Actions)

**Deferred Decisions (Post-MVP):**
- Monitoring/error tracking (not needed for single-user MVP)
- Advanced caching strategy (Workbox strategy to be finalized during PWA implementation spike)
- Rate limiting (relevant if app ever opens to other users)

---

### Data Architecture

**ORM:** Prisma (schema-first, automatic migrations, TypeScript type generation)
- Rationale: Beginner-friendly, excellent documentation, handles migrations automatically

**Validation:** Zod — shared schemas between client and server
- Define once in a shared `types/` location (or duplicate deliberately in client/server)
- Server: validate all incoming API request bodies with Zod before they touch Prisma
- Client: validate form inputs before submission
- Rationale: Single source of truth for data shapes; TypeScript inference from schemas

**Migration approach:** `prisma migrate dev` in development; `prisma migrate deploy` in CI/CD

**Conflict resolution:** Last-write-wins (single user, single device — documented in PRD as acceptable)

**Caching strategy:** TanStack Query handles server-state cache on the client; Workbox handles PWA shell + static asset cache; no server-side cache needed at this scale

---

### Authentication & Security

**Session strategy:** `express-session` with `connect-pg-simple` (sessions stored in PostgreSQL)
- Cookie: HttpOnly, Secure, SameSite=Strict
- Session invalidated on logout (DELETE from session table)
- Rationale: Simpler to reason about than JWT; easy to revoke; single-user means no scale concerns

**Password hashing:** Argon2 (`argon2` npm package)
- Rationale: Modern recommendation over bcrypt; resistant to GPU-based attacks

**Email service:** Resend (`resend` npm package) — password reset emails (FR4, NFR-S5)
- Rationale: Simple Node.js SDK, free tier (3,000 emails/month), no SMTP configuration needed

**CORS:** Configured to allow only the Vercel frontend origin in production

**HTTPS:** Enforced via Vercel (frontend) and Vercel Functions / Railway (backend); no plain HTTP in production

**Sensitive data:** No health data stored in localStorage or sessionStorage; all personal data server-side only

---

### API & Communication Patterns

**API style:** REST
- No GraphQL — adds complexity without benefit at this scale

**URL structure:** `/api/` prefix, no versioning for MVP (single consumer, single developer)
- Example: `POST /api/logs`, `GET /api/goals`, `POST /api/auth/login`

**Error format (standard across all endpoints):**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Human-readable description",
  "details": {}
}
```

**HTTP client (frontend):** `fetch` via TanStack Query — no Axios needed; native fetch is sufficient

**Request validation:** Zod middleware on all POST/PATCH routes — reject malformed input before it reaches business logic

---

### Frontend Architecture

**Server state:** TanStack Query v5
- Handles: API fetching, loading/error states, background refetch, cache invalidation
- Integrates with Dexie.js offline queue: optimistic updates write to local queue first, TanStack Query syncs when online
- Rationale: Industry standard for React + REST; dramatically reduces boilerplate for async data

**UI/client state:** Zustand
- Owns: navigation state, modal open/close, current week context, sync status indicator
- Rationale: Minimal boilerplate, no provider wrapping, simple mental model

**Offline queue:** Dexie.js (IndexedDB wrapper)
- Stores: queued write actions (type, payload, timestamp, retry count, status)
- Queue is drained on connectivity restore; each action retried up to 3x with exponential backoff
- Rationale: Structured storage for complex offline state; localStorage is insufficient for queued operations

**Routing:** React Router v7
- Routes: `/` (dashboard), `/week` (weekly planning), `/goals` (goals library), `/settings`, `/onboarding`
- All routes behind auth guard; redirect to `/onboarding` on first run

**Styling:** Tailwind CSS v4
- Vault-Tec theme via CSS custom properties (color tokens: amber, green, blue, orange — matching zone model)
- Mobile-first utility classes; 320px base
- No component library — custom components built with Tailwind (keeps bundle small, full theme control)

**Bundle target:** <250KB gzipped initial load (Vite tree-shaking + code splitting by route)

---

### Infrastructure & Deployment

**Frontend hosting:** Vercel (static SPA deployment; auto-deploy on `main` branch push)

**Backend hosting:** Vercel Functions or Railway
- Vercel Functions: simplest for a learner (same platform, no separate server config); cold start acceptable for personal use
- Railway: always-on server if cold starts cause issues — decide after MVP testing

**Database:** Neon (free tier)
- Dev branch and prod branch via Neon's database branching feature
- Connection string via environment variable (`DATABASE_URL`)

**CI/CD:** GitHub Actions
- On push to `main`: run `prisma migrate deploy` + deploy to Vercel
- On PR: type-check + lint

**Environment config:**
- Local: `.env` files (`.env.local` for client, `.env` for server) — gitignored
- Production: Vercel environment variables panel

**Monitoring:** None for MVP — Vercel function logs for production debugging

---

### Decision Impact Analysis

**Implementation Sequence (order matters):**
1. Project scaffolding (Vite + Express + Prisma init)
2. Prisma schema + Neon database setup
3. Auth routes (register, login, logout, session middleware)
4. Zod validation middleware (used by all subsequent routes)
5. Core API routes (logs, goals, weekly plans)
6. Dexie.js offline queue (client-side, before connecting to real API)
7. TanStack Query integration (connect client to API)
8. Zustand stores (UI state)
9. React Router routes + auth guard
10. Tailwind CSS + Vault-Tec theme tokens
11. vite-plugin-pwa + Workbox configuration (last — requires HTTPS)

**Cross-Component Dependencies:**
- Zod schemas are shared between client form validation and server request validation — establish early
- Dexie schema must mirror Prisma schema for offline-to-sync consistency
- Zustand sync status store is driven by Dexie queue state + TanStack Query network status
- Color zone logic (Floor/Zone Calculation Engine) must be defined before any progress bar component is built

## Implementation Patterns & Consistency Rules

### Critical Conflict Points Identified

8 areas where AI agents could make different choices without explicit standards — all addressed below.

### Naming Patterns

**Database Naming Conventions (Prisma):**
- Model names: PascalCase singular (`User`, `DailyLog`, `Goal`, `WeeklyPlan`)
- Field names: camelCase (`userId`, `logDate`, `createdAt`)
- PostgreSQL table names: snake_case plural via `@@map` (`daily_logs`, `weekly_plans`)
- PostgreSQL column names: snake_case via `@map` (`user_id`, `log_date`, `created_at`)
- Foreign keys: `userId`, `goalId` (camelCase field) → `user_id`, `goal_id` (column via @map)

```prisma
// ✅ Correct
model DailyLog {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  logDate   DateTime @map("log_date")
  @@map("daily_logs")
}
```

**API Endpoint Naming:**
- Plural, kebab-case nouns: `/api/daily-logs`, `/api/goals`, `/api/weekly-plans`
- Auth routes: `/api/auth/login`, `/api/auth/logout`, `/api/auth/register`
- Route parameters: `:id` (e.g., `/api/goals/:id`)
- Query parameters: camelCase (`?weekStartDate=2026-03-09`)

**Code Naming Conventions:**
- React components: PascalCase files AND exports (`ProgressBar.tsx`, `export function ProgressBar`)
- Pages: PascalCase with `Page` suffix (`DashboardPage.tsx`, `WeeklyPlanPage.tsx`)
- Custom hooks: camelCase with `use` prefix (`useOfflineQueue.ts`, `useSyncStatus.ts`)
- Utilities/pure functions: camelCase files (`zoneCalculator.ts`, `consistencyCalc.ts`)
- Zustand stores: camelCase with `store` suffix (`syncStore.ts`, `uiStore.ts`)
- Zod schemas: camelCase with `Schema` suffix (`dailyLogSchema`, `goalSchema`)
- Constants: SCREAMING_SNAKE_CASE (`CALORIE_FLOOR_OFFSET`, `ZONE_COLORS`)
- TypeScript types/interfaces: PascalCase (`DailyLog`, `GoalType`, `ZoneColor`)

**JSON field naming:** camelCase throughout (matches Prisma output, matches TypeScript convention)

### Structure Patterns

**Project File Organization:**
```
client/src/
├── components/          # Reusable UI components, organized by feature
│   ├── dashboard/       # ProgressBar, CheatCodes, DayCompleteButton, ActiveGoalList
│   ├── goals/           # GoalCard, GoalLibrary, GoalForm
│   ├── weekly/          # WeekSummary, GoalSelector, ConsistencyBadge
│   └── shared/          # Button, Input, Modal, LoadingSpinner (used across features)
├── pages/               # Route-level components (one per route)
│   ├── DashboardPage.tsx
│   ├── WeeklyPlanPage.tsx
│   ├── GoalsLibraryPage.tsx
│   ├── SettingsPage.tsx
│   └── OnboardingPage.tsx
├── hooks/               # Custom React hooks
│   ├── useOfflineQueue.ts
│   └── useSyncStatus.ts
├── stores/              # Zustand stores
│   ├── uiStore.ts       # Modal state, nav state, current week
│   └── syncStore.ts     # Online status, queue length, last sync time
├── lib/                 # Pure functions — NO React, NO side effects
│   ├── zoneCalculator.ts        # Floor/zone color logic
│   ├── consistencyCalc.ts       # Weekly consistency %, roughDay, tier labels
│   ├── floorCalculator.ts       # target → floor derivation
│   └── zoneConstants.ts         # ZONE_COLORS, TIER_LABELS, FLOOR_OFFSETS
└── db/                  # Dexie database schema and offline queue
    ├── dexieDb.ts
    └── offlineQueue.ts

server/src/
├── routes/              # Express route handlers (thin — delegate to services)
│   ├── auth.ts
│   ├── logs.ts
│   ├── goals.ts
│   └── weeklyPlans.ts
├── middleware/          # Express middleware
│   ├── auth.ts          # Session authentication guard
│   ├── validate.ts      # Zod validation middleware factory
│   └── errorHandler.ts  # Central error handler (must be last)
├── services/            # Business logic (pure functions where possible)
│   ├── logService.ts
│   ├── goalService.ts
│   └── weekService.ts
└── index.ts             # Express app setup and server entry point
```

**Test file placement:** Co-located with source file
```
src/lib/zoneCalculator.ts
src/lib/zoneCalculator.test.ts   ✅
src/__tests__/zoneCalculator.test.ts  ❌ — do not use separate __tests__ folder
```

### Format Patterns

**API Success Response:** Direct object — no envelope wrapper
```json
// ✅ Correct
{ "id": "abc123", "logDate": "2026-03-09", "calories": 1840 }

// ❌ Wrong — do not wrap
{ "data": { "id": "abc123" }, "success": true }
```

**API Error Response:** Consistent shape (must match exactly)
```json
{ "error": "VALIDATION_ERROR", "message": "calories must be a positive number", "details": {} }
```

**Date formats in JSON:**
- Date only: `"2026-03-09"` (ISO 8601 date string, no time)
- Timestamps: `"2026-03-09T08:47:00.000Z"` (ISO 8601 UTC)
- Never use Unix timestamps in API responses

**HTTP status codes — enforced usage:**
| Status | When |
|---|---|
| 200 | GET success, PATCH success |
| 201 | POST created |
| 204 | DELETE success (no body) |
| 400 | Validation error (Zod rejection) |
| 401 | Not authenticated |
| 403 | Authenticated but forbidden |
| 404 | Resource not found |
| 500 | Unexpected server error |

### Communication Patterns

**State management boundaries:**
- TanStack Query owns ALL server-derived data (logs, goals, weekly plans, user profile)
- Zustand owns ONLY UI state that doesn't come from the server (modals, nav, sync indicator)
- Never store server data in Zustand — duplication causes stale state bugs

**Offline queue actions:** Typed discriminated union
```typescript
type OfflineAction =
  | { type: 'LOG_DAILY'; payload: DailyLogInput }
  | { type: 'DAY_COMPLETE'; payload: DayCompleteInput }
  | { type: 'UPDATE_GOAL'; payload: GoalUpdateInput }
```

**Zustand store pattern:** Flat stores, no nested state
```typescript
// ✅ Correct
const useUiStore = create((set) => ({
  isGoalModalOpen: false,
  openGoalModal: () => set({ isGoalModalOpen: true }),
}))
```

### Process Patterns

**Error handling (backend):**
- Route handlers NEVER send error responses directly — always call `next(err)`
- Central error middleware in `middleware/errorHandler.ts` handles all errors
- Zod errors are caught and formatted before reaching the central handler

**Error handling (frontend):**
- TanStack Query `isError` + `error` for server errors — never `try/catch` in components
- React Error Boundary wraps each page for unexpected render errors
- No alert() or console.error in production — errors surface via UI state only

**Loading states:**
- Use TanStack Query `isPending` — never create `isLoading` state in Zustand for server data
- Show loading UI only if request takes >300ms (avoid flicker on fast connections)

**ADHD UX invariants — enforced in code, never overridden:**
- All zone colors sourced ONLY from `lib/zoneConstants.ts` — no inline color values
- `amber` zone text context: always "neutral data" language — never "missed", "failed", "below"
- No streak counters, "days missed" counts, or negative progress indicators anywhere
- Day Complete button: never disabled, never locked behind metric achievement

### Enforcement Guidelines

**All AI Agents MUST:**
- Source zone colors and tier labels from `lib/zoneConstants.ts` — no magic values
- Route handlers call `next(err)`, never `res.status(500).json(...)` directly
- Use PascalCase for component files and kebab-case for API endpoints
- Validate all API inputs with Zod middleware before business logic runs
- Write tests co-located with source files (`*.test.ts` next to the file)
- Never store server state in Zustand

**Anti-patterns to avoid:**
```typescript
// ❌ Magic zone color values
const color = value > 1800 ? '#ff9900' : '#22c55e'

// ✅ Use constants
import { getZoneColor } from '@/lib/zoneCalculator'
const color = getZoneColor('calories', value, userTargets)

// ❌ Sending error directly from route
res.status(500).json({ error: 'Something went wrong' })

// ✅ Pass to error middleware
next(new AppError('Something went wrong', 500))

// ❌ Server data in Zustand
useUiStore.setState({ todayLog: apiResponse })

// ✅ Server data in TanStack Query
const { data: todayLog } = useQuery({ queryKey: ['log', today] })
```

## Project Structure & Boundaries

### Complete Project Directory Structure

```
vault_1/
├── .github/
│   └── workflows/
│       └── ci.yml                    # Type-check + lint on PR; migrate + deploy on main
├── .gitignore
├── README.md
│
├── client/                           # Vite React PWA
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts                # vite-plugin-pwa config, path aliases
│   ├── tailwind.config.ts            # Vault-Tec theme tokens
│   ├── index.html
│   ├── .env.local                    # VITE_API_URL=http://localhost:3001
│   ├── .env.example
│   ├── public/
│   │   ├── manifest.webmanifest      # PWA manifest (name, icons, theme_color)
│   │   ├── icons/                    # PWA icons (192x192, 512x512, maskable)
│   │   └── vault-tec-logo.svg
│   └── src/
│       ├── main.tsx                  # React root, TanStack Query provider, Router
│       ├── App.tsx                   # Route definitions, auth guard wrapper
│       │
│       ├── pages/                    # Route-level components (one per route)
│       │   ├── DashboardPage.tsx     # FR11-19: daily tracking, progress bars, Day Complete
│       │   ├── WeeklyPlanPage.tsx    # FR28-35: Sunday planning ritual, consistency %
│       │   ├── GoalsLibraryPage.tsx  # FR20-24: goals CRUD
│       │   ├── SettingsPage.tsx      # FR6-10: targets, floors, Cheat Codes
│       │   └── OnboardingPage.tsx    # FR1, FR6-10, FR24-25: first-run setup
│       │
│       ├── components/
│       │   ├── dashboard/
│       │   │   ├── ProgressBar.tsx           # FR12-14: floor-based colored bar
│       │   │   ├── ProgressBar.test.tsx
│       │   │   ├── CheatCodes.tsx            # FR15: always-visible coaching reminders
│       │   │   ├── DayCompleteButton.tsx     # FR16-17: pressable anytime + mood tag
│       │   │   ├── ActiveGoalList.tsx        # FR27: active goals + per-goal progress
│       │   │   ├── YesterdayPrompt.tsx       # FR18: login prompt for prior day
│       │   │   └── DailyLogForm.tsx          # FR11: calories/protein/steps/workout input
│       │   ├── goals/
│       │   │   ├── GoalCard.tsx              # FR20-23: display + edit/delete actions
│       │   │   ├── GoalForm.tsx              # FR20-21: create/edit form with Zod validation
│       │   │   └── GoalLibrary.tsx           # FR24: starter library + user goals list
│       │   ├── weekly/
│       │   │   ├── WeekSummary.tsx           # FR29: prior week per-goal results grid
│       │   │   ├── ConsistencyBadge.tsx      # FR30-31: consistency % + tier label
│       │   │   ├── GoalSelector.tsx          # FR33: 3-5 enforced selection for next week
│       │   │   └── GoalSuggestions.tsx       # FR32: app-suggested keep/drop/add
│       │   ├── settings/
│       │   │   ├── TargetForm.tsx            # FR6-8: calorie/protein/steps targets + auto-floor
│       │   │   └── CheatCodeForm.tsx         # FR9-10, FR35: Cheat Code editor (max 3)
│       │   └── shared/
│       │       ├── Button.tsx
│       │       ├── Input.tsx
│       │       ├── Modal.tsx
│       │       ├── AuthGuard.tsx             # FR2-3: route protection, session check
│       │       ├── SyncStatusBar.tsx         # FR36-38: offline indicator + queue status
│       │       └── LoadingSpinner.tsx
│       │
│       ├── hooks/
│       │   ├── useOfflineQueue.ts            # FR36-38: queue write actions, drain on reconnect
│       │   ├── useOfflineQueue.test.ts
│       │   ├── useSyncStatus.ts              # online/offline state, queue length
│       │   └── useAuthSession.ts             # FR3: session presence check
│       │
│       ├── stores/                           # Zustand — UI state only
│       │   ├── uiStore.ts                    # modal state, active nav, week context
│       │   └── syncStore.ts                  # online status, last sync time
│       │
│       ├── lib/                              # Pure functions — no React, no side effects
│       │   ├── zoneCalculator.ts             # FR12-14: floor/zone color logic (calorie-asymmetric)
│       │   ├── zoneCalculator.test.ts
│       │   ├── consistencyCalc.ts            # FR30-31, FR44: weekly %, roughDay, tier labels
│       │   ├── consistencyCalc.test.ts
│       │   ├── floorCalculator.ts            # FR7: target → floor derivation
│       │   ├── floorCalculator.test.ts
│       │   └── zoneConstants.ts              # ZONE_COLORS, TIER_LABELS, FLOOR_OFFSETS, MOOD_OPTIONS
│       │
│       ├── db/                               # Dexie.js — IndexedDB offline layer
│       │   ├── dexieDb.ts                    # Dexie database instance + schema
│       │   └── offlineQueue.ts               # FR36-38: typed action queue + retry logic
│       │
│       ├── api/                              # TanStack Query hooks (server state)
│       │   ├── useDailyLog.ts                # GET/POST /api/daily-logs
│       │   ├── useGoals.ts                   # GET/POST/PATCH/DELETE /api/goals
│       │   ├── useWeeklyPlan.ts              # GET/POST /api/weekly-plans
│       │   └── useAuth.ts                    # POST /api/auth/login, logout, register
│       │
│       └── types/                            # Shared TypeScript types (no Zod here)
│           └── index.ts                      # DailyLog, Goal, WeeklyPlan, User, ZoneColor
│
└── server/                                   # Express TypeScript API
    ├── package.json
    ├── tsconfig.json
    ├── .env                                  # DATABASE_URL, SESSION_SECRET, CLIENT_ORIGIN, RESEND_API_KEY
    ├── .env.example
    └── src/
        ├── index.ts                          # Express app setup, middleware chain, server start
        │
        ├── routes/                           # Thin route handlers — delegate to services
        │   ├── auth.ts                       # FR1-5: register, login, logout, session check
        │   ├── logs.ts                       # FR11-19, FR43: daily log CRUD + Day Complete
        │   ├── goals.ts                      # FR20-27: goals library CRUD + active goal selection
        │   └── weeklyPlans.ts                # FR28-35, FR44: weekly plan + consistency calc
        │
        ├── middleware/
        │   ├── auth.ts                       # FR2-3: session guard (requireAuth)
        │   ├── validate.ts                   # Zod middleware factory — validates req.body
        │   └── errorHandler.ts              # Central error handler (last middleware)
        │
        ├── services/                         # Business logic
        │   ├── authService.ts                # Argon2 hash/verify, session creation
        │   ├── emailService.ts               # FR4: Resend integration — password reset emails
        │   ├── logService.ts                 # Day Complete logic, roughDay flag (FR19), login timestamps (FR43)
        │   ├── goalService.ts                # 3-5 enforcement (FR26), starter library (FR24)
        │   └── weekService.ts                # Consistency % calc (FR44), goal suggestions (FR32)
        │
        ├── schemas/                          # Zod schemas (server-side validation)
        │   ├── authSchemas.ts                # registerSchema, loginSchema
        │   ├── logSchemas.ts                 # dailyLogSchema, dayCompleteSchema
        │   ├── goalSchemas.ts                # createGoalSchema, updateGoalSchema
        │   └── weekSchemas.ts                # weeklyPlanSchema, goalSelectionSchema
        │
        └── prisma/
            ├── schema.prisma                 # Models: User, DailyLog, Goal, ActiveGoal,
            │                                 #   WeeklyPlan, CheatCode, LoginEvent, Session
            └── migrations/                   # Auto-generated by prisma migrate dev
```

### Architectural Boundaries

**API Boundary (client ↔ server):**
- All communication via HTTPS REST to `/api/*`
- Client never reads the database directly
- Auth boundary: `requireAuth` middleware on all routes except `/api/auth/*`
- Session cookie set by server, read automatically by browser — client never handles the token

**Offline Boundary (Dexie ↔ API):**
- All write actions from components go through `useOfflineQueue` hook — never direct API calls
- `offlineQueue.ts` is the only place that decides "queue or send now"
- TanStack Query's `queryClient.invalidateQueries()` triggers after successful sync to refresh UI

**Calculation Boundary (`lib/` functions):**
- `zoneCalculator.ts`, `consistencyCalc.ts`, `floorCalculator.ts` are pure functions
- They have NO imports from React, Zustand, Dexie, or API layers
- They can be used from both client components AND server services — same logic, consistent results
- Tests for these run without any mocking

**State Boundary:**
- Zustand (`stores/`) — UI/navigation state only
- TanStack Query (`api/`) — all server-derived data
- Dexie (`db/`) — offline queue and local writes

### Requirements to Structure Mapping

| FR Category | Primary Files |
|---|---|
| Auth (FR1–5) | `routes/auth.ts`, `services/authService.ts`, `components/shared/AuthGuard.tsx`, `pages/OnboardingPage.tsx` |
| Setup/Config (FR6–10) | `components/settings/TargetForm.tsx`, `components/settings/CheatCodeForm.tsx`, `lib/floorCalculator.ts` |
| Daily Tracking (FR11–19) | `pages/DashboardPage.tsx`, `components/dashboard/*`, `routes/logs.ts`, `services/logService.ts`, `lib/zoneCalculator.ts`, `lib/zoneConstants.ts` |
| Goals (FR20–27) | `pages/GoalsLibraryPage.tsx`, `components/goals/*`, `routes/goals.ts`, `services/goalService.ts` |
| Weekly Planning (FR28–35) | `pages/WeeklyPlanPage.tsx`, `components/weekly/*`, `routes/weeklyPlans.ts`, `services/weekService.ts`, `lib/consistencyCalc.ts` |
| Offline/Sync (FR36–39) | `db/dexieDb.ts`, `db/offlineQueue.ts`, `hooks/useOfflineQueue.ts`, `components/shared/SyncStatusBar.tsx` |
| PWA (FR40–42) | `vite.config.ts`, `public/manifest.webmanifest`, `public/icons/` |
| System Tracking (FR43–44) | `services/logService.ts` (login timestamps), `services/weekService.ts` (consistency %) |

### Data Flow

```
User action
  → Component calls useOfflineQueue hook
    → Dexie queue stores action locally (immediate — no network wait)
      → UI updates optimistically
        → Online? → offlineQueue drains → API call
          → Prisma → Neon PostgreSQL
            → TanStack Query invalidates → UI syncs from server
        → Offline? → queue persists until connectivity restored
```

### Development Workflow

```bash
# Terminal 1 — Backend
cd server && npx tsx watch src/index.ts

# Terminal 2 — Frontend
cd client && npm run dev

# Terminal 3 — Database (optional visual browser)
cd server && npx prisma studio
```

**Deployment:**
- `client/` → Vercel static deployment (auto on `main` push)
- `server/` → Vercel Functions or Railway
- Database migrations run in CI before deploy: `npx prisma migrate deploy`

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices work together without conflicts. React 18 + Vite 7 + TypeScript is a well-validated stack. TanStack Query v5 and Zustand occupy non-overlapping state domains (server state vs. UI state) with an explicit boundary enforced in patterns. Dexie.js and TanStack Query are additive — Dexie handles offline queue persistence while TanStack Query handles server-synchronised display state. Express sessions with connect-pg-simple use the same Neon database as the application data, eliminating a separate session store dependency. Argon2 (password hashing) and express-session (cookie-based auth) are compatible. Resend (email) has no conflicts with any other dependency. Prisma + Neon + PostgreSQL is a tested combination.

**Pattern Consistency:**
Naming conventions are consistent: PascalCase components/files throughout `client/src/`, camelCase JSON fields and TypeScript identifiers, snake_case Prisma `@map`/`@@map` for PostgreSQL columns, kebab-case API endpoints. The offline queue discriminated union pattern aligns with TypeScript and Dexie's typed table approach. Error handling patterns (backend: `next(err)` to central handler; frontend: TanStack Query `isError`) are consistent and complementary. ADHD UX invariants are enforced in code via `lib/zoneConstants.ts` rather than relying on developer discipline.

**Structure Alignment:**
The monorepo layout (`/client` + `/server`) cleanly separates concerns without Turborepo overhead — appropriate for a single-developer project. The `lib/` pure-function boundary means calculation logic can be shared (or duplicated without divergence risk) between client and server. All architectural decisions — offline-first writes, session auth, zone calculations — map to specific files in the directory tree.

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**
All 44 FRs are mapped to specific files in the Requirements to Structure Mapping table. No FR category is without an implementation home:
- Auth (FR1–5): `routes/auth.ts` + `services/authService.ts` + `emailService.ts` (FR4 password reset via Resend)
- Setup/Config (FR6–10): `TargetForm.tsx`, `CheatCodeForm.tsx`, `lib/floorCalculator.ts`
- Daily Tracking (FR11–19): `DashboardPage.tsx`, `components/dashboard/*`, `lib/zoneCalculator.ts`
- Goals (FR20–27): `GoalsLibraryPage.tsx`, `components/goals/*`, `services/goalService.ts`
- Weekly Planning (FR28–35): `WeeklyPlanPage.tsx`, `components/weekly/*`, `services/weekService.ts`
- Offline/Sync (FR36–39): `db/offlineQueue.ts`, `hooks/useOfflineQueue.ts`
- PWA (FR40–42): `vite.config.ts`, `public/manifest.webmanifest`
- System Tracking (FR43–44): `services/logService.ts` (login timestamps), `services/weekService.ts` (consistency %)

**Non-Functional Requirements Coverage:**
- Performance (<3s TTI, <300ms feedback, <250KB bundle): Vite code-splitting, PWA app shell caching, optimistic UI via offline queue, loading UI only if >300ms (pattern enforced)
- Security (HTTPS, HttpOnly cookies, Argon2): express-session HttpOnly/Secure cookies, Argon2 hashing, Zod validation on all API inputs, `requireAuth` middleware on all protected routes
- Reliability (offline queue, no silent data loss): Dexie.js typed queue with 3-retry exponential backoff, discriminated union prevents invalid action types
- Accessibility (WCAG 2.1 AA, 44px touch targets, color not sole indicator): ADHD UX invariants enforced in `zoneConstants.ts`, patterns prohibit inline color values

### Implementation Readiness Validation ✅

**Decision Completeness:**
All critical decisions are documented with exact versions: React 18, TypeScript, Vite 7, Node/Express, PostgreSQL via Prisma on Neon, TanStack Query v5, Zustand, Dexie.js, Argon2, express-session + connect-pg-simple, Resend, React Router v7, Zod, Tailwind CSS v4, vite-plugin-pwa v1.2.0. Rationale is recorded for all non-obvious choices (e.g., express-session over JWT, Dexie over localStorage, PWA over React Native).

**Structure Completeness:**
The directory tree is specific to vault_1 — no generic placeholders. Every component, hook, service, schema, and lib file is named and mapped to its FR coverage. Integration points (API boundary, offline boundary, calculation boundary, state boundary) are explicitly defined.

**Pattern Completeness:**
Naming, structure, format, communication, and process patterns are fully specified with concrete examples and anti-patterns. The enforcement guidelines use "MUST" language with code examples for the most critical rules (zone color sourcing, error middleware pattern, state boundaries).

### Gap Analysis Results

**Critical Gaps Resolved During This Session:**
- **Email service gap (NFR-S5, FR4):** No email provider had been selected for password reset. Resolved: Resend selected. `emailService.ts` added to `server/src/services/`. `RESEND_API_KEY` added to `.env`/`.env.example`. Auth section updated to document Resend decision.

**Important Notes (Non-Blocking):**
- **Vercel serverless deployment pattern:** Express apps on Vercel Functions must export `app` as a handler, not call `app.listen()`. This diverges from the development `index.ts` setup and must be explicitly covered in the first implementation story to avoid a deployment-blocking discovery. *(Flagged by implementation review.)*
- iOS Safari service worker limitations (noted in constraints): PWA offline behaviour must be validated on a real device before offline-dependent features are considered "done" — particularly the offline queue drain and service worker update flow.

**Nice-to-Have (Deferred):**
- Prisma schema for the `Session` table (managed by connect-pg-simple — no Prisma schema needed, but documenting is helpful)
- E2E test strategy (Playwright setup deferred post-MVP)
- HealthKit integration schema (Phase 3 — data shapes are already compatible)

### Priority Test Targets

The following files carry the highest implementation risk and must have comprehensive test coverage before dependent features are considered stable:

| File | Why Priority | Test Focus |
|---|---|---|
| `client/src/db/offlineQueue.ts` | Core reliability guarantee — silent failure here means data loss with no user feedback | Queue drain, retry backoff (3 attempts), action type discrimination, network-restored trigger |
| `client/src/hooks/useOfflineQueue.ts` | Consumer of `offlineQueue.ts` — most components write through this hook | Optimistic UI update, queue-vs-send decision, error surface |
| `client/src/lib/zoneCalculator.ts` | ADHD UX correctness depends entirely on this function — wrong zone color = wrong emotional signal | Calorie asymmetry (below floor ≠ above target), amber as neutral, boundary values, all zone transitions |
| `client/src/lib/consistencyCalc.ts` | Consistency % drives weekly planning ritual — wrong calc = misleading progress | roughDay flag, tier label thresholds, 0%/100% edge cases |
| `client/src/lib/floorCalculator.ts` | Floor derivation is foundational — all zone calculations depend on correct floors | Target-to-floor ratio, rounding, zero/negative guards |

All five files are pure functions or thin hooks — tests run without mocking and execute fast.

### Validation Issues Addressed

1. **Missing email service (Critical → Resolved):** `emailService.ts` added to services directory; `RESEND_API_KEY` added to environment variables; Resend documented in Authentication & Security decisions section.

2. **Vercel serverless export pattern (Important → Documented):** Flagged as a required first-story implementation detail. The pattern (`module.exports = app` or `export default app` without `app.listen()` for Vercel Functions) must be the first thing addressed in the server setup story.

3. **Priority test targets (Important → Documented):** `offlineQueue.ts`, `useOfflineQueue.ts`, `zoneCalculator.ts`, `consistencyCalc.ts`, and `floorCalculator.ts` are explicitly named as priority test targets with rationale and test focus areas.

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed (Low-Medium; single user; ~7 architectural components)
- [x] Technical constraints identified (iOS Safari limitations, HealthKit data shapes, no SSR)
- [x] Cross-cutting concerns mapped (offline sync, ADHD UX invariants, calculation isolation)

**✅ Architectural Decisions**
- [x] Critical decisions documented with exact versions
- [x] Technology stack fully specified (all packages named with versions)
- [x] Integration patterns defined (API, offline, state, calculation boundaries)
- [x] Performance considerations addressed (<250KB bundle, <300ms feedback, PWA caching)

**✅ Implementation Patterns**
- [x] Naming conventions established (PascalCase, camelCase, snake_case, kebab-case — all contexts covered)
- [x] Structure patterns defined (co-located tests, feature-first components, services vs. routes separation)
- [x] Communication patterns specified (offline queue discriminated union, Zustand/TanStack boundary)
- [x] Process patterns documented (error middleware chain, loading state, ADHD UX invariants)

**✅ Project Structure**
- [x] Complete directory structure defined (vault_1-specific, no placeholders)
- [x] Component boundaries established (4 explicit boundaries documented)
- [x] Integration points mapped (all 44 FRs → specific files)
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High — all critical decisions made, all FRs mapped, no blocking gaps, patterns comprehensive enough to guide consistent multi-agent implementation.

**Key Strengths:**
- Offline-first architecture is fully specified: Dexie queue → typed discriminated union → retry → TanStack invalidation. No ambiguity for agents.
- ADHD UX invariants are enforced in code (`zoneConstants.ts`), not just in documentation — agents cannot accidentally introduce streaks or negative language without violating an explicit rule.
- Pure function calculation engine (`lib/`) is isolated from all frameworks — testable, shareable, predictable.
- Monorepo without Turborepo keeps the setup learnable for Elizabeth while maintaining clear `client/server` separation.
- All naming convention conflicts are pre-resolved: no agent will guess a different casing convention for any context.

**Areas for Future Enhancement:**
- E2E testing with Playwright (post-MVP, after core flows are stable)
- HealthKit integration (Phase 3 — data shapes are already compatible, no migration needed)
- Push notifications for Day Complete reminders (requires additional PWA setup)
- Progressive disclosure of advanced settings (currently all settings on one page)

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented — do not introduce alternative libraries or patterns
- Use implementation patterns consistently across all components — refer to the enforcement guidelines and anti-pattern examples
- Respect the four explicit boundaries (API, offline, calculation, state) — crossing them without documentation is an architectural violation
- Source zone colors and tier labels exclusively from `lib/zoneConstants.ts` — this is non-negotiable for ADHD UX correctness
- Refer to this document for all architectural questions before making independent decisions

**First Implementation Priority:**
```bash
# Initialize monorepo structure
mkdir vault_1 && cd vault_1
git init

# Scaffold client (Vite + React + TypeScript + PWA)
npm create vite@latest client -- --template react-ts
cd client && npm install

# Scaffold server (Express + TypeScript)
mkdir -p server/src && cd ../server
npm init -y && npm install express typescript tsx @types/express

# CRITICAL FIRST STORY: Configure server/src/index.ts to export app
# for Vercel Functions compatibility — do NOT use app.listen() in production path
# Pattern: export default app (for Vercel) + conditional listen (for local dev)
```

**Vercel Serverless Export Pattern (Must Implement in Story 1):**
```typescript
// server/src/index.ts
const app = express()
// ... middleware and routes setup ...

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(3001, () => console.log('Server running on :3001'))
}

// For Vercel Functions — export as handler
export default app
```
