# Story 1.6: Session Invalidation on Password Reset

Status: done

<!-- Security hardening story. Tracked as SEC-001 (score 6) in test-design-epic-1.4.md. Waived from Story 1.4 and deferred here. -->

## Story

As the application security layer,
I want existing sessions to be invalidated when a password reset completes,
so that a stolen pre-reset session cookie cannot be used to access the account after the victim changes their password.

## Acceptance Criteria

1. **Given** a user has an active session (valid session cookie) AND successfully submits `POST /api/auth/reset-password/:token`, **when** the reset completes, **then** the old session ID is destroyed in the session store and a new session ID is issued (the `Set-Cookie` header on the reset response contains a different session ID from any pre-existing session cookie).

2. **Given** a valid session cookie that was issued _before_ a password reset, **when** a `GET /api/auth/me` request is made with that old cookie after the reset completes, **then** the response is `401 UNAUTHENTICATED`.

3. **Given** a password reset completes successfully, **when** `GET /api/auth/me` is called with the _new_ session cookie from the reset response, **then** it returns `200` with the correct user — existing test `1.4-API-009` must continue to pass unchanged.

## Tasks / Subtasks

- [x] Task 1 — Apply `req.session.regenerate()` fix in the reset-password POST handler (AC: #1, #2, #3)
  - [x] In `apps/backend/src/routes/auth.ts` (lines 283–288), replace the direct `req.session.userId = ...` + `req.session.save()` block with a `req.session.regenerate()` callback that sets `userId` and then calls `save()`
  - [ x] Do NOT touch the login route (`/login`), register route (`/register`), or any other handler

- [x] Task 2 — Write regression test `1.4-API-018`: old session cookie returns 401 after reset (AC: #1, #2)
  - [x] In `apps/backend/src/__tests__/auth/reset-password.test.ts`, add a test that: logs in → captures old session cookie → resets password → asserts `GET /api/auth/me` with old cookie returns `401`
  - [x] Confirm `GET /api/auth/me` with the new session cookie from the reset response returns `200` (covers AC #3)

- [x] Task 3 — Update test design document (housekeeping)
  - [x] In `_bmad-output/test-artifacts/test-design-epic-1.4.md`, move SEC-001 out of "Not in Scope" and mark its mitigation status as resolved

## Dev Notes

### The Fix — Exact Code Change

**File:** `apps/backend/src/routes/auth.ts`

**Current code (lines 283–288):**

```typescript
// Log the user in after reset
req.session.userId = record.userId;
req.session.save((saveErr) => {
  if (saveErr) return next(saveErr);
  res.status(200).json({ id: record.user.id, username: record.user.username });
});
```

**Required replacement:**

```typescript
// Invalidate the old session before creating a new one (SEC-001 fix)
req.session.regenerate((regenErr) => {
  if (regenErr) return next(regenErr);
  req.session.userId = record.userId;
  req.session.save((saveErr) => {
    if (saveErr) return next(saveErr);
    res
      .status(200)
      .json({ id: record.user.id, username: record.user.username });
  });
});
```

**Why this works:**

- `req.session.regenerate(callback)` is the `express-session` API for atomically destroying the current session and creating a new one with a fresh session ID.
- The callback receives the new (empty) session object — setting `req.session.userId` after this populates the _new_ session, not the old one.
- `req.session.save()` then persists the new session row to the `connect-pg-simple` PostgreSQL store (Neon).
- The old session ID is deleted from the `session` table — any request arriving with the old cookie will find no matching row and `req.session.userId` will be `undefined`, causing `GET /me` to return `401`.

**Why NOT `req.session.destroy()` + manual recreation:**
`regenerate()` is the idiomatic `express-session` method for this exact use case (session fixation prevention). It handles the lifecycle correctly in one call. `destroy()` would require manually calling `req.session` methods that are undefined on the destroyed session.

**Nothing else to touch:** The login and register routes use the simpler `req.session.userId = ...; req.session.save()` pattern — that is correct for those routes because there is no pre-existing session to invalidate (login from logged-out state, register is a new account). Only the password reset has this security requirement.

### Test Pattern for `1.4-API-018`

The test uses a shared `agent` (supertest) with a cookie jar so session cookies persist across requests within a test:

```typescript
it("1.4-API-018: old session cookie is rejected after password reset", async () => {
  // 1. Seed: create user with email, create valid reset token
  const user = await createTestUser({ email: "test@example.com" });
  const token = await seedResetToken(user.id);

  // 2. Log in to get a pre-reset session cookie
  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ username: user.username, password: TEST_PASSWORD });
  const oldCookie = loginRes.headers["set-cookie"];

  // 3. Reset the password (using a separate agent — no pre-existing cookie)
  const resetRes = await request(app)
    .post(`/api/auth/reset-password/${token}`)
    .send({ password: "NewPassword123!" });
  expect(resetRes.status).toBe(200);
  const newCookie = resetRes.headers["set-cookie"];

  // 4. Old cookie → 401
  const meOld = await request(app).get("/api/auth/me").set("Cookie", oldCookie);
  expect(meOld.status).toBe(401);

  // 5. New cookie → 200 (this is also what 1.4-API-009 validates)
  const meNew = await request(app).get("/api/auth/me").set("Cookie", newCookie);
  expect(meNew.status).toBe(200);
  expect(meNew.body.username).toBe(user.username);
});
```

### Session Store Context

- **Store:** `connect-pg-simple` backed by Neon PostgreSQL
- **Session table:** `session` (default table name for connect-pg-simple)
- **Session cookie:** `HttpOnly`, `Secure`, `SameSite=Strict` (set in server config)
- `regenerate()` removes the old row from the `session` table and issues a new session ID via `Set-Cookie` on the response — no additional cleanup needed.

### Project Structure Notes

- Only one file changes in production code: `apps/backend/src/routes/auth.ts`
- One test file is modified/extended: `apps/backend/src/__tests__/auth/reset-password.test.ts`
- One doc is updated (housekeeping): `_bmad-output/test-artifacts/test-design-epic-1.4.md`
- No schema changes, no migrations, no frontend changes.

### Security Context (from test design)

| Field                | Value                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------- |
| Risk ID              | SEC-001                                                                                   |
| Category             | SEC                                                                                       |
| Description          | Existing sessions not invalidated after password reset — old session cookie remains valid |
| Probability × Impact | 2 × 3 = **6**                                                                             |
| Original status      | Waived from Story 1.4 — deferred to backlog                                               |
| Fix                  | `req.session.regenerate()` in `POST /api/auth/reset-password/:token`                      |

### References

- Risk SEC-001: [Source: `_bmad-output/test-artifacts/test-design-epic-1.4.md` — Risk Assessment → High-Priority Risks]
- Not in Scope waiver: [Source: `_bmad-output/test-artifacts/test-design-epic-1.4.md` — Not in Scope table, row 2]
- Mitigation detail: [Source: `_bmad-output/test-artifacts/test-design-epic-1.4.md` — Mitigation Plans → SEC-001]
- Fix location: [Source: `apps/backend/src/routes/auth.ts` lines 283–288]
- Session store config: [Source: `_bmad-output/planning-artifacts/architecture.md` — Authentication section: `express-session` + `connect-pg-simple`]
- NFR-S3: _"Authentication sessions persist across visits (remember-me); users can sign out and invalidate the session"_ [Source: `_bmad-output/planning-artifacts/epics.md` — NFR-S3]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
