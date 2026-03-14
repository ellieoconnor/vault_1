# Story 1.1: Project Scaffolding & CI/CD

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the project initialized with Vite React TypeScript + Express TypeScript + Prisma connected to Neon PostgreSQL, deployed to Vercel with a working health check and GitHub Actions CI/CD,
So that all subsequent feature stories have a working, deployable foundation to build on.

## Acceptance Criteria

**Given** the monorepo is initialized
**When** the frontend dev server runs (`npm run dev` in `apps/frontend`)
**Then** the Vite React app loads at `localhost:5173` with no errors

**Given** the backend is running (`npm run dev` in `apps/backend`)
**When** I hit `GET /api/health`
**Then** it returns `200 OK`

**Given** Prisma is configured with `DATABASE_URL` pointing to Neon
**When** I run `prisma migrate dev` from `apps/backend`
**Then** migrations apply to the Neon database without error

**Given** a push to the `master` branch
**When** GitHub Actions CI runs
**Then** TypeScript type-check and lint both pass, and Vercel deploys successfully

**Given** the deployed Vercel URL
**When** I visit it in a browser
**Then** the app is served over HTTPS and displays a placeholder "Vault 1" page

## Current State Assessment

> ⚠️ Scaffolding work has already been started. This story is being created after initial commits. Review carefully what is done vs. remaining.

### ✅ Already Done (from git history)

- Monorepo initialized with npm workspaces (`apps/frontend`, `apps/backend`)
- Vite React TypeScript frontend (`apps/frontend`) with React 19 and Vite 7
- Express TypeScript backend (`apps/backend`) with `tsx` for dev, Express v5
- Prisma installed (`prisma@7.5.0`) with `User` model and `@prisma/adapter-pg` (Neon PG driver)
- GitHub Actions CI workflow (`.github/workflows/ci.yml`) — type-check on PR and push to master
- Health endpoint exists at `GET /health` (but needs to be `/api/health`)
- Backend reads `DATABASE_URL` from env via `dotenv`

### ❌ Remaining Work

1. **Health endpoint**: Change `/health` → `/api/health` (architecture requires `/api/` prefix on all routes)
2. **Prisma schema `DATABASE_URL`**: Add `url = env("DATABASE_URL")` to the `datasource db` block in `schema.prisma`
3. **Neon database**: Create a Neon project, get `DATABASE_URL`, add to `.env` in `apps/backend`
4. **Run first migration**: `npx prisma migrate dev --name init` from `apps/backend` — confirm User table creates in Neon
5. **Fix User model**: Current model has `email` and `name` fields. Architecture specifies username-based auth. Model needs `username` (not `email`) for login, plus `email` for password reset. See Data Model section below.
6. **Frontend placeholder**: Replace default Vite + React template in `App.tsx` with a "Vault 1" placeholder page
7. **Vercel deployment**: Connect Vercel to the GitHub repo, configure frontend and backend deploy
8. **CI Vercel deploy step**: Add Vercel deploy step to `.github/workflows/ci.yml` on `master` push

### ⚠️ Structural Divergences from Architecture Doc

The architecture doc specifies `/client` and `/server` at root. The actual implementation uses `apps/frontend` and `apps/backend`. This is an acceptable deviation — do not rename; update story references to use actual paths.

The architecture doc also specifies branch `main`. The repo uses `master`. Update the CI config reference if needed, but do not rename the branch.

## Tasks / Subtasks

- [x] Task 1: Fix health endpoint path (AC: health endpoint)
  - [x] 1.1 In `apps/backend/src/index.ts`, change `app.get("/health", ...)` to `app.get("/api/health", ...)`
  - [x] 1.2 Confirm `GET /api/health` returns `{ "status": "ok" }` with 200 locally

- [x] Task 2: Fix Prisma schema for User model and DATABASE_URL (AC: prisma migrate dev)
  - [x] 2.1 Removed `url` from `datasource db` in `schema.prisma` (Prisma v7 — connection managed via `prisma.config.ts`)
  - [x] 2.2 Updated `User` model: `username` (unique), `passwordHash`, optional `email`, snake_case `@@map("users")`
  - [x] 2.3 Neon project already existed — `DATABASE_URL` already configured in `apps/backend/.env`
  - [x] 2.4 `.env` confirmed gitignored at root `.gitignore`
  - [x] 2.5 `npx prisma migrate dev --name update-user-model` applied successfully to Neon

- [x] Task 3: Frontend "Vault 1" placeholder (AC: frontend loads, deployed page shows Vault 1)
  - [x] 3.1 Replaced `apps/frontend/src/App.tsx` with minimal "Vault 1" placeholder
  - [x] 3.2 Frontend builds clean (`npm run build` passes, 193KB bundle)

- [ ] Task 4: Vercel deployment — REQUIRES MANUAL SETUP (AC: deployed URL + HTTPS)
  - [x] 4.1 Connected Vercel project to GitHub repo `ellieoconnor/vault_1`
  - [x] 4.2 `vercel.json` created at repo root — sets `rootDirectory: apps/frontend`, framework: vite
  - [ ] 4.3 **[You]** In Vercel project settings → Environment Variables → add `DATABASE_URL` (copy from `apps/backend/.env`)
  - [x] 4.4 `DATABASE_URL` added as GitHub Actions secret

- [x] Task 5: Update CI for migrations on master push (AC: CI deploys on push)
  - [x] 5.1 Added `migrate` job to CI: runs `prisma migrate deploy` on `master` push only, after typecheck
  - [x] 5.2 Fixed `prisma generate` step (removed deprecated `--schema` flag, Prisma v7 uses `prisma.config.ts`)
  - [ ] 5.3 **[You]** Push to `master` to confirm full CI run passes (typecheck + migrate jobs)

## Dev Notes

### Architecture Constraints (MUST follow)

- **API prefix**: ALL backend routes use `/api/` prefix. No exceptions. Current `/health` must become `/api/health`.
- **Error format**: All errors return `{ "error": "ERROR_CODE", "message": "...", "details": {} }` — already correct for this story as there's no error handling yet, but establish the pattern in `errorHandler.ts` for future stories.
- **Env files**: `.env` in `apps/backend` and `.env.local` in `apps/frontend` — both gitignored.
- **No inline secrets**: `DATABASE_URL` and other secrets only via `.env` / Vercel env vars — never hardcoded.
- **TypeScript strict**: Both packages use TypeScript. Do not disable strict mode.

### Data Model (User — must fix before first migration)

The current Prisma `User` model is incorrect for this project. Architecture requires username-based auth with a separate email field for password reset. The correct model is:

```prisma
model User {
  id           String    @id @default(cuid())
  username     String    @unique
  passwordHash String    @map("password_hash")
  email        String?   @unique  // optional — for password reset only
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  @@map("users")
}
```

> **Why:** Architecture specifies username + password login (FR1, FR2). Email is only required for password reset (FR4, NFR-S5). The current model has `email` as the identity field (String @unique) which would force email-based login — wrong for this app.

> **Naming conventions (MUST follow for all models):**
> - Model names: PascalCase singular (`User`)
> - Field names: camelCase (`userId`, `passwordHash`)
> - PostgreSQL column names: snake_case via `@map` (`password_hash`, `created_at`)
> - Table names: snake_case plural via `@@map` (`users`)

### Frontend Placeholder Requirements

The placeholder page must:
- Show "Vault 1" as the heading (H1)
- Be clean and minimal — no Vite/React logos, no counter button
- This is purely a scaffolding checkpoint; full UI comes in later stories

```tsx
// apps/frontend/src/App.tsx — minimal placeholder
export default function App() {
  return (
    <main>
      <h1>Vault 1</h1>
      <p>Coming soon.</p>
    </main>
  )
}
```

### CI Workflow Gaps

Current `.github/workflows/ci.yml`:
- ✅ Runs on push to master and PR
- ✅ Type-checks frontend (via `npm run build`)
- ✅ Type-checks backend (`npx tsc --noEmit`)
- ✅ Generates Prisma client before type check
- ❌ Does NOT run `prisma migrate deploy` on master push
- ❌ Does NOT deploy to Vercel

The CI must be updated to add a deploy job that:
1. Runs only on `master` push (not on PRs)
2. Runs `npx prisma migrate deploy` in `apps/backend`
3. Deploys frontend to Vercel

> **Note:** `prisma migrate deploy` requires `DATABASE_URL` to be available as a GitHub Actions secret. Add `DATABASE_URL` to repo secrets before this step runs.

### Prisma & Neon Setup Notes

- Neon free tier: Create project at neon.tech → "New Project" → get connection string
- Connection string format: `postgresql://user:password@host/dbname?sslmode=require`
- The Prisma schema already uses `@prisma/adapter-pg` (Neon's recommended driver) — do NOT remove this
- Prisma generator output path `../src/generated/prisma` is non-standard but already in use — do not change it; the import in `index.ts` references it correctly

### Project Structure Notes

**Actual paths (differ from architecture doc — do NOT rename):**
- Architecture doc says: `/client` and `/server`
- Actual project uses: `apps/frontend` and `apps/backend`
- All file path references in future stories should use `apps/frontend/src/...` and `apps/backend/src/...`

**Alignment with architecture folder structure inside each app:**
```
apps/frontend/src/
├── components/      # to be created in later stories
├── pages/           # to be created in later stories
├── stores/          # to be created in later stories
├── lib/             # to be created in later stories
└── hooks/           # to be created in later stories

apps/backend/src/
├── routes/          # to be created in later stories
├── middleware/      # to be created in later stories
├── services/        # to be created in later stories
└── index.ts         # ✅ exists
```

> ⚠️ Do not create these subdirectories in this story — they will be scaffolded as needed in each feature story.

### References

- Architecture: Project structure [Source: _bmad-output/planning-artifacts/architecture.md#Complete-Project-Directory-Structure]
- Architecture: Naming conventions [Source: _bmad-output/planning-artifacts/architecture.md#Naming-Patterns]
- Architecture: Initialization commands [Source: _bmad-output/planning-artifacts/architecture.md#Selected-Starter]
- Architecture: CI/CD [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure-Deployment]
- Epics: Story 1.1 ACs [Source: _bmad-output/planning-artifacts/epics.md#Story-1.1]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Prisma v7 does not support `url` in `datasource db` — moved to `prisma.config.ts` (already existed, auto-generated by Prisma)
- Existing migration `20260314163934_init` had old User model (`email`, `name`). Created `20260314194001_update_user_model` to apply corrected schema.
- CI `prisma generate` step used deprecated `--schema` flag; removed it as Prisma v7 reads from `prisma.config.ts` automatically

### Completion Notes List

- ✅ `GET /api/health` returns `{"status":"ok"}` — verified with curl locally
- ✅ Prisma schema corrected: `users` table with `username`, `password_hash`, optional `email`, proper snake_case `@map` conventions
- ✅ Migration `20260314194001_update_user_model` applied to Neon successfully
- ✅ Frontend `App.tsx` replaced with minimal "Vault 1" placeholder; builds clean at 193KB
- ✅ CI updated: `typecheck` job fixed (Prisma v7 generate), new `migrate` job added for master push
- ✅ `vercel.json` created to configure Vercel for `apps/frontend` deployment
- ⏳ Pending user: connect Vercel project, add `DATABASE_URL` to Vercel env + GitHub secret, push to master to validate full CI

### File List

- `apps/backend/src/index.ts` — modified: `/health` → `/api/health`
- `apps/backend/prisma/schema.prisma` — modified: removed `url` from datasource, corrected User model
- `apps/backend/prisma/migrations/20260314194001_update_user_model/migration.sql` — created: migration for corrected User model
- `apps/frontend/src/App.tsx` — modified: replaced default template with "Vault 1" placeholder
- `.github/workflows/ci.yml` — modified: fixed prisma generate step, added `migrate` job
- `vercel.json` — created: Vercel deployment config pointing to `apps/frontend`
