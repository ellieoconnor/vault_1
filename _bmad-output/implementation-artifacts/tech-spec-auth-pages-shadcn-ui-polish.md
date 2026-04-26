---
title: 'Auth Pages shadcn UI Polish'
slug: 'auth-pages-shadcn-ui-polish'
created: '2026-04-26'
status: 'completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['React 18 + TypeScript', 'Tailwind v4', 'shadcn/ui (radix-nova)', 'TanStack Query', 'React Router v6']
files_to_modify:
  - 'apps/frontend/src/pages/LoginPage.tsx'
  - 'apps/frontend/src/pages/RegisterPage.tsx'
  - 'apps/frontend/src/pages/ForgotPasswordPage.tsx'
  - 'apps/frontend/src/pages/ResetPasswordPage.tsx'
  - 'apps/frontend/src/components/ui/card.tsx (new — via shadcn CLI)'
  - 'apps/frontend/src/components/ui/input.tsx (new — via shadcn CLI)'
code_patterns: ['shadcn component pattern (cn + cva + data-slot)', '@/ path alias', 'TanStack useMutation for form state']
test_patterns: ['Playwright E2E in tests/e2e/', 'getByPlaceholder / getByRole / getByLabel selectors']
---

# Tech-Spec: Auth Pages shadcn UI Polish

**Created:** 2026-04-26

## Overview

### Problem Statement

All 4 auth pages (Login, Register, ForgotPassword, ResetPassword) are unstyled bare forms with no layout. They render pushed into the top-left corner of the screen with raw `<input>` and `<button>` elements — janky and unprofessional looking.

### Solution

Install shadcn `card` and `input` components. Wrap each auth page in a centered full-height layout using a `Card`. Replace all raw `<input>` elements with shadcn `<Input>` and all raw `<button>` elements with shadcn `<Button>`. Apply consistently across all 4 auth pages including their success/error/loading states.

### Scope

**In Scope:**
- Install `card` and `input` components via `npx shadcn@latest add card input`
- `LoginPage.tsx` — centered card layout, Input + Button components
- `RegisterPage.tsx` — centered card layout, Input + Button components
- `ForgotPasswordPage.tsx` — centered card layout, Input + Button components (including submitted success state)
- `ResetPasswordPage.tsx` — centered card layout, Input + Button components (including loading/error/success states)

**Out of Scope:**
- `OnboardingPage.tsx` and `DashboardPage.tsx`
- Custom theming or color overrides beyond shadcn defaults
- Any backend changes
- Advanced animations or transitions

## Context for Development

### Codebase Patterns

- Tailwind v4 + shadcn/ui (`radix-nova` style, `neutral` base color, CSS variables) is installed. Only `button.tsx` exists in `ui/` so far — `card` and `input` must be added via CLI.
- shadcn components use `cn()` from `@/lib/utils` (clsx + tailwind-merge), `cva` for variants, and `data-slot` attributes.
- `@/` path alias resolves to `apps/frontend/src/`.
- All 4 pages use local React state + `useMutation` / `useQuery` from TanStack Query — **logic must not be touched**.
- Pages currently return a bare `<form>` or `<div>` directly with no layout wrapper.
- **E2E tests** (`tests/e2e/auth.spec.ts`) use Playwright with `getByPlaceholder`, `getByRole`, and `getByLabel` selectors — must not break these.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `apps/frontend/src/pages/LoginPage.tsx` | Auth page to update |
| `apps/frontend/src/pages/RegisterPage.tsx` | Auth page to update — also has broken placeholder + role="alert" issues |
| `apps/frontend/src/pages/ForgotPasswordPage.tsx` | Auth page to update (has post-submit success state) |
| `apps/frontend/src/pages/ResetPasswordPage.tsx` | Auth page to update (has loading / invalid-token / success states) |
| `apps/frontend/src/components/ui/button.tsx` | Reference for shadcn component conventions |
| `apps/frontend/src/lib/utils.ts` | `cn()` utility used by all shadcn components |
| `tests/e2e/auth.spec.ts` | E2E tests — selectors must be preserved |

### Technical Decisions

- **Canonical layout structure** — `<form>` wraps the Card (not inside it), so the submit button in `CardFooter` is always part of the form:
  ```tsx
  <div className="min-h-screen flex items-center justify-center p-4">
    <form onSubmit={...}>
      <Card className="w-full max-w-sm">
        <CardHeader><CardTitle>…</CardTitle></CardHeader>
        <CardContent>…inputs…</CardContent>
        <CardFooter><Button type="submit" className="w-full">…</Button></CardFooter>
      </Card>
    </form>
  </div>
  ```
- **Card structure:** `CardHeader` + `CardTitle` for the heading; `CardContent` for form fields; `CardFooter` for the primary submit `<Button>` and secondary navigation links
- **Input fields:** Replace raw `<input>` with shadcn `<Input>`. For RegisterPage (which uses `<label>` wrapping `<input>`), convert to `<div className="space-y-1"><label className="text-sm font-medium">…</label><Input …/></div>` pattern
- **Error messages:** Wrap in `<p className="text-destructive text-sm mt-1">` (or `<span>`) — `mt-1` ensures visual separation from the input above. Keep `role="alert"` where it exists.
- **Buttons:** Replace raw `<button>` with shadcn `<Button className="w-full">`. **Button text must be preserved verbatim** — e.g. `"Log In"`, `"Register"`, `"Send reset link"`, `"Set new password"` — E2E tests select by button name.
- **Placeholder text:** **Preserve all existing placeholder text verbatim** on `<Input>` components — E2E tests use `getByPlaceholder(...)` selectors.
- **Secondary links in CardFooter:** Wrap navigation links (`<Link>`) in `<p className="text-sm text-center w-full">` so they sit centred and don't stretch.
- **RegisterPage fixes (piggyback):** Add `placeholder` attributes (`"Username"`, `"Email"`, `"Password"`) — currently missing, breaking E2E test selectors. Add `role="alert"` to the username-taken error `<span>` — currently missing, breaking E2E test assertion.
- **Non-form states** (loading / invalid-token error / success states in ForgotPassword + ResetPassword): wrap in the same `min-h-screen` centering div + `<Card><CardContent>…</CardContent></Card>` so they look consistent, not like unstyled text floating in a styled shell.

## Implementation Plan

### Tasks

- [x] Task 1: Install shadcn `card` and `input` components
  - File: `apps/frontend/` (monorepo — must run from this subdirectory, not repo root)
  - Action: `cd apps/frontend && npx shadcn@latest add card input`
  - Notes: This creates `apps/frontend/src/components/ui/card.tsx` and `apps/frontend/src/components/ui/input.tsx`. Must be done before any page changes. Accept all prompts/defaults.

- [x] Task 2: Update `LoginPage.tsx`
  - File: `apps/frontend/src/pages/LoginPage.tsx`
  - Action:
    1. Add imports: `Card, CardHeader, CardTitle, CardContent, CardFooter` from `@/components/ui/card`; `Input` from `@/components/ui/input`; `Button` from `@/components/ui/button`
    2. Wrap the return in `<div className="min-h-screen flex items-center justify-center p-4">`
    3. Wrap `<form onSubmit={handleSubmit}>` around `<Card className="w-full max-w-sm">`
    4. Move `<h1>Log In</h1>` into `<CardHeader><CardTitle>Log In</CardTitle></CardHeader>`
    5. Move the two inputs into `<CardContent>` with `<div className="space-y-4">` wrapping each field group
    6. Replace both raw `<input>` elements with `<Input>` — preserve all existing props (`type`, `placeholder`, `value`, `onChange`, `autoComplete`) verbatim
    7. Move the error paragraph into `<CardContent>` above the fields; add `className="text-destructive text-sm"` (keep `role="alert"`)
    8. Move `<button type="submit">` into `<CardFooter className="flex-col gap-2">`; replace with `<Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>`; preserve button text verbatim (`"Log In"` / `"Logging in..."`)
    9. Move the two `<Link>` paragraphs into `CardFooter` after the Button; wrap each in `<p className="text-sm text-center w-full">`

- [x] Task 3: Update `RegisterPage.tsx`
  - File: `apps/frontend/src/pages/RegisterPage.tsx`
  - Action:
    1. Add imports: `Card, CardHeader, CardTitle, CardContent, CardFooter`; `Input`; `Button`
    2. Wrap return in `<div className="min-h-screen flex items-center justify-center p-4">`
    3. Wrap `<form onSubmit={handleSubmit}>` around `<Card className="w-full max-w-sm">`
    4. Add `<CardHeader><CardTitle>Create account</CardTitle></CardHeader>`
    5. Move all fields into `<CardContent><div className="space-y-4">…</div></CardContent>`. Note: `space-y-4` applies between field group `<div>` wrappers — spacing within each group (label → input → error) is handled by `space-y-1` on the wrapper and `mt-1` on the error. Trust the defaults; no extra padding needed.
    6. For each field, convert `<label>Label<input/></label>` to:
       ```tsx
       <div className="space-y-1">
         <label htmlFor="fieldId" className="text-sm font-medium">Label text</label>
         <Input id="fieldId" type="…" value={…} onChange={…} placeholder="…" autoComplete="…" />
       </div>
       ```
       Use IDs: `id="username"`, `id="email"`, `id="password"` with matching `htmlFor` on each label. This is required so clicking a label focuses its input and screen readers can associate them — the old implicit-nesting approach no longer works once label and input are siblings.
    7. **Add missing `placeholder` attributes:** username → `placeholder="Username"`, email → `placeholder="Email"`, password → `placeholder="Password"` (required by E2E tests)
    8. **Add missing `autoComplete` attributes:** username → `autoComplete="username"`, email → `autoComplete="email"`, password → `autoComplete="new-password"` (currently absent on all 3 inputs — improves mobile autofill)
    9. Keep the inline `<span style={{ fontWeight: "normal", fontSize: "0.875rem" }}>` inside the email label text (or convert to Tailwind: `<span className="font-normal text-sm text-muted-foreground">`)
    10. For each field error `<span>`: add `className="text-destructive text-sm mt-1 block"`
    11. **Add `role="alert"` to the username-taken error `<span>`** (the one that renders `fieldErrors.username?.[0]`) — currently missing, breaking E2E test
    12. For `generalError`: add `role="alert"` (already has `<span>`) and `className="text-destructive text-sm"`
    14. Move `<button>Register</button>` into `<CardFooter>`; replace with `<Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>Register</Button>` — preserve text verbatim

- [x] Task 4: Update `ForgotPasswordPage.tsx`
  - File: `apps/frontend/src/pages/ForgotPasswordPage.tsx`
  - Action:
    1. Add imports: `Card, CardHeader, CardTitle, CardContent, CardFooter`; `Input`; `Button`
    2. **Success state** (the `if (submitted)` return): wrap in `<div className="min-h-screen flex items-center justify-center p-4"><Card className="w-full max-w-sm"><CardHeader><CardTitle>Check your email</CardTitle></CardHeader><CardContent>…</CardContent><CardFooter>…</CardFooter></Card></div>`. Move the `<h1>` text into `CardTitle`, move the description `<p>` into `CardContent`, move the `<Link to="/login">Back to login</Link>` into `CardFooter` wrapped in `<p className="text-sm text-center w-full">` — consistent with how all other nav links are treated.
    3. **Form state**: wrap in the canonical layout structure. Move `<h1>` into `CardHeader/CardTitle`, description `<p>` and error `<p>` into `CardContent`, input into `CardContent`, button + back link into `CardFooter`
    4. Replace raw `<input>` with `<Input>` — preserve `type`, `placeholder`, `value`, `onChange`, `autoComplete`
    5. Replace `<button>` with `<Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>` — preserve text verbatim (`"Send reset link"` / `"Sending..."`)
    6. Error `<p role="alert">`: add `className="text-destructive text-sm"`
    7. Back-to-login link: wrap in `<p className="text-sm text-center w-full">` inside `CardFooter`

- [x] Task 5: Update `ResetPasswordPage.tsx`
  - File: `apps/frontend/src/pages/ResetPasswordPage.tsx`
  - Action:
    1. Add imports: `Card, CardHeader, CardTitle, CardContent, CardFooter`; `Input`; `Button`
    2. Define a shared centering wrapper to reuse across all return branches: `<div className="min-h-screen flex items-center justify-center p-4">`
    3. **Note on state order — follow the existing source order exactly, do not reorder:** `if (!token)` → `if (isLoading)` → `if (isError)` → form. Changing this order would change runtime behaviour (the null-token guard must fire before the query hooks render).
    4. **Note:** There are exactly 3 visual states to update — loading, error (invalid/expired token), and the form. There is **no success JSX** — `onSuccess` calls `navigate("/")` immediately, so nothing to wrap.
    5. **`!token` state** (`if (!token)`): wrap `<p>Invalid reset link.</p>` in centering div + `<Card className="w-full max-w-sm"><CardContent><p>Invalid reset link.</p></CardContent></Card>`
    6. **Loading state** (`if (isLoading)`): wrap `<div>Validating reset link...</div>` in centering div + `<Card className="w-full max-w-sm"><CardContent><p>Validating reset link...</p></CardContent></Card>`
    7. **Invalid token / error state** (`if (isError)`): wrap in centering div + Card. Move `<h1>Link unavailable</h1>` into `CardHeader/CardTitle`, move error `<p role="alert">` and `<Link>` into `CardContent`
    8. **Form state**: apply canonical layout. Move `<h1>Set a new password</h1>` into `CardHeader/CardTitle`, inputs and error into `CardContent`, button into `CardFooter`
    9. Replace both raw `<input>` elements with `<Input>` — preserve all props verbatim. Existing placeholders are `placeholder="New password"` and `placeholder="Confirm password"` — these must be preserved exactly on the `<Input>` replacements.
    10. Replace `<button>` with `<Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>` — preserve text verbatim (`"Set new password"` / `"Saving..."`)
    10. Error `<p role="alert">`: add `className="text-destructive text-sm mt-1"`

### Acceptance Criteria

- [x] AC 1: Given any of the 4 auth pages is visited, when the page renders, then the content is centered both vertically and horizontally in the viewport — not pushed to the top-left corner.

- [x] AC 2: Given any of the 4 auth pages is visited, when the page renders, then the form appears inside a Card component with a visible heading in the CardHeader.

- [x] AC 3: Given LoginPage renders, when the user inspects the inputs, then they use shadcn `Input` styling (not raw browser-default inputs).

- [x] AC 4: Given RegisterPage renders, when the user inspects the inputs, then the username input has `placeholder="Username"`, the email input has `placeholder="Email"`, and the password input has `placeholder="Password"`.

- [x] AC 5: Given RegisterPage shows a "username already taken" error, when the error renders, then the element has `role="alert"` and is styled with destructive colour.

- [x] AC 6: Given ForgotPasswordPage is submitted successfully, when the success state renders, then the "Check your email" message appears inside a Card (not as unstyled text on a blank page).

- [x] AC 7: Given ResetPasswordPage receives an invalid or expired token, when the error state renders, then the message appears inside a Card.

- [x] AC 8: Given any auth page form has a validation or server error, when the error renders, then it is styled in destructive colour with visible separation from the input above it.

- [x] AC 9: Given the existing Playwright E2E suite runs after these changes, when `npx playwright test tests/e2e/auth.spec.ts` executes, then all Login tests pass and all Register tests pass — **except** the pre-existing failure: the `creates account and redirects` test asserts `toHaveURL('/')` but `RegisterPage` navigates to `"/onboarding"` on success. This failure pre-dates this spec and is not introduced or fixed by it.

- [x] AC 10: Given any auth page submit button is inspected, when the page renders, then the button text matches exactly what it was before (e.g. `"Log In"`, `"Register"`, `"Send reset link"`, `"Set new password"`) — no renames.

## Review Notes

- Adversarial review completed
- Findings: 12 total, 9 fixed, 3 skipped (F4 pre-existing E2E bug out-of-scope, F11 low timing edge case, F12 low aria-live out-of-scope)
- Resolution approach: auto-fix
- Post-fix fixes applied: generalError mb-4 + block, email error role="alert", handleSubmit hoisted above early return, !token state nav link, isError link moved to CardFooter, formError mt-1→mb-4, confirmPassword autoComplete="off", labels added to LoginPage + ForgotPasswordPage inputs

## Additional Context

### Dependencies

- shadcn/ui is already installed and configured (`components.json` present, `radix-nova` style, Tailwind v4)
- `button.tsx` already exists in `apps/frontend/src/components/ui/` — confirms shadcn is working
- `apps/frontend/src/lib/utils.ts` exports `cn()` — used by all shadcn components
- Task 1 (CLI install of card + input) must complete before Tasks 2–5

### Testing Strategy

- **No new tests required** — the existing Playwright E2E suite in `tests/e2e/auth.spec.ts` validates all functional auth behaviour
- **Run after implementation:** `npx playwright test tests/e2e/auth.spec.ts` from the repo root — **both the Vite dev server and Express backend must be running** before executing (see test file header comment)
- **Manual verification steps:**
  1. Start the dev server and visit `/login`, `/register`, `/forgot-password`, `/reset-password/fake-token`
  2. Confirm each page is visually centered in the viewport
  3. Confirm inputs have shadcn styling (border, rounded, focus ring)
  4. Confirm submit buttons fill the card width
  5. On LoginPage, submit with wrong credentials — confirm red error text appears
  6. On RegisterPage, submit empty form — confirm field errors appear below each input in red
  7. On ForgotPasswordPage, submit a username — confirm the success state also appears in a Card

### Notes

- The `radix-nova` shadcn style generates slightly different component markup than the default shadcn docs show — trust what the CLI generates, don't copy-paste from docs
- `<form>` wraps the `<Card>` (not the other way around) — this is non-obvious but required so the `<Button type="submit">` in `CardFooter` is inside the form and triggers `onSubmit`
- `OnboardingPage` and `DashboardPage` are intentionally out of scope — they use the same bare pattern but are complex enough to warrant their own polish pass
- Future consideration: once Dashboard and Onboarding are polished, extract the centering wrapper (`min-h-screen flex items-center justify-center p-4`) into a shared `AuthLayout` component to DRY up the pattern
