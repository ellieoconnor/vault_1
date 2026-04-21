# Story 1.5: Logout

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Elizabeth,
I want to log out of the app,
so that my session is properly ended.

## Acceptance Criteria

**Given** I'm logged in
**When** I tap the logout button
**Then** my session is invalidated server-side and I'm redirected to `/login`

**Given** I've just logged out
**When** I navigate to a protected route
**Then** I'm redirected to `/login` (session is truly gone, not just client-side cleared)

**Given** I've logged out
**When** a request is made with the old session cookie
**Then** the server responds with `401 Unauthorized`

## Tasks / Subtasks

- [x] Task 1: Backend — Add `POST /api/auth/logout` route (AC: #1, #3)
  - [x] 1.1 ADD `POST /api/auth/logout` to `apps/backend/src/routes/auth.ts` — requires `requireAuth` middleware, calls `req.session.destroy()`, clears cookie, returns 200
  - [x] 1.2 Verify the route is mounted — no new file needed, it goes in the existing `auth.ts` router

- [x] Task 2: Frontend — Add logout mutation hook to `useAuth.ts` (AC: #1, #2)
  - [x] 2.1 ADD `useLogout` hook (or `logout` mutation) to `apps/frontend/src/api/useAuth.ts` — calls `POST /api/auth/logout`, on success: clears `['auth', 'me']` query cache and navigates to `/login`

- [x] Task 3: Frontend — Wire logout button to DashboardPage (AC: #1, #2)
  - [x] 3.1 Add a logout button to `apps/frontend/src/pages/DashboardPage.tsx` — on click calls the logout mutation; button is disabled while mutation is pending

## Dev Notes

### What Already Exists — Do NOT Recreate

From Stories 1.2, 1.3, 1.4 — import and use these:

- **Session middleware** — fully configured in `apps/backend/src/index.ts` (express-session + connect-pg-simple, HttpOnly/Secure/SameSite=Strict). Do not touch session config.
- **`requireAuth` middleware** — `apps/backend/src/middleware/auth.ts`. USE this for the logout route — it ensures only authenticated sessions can call logout (prevents unnecessary destroy calls).
- **`req.session.userId` type augmentation** — `apps/backend/src/types/session.d.ts`. No changes needed.
- **`errorHandler` middleware** — `apps/backend/src/middleware/errorHandler.ts`. Already mounted last in `index.ts`. Do NOT add error middleware again.
- **`prisma`** — exported from `apps/backend/src/index.ts`. Import as: `import { prisma } from '../index.js'` (not needed for logout itself — session destroy is enough)
- **`react-router-dom`, `@tanstack/react-query`, `zod`** — already installed in `apps/frontend`
- **`useAuth` hook** — `apps/frontend/src/api/useAuth.ts`. ADD `useLogout` to this file. Do NOT replace the existing `useAuth` export.
- **`QueryClientProvider`** — already wrapping the app in `apps/frontend/src/main.tsx`
- **`AuthGuard`** — `apps/frontend/src/components/shared/AuthGuard.tsx`. No changes needed — it already redirects to `/login` when `isAuthenticated` is false. Once the `['auth', 'me']` cache is cleared after logout, AuthGuard will redirect automatically.

### Backend: Logout Route

```typescript
// apps/backend/src/routes/auth.ts — ADD to existing router (after the /me route)
import { requireAuth } from "../middleware/auth.js"; // already imported? check file

router.post("/logout", requireAuth, async (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    // Clear the session cookie on the client
    res.clearCookie("connect.sid"); // default express-session cookie name
    return res.status(200).json({ message: "Logged out" });
  });
});
```

**Important notes on `session.destroy()`:**
- `session.destroy()` removes the session record from the `sessions` table in PostgreSQL (via connect-pg-simple) — this is true server-side invalidation, not just cookie clearing
- After `destroy()`, `req.session` is `null` — do not reference it again after the callback
- `res.clearCookie("connect.sid")` ensures the browser discards the cookie too — belt-and-suspenders (the cookie won't work anyway since the session record is gone, but clearing it prevents a confusing stale cookie from lingering)
- The cookie name `connect.sid` is the express-session default; verify this matches the actual `name` option in `apps/backend/src/index.ts` session config

**Verify `requireAuth` import:** Check `apps/backend/src/routes/auth.ts` — if `requireAuth` is NOT already imported at the top, add: `import { requireAuth } from '../middleware/auth.js';`

### Frontend: `useLogout` Hook

ADD to `apps/frontend/src/api/useAuth.ts` — do NOT replace the existing `useAuth` export:

```typescript
// apps/frontend/src/api/useAuth.ts — ADD below existing useAuth function

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw err;
      }
      return res.json();
    },
    onSuccess: () => {
      // Clear the auth cache — AuthGuard will see isAuthenticated: false and redirect to /login
      queryClient.removeQueries({ queryKey: ["auth", "me"] });
      navigate("/login");
    },
  });
}
```

**Why `removeQueries` not `invalidateQueries`:** `invalidateQueries` marks the query stale and triggers a background refetch — but we want the auth state gone immediately, not refetched. `removeQueries` wipes the cache entry entirely, so `useAuth` returns `{ user: null, isAuthenticated: false }` immediately without a network round-trip.

**`useNavigate` in a non-component context:** `useLogout` is a custom hook (not a component), so calling `useNavigate()` inside it is valid — hooks can call other hooks. The hook must be called from inside a React component that is rendered within `<BrowserRouter>`.

### Frontend: Logout Button on DashboardPage

ADD a logout button to `apps/frontend/src/pages/DashboardPage.tsx`:

```tsx
// apps/frontend/src/pages/DashboardPage.tsx — ADD import and button

import { useLogout } from "../api/useAuth";

export default function DashboardPage() {
  const logout = useLogout();

  return (
    <div>
      <h1>Dashboard</h1>
      {/* ... existing content ... */}
      <button
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
        type="button"
      >
        {logout.isPending ? "Logging out..." : "Log Out"}
      </button>
    </div>
  );
}
```

**Placement:** The logout button can be anywhere visible on the dashboard for now — exact UX placement (header, footer, settings nav) is deferred to Epic 2's UI work. Just make it accessible and functional.

### How AC #2 is Satisfied Without Extra Code

AC2 says "navigating to a protected route after logout redirects to `/login` — session truly gone, not just client-side cleared." This is already handled by the combination of:

1. `session.destroy()` on the backend removes the session from PostgreSQL — the old cookie is now a dead reference
2. `queryClient.removeQueries({ queryKey: ['auth', 'me'] })` on the frontend clears local auth state
3. `AuthGuard` reads from the `useAuth` hook — when the cache is empty, it calls `GET /api/auth/me`, which returns 401 (no valid session), so `useAuth` returns `{ isAuthenticated: false }`, and `AuthGuard` redirects to `/login`

No additional code is needed for AC2 — it is a composition of existing mechanisms.

### How AC #3 is Satisfied

AC3 says "a request with the old session cookie returns 401." This is already handled:
- `requireAuth` middleware (`apps/backend/src/middleware/auth.ts`) checks `req.session.userId`
- After `session.destroy()`, the PostgreSQL session record is deleted
- connect-pg-simple cannot find the session → `req.session.userId` is undefined → `requireAuth` returns 401

All protected routes already use `requireAuth` — no changes needed to existing routes.

### Import Extension Rule (CRITICAL)

The backend uses `"module": "NodeNext"` in tsconfig. ALL local imports in `apps/backend/src/` MUST use `.js` extension:

```typescript
// ✅ Correct
import { requireAuth } from "../middleware/auth.js";

// ❌ Wrong — fails at runtime with NodeNext
import { requireAuth } from "../middleware/auth";
```

### Project Structure Notes

**Actual directory structure** (confirmed across previous stories — `apps/` prefix, NOT `client/server/` as the architecture doc shows):

```
apps/
├── backend/src/
│   ├── middleware/
│   │   ├── auth.ts           ← EXISTS (requireAuth) — may need import in auth.ts router
│   │   ├── errorHandler.ts   ← EXISTS
│   │   └── validate.ts       ← EXISTS
│   ├── routes/
│   │   └── auth.ts           ← MODIFY: add POST /logout route
│   └── index.ts              ← EXISTS (do not touch)
│
└── frontend/src/
    ├── api/
    │   └── useAuth.ts        ← MODIFY: add useLogout hook
    ├── components/shared/
    │   └── AuthGuard.tsx     ← EXISTS (no changes needed)
    ├── pages/
    │   └── DashboardPage.tsx ← MODIFY: add logout button
    └── App.tsx               ← EXISTS (no changes needed — no new route)
```

**Architecture doc mismatch:** Architecture shows `client/` and `server/` paths. The ACTUAL paths are `apps/frontend/` and `apps/backend/`. Always use the actual paths above.

**No new files** — this story modifies 3 existing files only.

### Previous Story Learnings (Stories 1.3 & 1.4)

Patterns established that MUST be followed:

- **Express v5** — async errors auto-forward to `next(err)`. The `session.destroy()` callback-based API doesn't propagate errors automatically — always call `next(err)` inside the callback if `err` is present.
- **`req.session.save(callback)` → `req.session.destroy(callback)`** — both are callback-based, not promise-based. Do NOT `await` them. Use the callback form shown above.
- **`credentials: 'include'`** on every frontend `fetch` call — required for cross-origin session cookies. The logout fetch must include this.
- **`queryClient.invalidateQueries`** vs **`queryClient.removeQueries`** — for logout, use `removeQueries` (immediate cache removal) not `invalidateQueries` (triggers background refetch which would momentarily re-authenticate).
- **No shared Zod schema needed** — logout takes no request body, so no Zod validation is required on either side.
- **Button `type="button"`** — always specify `type="button"` for non-submit buttons inside forms to prevent accidental form submission.

### Testing Notes

The test file for auth routes is at `apps/backend/tests/api/auth.test.ts` (established in Story 1.4). If you add integration tests for logout, add them there. Suggested test cases:

- `POST /api/auth/logout` when authenticated → 200, session destroyed
- `GET /api/auth/me` after logout with old session cookie → 401
- `POST /api/auth/logout` when not authenticated → 401 (requireAuth blocks it)

Tests are co-located with source files per architecture standards, but the auth test file is in `apps/backend/tests/api/` based on Story 1.4's established pattern. Follow that existing pattern.

### References

- Story ACs: [Source: _bmad-output/planning-artifacts/epics.md#Story-1.5]
- FR5 (logout): [Source: _bmad-output/planning-artifacts/epics.md#Requirements-Inventory]
- NFR-S3 (session invalidation on sign-out): [Source: _bmad-output/planning-artifacts/epics.md#NonFunctional-Requirements]
- Session destroy pattern: [Source: _bmad-output/implementation-artifacts/1-3-user-login-persistent-session.md]
- `requireAuth` middleware location: [Source: _bmad-output/implementation-artifacts/1-4-password-reset-via-email.md#What-Already-Exists]
- `queryClient.invalidateQueries` after auth change: [Source: _bmad-output/implementation-artifacts/1-4-password-reset-via-email.md#Previous-Story-Learnings]
- Error handling pattern (next(err)): [Source: _bmad-output/planning-artifacts/architecture.md#Process-Patterns]
- API error format: [Source: _bmad-output/planning-artifacts/architecture.md#API-Communication-Patterns]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

- apps/backend/src/routes/auth.ts
- apps/backend/tests/api/auth.test.ts
- apps/frontend/src/api/useAuth.ts
- apps/frontend/src/pages/DashboardPage.tsx
