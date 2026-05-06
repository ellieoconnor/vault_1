---
title: 'Dev Environment Setup — Staging Branch, Neon DB Branch & Local Dev Script'
slug: 'dev-environment-setup'
created: '2026-05-06'
status: 'completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['GitHub Actions', 'Vercel', 'Neon', 'npm workspaces', 'concurrently']
files_to_modify:
  - '.github/workflows/ci.yml'
  - 'package.json'
code_patterns:
  - 'Frontend uses VITE_API_URL env var (import.meta.env.VITE_API_URL) in 8+ files for all API calls'
  - 'Backend runs on port 3000 (from apps/frontend/.env.local)'
  - 'Root package.json delegates to workspaces via --workspace=apps/<name>'
  - 'Vercel env vars set via dashboard only — no env config in vercel.json files'
test_patterns: ['manual verification — no automated tests for CI/infra config']
---

# Tech-Spec: Dev Environment Setup — Staging Branch, Neon DB Branch & Local Dev Script

**Created:** 2026-05-06

## Overview

### Problem Statement

All code merged to `master` deploys directly to production. There is no staging environment to validate changes before they go live, no branch protection preventing accidental direct pushes, and no convenient way to start the full local dev stack in one command.

### Solution

Create a `develop` branch wired to separate Vercel staging deployments (frontend + backend) backed by a Neon `develop` DB branch. Update CI to also run on `develop` and auto-migrate the staging DB on push. Protect both `master` and `develop` branches on GitHub. Add a root-level `npm run dev` script using `concurrently` to start frontend and backend together locally.

### Scope

**In Scope:**
- Create `develop` git branch
- Configure both Vercel projects (frontend + backend) to serve `develop` via Preview deployments with correct staging env vars
- Create a Neon `develop` DB branch and capture its connection string
- Update `.github/workflows/ci.yml`: trigger on `develop`, add staging migration job
- Add `DATABASE_URL_STAGING` GitHub Actions secret
- Add GitHub branch protection to `master` and `develop`
- Add `concurrently` devDependency and `dev` script to root `package.json`

**Out of Scope:**
- Any application code changes
- Storybook startup in local dev script
- Automated Neon branch creation via API/CLI
- Changing Vercel project names or custom domains

## Context for Development

### Codebase Patterns

- **Monorepo:** npm workspaces, `apps/frontend` (Vite React TS) and `apps/backend` (Express TS + Prisma)
- **Frontend dev:** `npm run dev --workspace=apps/frontend` → Vite on port 5173
- **Backend dev:** `npm run dev --workspace=apps/backend` → `tsx watch src/index.ts` on port 3000
- **API connection:** Frontend uses `import.meta.env.VITE_API_URL` in 8+ files — the single env var controlling which backend it calls. Set in `apps/frontend/.env.local` for local dev (`http://localhost:3000`)
- **Root workspace delegation:** `npm run <cmd> --workspace=apps/<name>` pattern used throughout root `package.json`
- **CI trigger:** currently `on: push/pull_request: branches: [master]` only
- **Production migration job:** gated to `github.ref == 'refs/heads/master' && github.event_name == 'push'`
- **Vercel env vars:** set via dashboard only — `vercel.json` files only contain routing rewrites
- **Backend env vars:** `DATABASE_URL`, `SESSION_SECRET`, `CLIENT_ORIGIN`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `.github/workflows/ci.yml` | CI pipeline — needs `develop` trigger + staging migrate job |
| `package.json` (root) | Add `dev` script + `concurrently` devDependency |
| `apps/backend/.env.example` | Reference for all required backend env vars |
| `apps/frontend/.env.local` | Shows `VITE_API_URL=http://localhost:3000` pattern |
| `apps/frontend/vercel.json` | SPA rewrites only — no env config |
| `apps/backend/vercel.json` | API rewrites only — no env config |

### Technical Decisions

- **`concurrently` v9** added as root devDependency — labelled, colour-coded output per app in one terminal
- **Neon DB branch:** manually created via Neon Console (one-time). Not automated via CLI/API — simpler and sufficient for a solo project
- **Staging migrations:** use a separate GitHub secret `DATABASE_URL_STAGING` so the staging CI job never touches the production DB. Same `prisma migrate deploy` command, different connection string
- **Vercel Preview deployments:** Vercel already creates a Preview deployment for every branch push automatically. The `develop` branch gets a stable preview URL. Env vars must be scoped to **Preview** (not Production) in both Vercel projects
- **Branch protection:** requires PR + passing CI checks. No reviewer requirement — goal is preventing accidental direct pushes, not enforcing team review

## Implementation Plan

### Tasks

> **Note:** Tasks 1–4 are one-time manual steps in external dashboards. Tasks 5–6 are the only code changes. Do Tasks 1–4 first so the secrets and URLs are available when you need them.

> **Pre-flight check:** Before starting, verify that `apps/frontend/.env.local` is listed in `.gitignore`. This file contains your local API URL and must never be committed. If it isn't there, add it now before proceeding.

---

- [ ] **Task 1: Create the `develop` git branch**
  - Action: Run from the root of the repo:
    ```bash
    git checkout master
    git pull origin master
    git checkout -b develop
    git push -u origin develop
    ```
  - Notes: This is the branch that will become your staging environment. All feature branches should eventually merge to `develop`, then `develop` merges to `master` for production.

---

- [ ] **Task 2: Create a Neon staging DB branch**
  - Action (manual — Neon Console):
    1. Go to [console.neon.tech](https://console.neon.tech) → your project
    2. Click **Branches** in the left sidebar
    3. Click **Create Branch**
    4. Name it `develop`, branch from `main`
    5. Click **Create Branch**
    6. Open the new `develop` branch → **Connection Details** → copy the `DATABASE_URL` connection string (postgres://...neon.tech/...)
    7. Save this string — you'll use it in Tasks 3 and 5
  - Notes: The Neon `develop` branch is a full copy of the production schema at branch time, with isolated data. Migrations run against it independently.

---

- [ ] **Task 3a: Configure Vercel backend staging env vars (first pass — without `CLIENT_ORIGIN`)**
  - Action (manual — Vercel Dashboard):
    1. Go to your backend Vercel project → **Settings** → **Environment Variables**
    2. Add each of these scoped to **Preview** only (not Production):
       - `DATABASE_URL` = the Neon `develop` branch connection string from Task 2
       - `SESSION_SECRET` = a new random string — generate one with: `openssl rand -hex 32`
       - `RESEND_API_KEY` = same as production (or a test key)
       - `RESEND_FROM_EMAIL` = same as production
    3. **Do NOT add `CLIENT_ORIGIN` yet** — you don't know the frontend staging URL until after Task 3b
    4. Go to **Deployments** → find the `develop` branch deployment → click **Redeploy** to pick up the new env vars
    5. After redeploy, note the backend staging URL (e.g. `<project>-git-develop-<team>.vercel.app`) — you'll need it in Task 3b. Find it under **Deployments** filtered by branch, or in **Settings** → **Domains**.

---

- [ ] **Task 3b: Configure Vercel frontend staging env vars**
  - Action (manual — Vercel Dashboard):
    1. Go to your frontend Vercel project → **Settings** → **Environment Variables**
    2. Add scoped to **Preview** only:
       - `VITE_API_URL` = the backend staging URL from Task 3a (e.g. `https://<backend>-git-develop-<team>.vercel.app`)
    3. Go to **Deployments** → find the `develop` branch deployment → click **Redeploy**
    4. After redeploy, note the frontend staging URL — you'll need it in Task 3c

---

- [ ] **Task 3c: Add `CLIENT_ORIGIN` to Vercel backend staging (second pass)**
  - Action (manual — Vercel Dashboard):
    1. Go to your backend Vercel project → **Settings** → **Environment Variables**
    2. Add scoped to **Preview** only:
       - `CLIENT_ORIGIN` = the frontend staging URL from Task 3b (e.g. `https://<frontend>-git-develop-<team>.vercel.app`)
    3. Redeploy the backend `develop` deployment again to pick up `CLIENT_ORIGIN`
  - Notes: This two-pass approach is necessary because the backend CORS config needs the frontend URL, but the frontend URL isn't known until after the frontend is deployed. Skipping this step causes all API calls from staging to fail with CORS errors.

---

- [ ] **Task 4: Add GitHub branch protection**
  - Action (manual — GitHub):
    1. Go to `github.com/ellieoconnor/vault_1` → **Settings** → **Branches**
    2. Click **Add branch protection rule**
    3. Apply to `master`:
       - Branch name pattern: `master`
       - ✅ Require a pull request before merging
       - ✅ Require status checks to pass before merging
         - Search for and add: `Lint & Format`, `Type Check`
       - ✅ Do not allow bypassing the above settings
    4. Click **Create** then repeat for `develop` with the same settings
  - Notes: GitHub will only show status check names that have run at least once on that branch. Push a commit to `develop` first (Task 1 does this), wait for CI to run, then come back to add the checks.

---

- [x] **Task 5: Update `.github/workflows/ci.yml`**
  - File: `.github/workflows/ci.yml`
  - Action: Make two changes — (a) expand the `on` trigger to include `develop`, and (b) add a `migrate-staging` job

  Replace the current `on` block (lines 3–6):
  ```yaml
  on:
    push:
      branches: [master, develop]
    pull_request:
      branches: [master, develop]
  ```

  Add this new job at the end of the file, after the existing `migrate` job:
  ```yaml
  migrate-staging:
    name: Run Staging Migrations
    runs-on: ubuntu-latest
    needs: typecheck
    if: github.ref == 'refs/heads/develop' && github.event_name == 'push'
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL_STAGING }}
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run staging database migrations
        run: npx prisma migrate deploy
        working-directory: apps/backend
  ```

  - Notes: The `migrate-staging` job uses `DATABASE_URL_STAGING` secret (not `DATABASE_URL`) to ensure it can never accidentally run against production. Add the secret in GitHub: repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret** → name `DATABASE_URL_STAGING`, value = Neon `develop` branch connection string from Task 2.
  - **If a staging migration fails:** Prisma `migrate deploy` applies migrations forward only — it does not roll back on failure. If a migration fails, the Neon `develop` branch will be in a partially-migrated state. To recover: go to the Neon Console → your project → **Branches** → select the `develop` branch → **Reset to parent** to restore it to the production schema, then fix the failing migration and push again.

---

- [x] **Task 6: Add `concurrently` and root `dev` script**
  - File: `package.json` (root)
  - **Prerequisite:** Ensure `apps/backend/.env` exists and is populated. If it doesn't exist yet:
    ```bash
    cp apps/backend/.env.example apps/backend/.env
    # Then open apps/backend/.env and fill in real values for DATABASE_URL, SESSION_SECRET, etc.
    ```
    Without this, the backend will crash on startup with a missing env var error.

  - Action — two changes to `package.json`:

    **1. Add `concurrently` to `devDependencies`:**
    ```json
    "devDependencies": {
      "@pact-foundation/pact": "^16.3.0",
      "concurrently": "^9.0.0",
      "prettier": "^3.8.3"
    }
    ```

    **2. Add `dev` script to `scripts`:**
    ```json
    "dev": "concurrently --names FRONTEND,BACKEND --prefix-colors cyan,yellow \"npm run dev --workspace=apps/frontend\" \"npm run dev --workspace=apps/backend\""
    ```

  - **Run this immediately after editing `package.json`:**
    ```bash
    npm install
    ```
    This installs `concurrently` and updates `package-lock.json`. If you skip this step, `npm run dev` will fail with `concurrently: command not found`.

  - Notes: The `--names` flag labels each process's output. The `--prefix-colors` flag colour-codes them so you can tell frontend logs from backend logs at a glance.

---

### Acceptance Criteria

- [ ] **AC 1:** Given the repo root, when `npm run dev` is run, then both the Vite frontend (port 5173) and the Express backend (port 3000) start concurrently with labelled output (`[FRONTEND]` / `[BACKEND]`) in a single terminal.

- [ ] **AC 2:** Given a commit is pushed to the `develop` branch, when CI runs, then the `Lint & Format` and `Type Check` jobs execute successfully.

- [ ] **AC 3:** Given a commit is pushed to `develop` and `typecheck` passes, when CI runs the `migrate-staging` job, then `prisma migrate deploy` executes against `DATABASE_URL_STAGING` (the Neon `develop` DB branch) — not the production DB.

- [ ] **AC 4:** Given a commit is pushed to `master`, when CI runs, then the `Run Migrations` job runs against `DATABASE_URL` (production) and the `migrate-staging` job does NOT run.

- [ ] **AC 5:** Given a developer attempts to push a commit directly to `master`, when GitHub evaluates the push, then the push is rejected with a branch protection error.

- [ ] **AC 6:** Given a developer attempts to push a commit directly to `develop`, when GitHub evaluates the push, then the push is rejected and a PR is required.

- [ ] **AC 7:** Given a PR targeting `master` or `develop` exists and CI checks have not passed, when a merge is attempted, then GitHub blocks the merge until all required checks pass.

- [ ] **AC 8:** Given the frontend is deployed to the Vercel `develop` Preview environment, when it makes API calls, then they reach the backend staging URL (not production) — verifiable by checking network requests in browser devtools.

## Additional Context

### Dependencies

- `concurrently` npm package (root devDependency — new)
- Neon `develop` DB branch (manual one-time setup in Neon Console)
- `DATABASE_URL_STAGING` GitHub Actions secret (must be added before CI staging migrate job works)
- Vercel Preview env vars (manual one-time setup in both Vercel projects)
- Both apps must have their local `.env` files configured for `npm run dev` to work (backend: copy `apps/backend/.env.example` → `apps/backend/.env` and fill in values)

### Testing Strategy

Manual verification steps (in order):
1. Run `npm run dev` from root → confirm both servers start with labelled output
2. Push Task 5's CI change to `develop` → go to GitHub Actions and confirm `Lint & Format`, `Type Check`, and `Run Staging Migrations` all run (and `Run Migrations` does NOT)
3. Push the same commit to `master` (via PR) → confirm `Run Migrations` runs and `Run Staging Migrations` does NOT
4. Attempt `git push origin master` directly (after protection is on) → confirm rejection
5. Open the Vercel `develop` frontend URL in a browser → open devtools → confirm API calls go to the staging backend URL, not production

### Notes

- **Order matters for Task 4:** GitHub branch protection requires that the CI status check names (`Lint & Format`, `Type Check`) have appeared at least once in the branch's history before they can be selected. Complete Task 1 (push `develop`) and let CI run before setting up protection rules.
- **`CLIENT_ORIGIN` chicken-and-egg:** The backend needs to know the frontend staging URL for CORS, but the frontend URL isn't known until after the first Vercel `develop` deployment. Set the other backend env vars first, deploy, get the frontend URL, then come back and add `CLIENT_ORIGIN` and redeploy the backend staging.
- **Stable Vercel branch URLs:** The `develop` branch gets a consistent preview URL (not a per-commit hash URL). This is the URL to use for `CLIENT_ORIGIN` and `VITE_API_URL`.
- **Neon staging schema freshness:** The `develop` Neon branch is created from `main` at branch time. If production migrations run and the staging branch falls behind, staging tests may pass on stale schema. To resync: go to Neon Console → your project → **Branches** → select `develop` → **Reset to parent**. This resets the branch to the current `main` schema (data is wiped — staging only). Do this whenever you notice staging schema is out of date.
- **Future:** If Neon branch management becomes painful, look into the Neon GitHub integration which can automate branch creation/deletion per PR.
