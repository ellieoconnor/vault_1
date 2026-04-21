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

## Best practices

### Selectors

Prefer this order (most to least resilient):

1. `data-testid` — explicit, never changes with refactors
2. ARIA roles — `getByRole('button', { name: /log in/i })`
3. Labels — `getByLabel('Username')`
4. Placeholders — `getByPlaceholder('Username')` _(last resort)_

Never use CSS classes, internal IDs, or XPath.

### Test isolation

- Each test should set up its own data via the API (`apiRequest` fixture) — never share state between tests.
- Clean up created users/tokens after each test using `test.afterEach`.
- Use `uniqueUsername()` patterns (`testuser_${Date.now()}`) to avoid collisions in parallel runs.

### Network safety

The `networkErrorMonitor` fixture automatically fails tests when any `4xx`/`5xx` response is detected that wasn't explicitly expected. To allow a known error response:

```typescript
test('handles 401', async ({ page, networkErrorMonitor }) => {
  networkErrorMonitor.ignore('/api/auth/me'); // suppress expected 401
  await page.goto('/dashboard');
});
```

### Timeouts

| Context | Default | Override |
|---|---|---|
| Action (click, fill) | 15s | `page.click(..., { timeout: 5000 })` |
| Navigation | 30s | `page.goto(..., { timeout: 10000 })` |
| Test | 60s | `test.setTimeout(90_000)` |

### Debug mode

```bash
# Run with headed browser (watch it happen)
npx playwright test --headed

# Interactive UI mode (best for writing tests)
npx playwright test --ui

# Debug a single test with Playwright Inspector
npx playwright test tests/e2e/auth.spec.ts --debug

# Show Playwright trace viewer after a run
npx playwright show-report
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

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `TEST_USER_EMAIL and TEST_USER_PASSWORD must be set` | Missing env file | `cp .env.test.example .env.test` and fill in values |
| `Error: connect ECONNREFUSED 127.0.0.1:5173` | Frontend not running | Start with `npm run dev` in `apps/frontend` |
| `Error: connect ECONNREFUSED 127.0.0.1:3000` | Backend not running | Start with `npm run dev` in `apps/backend` |
| Test flakiness / element not found | Timing issue | Add an explicit `await expect(locator).toBeVisible()` before interacting |
| `Cannot find module '@seontechnologies/playwright-utils'` | Deps not installed | `npm install -D @seontechnologies/playwright-utils` |
| `Cannot find module 'vitest'` | Backend deps not installed | `cd apps/backend && npm install -D vitest supertest @types/supertest` |
| Supertest tests fail with `app is null` | `app` not exported | Export `app` from `apps/backend/src/index.ts` (see backend tests file for instructions) |
| Pact test fails: `Error: @pact-foundation/pact not found` | Pact not installed | `npm install -D @pact-foundation/pact` |
| Playwright browsers not found | Browsers not installed | `npx playwright install --with-deps` |
| Session cookie not captured in E2E | CORS `credentials` not set | The backend must have `credentials: true` in CORS config (already set) |

---

## Knowledge base

These TEA fragments informed the patterns in this setup:

| Fragment | Applies to |
|---|---|
| `overview.md` | Playwright utils design, fixture patterns |
| `auth-session.md` | Session-cookie auth provider pattern |
| `fixtures-composition.md` | `mergeTests` usage |
| `api-request.md` | `apiRequest` fixture for seeding/cleanup |
| `network-error-monitor.md` | Automatic 4xx/5xx detection |
| `data-factories.md` | Faker-based factory patterns |
| `pact-consumer-framework-setup.md` | Directory structure, scripts, CI workflow |
| `pactjs-utils-consumer-helpers.md` | `createProviderState`, `setJsonContent`, `setJsonBody` |
| `contract-testing.md` | CDC fundamentals |
