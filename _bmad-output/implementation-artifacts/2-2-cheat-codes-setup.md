# Story 2.2: Cheat Codes Setup

Status: done

## Why This Story Matters

Cheat Codes are not a settings field — they are ambient coaching infrastructure. The entire emotional design of Vault 1 depends on them being _there_, always visible, without Elizabeth having to think to look. This story builds the full CRUD backbone: database model, API endpoints, and the Settings page editor. The dashboard display (making them ambient) is Story 2.4, but the data layer and editing UI must exist first. Without this story, the dashboard shows nothing useful in the Cheat Codes band and the UX promise is hollow.

> **Before You Start**
>
> ⚠️ **Architecture doc shows `client/` and `server/` paths — those are wrong.** Actual paths are `apps/frontend/` and `apps/backend/`. Always use the actual paths.
>
> ⚠️ **There is NO `cheatCodes.ts` route file yet.** Create it from scratch. Do NOT create a duplicate of `users.ts`.
>
> ⚠️ **The Prisma schema has no CheatCode model yet.** You are adding it via a new additive migration. Do NOT re-run previous migrations.
>
> ⚠️ **`SettingsPage.tsx` does not exist yet** — App.tsx renders a placeholder `<div>`. Create `apps/frontend/src/pages/SettingsPage.tsx` and update App.tsx to import and render it.
>
> ⚠️ **Dashboard display of Cheat Codes is out of scope.** `CheatCodes.tsx` (dashboard band component) is built in Story 2.4. This story builds `CheatCodeForm.tsx` in `components/settings/` only.
>
> ⚠️ **No navigation to `/settings` exists yet.** Add a "Settings" link to `DashboardPage.tsx` so the page is reachable in the running app (not just by direct URL). See Task 6.3.

---

## Story

As Elizabeth,
I want to create up to 3 Cheat Codes (short coaching reminders) and be able to edit or delete them,
so that my coaching strategies are captured in the app and ready to surface on my dashboard.

## Acceptance Criteria

**AC1:** Given I'm in the Cheat Codes section (settings), when I type a Cheat Code and save it, then it is stored and appears in my Cheat Codes list immediately.

**AC2:** Given I already have 3 Cheat Codes, when I try to add a fourth, then the "Add" button is disabled and I see "Maximum 3 Cheat Codes".

**AC3:** Given an existing Cheat Code, when I edit its text and save, then the updated text is persisted and shown immediately.

**AC4:** Given an existing Cheat Code, when I delete it, then it is removed from the list and I can add a new one.

**AC5:** Given a Cheat Code text input, when I submit an empty string, then I see a validation error — blank Cheat Codes are not allowed.

**AC6:** Given any Cheat Code change (create, edit, delete), when the API call succeeds, then the list reflects the new state without a full page reload.

---

## Tasks / Subtasks

- [x] Task 1: Prisma schema — add CheatCode model and migration
    - [x] 1.1 Add `CheatCode` model to `apps/backend/prisma/schema.prisma` (see Dev Notes for full schema)
    - [x] 1.2 Add `cheatCodes CheatCode[]` relation to the `User` model in schema.prisma
    - [x] 1.3 Run `npx prisma migrate dev --name add_cheat_code` from `apps/backend/`
    - [x] 1.4 Verify `cheat_codes` table created in Neon (check Neon console or run `prisma studio`)

- [x] Task 2: Backend — Zod schema
    - [x] 2.1 Create `apps/backend/src/schemas/cheatCodeSchemas.ts` with `createCheatCodeSchema` and `updateCheatCodeSchema` (see Dev Notes)

- [x] Task 3: Backend — route handler
    - [x] 3.1 Create `apps/backend/src/routes/cheatCodes.ts` with 4 endpoints (see Dev Notes for full implementation)
    - [x] 3.2 `GET /api/cheat-codes` — return user's codes ordered by `sortOrder asc`
    - [x] 3.3 `POST /api/cheat-codes` — create, enforce max 3 server-side, auto-assign `sortOrder` as `MAX(sortOrder) + 1`
    - [x] 3.4 `PATCH /api/cheat-codes/:id` — update text only, verify ownership
    - [x] 3.5 `DELETE /api/cheat-codes/:id` — delete, verify ownership, return 204
    - [x] 3.6 Mount cheatCodesRouter in `apps/backend/src/index.ts`: `app.use('/api/cheat-codes', cheatCodesRouter)`

- [x] Task 4: Backend — API tests
    - [x] 4.1 Create `apps/backend/tests/api/cheat-codes.test.ts` following the pattern of `tests/api/users-config.test.ts`
    - [x] 4.2 Test GET returns empty array for new user
    - [x] 4.3 Test POST creates a code and returns 201
    - [x] 4.4 Test POST with 3 existing codes returns 400 MAX_CHEAT_CODES
    - [x] 4.5 Test POST with empty text returns 400 validation error
    - [x] 4.6 Test PATCH updates text and returns 200
    - [x] 4.7 Test PATCH for another user's code returns 404
    - [x] 4.8 Test DELETE removes code and returns 204
    - [x] 4.9 Test DELETE for another user's code returns 404

- [x] Task 5: Frontend — TanStack Query hook
    - [x] 5.1 Create `apps/frontend/src/api/useCheatCodes.ts` with `useCheatCodes`, `useCreateCheatCode`, `useUpdateCheatCode`, `useDeleteCheatCode` (see Dev Notes)

- [x] Task 6: Frontend — CheatCodeForm component and Settings page
    - [x] 6.1 Create `apps/frontend/src/components/settings/CheatCodeForm.tsx` (see Dev Notes)
    - [x] 6.2 Create `apps/frontend/src/pages/SettingsPage.tsx` that renders `<CheatCodeForm />`
    - [x] 6.3 Add a "Settings" link to `apps/frontend/src/pages/DashboardPage.tsx` so `/settings` is reachable without direct URL entry
    - [x] 6.4 Update `apps/frontend/src/App.tsx`: import `SettingsPage` and render it on the `/settings` route (replacing the placeholder `<div>`)
    - [x] 6.5 List existing Cheat Codes with inline edit (text input + save button per item)
    - [x] 6.6 "Add Cheat Code" input + button — disabled when 3 codes exist, showing "Maximum 3 Cheat Codes"
    - [x] 6.7 Delete button per code with immediate removal on success
    - [x] 6.8 Field-level validation: empty string shows error, no request sent
    - [x] 6.9 Handle `isError` from `useCheatCodes()` — show an error message, not a silent empty list
    - [x] 6.10 All inputs minimum 16px font size (prevents iOS Safari auto-zoom)
    - [x] 6.11 All interactive targets minimum 44×44px (NFR-A4)

---

## Dev Notes

### What Already Exists — Do NOT Recreate

- **`requireAuth`** — `apps/backend/src/middleware/auth.ts`
- **`errorHandler`** — already mounted last in `apps/backend/src/index.ts`. Do NOT add another one.
- **`prisma`** — exported from `apps/backend/src/index.ts`. Import as: `import { prisma } from '../index.js'`
- **`validateBody` middleware** — `apps/backend/src/middleware/validate.ts`
- **`useAuth`, `useUserConfig`** — exist in `apps/frontend/src/api/`. Do not modify.
- **`AuthGuard`** — wraps the `/settings` route in App.tsx already. Do not re-add it.
- **`QueryClientProvider`** — already wrapping the app in `apps/frontend/src/main.tsx`
- **`react-router-dom`, `@tanstack/react-query`, `zod`** — already installed
- **shadcn/ui components** — `Button` at `@/components/ui/button`, `Input` at `@/components/ui/input`, `Card` at `@/components/ui/card`
- **Test pattern** — `apps/backend/tests/api/users-config.test.ts` is the established test structure to follow

---

### Prisma Schema Changes

Add the `CheatCode` model to `apps/backend/prisma/schema.prisma`:

```prisma
model CheatCode {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  text      String
  sortOrder Int      @map("sort_order")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("cheat_codes")
}
```

Add relation field to the existing `User` model (alongside `userConfig UserConfig?`):

```prisma
cheatCodes CheatCode[]
```

Note: `text` uses plain `String` (maps to `TEXT` in PostgreSQL) — consistent with the rest of the schema. Max length is enforced by Zod (`.max(200)`), not at the DB level.

**Migration command (run from `apps/backend/`):**

```bash
npx prisma migrate dev --name add_cheat_code
```

---

### Backend: Zod Schemas

Create `apps/backend/src/schemas/cheatCodeSchemas.ts`:

```typescript
import { z } from 'zod';

export const createCheatCodeSchema = z.object({
    text: z.string().min(1, 'Cheat Code cannot be blank').max(200),
    // sortOrder is NOT accepted from the client — server assigns it
});

export const updateCheatCodeSchema = z.object({
    text: z.string().min(1, 'Cheat Code cannot be blank').max(200),
});

export type CreateCheatCodeInput = z.infer<typeof createCheatCodeSchema>;
export type UpdateCheatCodeInput = z.infer<typeof updateCheatCodeSchema>;
```

---

### Backend: `cheatCodes.ts` Route

Create `apps/backend/src/routes/cheatCodes.ts`:

```typescript
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createCheatCodeSchema, updateCheatCodeSchema } from '../schemas/cheatCodeSchemas.js';
import { prisma } from '../index.js';

const router = Router();

// GET /api/cheat-codes
router.get('/', requireAuth, async (req, res, next) => {
    try {
        const codes = await prisma.cheatCode.findMany({
            where: { userId: req.session.userId },
            orderBy: { sortOrder: 'asc' },
        });
        return res.json(codes);
    } catch (err) {
        next(err);
    }
});

// POST /api/cheat-codes
router.post('/', requireAuth, validateBody(createCheatCodeSchema), async (req, res, next) => {
    try {
        const userId = req.session.userId!;
        const count = await prisma.cheatCode.count({ where: { userId } });
        if (count >= 3) {
            return res.status(400).json({
                error: 'MAX_CHEAT_CODES',
                message: 'Maximum 3 Cheat Codes allowed',
            });
        }
        // Use MAX(sortOrder) + 1 — NOT count — to avoid duplicates after deletes
        const maxResult = await prisma.cheatCode.aggregate({
            where: { userId },
            _max: { sortOrder: true },
        });
        const nextSortOrder = (maxResult._max.sortOrder ?? -1) + 1;

        const code = await prisma.cheatCode.create({
            data: {
                userId,
                text: req.body.text,
                sortOrder: nextSortOrder,
            },
        });
        return res.status(201).json(code);
    } catch (err) {
        next(err);
    }
});

// PATCH /api/cheat-codes/:id
router.patch('/:id', requireAuth, validateBody(updateCheatCodeSchema), async (req, res, next) => {
    try {
        const existing = await prisma.cheatCode.findUnique({
            where: { id: req.params.id },
        });
        if (!existing || existing.userId !== req.session.userId) {
            return res.status(404).json({ error: 'NOT_FOUND', message: 'Cheat Code not found' });
        }
        const updated = await prisma.cheatCode.update({
            where: { id: req.params.id },
            data: { text: req.body.text },
        });
        return res.json(updated);
    } catch (err) {
        next(err);
    }
});

// DELETE /api/cheat-codes/:id
router.delete('/:id', requireAuth, async (req, res, next) => {
    try {
        const existing = await prisma.cheatCode.findUnique({
            where: { id: req.params.id },
        });
        if (!existing || existing.userId !== req.session.userId) {
            return res.status(404).json({ error: 'NOT_FOUND', message: 'Cheat Code not found' });
        }
        await prisma.cheatCode.delete({ where: { id: req.params.id } });
        return res.status(204).send();
    } catch (err) {
        next(err);
    }
});

export default router;
```

**Mount in `apps/backend/src/index.ts`** — add alongside the existing `usersRouter` mount:

```typescript
import cheatCodesRouter from './routes/cheatCodes.js';
// ...
app.use('/api/cheat-codes', cheatCodesRouter);
```

---

### Frontend: TanStack Query Hook

Create `apps/frontend/src/api/useCheatCodes.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL;

export interface CheatCode {
    id: string;
    userId: string;
    text: string;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}

export function useCheatCodes() {
    return useQuery<CheatCode[]>({
        queryKey: ['cheatCodes'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/cheat-codes`, {
                credentials: 'include',
            });
            if (!res.ok) throw await res.json();
            return res.json();
        },
    });
}

export function useCreateCheatCode() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (text: string) => {
            const res = await fetch(`${API_URL}/api/cheat-codes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ text }),
            });
            if (!res.ok) throw await res.json();
            return res.json() as Promise<CheatCode>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cheatCodes'] });
        },
    });
}

export function useUpdateCheatCode() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, text }: { id: string; text: string }) => {
            const res = await fetch(`${API_URL}/api/cheat-codes/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ text }),
            });
            if (!res.ok) throw await res.json();
            return res.json() as Promise<CheatCode>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cheatCodes'] });
        },
    });
}

export function useDeleteCheatCode() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`${API_URL}/api/cheat-codes/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (!res.ok) throw await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cheatCodes'] });
        },
    });
}
```

---

### Frontend: `CheatCodeForm.tsx` Component

Create `apps/frontend/src/components/settings/CheatCodeForm.tsx`:

The component manages:

1. **Existing codes**: Each row has an editable text input + "Save" + "Delete" button
2. **New code input**: Text input + "Add" button — disabled + message when count = 3
3. **Validation**: Empty string blocks both add and save; shows inline error per field
4. **Error state**: `isError` from `useCheatCodes()` shows an error message — never a silent empty list
5. **State**: Local state for the new-code input and per-code edit text. TanStack Query owns server state — do NOT use Zustand.
6. **`updateCode.isPending`** disables ALL Save buttons while any update is in flight — this is intentional for MVP simplicity, not a bug to fix.

```tsx
import { useState } from 'react';
import {
    useCheatCodes,
    useCreateCheatCode,
    useUpdateCheatCode,
    useDeleteCheatCode,
} from '@/api/useCheatCodes';

const MAX_CODES = 3;
const MAX_LENGTH = 200;

export function CheatCodeForm() {
    const { data: codes = [], isPending, isError } = useCheatCodes();
    const createCode = useCreateCheatCode();
    const updateCode = useUpdateCheatCode();
    const deleteCode = useDeleteCheatCode();

    const [newText, setNewText] = useState('');
    const [newError, setNewError] = useState('');
    const [editTexts, setEditTexts] = useState<Record<string, string>>({});
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});

    const atMax = codes.length >= MAX_CODES;

    function handleAdd() {
        if (!newText.trim()) {
            setNewError('Cheat Code cannot be blank');
            return;
        }
        setNewError('');
        createCode.mutate(newText.trim(), {
            onSuccess: () => setNewText(''),
        });
    }

    function handleSave(id: string) {
        const text = editTexts[id] ?? codes.find((c) => c.id === id)?.text ?? '';
        if (!text.trim()) {
            setEditErrors((prev) => ({ ...prev, [id]: 'Cheat Code cannot be blank' }));
            return;
        }
        setEditErrors((prev) => ({ ...prev, [id]: '' }));
        updateCode.mutate({ id, text: text.trim() });
    }

    function handleDelete(id: string) {
        deleteCode.mutate(id);
    }

    if (isPending) return <div>Loading...</div>;

    if (isError)
        return <div role="alert">Could not load Cheat Codes. Please refresh the page.</div>;

    return (
        <section aria-label="Cheat Codes">
            <h2>Cheat Codes</h2>
            <p>Short coaching reminders — up to 3, always visible on your dashboard.</p>

            <ul>
                {codes.map((code) => {
                    const editText = editTexts[code.id] ?? code.text;
                    const editError = editErrors[code.id] ?? '';
                    return (
                        <li key={code.id}>
                            <input
                                type="text"
                                value={editText}
                                maxLength={MAX_LENGTH}
                                style={{ fontSize: '16px' }}
                                aria-label={`Edit Cheat Code: ${code.text}`}
                                onChange={(e) =>
                                    setEditTexts((prev) => ({ ...prev, [code.id]: e.target.value }))
                                }
                            />
                            {editError && <span role="alert">{editError}</span>}
                            <button
                                type="button"
                                onClick={() => handleSave(code.id)}
                                disabled={updateCode.isPending}
                                style={{ minHeight: '44px', minWidth: '44px' }}
                            >
                                Save
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDelete(code.id)}
                                disabled={deleteCode.isPending}
                                style={{ minHeight: '44px', minWidth: '44px' }}
                                aria-label={`Delete Cheat Code: ${code.text}`}
                            >
                                Delete
                            </button>
                        </li>
                    );
                })}
            </ul>

            {atMax ? (
                <p role="status">Maximum 3 Cheat Codes</p>
            ) : (
                <div>
                    <input
                        type="text"
                        value={newText}
                        maxLength={MAX_LENGTH}
                        placeholder="Enter a Cheat Code..."
                        style={{ fontSize: '16px' }}
                        aria-label="New Cheat Code"
                        onChange={(e) => setNewText(e.target.value)}
                    />
                    {newError && <span role="alert">{newError}</span>}
                    <button
                        type="button"
                        onClick={handleAdd}
                        disabled={createCode.isPending}
                        style={{ minHeight: '44px', minWidth: '44px' }}
                    >
                        Add
                    </button>
                </div>
            )}
        </section>
    );
}
```

> **Styling note:** Replace inline `style` props with Tailwind classes and shadcn/ui `Input`/`Button`/`Card` primitives using the Vault-Tec theme. The logic and structure above must be preserved exactly.

---

### Frontend: `SettingsPage.tsx`

Create `apps/frontend/src/pages/SettingsPage.tsx`:

```tsx
import { CheatCodeForm } from '@/components/settings/CheatCodeForm';

export default function SettingsPage() {
    return (
        <main>
            <h1>Settings</h1>
            <CheatCodeForm />
            {/* Story 2.7 adds TargetForm here */}
        </main>
    );
}
```

---

### Frontend: Update `App.tsx`

In `apps/frontend/src/App.tsx`, replace the placeholder `/settings` route. Follow the existing relative import style used by the file — do not mix `@/` aliases into App.tsx if the rest of the file uses relative imports:

```tsx
// Add import at top of file — use relative path to match existing App.tsx style
import SettingsPage from './pages/SettingsPage';

// Replace the /settings route:
<Route
    path="/settings"
    element={
        <AuthGuard>
            <SettingsPage />
        </AuthGuard>
    }
/>;
```

---

### Frontend: Add Settings Link to `DashboardPage.tsx`

The current DashboardPage is a placeholder. Add a link to `/settings` so the Settings page is reachable without direct URL entry:

```tsx
import { Link } from 'react-router-dom';

// Inside the DashboardPage return:
<Link to="/settings">Settings</Link>;
```

---

### Import Extension Rule (CRITICAL — Backend)

ALL local imports in `apps/backend/src/` MUST use `.js` extension:

```typescript
// ✅ Correct
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../index.js';
import { createCheatCodeSchema } from '../schemas/cheatCodeSchemas.js';

// ❌ Wrong — will fail at runtime
import { requireAuth } from '../middleware/auth';
```

### `@/` Alias (Frontend)

ALL internal imports within `apps/frontend/src/` components, hooks, and lib files MUST use `@/`:

```typescript
// ✅ Correct
import { useCheatCodes } from '@/api/useCheatCodes';
import { CheatCodeForm } from '@/components/settings/CheatCodeForm';

// ❌ Wrong
import { useCheatCodes } from '../api/useCheatCodes';
```

---

### Project Structure Notes

```
apps/backend/
├── prisma/
│   └── schema.prisma              ← MODIFY: add CheatCode model + User relation
└── src/
    ├── routes/
    │   ├── auth.ts               ← EXISTS (no changes)
    │   ├── users.ts              ← EXISTS (no changes)
    │   └── cheatCodes.ts         ← CREATE NEW
    ├── schemas/
    │   ├── auth.ts               ← EXISTS (no changes)
    │   ├── userConfigSchemas.ts  ← EXISTS (no changes)
    │   └── cheatCodeSchemas.ts   ← CREATE NEW
    ├── index.ts                  ← MODIFY: mount cheatCodesRouter
    └── tests/api/
        ├── auth.test.ts          ← EXISTS (no changes)
        ├── users-config.test.ts  ← EXISTS (no changes)
        └── cheat-codes.test.ts   ← CREATE NEW

apps/frontend/
└── src/
    ├── api/
    │   ├── useAuth.ts            ← EXISTS (no changes)
    │   ├── useUserConfig.ts      ← EXISTS (no changes)
    │   └── useCheatCodes.ts      ← CREATE NEW
    ├── components/
    │   └── settings/
    │       └── CheatCodeForm.tsx ← CREATE NEW
    ├── pages/
    │   ├── DashboardPage.tsx     ← MODIFY: add Settings link
    │   ├── OnboardingPage.tsx    ← EXISTS (no changes)
    │   └── SettingsPage.tsx      ← CREATE NEW
    └── App.tsx                   ← MODIFY: import + render SettingsPage
```

---

### Architecture Compliance

- ✅ Route handlers call `next(err)` — never `res.status(500).json(...)` directly
- ✅ Ownership verification on PATCH and DELETE — never trust `:id` alone
- ✅ Max 3 enforcement server-side — client UI disables button but server is authoritative
- ✅ `sortOrder` assigned server-side via `MAX(sortOrder) + 1` — client never sends it
- ✅ `requireAuth` on all `/api/cheat-codes/*` routes
- ✅ `validateBody` middleware for POST and PATCH before business logic
- ✅ TanStack Query for server state — no Zustand for Cheat Code data
- ✅ `@/` alias in all frontend component/hook imports
- ✅ `credentials: 'include'` on every frontend fetch
- ✅ API success: direct object or array, no envelope wrapper
- ✅ API error: `{ error: "CODE", message: "..." }`
- ✅ HTTP 201 for POST, 200 for PATCH, 204 for DELETE

### ADHD UX Invariants (Must Not Violate)

- ✅ No red states — validation errors use neutral styling, never red
- ✅ "Maximum 3 Cheat Codes" is informational, not shaming
- ✅ Immediate feedback on save/delete — no page reload required
- ✅ All touch targets minimum 44×44px (NFR-A4)
- ✅ Input font size minimum 16px (prevents iOS Safari auto-zoom)

### Key Learnings from Story 2.1

- **Express v5 is installed** — async errors in route handlers propagate to `next(err)` automatically
- **`credentials: 'include'`** on every frontend `fetch` — required for cross-origin session cookies
- **react-query error handling** — use `isError` from `useQuery` for fetch failures; mutations surface errors via `mutation.error`
- **Session type** — `req.session.userId` is typed via `apps/backend/src/types/session.d.ts`
- **`@prisma/adapter-pg`** — Prisma uses the pg adapter; `prisma.$connect()` is not needed
- **`prisma` is exported from index.ts** — never instantiate a second `PrismaClient`
- **shadcn/ui components exist** — `Button`, `Input`, `Card` in `apps/frontend/src/components/ui/`. Use them, don't recreate.
- **Backend test pattern** — `apps/backend/tests/api/users-config.test.ts` is the established structure; follow it for `cheat-codes.test.ts`

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — implementation followed Dev Notes spec without significant deviations.

### Completion Notes List

- POST route uses `$transaction` to prevent race condition on count check + create (improvement over spec)
- `CheatCodeForm` adds per-item delete optimistic tracking via `deletingIds` Set (improvement over spec)
- `CheatCodeForm` adds `onError` callbacks to surface network failures inline (improvement over spec)
- Zod schema uses `.trim()` before `.min(1)` — whitespace-only codes blocked at API boundary
- PATCH/DELETE rewritten post-review to use `updateMany`/`deleteMany` with `where: { id, userId }` — eliminates TOCTOU race condition
- `req.params.id as string` assertion added to resolve `@types/express@5` widening issue

### File List

- apps/backend/prisma/schema.prisma
- apps/backend/src/index.ts
- apps/backend/src/routes/cheatCodes.ts
- apps/backend/src/schemas/cheatCodeSchemas.ts
- apps/backend/tests/api/cheat-codes.test.ts
- apps/frontend/src/App.tsx
- apps/frontend/src/api/useCheatCodes.ts
- apps/frontend/src/components/settings/CheatCodeForm.tsx
- apps/frontend/src/pages/DashboardPage.tsx
- apps/frontend/src/pages/SettingsPage.tsx
