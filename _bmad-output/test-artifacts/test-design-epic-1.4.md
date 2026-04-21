---
stepsCompleted: []
lastStep: ''
lastSaved: ''
---

# Test Design: Epic 1 — Story 1.4: Password Reset via Email

**Date:** 2026-04-15
**Author:** Developer
**Status:** Draft

---

## Executive Summary

**Scope:** Full test design for Story 1.4 (Password Reset via Email) — Epic 1: Foundation & Authentication.

**Risk Summary:**

- Total risks identified: 11
- High-priority risks (score ≥6): 3 (1 BLOCK, 2 MITIGATE)
- Critical categories: TECH (no test framework), BUS (auto-login failure), SEC (session not regenerated)

**Coverage Summary:**

- P0 scenarios: 13 (~4–8 hrs)
- P1 scenarios: 6 (~3–6 hrs)
- P2/P3 scenarios: 6 (~3–6 hrs)
- **Total effort**: ~10–20 hrs (story 1.4 tests only; add ~4–8 hrs for first-time framework setup)

---

## Not in Scope

| Item | Reasoning | Mitigation |
| --- | --- | --- |
| Resend email delivery verification (live email) | No email capture service (Mailosaur/Ethereal) configured | E2E happy path seeds token directly in DB; full email flow tracked as P2 (1.4-E2E-007) |
| Existing session invalidation on password reset | Implemented in Story 1.6 (SEC-001) | Resolved — `req.session.regenerate()` applied in POST /reset-password/:token; regression test added |
| Rate limiting on forgot-password endpoint | No rate limiting implemented in current story | Known gap; acceptable for single-user app in early development |
| Resend webhook / delivery status callbacks | Out of scope for this story | Not implemented |

---

## Risk Assessment

> P0/P1/P2/P3 below = **priority and risk level**, not execution timing. See Execution Strategy for timing.

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TECH-001 | TECH | No test framework installed — cannot run any tests | 3 | 3 | **9 BLOCK** | Run `/bmad-tea-testarch-framework` to scaffold Vitest + Playwright before writing any tests | Developer | Before 1.4-API-001 |
| BUS-001 | BUS | Auto-login after reset: `session.save` failure leaves password changed but user not logged in | 2 | 3 | **6** | Cover with 1.4-API-009 — after POST /reset-password/:token, follow-up GET /api/auth/me must return the user | Developer | Sprint |
| SEC-001 | SEC | Existing sessions not invalidated after password reset — old session cookie remains valid | 2 | 3 | **6** | Resolved in Story 1.6 — `req.session.regenerate()` applied; regression test 1.4-API-018 added | Developer | Done |

### Medium-Priority Risks (Score 3–5)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| BUS-002 | BUS | Token check order: `usedAt` must be checked before `expiresAt` — wrong order returns wrong error code for a used+expired token | 2 | 2 | 4 | Cover with 1.4-API-014 — seed a token that is both used AND expired, assert TOKEN_ALREADY_USED | Developer |
| SEC-002 | SEC | Race condition: two concurrent POST /reset-password/:token requests could both pass the `usedAt` check before either sets it | 2 | 2 | 4 | Prisma transaction is partial mitigation (password+token update atomic); full fix requires DB-level upsert or advisory lock. Document as known gap. | Developer |
| OPS-001 | OPS | Resend API failure: token created in DB but email not sent — user gets "success" message with no email, no rollback | 2 | 2 | 4 | Cover with 1.4-API-016 (mock emailService throws, assert token state). Accepted given 1-hour TTL. | Developer |
| SEC-003 | SEC | User enumeration via forgot-password | 1 | 3 | 3 | Already mitigated — endpoint returns generic 200 regardless of user/email existence. Cover with 1.4-API-002/003. | Developer |
| SEC-004 | SEC | Token predictability | 1 | 3 | 3 | Already mitigated — `crypto.randomBytes(32)` is cryptographically secure. No test needed. | Developer |

### Low-Priority Risks (Score 1–2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
| --- | --- | --- | --- | --- | --- | --- |
| DATA-001 | DATA | Expired token accumulation — cleanup only runs when same user requests a new token | 2 | 1 | 2 | Document |
| BUS-003 | BUS | Frontend doesn't re-validate token before POST submit — mitigated by mutation.onError handling | 1 | 2 | 2 | Document |
| SEC-005 | SEC | CSRF on reset POST — mitigated by SameSite=Strict cookie | 1 | 2 | 2 | Document |

### Risk Category Legend

- **TECH**: Technical/Architecture (flaws, integration, scalability)
- **SEC**: Security (access controls, auth, data exposure)
- **DATA**: Data Integrity (loss, corruption, inconsistency)
- **BUS**: Business Impact (UX harm, logic errors)
- **OPS**: Operations (deployment, config, monitoring)

---

## Entry Criteria

- [ ] TECH-001 resolved: Vitest + Playwright scaffolded (run `/bmad-tea-testarch-framework`)
- [ ] Test database available (Neon branch or local Postgres with Prisma migrations run)
- [ ] `emailService.ts` mockable at module level in Vitest
- [ ] Story 1.4 implementation complete (all tasks checked — confirmed)
- [ ] `apps/backend/.env.test` populated with test DB connection string

## Exit Criteria

- [ ] All P0 tests passing (100%)
- [ ] All P1 tests passing (≥95%)
- [ ] BUS-001 verified: 1.4-API-009 passes (GET /me returns user after reset)
- [ ] BUS-002 verified: 1.4-API-014 passes (token check order correct)
- [x] SEC-001 resolved in Story 1.6 — `req.session.regenerate()` + regression test 1.4-API-018
- [ ] No open P0/P1 bugs

---

## Test Coverage Plan

> **Note:** P0/P1/P2/P3 indicate **priority and risk classification**, not execution timing. All functional tests (P0+P1) run on every PR. See Execution Strategy for details.

### P0 — Critical

**Criteria:** Blocks core functionality + high risk (score ≥6) or security-critical + no workaround

| Test ID | Requirement / Scenario | Test Level | Risk Link | Notes |
| --- | --- | --- | --- | --- |
| 1.4-API-001 | POST /forgot-password: username with email on file → 200 generic message | API | - | Mock emailService; assert 200 + generic message |
| 1.4-API-002 | POST /forgot-password: username without email on file → 200 generic message | API | SEC-003 | User enumeration prevention |
| 1.4-API-003 | POST /forgot-password: non-existent username → 200 generic message | API | SEC-003 | User enumeration prevention |
| 1.4-API-004 | GET /reset-password/:token: valid unexpired unused token → 200 `{valid: true}` | API | - | Seed valid token in DB |
| 1.4-API-005 | GET /reset-password/:token: expired token → 400 TOKEN_EXPIRED | API | - | Seed token with expiresAt in past |
| 1.4-API-006 | GET /reset-password/:token: used token → 400 TOKEN_ALREADY_USED | API | - | Seed token with usedAt set |
| 1.4-API-007 | GET /reset-password/:token: unknown token → 400 TOKEN_NOT_FOUND | API | - | Random string not in DB |
| 1.4-API-008 | POST /reset-password/:token: valid token + valid password → 200, password hash updated | API | - | Verify new hash differs from old |
| 1.4-API-009 | POST /reset-password/:token: auto-login — follow-up GET /api/auth/me returns user | API | BUS-001 | Critical: validates session.save fired |
| 1.4-API-010 | POST /reset-password/:token: token marked usedAt → same token returns 400 TOKEN_ALREADY_USED | API | - | Tests idempotency |
| 1.4-API-011 | POST /reset-password/:token: expired token → 400 TOKEN_EXPIRED | API | - | Seed expired token |
| 1.4-API-012 | POST /reset-password/:token: unknown token → 400 TOKEN_NOT_FOUND | API | - | - |
| 1.4-E2E-001 | Happy path: seed valid token in DB → visit `/reset-password/:token` → fill form → submit → redirected to `/` and authenticated | E2E | BUS-001 | Bypasses email; seeds token directly |

**Total P0:** 13 tests, ~4–8 hrs

---

### P1 — High

**Criteria:** Important correctness + medium risk (score 3–5) + common user-facing flows

| Test ID | Requirement / Scenario | Test Level | Risk Link | Notes |
| --- | --- | --- | --- | --- |
| 1.4-API-013 | POST /reset-password/:token: password < 8 chars → 400 validation error | API | - | Zod schema validation |
| 1.4-API-014 | Token both used AND expired → response is TOKEN_ALREADY_USED (not TOKEN_EXPIRED) | API | BUS-002 | Seed token with both usedAt and past expiresAt |
| 1.4-E2E-002 | ResetPasswordPage: expired token → on-mount shows "This link has expired — request a new one" + link to /forgot-password | E2E | - | Seed expired token, navigate to page |
| 1.4-E2E-003 | ResetPasswordPage: used token → on-mount shows "This link has already been used" | E2E | - | Seed used token |
| 1.4-E2E-004 | ResetPasswordPage: password + confirmPassword mismatch → "Passwords do not match" error, no API call made | E2E | - | Client-side Zod validation |
| 1.4-E2E-005 | ForgotPasswordPage: submits form → shows generic "Check your email" success state | E2E | - | Network intercept to mock API |

**Total P1:** 6 tests, ~3–6 hrs

---

### P2 — Medium

**Criteria:** Secondary correctness + low risk + edge cases

| Test ID | Requirement / Scenario | Test Level | Risk Link | Notes |
| --- | --- | --- | --- | --- |
| 1.4-API-015 | POST /forgot-password: expired tokens for same user deleted before new token created | API | DATA-001 | Seed expired token, request new one, assert old is gone |
| 1.4-API-016 | POST /forgot-password: emailService throws → assert token still created in DB (known limitation: no rollback) | API | OPS-001 | Documents accepted gap |
| 1.4-E2E-006 | "Forgot password?" link on LoginPage is visible and navigates to /forgot-password | E2E | - | Simple navigation check |
| 1.4-E2E-007 | Full email flow with Mailosaur: request reset → receive email → click link → reset → logged in | E2E | - | Requires Mailosaur account; deferred |

**Total P2:** 4 tests, ~2–4 hrs

---

### P3 — Low

**Criteria:** Nice-to-have + exploratory

| Test ID | Requirement / Scenario | Test Level | Notes |
| --- | --- | --- | --- |
| 1.4-UNIT-001 | Token expiry: `new Date(Date.now() + 60 * 60 * 1000)` falls within expected 1-hour window | Unit | Trivial; covers the constant |
| 1.4-API-017 | POST /forgot-password: missing `username` field → 400 validation error | API | Zod schema; covered by validateBody middleware |

**Total P3:** 2 tests, ~1–2 hrs

---

## Execution Strategy

**Every PR:** All P0 + P1 tests. With Playwright parallelisation, 19 tests should run in well under 5 minutes. This is the target — no deferred functional tests.

**Nightly:** P2 + P3. The Mailosaur E2E test (1.4-E2E-007) runs here once configured.

**Philosophy:** Run everything on every PR unless a test requires external services (live email delivery, load tooling) or takes more than 15 minutes. The default is "run it."

---

## Resource Estimates

| Priority | Count | Estimate | Notes |
| --- | --- | --- | --- |
| P0 | 13 | ~4–8 hrs | Includes DB seeding setup, session assertion patterns |
| P1 | 6 | ~3–6 hrs | Includes E2E token-state flows |
| P2 | 4 | ~2–4 hrs | Includes Mailosaur spike if tackled |
| P3 | 2 | ~1–2 hrs | - |
| **Total (story 1.4)** | **25** | **~10–20 hrs** | - |
| First-time framework setup | — | ~4–8 hrs | Vitest + Playwright scaffolding (one-time cost) |

---

## Quality Gate Criteria

| Gate | Threshold |
| --- | --- |
| P0 pass rate | 100% — no exceptions |
| P1 pass rate | ≥95% |
| BUS-001 (auto-login) | 1.4-API-009 must pass |
| BUS-002 (token order) | 1.4-API-014 must pass |
| SEC-001 (session not regenerated) | Resolved in Story 1.6; regression test 1.4-API-018 passing |
| OPS-001 (Resend failure) | Accepted; 1-hour TTL mitigates orphaned token risk |
| Critical path coverage | ≥80% of ACs covered by passing tests |

---

## Mitigation Plans

### TECH-001: No Test Framework (Score: 9 — BLOCK)

**Mitigation Strategy:**
1. Run `/bmad-tea-testarch-framework` to scaffold Vitest (backend) + Playwright (E2E)
2. Configure `apps/backend` with Vitest + a test DB connection (`DATABASE_URL_TEST`)
3. Configure Playwright with `baseURL` pointing to local dev server
4. Wire `npm test` in root `package.json` to run both

**Owner:** Developer
**Timeline:** Immediately — prerequisite for all other work
**Status:** Planned
**Verification:** `npm test` exits 0 on an empty test suite

---

### BUS-001: Auto-login After Reset May Fail Silently (Score: 6)

**Mitigation Strategy:**
1. Write 1.4-API-009: after successful POST /reset-password/:token, make a follow-up authenticated GET /api/auth/me in the same test session (same cookie jar)
2. Assert response is 200 and contains the correct `username`
3. If this test fails, it means `session.save()` did not fire or the session was not persisted

**Owner:** Developer
**Timeline:** Sprint (P0 test)
**Status:** Planned
**Verification:** 1.4-API-009 passes consistently

---

### SEC-001: Existing Sessions Not Invalidated (Score: 6 — RESOLVED)

**Mitigation Strategy:**
Resolved in Story 1.6. Applied `req.session.regenerate()` in `POST /api/auth/reset-password/:token` before setting the new `userId`, ensuring the old session is destroyed and a fresh session ID is issued on password reset.

**Owner:** Developer
**Timeline:** Completed in Story 1.6
**Status:** Resolved — fix shipped, regression test passing
**Verification:** Test 1.4-API-018 (`old session cookie is rejected after password reset`) in `apps/backend/tests/api/auth.test.ts`

---

## Assumptions and Dependencies

### Assumptions

1. Test database is a separate Neon branch or local Postgres instance — tests never run against production DB
2. `emailService.ts` can be mocked at the Vitest module level (`vi.mock('../services/emailService.js')`)
3. Playwright tests run against a locally running dev server (`npm run dev` in `apps/backend` + `apps/frontend`)
4. DB seed/teardown runs within each test (no shared state between tests)

### Dependencies

1. Test framework scaffolded (TECH-001) — required before any test can run
2. Test DB with Prisma migrations applied — required before API tests
3. Mailosaur account — required only for 1.4-E2E-007 (P2, deferred)

### Risks to Plan

- **Risk**: Neon free tier may not support multiple branches for test isolation
  - **Impact**: Tests could contaminate production data
  - **Contingency**: Use local Postgres via Docker for test runs; keep Neon for production only

---

## Interworking & Regression

| Component | Impact | Regression Scope |
| --- | --- | --- |
| `POST /api/auth/register` | Added optional `email` field (Task 1) | 1.2 registration tests must still pass with `email` omitted |
| `POST /api/auth/login` | No change | 1.3 login tests must pass unchanged |
| `GET /api/auth/me` | Used to verify auto-login after reset | Must return correct user after session creation in reset flow |
| `express-session` / `connect-pg-simple` | Session created in reset route via `req.session.save()` | Session pattern must match existing login route pattern |
| `PasswordResetToken` Prisma model | New model — migration must be applied on test DB | Prisma migration `add-password-reset-token` must be present |

---

## Appendix

### Test Data Approach

- **Token seeding**: Tests create `PasswordResetToken` records directly via Prisma in test setup, bypassing the email flow
- **User seeding**: Tests create `User` records with known credentials and optionally an email address
- **Cleanup**: Each test deletes its own created records in `afterEach` (or uses a test-scoped DB transaction)
- **Email testing**: For P2 1.4-E2E-007, use Mailosaur with a `@{serverId}.mailosaur.net` address — link extraction via `message.html.links[0].href`

### Suggested Test File Structure

```
apps/backend/src/__tests__/
  auth/
    forgot-password.test.ts    # 1.4-API-001–003, 015, 016
    reset-password.test.ts     # 1.4-API-004–014

apps/frontend/e2e/
  auth/
    password-reset.spec.ts     # 1.4-E2E-001–007
```

### Knowledge Base References

- `risk-governance.md` — Risk classification framework, gate decision engine
- `probability-impact.md` — P×I scoring (1–9), DOCUMENT/MONITOR/MITIGATE/BLOCK thresholds
- `test-levels-framework.md` — Test level selection (unit/integration/E2E)
- `test-priorities-matrix.md` — P0–P3 prioritisation criteria
- `email-auth.md` — Email authentication testing patterns (Mailosaur, session caching, negative flows)

### Related Documents

- Story: `_bmad-output/implementation-artifacts/1-4-password-reset-via-email.md`
- Epics: `_bmad-output/planning-artifacts/epics.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- PRD: `_bmad-output/planning-artifacts/prd.md`

---

**Generated by**: BMad TEA Agent — Test Architect Module
**Workflow**: `_bmad/tea/testarch/test-design`
**Version**: 4.0 (BMad v6)
