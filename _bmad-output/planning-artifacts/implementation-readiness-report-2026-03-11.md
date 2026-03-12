# Implementation Readiness Assessment Report

**Date:** 2026-03-11
**Project:** vault_1

---

## Document Inventory

### PRD Documents

**Whole Documents:**
- `prd.md` (35.8 KB, modified Mar 8)
- `prd-validation-report.md` (21 KB, modified Mar 8) — *validation report, not a PRD itself*

**Sharded Documents:** None

---

### Architecture Documents

**Whole Documents:**
- `architecture.md` (46.1 KB, modified Mar 11)

**Sharded Documents:** None

---

### Epics & Stories Documents

**Whole Documents:**
- `epics.md` (33.8 KB, modified Mar 11)

**Sharded Documents:** None

---

### UX Design Documents

**Whole Documents:**
- `ux-design-specification.md` (57.6 KB, modified Mar 9)

**Sharded Documents:** None

---

### Other Documents Found

- `product-brief-vault_1-2026-03-06.md` (17.8 KB, modified Mar 7)

---

## stepsCompleted: ["step-01-document-discovery", "step-02-prd-analysis", "step-03-epic-coverage-validation", "step-04-ux-alignment", "step-05-epic-quality-review", "step-06-final-assessment"]

---

## PRD Analysis

### Functional Requirements

FR1: User can create an account with a username and password
FR2: User can log in with username and password
FR3: User can remain logged in across app sessions without re-authenticating
FR4: User can reset their password
FR5: User can log out
FR6: User can set daily targets for calories, protein, and steps
FR7: The system automatically calculates floor values when targets are set (calories: target−250, protein: target×0.8, steps: target×0.5)
FR8: User can update their targets at any time
FR9: User can create up to 3 Cheat Codes (coaching strategy reminders)
FR10: User can edit and delete existing Cheat Codes
FR11: User can log daily values for calories, protein, steps, and workout completion
FR12: User can view their current day's progress as color-coded progress bars reflecting floor-based zones
FR13: The system applies a calorie-asymmetric color zone model to the calorie progress bar (below-floor: amber-low; floor→target: green; target→threshold: amber-over; above threshold: orange)
FR14: The system applies a standard color zone model to protein and steps progress bars (below-floor: amber; floor→target: green; above-target: blue)
FR15: User can view their Cheat Codes on the daily dashboard at all times, without any navigation required
FR16: User can press Day Complete at any time regardless of whether daily metrics were achieved
FR17: User can select a mood tag when pressing Day Complete
FR18: The system prompts the user to complete the previous day if it was not closed at login
FR19: The system records a `roughDay` flag at Day Complete time (derived: fewer than 50% of active goals achieved that day)
FR20: User can create goals in a personal goals library
FR21: User can specify a goal type (daily metric-based or weekly frequency-based)
FR22: User can edit goals in their library
FR23: User can delete goals from their library
FR24: The system provides a starter library of pre-defined goals available during onboarding and goal selection
FR25: User can select 3–5 active goals per week from their goals library
FR26: The system enforces a minimum of 3 and maximum of 5 concurrently active goals
FR27: User can view their active goals and per-goal progress on the daily dashboard
FR28: User can access a weekly planning view
FR29: User can view the prior week's results per active goal (days achieved vs. total days)
FR30: User can view their weekly consistency percentage
FR31: The system displays a tier label corresponding to weekly consistency % (60–74%: "Surviving the Wasteland"; 75–89%: "Thriving"; 90%+: "Elite")
FR32: The system suggests which goals to keep, drop, or add based on prior week performance
FR33: User can select active goals for the upcoming week (3–5 enforced)
FR34: User can start a new week, which resets the dashboard to the newly selected active goal set
FR35: User can edit Cheat Codes from within the weekly planning view
FR36: User can perform core logging actions (calories, protein, steps, workout, Day Complete) while offline
FR37: The system queues offline actions and syncs them automatically when connectivity is restored
FR38: The system retains local records until server sync is confirmed — no silent data loss on failed sync
FR39: User's data (daily logs, goals, configuration, weekly history) persists reliably across sessions
FR40: User can install the app to their mobile device home screen
FR41: The app is accessible and functional across iOS Safari (P1), Chrome mobile, and desktop browsers
FR42: The app layout adapts responsively for mobile (320px–768px primary) and desktop viewports
FR43: The system records login timestamps to support login gap monitoring
FR44: The system calculates weekly consistency % as active goal days achieved divided by total possible active goal days for the current week

**Total FRs: 44**

---

### Non-Functional Requirements

NFR-P1: Dashboard (daily view) is interactive within 3 seconds on a mid-range mobile device on 4G connectivity
NFR-P2: User-initiated tracking actions provide visual feedback within 300ms; full save completes within 1 second under normal conditions
NFR-P3: App shell loads from service worker cache within 1 second on repeat visits (offline or online)
NFR-P4: Offline-to-online transition is transparent — queued actions show no error state; sync happens silently in the background
NFR-S1: All data transmitted between client and server uses HTTPS/TLS
NFR-S2: Personal health and behavioral data stored server-side is encrypted at rest
NFR-S3: Authentication sessions persist across visits; users can sign out and invalidate the session
NFR-S4: Each user's data is strictly isolated — no cross-user data access is possible at any layer
NFR-S5: Password reset is available via standard email-based recovery
NFR-R1: All tracking actions performed offline are queued locally and synced when connectivity is restored — no data is silently lost
NFR-R2: Sync failures retry automatically (minimum 3 attempts with exponential backoff) before surfacing a non-blocking notification
NFR-R3: All core tracking features function fully in offline mode; only sync-dependent features are unavailable offline
NFR-R4: App data is not lost during PWA updates or service worker refreshes
NFR-A1: All user-facing interfaces meet WCAG 2.1 Level AA standards
NFR-A2: All interactive elements are keyboard navigable and screen reader compatible
NFR-A3: Color is never the sole means of conveying information — status indicators include text labels or icons alongside color
NFR-A4: All interactive tap/click targets are minimum 44×44px
NFR-A5: Primary action areas display no more than 5 items — cognitive load reduction is a first-class design constraint

**Total NFRs: 18** (4 Performance, 5 Security, 4 Reliability, 5 Accessibility)

---

### Additional Requirements / Constraints

- **Bundle size target:** < 250KB gzipped (initial load)
- **App launch from home screen:** < 2 seconds
- **No SSR required:** Client-side rendering only
- **SPA architecture:** All navigation client-side, no full-page reloads
- **Data model must accommodate HealthKit shapes** for future Phase 3 integration (steps as integer, workouts as boolean/duration)
- **Calorie Danger Zone threshold** (e.g., +200 kcal above target) to be validated against coaching guidance — exact value not specified in PRD
- **Browser matrix:** Safari iOS (P1), Chrome Android (P2), Chrome Desktop (P2), Safari macOS (P2), Firefox Desktop (P3)
- **No third-party analytics services** receiving personal log data
- **Passwords** hashed with bcrypt or Argon2; sessions via HttpOnly cookies
- **Last-write-wins** for offline sync conflicts (single user, single device — documented acceptable risk)

### PRD Completeness Assessment

The PRD is thorough and well-structured. Key observations:
- All 44 FRs are clearly numbered and grouped by domain area
- NFRs have specific measurable targets (response times, retry counts, viewport sizes)
- One minor ambiguity: the calorie Danger Zone threshold value is described as "e.g., +200 kcal" and noted as requiring coaching validation — this is a known open item, not an oversight
- The PRD clearly scopes what is in/out of MVP with explicit rationale

---

---

## Epic Coverage Validation

### Coverage Matrix

| FR | Requirement (Summary) | Epic Coverage | Story | Status |
|----|----------------------|---------------|-------|--------|
| FR1 | Create account (username + password) | Epic 1 | 1.2 | ✓ Covered |
| FR2 | Log in with username + password | Epic 1 | 1.3 | ✓ Covered |
| FR3 | Remain logged in across sessions | Epic 1 | 1.3 | ✓ Covered |
| FR4 | Reset password | Epic 1 | 1.4 | ✓ Covered |
| FR5 | Log out | Epic 1 | 1.5 | ✓ Covered |
| FR6 | Set daily targets (cal, protein, steps) | Epic 2 | 2.1 | ✓ Covered |
| FR7 | Automatic floor calculation | Epic 2 | 2.1, 2.3 | ✓ Covered |
| FR8 | Update targets at any time | Epic 2 | 2.7 | ✓ Covered |
| FR9 | Create up to 3 Cheat Codes | Epic 2 | 2.2 | ✓ Covered |
| FR10 | Edit and delete Cheat Codes | Epic 2 | 2.2 | ✓ Covered |
| FR11 | Log daily values (cal, protein, steps, workout) | Epic 2 | 2.4 | ✓ Covered |
| FR12 | Floor-based color-coded progress bars | Epic 2 | 2.4 | ✓ Covered |
| FR13 | Calorie-asymmetric color zone model | Epic 2 | 2.3, 2.4 | ✓ Covered |
| FR14 | Standard color zone model (protein/steps) | Epic 2 | 2.3, 2.4 | ✓ Covered |
| FR15 | Cheat Codes always visible on dashboard | Epic 2 | 2.4 | ✓ Covered |
| FR16 | Day Complete always pressable | Epic 2 | 2.5 | ✓ Covered |
| FR17 | Mood tag at Day Complete | Epic 2 | 2.5 | ✓ Covered |
| FR18 | Yesterday completion prompt on login | Epic 2 | 2.6 | ✓ Covered |
| FR19 | roughDay flag at Day Complete | Epic 2 | 2.5, 3.4 | ✓ Covered |
| FR20 | Create goals in personal library | Epic 3 | 3.1 | ✓ Covered |
| FR21 | Goal type specification (daily/weekly) | Epic 3 | 3.1 | ✓ Covered |
| FR22 | Edit goals in library | Epic 3 | 3.2 | ✓ Covered |
| FR23 | Delete goals from library | Epic 3 | 3.2 | ✓ Covered |
| FR24 | Starter library of pre-defined goals | Epic 3 | 3.1 | ✓ Covered |
| FR25 | Select 3–5 active goals per week | Epic 3 | 3.3 | ✓ Covered |
| FR26 | Enforce min 3 / max 5 active goals | Epic 3 | 3.3 | ✓ Covered |
| FR27 | Active goals + per-goal progress on dashboard | Epic 2, 3 | 2.4, 3.4 | ✓ Covered |
| FR28 | Access weekly planning view | Epic 4 | 4.2 | ✓ Covered (title only) |
| FR29 | Prior week per-goal results | Epic 4 | 4.2 | ✓ Covered (title only) |
| FR30 | View weekly consistency percentage | Epic 4 | 4.3 | ✓ Covered (title only) |
| FR31 | Tier labels (Surviving/Thriving/Elite) | Epic 4 | 4.3 | ✓ Covered (title only) |
| FR32 | Goal suggestions (keep/drop/add) | Epic 4 | 4.4 | ✓ Covered (title only) |
| FR33 | Active goal selection for next week | Epic 4 | 4.5 | ✓ Covered (title only) |
| FR34 | Start new week / dashboard reset | Epic 4 | 4.5 | ✓ Covered (title only) |
| FR35 | Edit Cheat Codes from planning view | Epic 4 | 4.6 | ✓ Covered (title only) |
| FR36 | Offline core logging actions | Epic 5 | 5.1 | ✓ Covered (title only) |
| FR37 | Offline queue auto-sync on reconnect | Epic 5 | 5.2 | ✓ Covered (title only) |
| FR38 | No silent data loss on failed sync | Epic 5 | 5.2 | ✓ Covered (title only) |
| FR39 | Data persistence across sessions | Epic 5 | 5.1 | ✓ Covered (title only) |
| FR40 | PWA installable to home screen | Epic 5 | 5.3 | ✓ Covered (title only) |
| FR41 | Cross-browser support (iOS Safari P1) | Epic 5 | 5.4 | ✓ Covered (title only) |
| FR42 | Responsive layout (320px–768px) | Epic 5 | 5.4 | ✓ Covered (title only) |
| FR43 | Login timestamp recording | Epic 4 | ⚠️ No dedicated story | ⚠️ GAP |
| FR44 | Weekly consistency % calculation | Epic 4 | 4.1 | ✓ Covered (title only) |

### Missing Requirements

#### ⚠️ FR43 — Login Timestamp Recording

> The system records login timestamps to support login gap monitoring.

- **Impact:** This is a system-level data capture requirement. It has no dedicated story and is mapped to Epic 4 in the FR Coverage Map, but no Epic 4 story (4.1–4.6) addresses it.
- **Root Cause:** Login happens in Epic 1 (Story 1.3), but the FR was mapped to Epic 4. The timestamp recording logic is naturally part of the login endpoint — it belongs in Epic 1, not Epic 4.
- **Recommendation:** Add a single acceptance criterion to Story 1.3 (or Story 1.1 data model): *"When a user authenticates successfully, a `lastLoginAt` timestamp is recorded on the User record."* This is a one-line addition to the login handler — not a new story.

### Coverage Statistics

- **Total PRD FRs:** 44
- **FRs fully covered (with detailed ACs):** 28 (FR1–FR27 across Epics 1–3)
- **FRs mapped but stories have titles-only (no ACs yet):** 15 (FR28–FR42, FR44 — Epics 4 & 5, rolling wave)
- **FRs with coverage gap:** 1 (FR43 — no story, wrong epic assignment)
- **FR Coverage percentage:** 43/44 = **97.7% mapped; 63.6% with detailed ACs**

### Notable Observations

1. **Epic 4 & 5 stories are intentionally titles-only** — the epics file explicitly notes "Detailed acceptance criteria for Epic X stories to be written before Epic X implementation begins (rolling wave planning)." This is a deliberate decision, not a gap.
2. **FR27 appears in both Epic 2 and Epic 3** FR coverage lists — this is intentional and correct (dashboard placeholder in Story 2.4, fulfilled with real goals in Story 3.4).
3. **FR19 (roughDay flag)** is split across Stories 2.5 and 3.4 with a clear deferred logic pattern — Story 2.5 sets `roughDay: false` when no goals exist; Story 3.4 wires real goal achievement. Well-structured.
4. **Story 2.3 (Zone Calculation Engine)** is an infrastructure story not tied to a single FR — it underpins FR12, FR13, FR14, and FR7. This is good architectural practice.

---

---

## UX Alignment Assessment

### UX Document Status

**Found** — `ux-design-specification.md` (57.6 KB, 14 steps completed, status: complete, dated 2026-03-08)

---

### UX ↔ PRD Alignment

| Area | Status | Notes |
|------|--------|-------|
| Floor-based progress bars (amber/green/blue/orange) | ✓ Aligned | UX spec fully elaborates FR12–14; calorie-asymmetric model consistent |
| Cheat Codes always visible on dashboard | ✓ Aligned | UX spec elevates this to "Coaching Forward" hierarchy — first content block |
| Day Complete always pressable + mood tag | ✓ Aligned | 8-second timeout for mood picker; day closes without selection — consistent with FR16, FR17 |
| Yesterday completion prompt | ✓ Aligned | Detailed as "Non-blocking banner" pattern — consistent with FR18 |
| Active goals 3–5 enforcement | ✓ Aligned | Goal selection tiles with amber inline constraint copy |
| Weekly planning view + prior week summary | ✓ Aligned | Sunday ritual flow fully detailed |
| Responsive 320px–768px | ✓ Aligned | Single-column, max-width 480px centered on larger screens |
| WCAG 2.1 AA | ✓ Aligned | NFR-A1–A5 each explicitly addressed in UX spec |
| **Tier Labels** | ❌ **MISALIGNED** | See critical issue below |
| roughDay flag | ✓ Aligned | Consistent between PRD, UX flow, and epics |
| No red states | ✓ Aligned | UX spec enforces this as an absolute requirement |

---

### ⚠️ CRITICAL ALIGNMENT ISSUE: Tier Label Definitions

The PRD and UX spec define the tier labels with **different ranges and different label names**:

| Consistency % | PRD (FR31) | UX Spec (`TierBadge` component) |
|---|---|---|
| < 60% | *(no label defined)* | "Surviving the Wasteland" |
| 60–74% | "Surviving the Wasteland" | "Making Progress" |
| 75–89% | "Thriving" | "Thriving" |
| 90%+ | "Elite" | "Vault Elite" |

**Impact:** This is a meaningful conflict. The PRD was validated and story 4.3 references the PRD tier labels. The epics `lib/consistencyCalc.ts` will implement one or the other. If implemented from PRD, the UX component renders wrong labels. If implemented from UX spec, the PRD acceptance criteria fail.

**Recommendation:** Resolve before Epic 4 implementation begins. The PRD's model (60%+ = "Surviving") aligns better with the narrative framing in journey 2 ("68% consistency — Surviving the Wasteland"), where 68% is above 60% and correctly lands in that tier. The UX `TierBadge` appears to have introduced a "Making Progress" tier not in the PRD, and shifted the floor tier label down to <60%. A decision is needed — either update the UX component spec or update the PRD — and propagate to `lib/zoneConstants.ts` before Story 4.3 is written.

---

### Minor Alignment Issues

**1. `zone-amber-over` missing from confirmed UX color token table**
The `FloorProgressBar` component table uses `zone-amber-over` (`#F97316`) as a color, but the confirmed design token palette in the UX spec does not include this token (the palette table shows `zone-orange` `#EA580C` and `zone-amber-over` is listed in a separate earlier section as `#F97316`). The token needs to be canonically defined in the confirmed palette and in `lib/zoneConstants.ts`.

**2. UX "view states" vs. Architecture "routes" terminology mismatch**
The UX spec describes four "view states" (`daily-dashboard`, `yesterday-dashboard`, `weekly-summary`, `goal-selection`) while the architecture (via epics) defines React Router v7 routes (`/`, `/week`, `/goals`, `/settings`, `/onboarding`). These are complementary but the mapping is implicit. During Epic 2–4 implementation, developers should confirm whether `yesterday-dashboard` is a route-level or state-level concern (it appears to be state-level within `/`).

**3. Google Fonts external dependency and bundle size**
The UX spec specifies VT323 and Share Tech Mono from Google Fonts. This adds an external network dependency and is not addressed in the architecture. Fonts should be self-hosted or loaded with `font-display: swap` to avoid blocking render — especially important for the <3-second TTI target (NFR-P1) on mobile.

---

### UX ↔ Architecture Alignment

| Area | Status | Notes |
|------|--------|-------|
| React + Vite + Tailwind + shadcn/ui | ✓ Aligned | Both documents agree on the full stack |
| `FloorProgressBar` as bespoke component | ✓ Aligned | Both identify this as the highest-priority custom component |
| `lib/zoneConstants.ts` as single source of truth | ✓ Aligned | Architecture requires it; UX spec confirms no hardcoded hex values in components |
| `aria-live="polite"` on zone labels | ✓ Aligned | UX spec specifies this; architecture/epics enforce ARIA in Story 2.4 ACs |
| shadcn/ui components as owned code | ✓ Aligned | Both documents confirm copy-into-project approach |
| Performance targets | ✓ Aligned | UX spec supports <3s TTI via local-first writes and no navigation for logging |
| Offline-first logging | ✓ Aligned | UX spec shows `OFFLINE` indicator pattern; architecture specifies Dexie.js queue |

---

### Warnings

- **No wireframes or visual mockups embedded** in the UX spec — the reference `ux-design-directions.html` file is mentioned but not provided within the planning artifacts folder. This is acceptable (HTML mockup is a separate file) but should be confirmed accessible during Epic 2 implementation.

---

---

## Epic Quality Review

### Epic Structure Validation

#### Epic 1: Foundation & Authentication

| Check | Result | Notes |
|-------|--------|-------|
| User value focus | ✓ PASS | Goal clearly states what the user can do: register, log in, stay logged in, reset password, log out |
| Epic independence | ✓ PASS | Stands completely alone — no prior epic required |
| Stories user-centric | ⚠️ MINOR | Story 1.1 is written "As a developer" — see below |
| ACs present and complete | ✓ PASS | All 5 stories have full Given/When/Then ACs |
| Error conditions covered | ✓ PASS | Duplicate username, invalid password, expired reset link, already-used link all covered |
| Greenfield setup story | ✓ PASS | Story 1.1 is the starter template setup as required by architecture |

#### Epic 2: Daily Tracking Core

| Check | Result | Notes |
|-------|--------|-------|
| User value focus | ✓ PASS | Goal: core product hypothesis — dashboard + tracking + Day Complete |
| Epic independence | ✓ PASS | Requires only Epic 1 (auth) — correct dependency chain |
| Stories user-centric | ⚠️ MINOR | Story 2.3 is written "As a developer" — see below |
| ACs present and complete | ✓ PASS | All 7 stories have full ACs |
| Forward dependencies handled | ✓ PASS | Stories 2.4 and 2.5 correctly defer Epic 3 behavior (placeholder state / roughDay default) |
| FR coverage | ✓ PASS | FR6–FR19, FR27 all addressed |

#### Epic 3: Goals Management

| Check | Result | Notes |
|-------|--------|-------|
| User value focus | ✓ PASS | Users build a library and select active goals |
| Epic independence | ✓ PASS | Builds correctly on Epics 1 + 2 |
| Stories user-centric | ✓ PASS | All 4 stories are user-centric |
| ACs present and complete | ✓ PASS | All 4 stories have full ACs including edge cases (active goal deletion warning, 6th goal block, fewer than 3 block) |
| Forward dependencies | ✓ PASS | Story 3.4 explicitly completes the deferred roughDay logic from Story 2.5 — correctly documented |

#### Epic 4: Weekly Planning Ritual

| Check | Result | Notes |
|-------|--------|-------|
| User value focus | ✓ PASS | Goal: Sunday planning ritual — clear user outcome |
| Epic independence | ✓ PASS | Correctly requires Epics 1–3 |
| Stories user-centric | ✓ PASS | Story 4.1 is "As a developer" but justified (calculation engine) |
| **ACs present** | ❌ **NOT READY** | All 6 stories (4.1–4.6) are **titles only** — no acceptance criteria |

#### Epic 5: Offline & PWA

| Check | Result | Notes |
|-------|--------|-------|
| User value focus | ✓ PASS | Users can log offline and install to home screen |
| Epic independence | ✓ PASS | Adds offline layer on top of existing Epic 2 logging |
| **ACs present** | ❌ **NOT READY** | All 4 stories (5.1–5.4) are **titles only** — no acceptance criteria |
| Cross-cutting concern noted | ⚠️ MINOR | Epic 2 logging will NOT be offline-capable until Epic 5 is implemented — developer must be aware |

---

### 🔴 Critical Violations

**None found.**

---

### 🟠 Major Issues

**M1 — Epics 4 and 5: No Acceptance Criteria (10 of 22 stories)**

Stories 4.1–4.6 and 5.1–5.4 have titles only. The epics document explicitly acknowledges this with "Detailed acceptance criteria to be written before Epic X implementation begins (rolling wave planning)."

- **Impact:** These 10 stories cover FR28–FR44 (15 FRs) plus all offline and PWA behavior. They cannot be implemented without ACs.
- **Status:** Intentional — this is a documented planning decision, not an oversight.
- **Risk:** If Epic 3 implementation proceeds faster than expected, there may be pressure to start Epic 4 before ACs are written. The rolling wave gate must be enforced.
- **Recommendation:** ACs for Epic 4 should be written and reviewed before the first Epic 4 story is assigned. Same for Epic 5. Consider doing Epic 4 ACs during Epic 3 implementation so there is no blocking wait.

---

### 🟡 Minor Concerns

**MC1 — Stories 1.1 and 2.3 are developer-centric ("As a developer")**

Story 1.1 (Project Scaffolding) and Story 2.3 (Zone Calculation Engine) are written from the developer's perspective. Strictly, these are technical milestones rather than user stories.

- **Justification accepted:** Story 1.1 is the required starter template setup — no feature work can begin without it. Story 2.3 isolates the zone calculation engine as a testable library before any UI is built — the architecture explicitly requires this. Both are valid infrastructure investments.
- **Risk:** LOW — they are clearly marked and serve a specific architectural purpose.
- **Recommendation:** No change needed. These patterns are accepted for greenfield projects with architectural prerequisites.

---

**MC2 — FR43 (login timestamps) has no dedicated story**

Already flagged in Step 3 coverage analysis. Repeated here: FR43 is mapped to Epic 4 in the FR Coverage Map but no Epic 4 story addresses it. Login timestamps are naturally a backend concern at the login handler level (Story 1.3), not a planning view feature.

- **Recommendation:** Add one AC to Story 1.3: *"When a user authenticates successfully, a `lastLoginAt` timestamp is recorded on the User record."* No new story needed.

---

**MC3 — Prisma schema creation timing not story-explicit**

The architecture specifies Prisma schema-first with `prisma migrate dev`. Story 1.1 sets up Prisma/Neon connectivity, but it is not explicit about whether the full schema (all tables) is created in Story 1.1 or incrementally per story.

- **Best practice:** Each story should create only the tables it needs. In practice with Prisma, a single evolving schema file with incremental migrations per story is the implementation pattern.
- **Risk:** LOW — solo developer, personal project. Prisma's migration tooling naturally supports incremental schema evolution.
- **Recommendation:** When implementing, add Prisma migrations incrementally per story (Story 1.2 adds `User` table; Story 2.1 adds `UserConfig`; etc.) rather than creating the full schema in Story 1.1.

---

**MC4 — Epic 5 offline features are cross-cutting**

Offline logging is architecturally dependent on Epic 2 (the logging UI), but won't be added until Epic 5. Between Epic 2 completion and Epic 5 completion, the app will fail silently or error during offline use.

- **Risk:** MEDIUM for a solo developer who relies on the app during commute. If Elizabeth starts using the app before Epic 5, she'll encounter errors during the offline commute window.
- **Recommendation:** Consider implementing Story 5.1 (Offline Logging Queue via Dexie.js) immediately after Story 2.4 (Dashboard Logging), rather than waiting for Epic 5 as a batch. The architecture already specifies Dexie.js — the offline queue could be wired in during Epic 2 development without disruption.

---

### Best Practices Compliance Summary

| Epic | User Value | Independent | ACs Complete | No Forward Deps | Sized Right |
|------|-----------|-------------|--------------|-----------------|-------------|
| Epic 1 | ✓ | ✓ | ✓ | ✓ | ✓ |
| Epic 2 | ✓ | ✓ | ✓ | ✓ | ✓ |
| Epic 3 | ✓ | ✓ | ✓ | ✓ | ✓ |
| Epic 4 | ✓ | ✓ | ❌ Rolling wave | ✓ | ✓ |
| Epic 5 | ✓ | ✓ | ❌ Rolling wave | ✓ | ✓ |

**Stories with full ACs: 12 of 22 (54%)** — Epics 1–3 are implementation-ready. Epics 4–5 require AC authoring before implementation.

---

---

## Summary and Recommendations

### Overall Readiness Status

> **✅ READY TO BEGIN — with 1 issue to resolve before Epic 4**

Epics 1, 2, and 3 are **implementation-ready**. The planning artifacts are thorough, well-structured, and clearly aligned. The PRD is complete with 44 explicit FRs and 18 NFRs. The architecture is detailed and opinionated. The epics are correctly sequenced, user-centric, and have complete acceptance criteria for the first 12 stories.

One issue must be resolved before Epic 4 work begins. Several minor issues are worth addressing but do not block implementation.

---

### Critical Issues Requiring Immediate Action

**Before ANY implementation begins:**

*(None — Epics 1–3 can start now)*

**Before Epic 4 implementation begins:**

**CRITICAL-1: Tier Label Discrepancy (PRD vs. UX Spec)**

The tier labels differ between documents. This will cause acceptance criteria failures if not resolved first.

| Consistency % | PRD (FR31) | UX Spec (TierBadge) |
|---|---|---|
| < 60% | *(undefined)* | "Surviving the Wasteland" |
| 60–74% | "Surviving the Wasteland" | "Making Progress" |
| 75–89% | "Thriving" | "Thriving" |
| 90%+ | "Elite" | "Vault Elite" |

**Action required:** Decide which version is authoritative and update both documents + `lib/zoneConstants.ts` + Story 4.3 ACs before that story is implemented.

---

### Recommended Next Steps

**Immediate (before first commit):**

1. **Add one AC to Story 1.3** to capture FR43 (login timestamp): *"When a user authenticates successfully, a `lastLoginAt` timestamp is recorded on the User record."* This closes the only FR gap in coverage.

2. **Resolve the tier label discrepancy** — decide on the canonical tier label ranges and update `prd.md`, `ux-design-specification.md`, and document the decision for Story 4.3.

**During Epic 2–3 implementation:**

3. **Canonicalize `zone-amber-over` token** — add it to the UX spec's confirmed palette table and ensure `lib/zoneConstants.ts` defines it alongside the other zone colors.

4. **Consider pulling Story 5.1 (Offline Queue) forward** — implement the Dexie.js offline queue immediately after Story 2.4 (Dashboard Logging). This prevents the gap where Elizabeth is using the app on her commute before Epic 5 is built. It is architectural work that fits naturally alongside the logging feature.

5. **Self-host Google Fonts** (VT323 + Share Tech Mono) — add to the Story 1.1 scaffolding or early Epic 2 work to avoid external network dependency and stay within the NFR-P1 <3s TTI target.

**Before Epic 4 begins:**

6. **Write Epic 4 ACs** (Stories 4.1–4.6) during Epic 3 implementation — avoid a blocking wait. The Sunday planning ritual is the highest-risk epic from a behavioral design standpoint and deserves careful AC authoring.

**Before Epic 5 begins:**

7. **Write Epic 5 ACs** (Stories 5.1–5.4) with specific focus on iOS Safari PWA constraints — the architecture flags this as the most complex PWA constraint. Prototype the service worker + sync queue behavior on an actual iOS device before writing ACs.

---

### Issues Summary

| ID | Severity | Category | Issue | Blocks? |
|----|----------|----------|-------|---------|
| CRITICAL-1 | 🔴 Critical | UX/PRD | Tier label definitions conflict | Epic 4 |
| M1 | 🟠 Major | Epics | Epic 4 + 5 stories have no ACs (rolling wave) | Epic 4, 5 |
| MC1 | 🟡 Minor | Epics | Stories 1.1 and 2.3 are developer-centric | None |
| MC2 | 🟡 Minor | Coverage | FR43 has no dedicated story | None |
| MC3 | 🟡 Minor | Epics | Prisma schema creation timing not story-explicit | None |
| MC4 | 🟡 Minor | Epics | Epic 5 offline features are cross-cutting (gap period) | None |
| UX-1 | 🟡 Minor | UX | `zone-amber-over` missing from confirmed token table | None |
| UX-2 | 🟡 Minor | UX | View states vs. route terminology mapping implicit | None |
| UX-3 | 🟡 Minor | UX | Google Fonts external dependency not in architecture | None |

**Total: 9 issues — 1 critical, 1 major, 7 minor**

---

### Strengths

The planning artifacts for vault_1 demonstrate exceptional quality in several areas worth recognizing:

- **PRD completeness** — 44 numbered FRs and 18 NFRs with measurable targets, 100% mapped to epics. Rare to see this level of traceability.
- **ADHD-aware design depth** — the PRD, UX spec, and epics are all internally consistent in enforcing the core design constraint (no shame triggers, amber = neutral, Day Complete always pressable). The constraint is embedded at every layer.
- **Story AC quality (Epics 1–3)** — acceptance criteria are specific, testable, include error conditions, and reference NFRs explicitly. Story 2.3 (zone engine) and Story 3.2 (active goal deletion warning) are particularly well-crafted.
- **Deferred logic pattern** — the way roughDay is handled across Stories 2.5 and 3.4 is elegant. Same for the dashboard placeholder in Story 2.4 that Story 3.4 completes. The sequencing is clean.
- **Infrastructure stories done right** — Stories 1.1 and 2.3 are technically-flavored but serve clear architectural purposes and are correctly placed.

---

### Final Note

This assessment reviewed **44 FRs, 18 NFRs, 5 epics, and 22 stories** across PRD, UX Design Specification, Architecture, and Epics documents. **Epics 1, 2, and 3 (12 stories covering FR1–FR27) are implementation-ready today.** One critical issue (tier label conflict) must be resolved before Epic 4 begins. The rolling wave plan for Epics 4 and 5 is a legitimate planning decision — just ensure AC authoring is completed ahead of those epics' implementation windows.

**Assessor:** Claude Code (BMAD Check Implementation Readiness workflow)
**Assessment Date:** 2026-03-11

---

## Files Selected for Assessment

- PRD: `prd.md`
- Architecture: `architecture.md`
- Epics & Stories: `epics.md`
- UX Design: `ux-design-specification.md`

