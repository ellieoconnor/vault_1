# Vault 1

A personal health and habit tracking app built for people with ADHD — designed around consistency and momentum, not perfection.

## The Problem

Most tracking apps punish you for a bad day. One missed goal turns green bars red, red bars feel like failure, and failure triggers the shame spiral that gets the whole system abandoned.

**Vault 1 is built differently.** There is no failure state. Every day you log is a win. The goal is showing up, not hitting targets.

## How It Works

### Win the Day (Daily Dashboard)
Track calories, protein, steps, and workouts using a **floor-based progress system** — not a target system. Results are displayed as neutral amber data below your floor, never as failure. Your "Cheat Codes" (personal coaching reminders) are always visible while you log.

### Build Your Character (Weekly Planning)
Review last week's consistency %, get goal suggestions, update your Cheat Codes, and choose 3–5 active goals for the coming week. Consistency at 60%+ earns a Vault tier label (Wasteland Survivor → Vault Legend).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Server State | TanStack Query |
| UI State | Zustand |
| Routing | React Router |
| Backend | Express + TypeScript |
| Database ORM | Prisma |
| Database | PostgreSQL (serverless) |
| Auth | Session-based authentication |
| Email | Transactional email service |
| Offline | Dexie.js (IndexedDB) + PWA |
| Validation | Zod (shared frontend + backend) |
| Testing | Vitest + Playwright + Pact |
| CI/CD | GitHub Actions |
| Deployment | Cloud hosting |

---

## Project Structure

```
vault_1/
├── apps/
│   ├── frontend/         # Vite React PWA
│   │   └── src/
│   │       ├── pages/    # Route-level components
│   │       ├── components/
│   │       ├── api/      # TanStack Query hooks
│   │       ├── lib/      # Pure functions (zone calculator, BMR)
│   │       └── schemas/  # Zod validation
│   │
│   └── backend/          # Express TypeScript REST API
│       └── src/
│           ├── routes/
│           ├── middleware/
│           ├── services/
│           └── schemas/
│           └── prisma/   # Database schema + migrations
│
├── .github/workflows/    # CI/CD pipelines
└── vercel.json
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- A serverless PostgreSQL database
- A transactional email service API key (for password reset emails)

### Install

```bash
git clone https://github.com/ellieoconnor/vault_1.git
cd vault_1
npm install
```

### Environment Variables

**`apps/backend/.env`**
```
DATABASE_URL=your_neon_connection_string
SESSION_SECRET=your_session_secret
RESEND_API_KEY=your_resend_api_key
FRONTEND_URL=http://localhost:5173
```

**`apps/frontend/.env`**
```
VITE_API_URL=http://localhost:3001
```

### Database Setup

```bash
cd apps/backend
npx prisma migrate dev
```

### Run Locally

```bash
# Backend (localhost:3001)
cd apps/backend && npm run dev

# Frontend (localhost:5173)
cd apps/frontend && npm run dev
```

---

## Key Scripts

| Command | What it does |
|---|---|
| `npm run test` | Run all unit tests |
| `npm run test:e2e` | Playwright end-to-end tests |
| `npx prisma studio` | Visual database browser |
| `npx prisma migrate dev` | Create and apply a new migration |

---

## Architecture Highlights

**Offline-First** — All writes queue locally in IndexedDB (Dexie.js) and sync to the server when online. No silent data loss.

**Zone Calculator** — An isolated pure-function library drives all progress bar colors from a single source of truth. No inline color values anywhere in the UI.

**No Red States** — The ADHD UX invariant is enforced in code: below-floor performance renders as amber (neutral), never red (failure).

**Clear State Boundaries**
- TanStack Query owns all server data
- Zustand owns UI-only state (modals, nav)
- Dexie.js owns the offline write queue

---

## Product Roadmap

### Phase 1 — MVP (Current)

Building the core daily tracking loop.

| Epic | Status | What it delivers |
|---|---|---|
| Epic 1: Foundation & Auth | Complete | Registration, login, sessions, password reset |
| Epic 2: Daily Tracking Core | In progress | Onboarding, Cheat Codes, zone calculator, dashboard, Day Complete |
| Epic 3: Goals Management | Planned | Goal library, active goal selection, 3–5 cap enforced |
| Epic 4: Weekly Planning Ritual | Planned | Consistency %, tier labels, goal review, Cheat Code updates |
| Epic 5: Offline & PWA | Planned | Dexie queue, service worker, home screen install |

**Go signal for Phase 2:** 4+ weeks of consistent personal use with 65%+ weekly consistency average.

---

### Phase 2 — Gamification Layer

Introducing XP, progression, and long-term engagement mechanics.

- XP & leveling system (actions earn XP, levels unlock cosmetics)
- SPECIAL stats (Fallout-inspired attributes tied to habit categories)
- Bunker progression (cosmetic + functional upgrades)
- Encounters system (plan a challenge, reflect afterward for XP)
- Maintenance Mode (deliberate reduced-target state for hard weeks)
- Weight tracking + outcome goals

---

### Phase 3 — Native Integration

- Apple Health integration (step count, workouts)
- Native app logging (replace manual Cronometer entry)
- Push notifications for streaks and weekly planning
- Advanced analytics (mood trends, consistency history)

---

### Phase 4 — Expansion

- Coach-facing view (share active goals + Cheat Codes with a coach)
- Apple Watch companion app
- Multi-user support for others with ADHD coaching needs

---

## License

Private repository. All rights reserved.
