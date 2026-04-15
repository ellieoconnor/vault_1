---
stepsCompleted: ['step-01-detect-mode', 'step-02-load-context', 'step-03-risk-and-testability', 'step-04-coverage-plan', 'step-05-generate-output']
lastStep: 'step-05-generate-output'
status: complete
lastSaved: '2026-04-15'
inputDocuments:
  - _bmad-output/implementation-artifacts/1-4-password-reset-via-email.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/epics.md
  - _bmad/tea/testarch/knowledge/risk-governance.md
  - _bmad/tea/testarch/knowledge/probability-impact.md
  - _bmad/tea/testarch/knowledge/test-levels-framework.md
  - _bmad/tea/testarch/knowledge/test-priorities-matrix.md
  - _bmad/tea/testarch/knowledge/email-auth.md
---

## Step 4 Output: Coverage Plan

### P0 (13 scenarios — API + 1 E2E)
- 1.4-API-001–012: Full backend API coverage of all token states, user enumeration, session creation
- 1.4-E2E-001: Happy path with DB-seeded token

### P1 (6 scenarios — API + E2E)
- 1.4-API-013: password validation
- 1.4-API-014: token check ORDER (usedAt before expiresAt) — BUS-002 mitigation
- 1.4-E2E-002–005: expired/used token error states, password mismatch, forgot-password success state

### P2 (4 scenarios)
- 1.4-API-015: expired token cleanup
- 1.4-API-016: emailService failure (OPS-001 documentation)
- 1.4-E2E-006: forgot password link on login page
- 1.4-E2E-007: full email flow with Mailosaur (requires email capture service)

### P3 (2 scenarios)
- 1.4-UNIT-001: token expiry calculation
- 1.4-API-017: missing username validation

### Waivers
- SEC-001: old sessions not invalidated — accepted, document as separate security story
- OPS-001: orphaned token on Resend failure — accepted given 1-hour TTL

### Quality Gates
- P0: 100%, P1: ≥95%, BUS-001 verified (API-009), BUS-002 verified (API-014)

## Step 3 Output: Risk Assessment

### BLOCK (score 9)
- TECH-001: No test framework installed — blocks all test execution

### MITIGATE (score 6)
- BUS-001: Auto-login after reset — session.save failure leaves password changed, user not logged in (P=2, I=3)
- SEC-001: Old sessions not invalidated after reset (P=2, I=3)

### MONITOR (score 4)
- BUS-002: Token check order — usedAt must precede expiresAt check (P=2, I=2)
- SEC-002: Race condition on concurrent token use (P=2, I=2)
- OPS-001: Resend failure — token created, email not sent, no rollback (P=2, I=2)

### DOCUMENT (score 1–3)
- BUS-003, SEC-003, SEC-004, DATA-001, SEC-005 — low risk, already mitigated or acceptable

### Testability Concerns
- Email delivery requires capture service (Mailosaur/Ethereal) or emailService mock
- session.save assertion requires follow-up GET /api/auth/me
- Frontend token validation fires on mount — needs backend or query mock
- TECH-001 is the immediate prerequisite for all test execution

## Step 2 Output

- **Stack**: fullstack (React 19 + Vite frontend, Express v5 TS backend)
- **Existing tests**: None — no test tooling installed
- **Story**: 1-4-password-reset-via-email — all tasks complete
- **Endpoints**: POST /forgot-password, GET /reset-password/:token, POST /reset-password/:token
- **Key risks to assess**: token expiry, token reuse, user enumeration, session creation on reset
- **Email fragments**: email-auth.md loaded (specialized) — password reset is email auth flow
- **Skipped**: pactjs-utils, pact-mcp (monolith), playwright-cli (no live app)

## Step 1 Output

- **Mode**: Epic-Level
- **Trigger**: `sprint-status.yaml` found with story `1-4-password-reset-via-email` in-progress
- **Story file**: `_bmad-output/implementation-artifacts/1-4-password-reset-via-email.md`
- **Architecture**: `_bmad-output/planning-artifacts/architecture.md`
- **Epics**: `_bmad-output/planning-artifacts/epics.md`
