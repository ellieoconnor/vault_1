---
stepsCompleted: ['step-01-preflight', 'step-02-select-framework', 'step-03-scaffold-framework', 'step-04-docs-and-scripts', 'step-05-validate-and-summary']
lastStep: 'step-05-validate-and-summary'
lastSaved: '2026-04-15'
status: 'complete'
---

# Test Framework Setup Progress

## Step 1: Preflight Results

### Stack Detection
- **Detected Stack**: `fullstack`
  - Frontend indicators: `apps/frontend/package.json` with React 19, Vite 7, TypeScript
  - Backend indicators: `apps/backend/package.json` with Express 5, TypeScript, Prisma

### Prerequisites Check
- ✅ Root `package.json` exists (monorepo workspace config)
- ✅ No existing E2E framework found (no `playwright.config.*`, no `cypress.config.*`, no `cypress.json`)
- ✅ Backend manifest found (`apps/backend/package.json`)
- ✅ No conflicting test suite configs detected

### Project Context

**Monorepo Structure**: `apps/frontend` + `apps/backend` under pnpm/npm workspaces

**Frontend**:
- Framework: React 19
- Bundler: Vite 7
- Language: TypeScript
- Routing: React Router DOM 7
- State/Data: TanStack Query 5
- Validation: Zod 4

**Backend**:
- Framework: Express 5
- Language: TypeScript
- ORM: Prisma 7 + PostgreSQL (Neon via `pg` adapter)
- Auth: Argon2 password hashing, express-session (HttpOnly cookies)
- Email: Resend
- Validation: Zod 4

**Architecture Context**:
- Full-stack SPA/PWA, mobile-first
- Auth: username + password, session cookies
- Deployment: Static hosting (Vercel) + separate API server (no SSR)
- Security: HttpOnly cookies, HTTPS

**Existing Test Setup**: None (root `package.json` test script is a stub)

**Architecture Doc**: `_bmad-output/planning-artifacts/architecture.md` — available and complete

## Step 2: Framework Selection

### Decision
| Layer | Framework | Rationale |
|---|---|---|
| E2E / UI | **Playwright** | WebKit support covers iOS Safari P1; native API+UI testing; excellent GitHub Actions CI parallelism |
| Backend unit/integration | **Vitest + Supertest** | Native ESM support matches `"type": "module"` backend; Vite ecosystem alignment; faster than Jest |

### Config override
`config.test_framework` = `"auto"` — auto-selection applied.

## Step 3: Scaffold Framework

### Execution mode resolved: `sequential`

### Files created

**E2E (Playwright)**
- `playwright.config.ts` — 3 projects: Chromium, WebKit (Safari), Mobile Safari
- `tests/e2e/auth.spec.ts` — login/register sample tests
- `tests/support/fixtures/index.ts` — mergeTests composition
- `tests/support/helpers/auth-provider.ts` — session-cookie auth provider
- `tests/support/factories/user.factory.ts` — Faker-based user factory

**Backend (Vitest + Supertest)**
- `apps/backend/vitest.config.ts`
- `apps/backend/tests/api/auth.test.ts` — supertest tests for all auth routes

**Contract (Pact)**
- `vitest.config.pact.ts` — minimal pact config
- `tests/contract/consumer/auth.pacttest.ts` — login contract test
- `tests/contract/support/pact-config.ts` — PactV4 factory (consumer: vault-1-frontend, provider: vault-1-backend)
- `tests/contract/support/provider-states.ts`
- `tests/contract/support/consumer-helpers.ts` — local pactjs-utils shim

**Scripts**
- `scripts/env-setup.sh`, `publish-pact.sh`, `can-i-deploy.sh`, `record-deployment.sh`

**CI**
- `.github/workflows/contract-test-consumer.yml`
- `.github/actions/detect-breaking-change/action.yml`

**Env/Config**
- `.nvmrc` — Node 22
- `.env.test.example`
- `.gitignore` — added pacts/, playwright-report/, auth-sessions/

**Root package.json scripts added**
- `test:e2e`, `test:pact:consumer`, `publish:pact`, `can:i:deploy:consumer`, `record:consumer:deployment`

**Output**
- `tests/README.md`

### Outstanding TODOs
1. Export `app` from `apps/backend/src/index.ts` to enable supertest tests
2. Extract frontend fetch calls into a standalone `auth-client.ts` for real Pact consumer testing
3. Add `data-testid` attributes to form inputs in LoginPage, RegisterPage, etc.
4. Add `PACT_BROKER_BASE_URL` + `PACT_BROKER_TOKEN` as GitHub repository secrets when PactFlow is set up

## Step 5: Validation & Summary

### Checklist result: ✅ PASS (with 3 known deferred items)

| Area | Status | Notes |
|---|---|---|
| Preflight | ✅ | fullstack detected |
| Framework selection | ✅ | Playwright + Vitest/Supertest |
| Directory structure | ✅ | all dirs created |
| Config files | ✅ | timeouts, reporters, CI settings |
| Environment | ✅ | .env.test.example + .nvmrc |
| Fixtures | ✅ | mergeTests composition |
| Factories | ✅ | user.factory.ts with Faker |
| Sample tests | ✅ | auth.spec.ts + auth.test.ts + auth.pacttest.ts |
| Helpers | ✅ | auth-provider.ts |
| Documentation | ✅ | README with troubleshooting |
| Scripts | ✅ | all package.json scripts wired |
| Pact CDC alignment | ✅ | all 22 items pass |
| Security | ✅ | no real credentials |

### Deferred items (known, acceptable)
1. `data-testid` attrs on form inputs (purely frontend markup — not a framework gap)
2. Extract frontend fetch to `auth-client.ts` + URL injection (prerequisite for real Pact CDC testing)
3. Export `app` from `apps/backend/src/index.ts` (prerequisite for supertest integration tests)

### Next steps for user
1. `npm install`
2. `npm install -D @seontechnologies/playwright-utils @faker-js/faker @pact-foundation/pact`
3. `cd apps/backend && npm install -D vitest supertest @types/supertest`
4. `npx playwright install --with-deps`
5. `cp .env.test.example .env.test` and fill in values
6. `npm run test:e2e` (with frontend + backend running)
