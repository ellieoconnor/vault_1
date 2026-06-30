# Vault 1 — Project Context

## What This Is

Vault 1 is a personal health and habit tracking app built by and for one person —
Elizabeth, the developer and sole user. It is not a generic habit tracker. It is
built around a specific behavioral insight: for ADHD brains, visible data about
failure drives avoidance, not improvement. Vault 1 inverts the standard feedback
architecture.

The core hypothesis: a floor-based, shame-free tracking system will keep Elizabeth
engaged through rough days, breaking the shame-and-spiral pattern that causes
abandonment of every other tool she's tried.

## Domain Vocabulary

Use these terms exactly — don't drift to synonyms.

| Term | Definition |
|---|---|
| **Floor** | The minimum acceptable daily value. Below this is amber (neutral), never red (failure). Calorie floor = BMR. Protein floor = target × 0.8. Steps floor = target × 0.5. |
| **Ceiling** | Calorie target + 200 cal buffer. Above ceiling = "Rad Zone" (orange). |
| **Zone** | The color band a progress bar falls into: amber-low / green / amber-over / orange (calories); amber / green / blue (protein, steps). |
| **Cheat Codes** | Up to 3 short coaching strategy reminders, always visible on the dashboard. First-class UI — not an optional notes field. |
| **Day Complete** | The action that closes a day's log. Always pressable — never locked behind metric achievement. |
| **roughDay** | Boolean logged at Day Complete: `true` when fewer than 50% of active weekly goals were achieved that day. |
| **Active Goals** | The 3–5 goals chosen each week from the goals library. Minimum 3, maximum 5 — the constraint is the strategy. |
| **Tier labels** | Labels for weekly consistency %: 60–74% = "Surviving the Wasteland", 75–89% = "Thriving", 90%+ = "Elite". |
| **Weekly Planning Ritual** | The Sunday flow where Elizabeth reviews the prior week, sees consistency %, updates Cheat Codes, and selects next week's 3–5 active goals. |
| **Hard minimum** | Calorie input below 1,400 is rejected at input, regardless of biometrics. |

## ADHD UX Invariants

These are architectural constraints, not preferences. Never override them.

- **No red states anywhere.** Amber = neutral data. Never "failed", "missed", or "below".
- **No streak counters.** Zero "X days in a row" language anywhere in the UI.
- **Day Complete is always pressable.** Never disabled, never locked.
- **All zone colors source from `lib/zoneConstants.ts`.** No inline color values.
- **Amber text context:** always neutral language — never judgmental.

## Tech Stack

- **Frontend:** Vite + React 18 + TypeScript → `apps/frontend/`
- **Backend:** Node.js + Express + TypeScript → `apps/backend/`
- **Database:** PostgreSQL via Prisma ORM, hosted on Neon
- **Auth:** `express-session` + `connect-pg-simple`, Argon2 password hashing
- **Offline:** Dexie.js (IndexedDB) offline write queue
- **Server state:** TanStack Query v5 (never stored in Zustand)
- **UI state:** Zustand (UI-only — never server data)
- **Styling:** Tailwind CSS v4 with Vault-Tec/Fallout retro theme
- **Validation:** Zod (shared client/server schemas)
- **Routing:** React Router v7
- **Email:** Resend (password reset only)
- **Deployment:** Vercel (frontend + backend functions) + Neon (database)
- **CI/CD:** GitHub Actions (type-check + lint on PR; migrate + deploy on main)

## Key Architectural Rules

- Zone colors and tier labels come **only** from `apps/frontend/src/lib/zoneConstants.ts`
- State: TanStack Query = server data, Zustand = UI state, Dexie = offline queue
- Backend route handlers call `next(err)` — never `res.status(500).json()` directly
- Tests co-located with source (`*.test.ts` next to the file, not in `__tests__/`)
- API: `/api/` prefix, REST, no versioning, plural kebab-case nouns
- Naming: PascalCase components/files, camelCase JSON/TS, snake_case DB columns via `@map`
- Zod validates all API request bodies before business logic runs

## Roadmap

| Epic | Description | Status |
|---|---|---|
| **Epic 1** — Foundation & Auth | Registration, login, sessions, password reset, logout | ✅ Done (1.1–1.5) |
| **Epic 2** — Daily Tracking Core | Onboarding, Cheat Codes, zone calc engine, dashboard progress bars, Day Complete | 🔄 In progress (2.1–2.5 ✅, 2.6–2.7 remaining) |
| **Epic 3** — Goals Management | Goals library, weekly active goal selection, per-goal dashboard progress | 📋 Ready (#54–#57 in tracker) |
| **Epic 4** — Weekly Planning Ritual | Sunday planning view, consistency %, tier labels, goal suggestions, week start | 📋 Outlined — needs spec before dev |
| **Epic 5** — Offline & PWA | Offline queue, auto-sync, PWA manifest, home screen install, responsive | 📋 Outlined — needs spec before dev |

**MVP gate:** 4+ weeks of consistent use at 65%+ weekly consistency. Phase 2 begins after that.

**Phase 2+ (post-MVP):** XP/levels, Bunker progression, Encounters, AI Coach (pgvector
on existing Neon instance), Apple Health integration (requires native iOS wrapper).

### What's next

Next unblocked issue: **#52 — Yesterday Completion Prompt** (Story 2.6).
After that: **#53 — Update Targets / Settings Page** (Story 2.7), then Epic 3 starting with **#54**.

Issues live in GitHub (`gh issue list --label ready-for-agent`) and locally in `.claude/local/issues/`.

## Reference Docs

Full planning artifacts in `_bmad-output/vault1-bmad-output-backup/`:
- `planning-artifacts/prd.md` — complete PRD, user journeys, all 44 FRs
- `planning-artifacts/architecture.md` — all architecture decisions + implementation patterns
- `planning-artifacts/epics.md` — all epics and stories with acceptance criteria
- `docs/product-decisions-floor-ceiling-ai-coach.md` — floor/ceiling system + AI coach vision
