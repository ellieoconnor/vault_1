# Test Framework

vault_1 uses a three-layer test strategy:

| Layer | Tool | Location |
|---|---|---|
| E2E / UI | Playwright + `@seontechnologies/playwright-utils` | `tests/e2e/` |
| Backend integration | Vitest + Supertest | `apps/backend/tests/` |
| Consumer contract | Pact (PactV4) + Vitest | `tests/contract/` |

---

## Setup

### 1. Install dependencies

```bash
# From project root
npm install

# E2E: install Playwright browsers
npx playwright install --with-deps

# E2E utilities
npm install -D @seontechnologies/playwright-utils @faker-js/faker

# Backend test tools (run inside apps/backend)
cd apps/backend && npm install -D vitest supertest @types/supertest

# Contract testing (from root)
npm install -D @pact-foundation/pact
```

### 2. Configure environment

```bash
cp .env.test.example .env.test
# Fill in TEST_USER_EMAIL, TEST_USER_PASSWORD, API_URL, BASE_URL
```

---

## Running tests

```bash
# E2E (requires frontend + backend running)
npm run test:e2e
npm run test:e2e -- --ui          # Playwright UI mode

# Backend integration
cd apps/backend && npx vitest run

# Consumer contract tests
npm run test:pact:consumer
```

---

## Directory structure

```
tests/
├── e2e/                        # Playwright E2E tests
│   └── auth.spec.ts
├── contract/
│   ├── consumer/               # Pact consumer tests (.pacttest.ts)
│   │   └── auth.pacttest.ts
│   └── support/
│       ├── pact-config.ts      # PactV4 factory
│       ├── provider-states.ts  # Provider state factories
│       └── consumer-helpers.ts # Local shim (replaces @seontechnologies/pactjs-utils)
└── support/
    ├── fixtures/
    │   └── index.ts            # mergeTests — import from here in E2E tests
    ├── helpers/
    │   └── auth-provider.ts    # Session-cookie auth provider for Playwright
    ├── factories/
    │   └── user.factory.ts     # Faker-based test data
    └── page-objects/           # Page object models (add as UI grows)

apps/backend/tests/
├── unit/                       # Pure unit tests (no DB)
├── integration/                # Multi-layer integration tests
└── api/
    └── auth.test.ts            # Supertest HTTP tests against Express

scripts/
├── env-setup.sh                # Shared env loader (sourced by broker scripts)
├── publish-pact.sh             # Publish pacts to PactFlow
├── can-i-deploy.sh             # Deployment safety check
└── record-deployment.sh        # Record deployment after merge
```

---

## Auth in tests

The app uses **HttpOnly session cookies** (express-session). The Playwright auth provider
(`tests/support/helpers/auth-provider.ts`) logs in via `POST /api/auth/login` and captures
the `connect.sid` cookie.

For supertest backend tests, pass the `set-cookie` header from the login response into subsequent requests:

```typescript
const loginRes = await request(app).post('/api/auth/login').send({ username, password });
const cookie = loginRes.headers['set-cookie'];
const meRes = await request(app).get('/api/auth/me').set('Cookie', cookie);
```

### Required: export `app` from backend

Before running backend integration tests, update `apps/backend/src/index.ts` to export the Express app:

```typescript
export { app };  // add this line before app.listen(...)
```

---

## Selector strategy

Use `data-testid` attributes for E2E selectors. The current pages use placeholder/role selectors
as a fallback until testids are added:

```tsx
// Add to form inputs in LoginPage, RegisterPage, etc.:
<input data-testid="username-input" ... />
<button data-testid="submit-button" ... />
```

---

## Contract testing

Consumer: `vault-1-frontend` | Provider: `vault-1-backend`

The frontend API calls need to be extracted into standalone functions (currently inline in components)
before Pact consumer tests can call real consumer code. See `tests/contract/consumer/auth.pacttest.ts`
for the pattern and the TODO comment.

### CI

- `contract-test-consumer.yml` runs on every PR and push to master.
- Add `PACT_BROKER_BASE_URL` and `PACT_BROKER_TOKEN` as GitHub repository secrets.
- Mark breaking contract changes with `[x] Pact breaking change` in your PR body to skip `can-i-deploy`.
