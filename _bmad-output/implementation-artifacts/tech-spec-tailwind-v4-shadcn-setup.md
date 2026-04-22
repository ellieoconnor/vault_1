---
title: 'Tailwind v4 + shadcn/ui Foundation Setup'
slug: 'tailwind-v4-shadcn-setup'
created: '2026-04-21'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['tailwindcss v4', '@tailwindcss/vite', 'shadcn/ui', 'vite 7', 'react 19', 'typescript 5.9', 'node 22']
files_to_modify:
  - 'apps/frontend/package.json'
  - 'apps/frontend/vite.config.ts'
  - 'apps/frontend/tsconfig.app.json'
  - 'apps/frontend/src/index.css'
files_to_create:
  - 'apps/frontend/src/lib/utils.ts'
  - 'apps/frontend/components.json'
files_to_delete:
  - 'apps/frontend/src/App.css'
code_patterns:
  - 'CSS-first Tailwind v4 via @import "tailwindcss" in index.css'
  - '@theme block in index.css for Vault-Tec token definitions'
  - '@/ alias resolves to src/ — used in all internal imports from Epic 2 onward'
  - 'shadcn components land in src/components/ui/ (owned/copied code)'
test_patterns: ['no tests for this story — manual build + dev server verification only']
---

# Tech-Spec: Tailwind v4 + shadcn/ui Foundation Setup

**Created:** 2026-04-21

## Overview

### Problem Statement

`apps/frontend` has no CSS framework installed. Epic 2 builds styled UI components (progress bars, forms, buttons, modals) and requires Tailwind utility classes, the `@/` path alias, and shadcn/ui accessible primitives. Without this setup, no Epic 2 component work can begin.

### Solution

Install Tailwind CSS v4 using the CSS-first approach via `@tailwindcss/vite`, configure the `@/` path alias in Vite and TypeScript, replace `index.css` with Vault-Tec theme CSS custom properties, and run `shadcn init` to scaffold the base without installing any components.

### Scope

**In Scope:**
- Install `tailwindcss` and `@tailwindcss/vite`
- Update `vite.config.ts`: add Tailwind plugin + `@/` → `src/` path alias
- Update `tsconfig.app.json`: add `paths` mapping for `@/`
- Replace `apps/frontend/src/index.css` with Tailwind v4 import + Vault-Tec CSS custom property tokens (amber, green, blue, orange — zone model colors)
- Run `npx shadcn@latest init` to scaffold shadcn base (CSS vars, `components.json`, `lib/utils.ts`)
- Verify dev server runs and `npm run build` succeeds with no errors

**Out of Scope:**
- Installing any specific shadcn components (done per story in Epic 2)
- PWA configuration (Epic 5)
- Zone calculator implementation (Story 2.3)
- Dark mode configuration (see Notes)

## Context for Development

### Codebase Patterns

- **Single CSS entry point**: `main.tsx` imports only `./index.css`. `App.css` exists but is NOT imported anywhere (orphaned Vite template file — safe to delete).
- **No path aliases currently**: all imports in `App.tsx` and pages use relative paths (`./pages/...`, `./components/...`). Epic 2 components must use `@/` — this setup adds that.
- **`tsconfig.app.json` has no `baseUrl` or `paths`**: both must be added for `@/` alias to work. `moduleResolution: "bundler"` is already set, which supports path aliases.
- **`@types/node` already installed** (`^24.10.1` in devDeps) — `path.resolve()` in `vite.config.ts` will work without any additional installs.
- **shadcn not initialized**: no `components.json`, no `src/lib/utils.ts`. Clean slate.
- **Component directory convention**: architecture spec shows `src/components/shared/` for `Button`, `Input`, `Modal` etc. shadcn's default output directory is `src/components/ui/`. Decision: keep shadcn's `ui/` directory for shadcn-installed component files (they're owned/copied code per spec), and `shared/` for hand-written shared components that may wrap shadcn primitives.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `apps/frontend/vite.config.ts` | Currently: React plugin only. Add Tailwind plugin + `@/` resolve alias |
| `apps/frontend/tsconfig.app.json` | Currently: no paths. Add `baseUrl` + `paths` for `@/` |
| `apps/frontend/src/index.css` | Currently: vanilla Vite starter CSS. Replace entirely |
| `apps/frontend/src/main.tsx` | Imports `./index.css` — no changes needed here |
| `apps/frontend/src/App.css` | Orphaned Vite template file — delete |
| `apps/frontend/package.json` | Add `tailwindcss` + `@tailwindcss/vite` to devDeps |

### Technical Decisions

- **Tailwind v4 CSS-first** (not `tailwind.config.ts`): uses `@import "tailwindcss"` + `@theme` block in `index.css`. Architecture directory shows `tailwind.config.ts` but that was a planning artifact — v4 doesn't need it.
- **`@tailwindcss/vite` plugin**: correct approach for Vite 7 + Tailwind v4 (replaces old PostCSS pipeline).
- **`@/` alias requires two changes**: `vite.config.ts` needs `resolve.alias` (runtime) and `tsconfig.app.json` needs `compilerOptions.paths` (IDE + tsc). Missing either breaks imports.
- **Vault-Tec color token names — locked here, values deferred**: the five CSS custom property names are fixed in this story so `lib/zoneConstants.ts` (Story 2.3) can reference them without guessing. Names:
  - `--color-zone-amber-low` → Tailwind class `zone-amber-low` (calories below floor)
  - `--color-zone-green` → `zone-green` (on track, floor→target)
  - `--color-zone-amber-over` → `zone-amber-over` (calories target→+200 threshold)
  - `--color-zone-orange` → `zone-orange` (calories above threshold — "Rad Zone")
  - `--color-zone-blue` → `zone-blue` (bonus — protein/steps above target)
  Values are set to `transparent` as an obvious placeholder — Story 2.3 replaces them with final `oklch()`/hex values. Do NOT use `theme()` function syntax in `@theme` blocks — that is Tailwind v3/PostCSS only and is invalid in Tailwind v4's CSS-first mode.
- **`baseUrl` in tsconfig**: add `"baseUrl": "."` even though `moduleResolution: "bundler"` doesn't strictly require it — explicit is safer and avoids IDE ambiguity.
- **shadcn init runs before Vault-Tec `@theme` block is written**: shadcn modifies `index.css` on init, inserting its CSS variable block. Write the custom `@theme` Vault-Tec tokens *after* shadcn init completes, appended below shadcn's generated content. This preserves correct import order.
- **shadcn init must run after `@/` alias is in `vite.config.ts`**: shadcn reads the Vite config during init to detect aliases. Alias config goes in first.
- **shadcn dark mode**: select `none` during init. Deliberate deferral — see Notes.
- **shadcn component directory**: use shadcn default `src/components/ui/`. Differs slightly from architecture's `shared/` — documented here so agents don't re-litigate it.

## Implementation Plan

### Tasks

- [ ] Task 1: Install Tailwind v4 dependencies
  - File: `apps/frontend/package.json` (via npm install)
  - Action: Run from `apps/frontend/`:
    ```bash
    npm install -D tailwindcss @tailwindcss/vite
    ```
  - Notes: Both packages are build-time-only tools — must be installed as devDependencies (`-D`). Do NOT install `autoprefixer` or `postcss` — not needed with v4. If this project uses npm workspaces and you see these land in the root `node_modules`, that is expected workspace hoisting behaviour — imports will still resolve correctly from `apps/frontend`.

- [ ] Task 2: Update `vite.config.ts` — add Tailwind plugin and `@/` path alias
  - File: `apps/frontend/vite.config.ts`
  - Action: Replace entire file contents with:
    ```ts
    import { defineConfig } from 'vite'
    import react from '@vitejs/plugin-react'
    import tailwindcss from '@tailwindcss/vite'
    import path from 'path'

    export default defineConfig({
      plugins: [react(), tailwindcss()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        },
      },
    })
    ```
  - Notes: `@types/node` is already installed so `path` is available. Plugin order matters — `react()` before `tailwindcss()`.

- [ ] Task 3: Update `tsconfig.app.json` — add `baseUrl` and `paths` for `@/` alias
  - File: `apps/frontend/tsconfig.app.json`
  - Action: Replace the entire file with the following (all existing options preserved, `baseUrl` and `paths` added):
    ```json
    {
      "compilerOptions": {
        "baseUrl": ".",
        "paths": {
          "@/*": ["./src/*"]
        },
        "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
        "target": "ES2022",
        "useDefineForClassFields": true,
        "lib": ["ES2022", "DOM", "DOM.Iterable"],
        "module": "ESNext",
        "types": ["vite/client"],
        "skipLibCheck": true,
        "moduleResolution": "bundler",
        "allowImportingTsExtensions": true,
        "verbatimModuleSyntax": true,
        "moduleDetection": "force",
        "noEmit": true,
        "jsx": "react-jsx",
        "strict": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "erasableSyntaxOnly": true,
        "noFallthroughCasesInSwitch": true,
        "noUncheckedSideEffectImports": true
      },
      "include": ["src"]
    }
    ```
  - Notes: `baseUrl: "."` means project root (`apps/frontend/`). `@/*` maps to `./src/*`. Both `baseUrl` and `paths` are required — `vite.config.ts` handles runtime resolution; `tsconfig` handles IDE and `tsc` type-checking. Adding these fields invalidates the existing `tsBuildInfoFile` cache, which is harmless — the cache regenerates automatically on next build.

- [ ] Task 4: Verify and delete orphaned `App.css`
  - File: `apps/frontend/src/App.css`
  - Action:
    1. First, confirm no file in `src/` imports `App.css` by running:
       ```bash
       grep -r "App.css" apps/frontend/src/
       ```
       Expected output: no matches. If any matches are found, remove those imports before proceeding.
    2. Delete `apps/frontend/src/App.css`.
  - Notes: This was the original Vite template file. `main.tsx` imports only `index.css` and `App.tsx` has no CSS import — but verify with grep before deleting to be safe.

- [ ] Task 5: Clear `index.css` and run `shadcn init`
  - File: `apps/frontend/src/index.css` (cleared first), then creates `apps/frontend/components.json`, `apps/frontend/src/lib/utils.ts`
  - Action:
    1. **Clear `index.css`**: Replace the entire contents of `apps/frontend/src/index.css` with a single blank line (or empty file). This removes the Vite starter styles (`body { display:flex }`, custom button/anchor rules, etc.) which conflict with Tailwind's reset and shadcn's base styles. **Known visual consequence**: the existing auth pages (login, register, forgot-password, reset-password) will lose their current centering and button styling — this is an accepted regression that Epic 2 UI stories will address with proper Tailwind classes.
    2. **Run shadcn init** from `apps/frontend/`:
       ```bash
       npx shadcn@latest init
       ```
       When prompted, select:
       - **Style**: New York
       - **Base color**: Neutral
       - **CSS variables**: Yes
       - If prompted for **dark mode**: select None (deliberate deferral — see Notes)
       - **Components directory**: leave as default (`src/components/ui`)
       - **Utils path**: leave as default (`src/lib/utils`)
  - Notes: shadcn reads `vite.config.ts` to detect the `@/` alias — Task 2 must be complete before this runs. shadcn will write its CSS variable block and `@import "tailwindcss"` into `index.css`. The dark mode prompt may not appear in all CLI versions — only select it if it is shown. If `clsx` or `tailwind-merge` are installed to the monorepo root due to workspace hoisting, this is expected and imports will still resolve correctly.

- [ ] Task 6: Append Vault-Tec zone color tokens to `index.css`
  - File: `apps/frontend/src/index.css`
  - Action: After all of shadcn's generated content, append the following `@theme` block at the very end of the file:
    ```css
    /* =============================================================
       Vault-Tec zone color tokens
       TOKEN NAMES ARE LOCKED — do not rename without updating lib/zoneConstants.ts (Story 2.3)
       VALUES ARE PLACEHOLDERS — Story 2.3 replaces transparent with final oklch/hex values
       ============================================================= */
    @theme {
      --color-zone-amber-low: transparent; /* TODO Story 2.3: calories below floor */
      --color-zone-green: transparent;     /* TODO Story 2.3: on track (floor→target) */
      --color-zone-amber-over: transparent; /* TODO Story 2.3: calories target→+200 threshold */
      --color-zone-orange: transparent;    /* TODO Story 2.3: "Rad Zone" (calories above threshold) */
      --color-zone-blue: transparent;      /* TODO Story 2.3: bonus (protein/steps above target) */
    }
    ```
  - Notes: Values are intentionally set to `transparent` so it is visually obvious these are placeholders — Story 2.3 replaces them with final color values. The names are the binding contract with `lib/zoneConstants.ts`. Do NOT use `theme()` function syntax (that is Tailwind v3 only — invalid in v4). Do NOT add this block before shadcn's content — append after.

- [ ] Task 7: Verify setup is working
  - File: N/A
  - Action: Run from `apps/frontend/`:
    ```bash
    npm run dev
    ```
    Confirm: app loads at `localhost:5173` with no console errors. Then run:
    ```bash
    npm run build
    ```
    Confirm: build completes with no TypeScript or Vite errors.
  - Notes: If TypeScript errors appear referencing `@/` paths, check that `tsconfig.app.json` `paths` was saved correctly. If Tailwind classes aren't applying, confirm `@import "tailwindcss"` exists in `index.css` (shadcn should have added it in Task 5).

### Acceptance Criteria

- [ ] AC 1: Given `tailwindcss` and `@tailwindcss/vite` are installed, when `npm run dev` runs, then the Vite dev server starts with no missing module errors related to Tailwind.

- [ ] AC 2: Given the `@/` alias is configured in both `vite.config.ts` and `tsconfig.app.json`, when a file uses `import something from '@/lib/utils'`, then the import resolves correctly at runtime and shows no TypeScript error in the IDE.

- [ ] AC 3: Given shadcn init has run, when `apps/frontend/components.json` is opened, then it exists and contains: `"aliases.components": "@/components/ui"`, `"aliases.utils": "@/lib/utils"`, and `"baseColor": "neutral"`. If the aliases do not use `@/` (i.e., shadcn fell back to relative paths), re-run init after confirming Task 2 is complete.

- [ ] AC 4: Given shadcn init has run, when `apps/frontend/src/lib/utils.ts` is opened, then it exists and exports a `cn()` helper function using `clsx` and `tailwind-merge`.

- [ ] AC 5: Given the five Vault-Tec `@theme` token declarations exist in `index.css`, when the file is opened, then all five `--color-zone-*` custom properties are present below shadcn's generated CSS variable block.

- [ ] AC 6: Given `apps/frontend/src/App.css` existed before this story, when the story is complete, then the file no longer exists.

- [ ] AC 7: Given the full setup is in place, when `npm run build` is run in `apps/frontend/`, then the build completes successfully with no TypeScript errors and no Vite bundling errors.

- [ ] AC 8: Given the dev server is running, when the app is opened at `localhost:5173`, then the following manual smoke-test steps all pass:
  - Navigate to `/login` — page renders (visual styling may differ from pre-story; that is expected — see Task 5 notes)
  - Submit valid credentials — redirected to `/` (dashboard) with no JS errors in console
  - Navigate directly to `/register` — registration form renders
  - Navigate to a protected route while logged out (e.g., open a private/incognito window and go to `/`) — redirected to `/login`
  - No 404s, no blank pages, no unhandled JS errors in the console on any of the above routes

## Additional Context

### Dependencies

- `tailwindcss` v4 — CSS framework (install as **devDependency** — build-time only)
- `@tailwindcss/vite` — Vite plugin for Tailwind v4 (install as **devDependency** — build-time only; replaces old PostCSS pipeline)
- `shadcn@latest` CLI — scaffolds `components.json`, `src/lib/utils.ts`, modifies `index.css`; also installs `clsx`, `tailwind-merge` as runtime deps. If this monorepo uses npm workspaces, `clsx` and `tailwind-merge` may hoist to the root `node_modules` — this is acceptable, imports resolve correctly.
- `@types/node` — already in devDeps; needed for `path.resolve()` in `vite.config.ts`
- No dependency on any other story — this is standalone prep work

### Testing Strategy

No automated tests for this story. Manual verification only (covered by AC 7 and AC 8):
- `npm run build` — zero errors = primary pass criterion
- `npm run dev` + open browser — app loads, existing auth flows work, no regressions

### Notes

**Dark mode — deferred decision:**
Dark mode strategy (class-based vs. media-query-based) has not been documented in the architecture or UX spec. The Vault-Tec theme uses specific color tokens (amber, green, blue, orange) that may need separate light/dark variants in future. Before Epic 3 or whenever theming work begins, revisit: should dark mode be `class`-based (`.dark` on `<html>`) or `media`-based (`prefers-color-scheme`)? shadcn defaults to `class`. For now, dark mode is disabled/skipped during shadcn init.
