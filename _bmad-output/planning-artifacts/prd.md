---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete]
classification:
  projectType: web_app
  domain: general
  complexity: low-medium
  projectContext: greenfield
inputDocuments:
  - "product-brief-vault_1-2026-03-06.md"
workflowType: 'prd'
briefCount: 1
researchCount: 0
brainstormingCount: 0
projectDocsCount: 0
---

# Product Requirements Document - vault_1

**Author:** Elizabeth
**Date:** 2026-03-07

---

## Executive Summary

Vault 1 is a personal health and habit system built by and for one person — its creator, Elizabeth. The product solves a specific failure pattern endemic to ADHD: the shame-and-spiral loop where a single bad day, broken streak, or red metric becomes justification to abandon the system entirely. Existing solutions fail not because they lack data or gamification, but because they are built on an assumption that clear feedback drives motivation. For an ADHD brain, clear feedback about failure drives avoidance. Vault 1 inverts this assumption at the design level.

The product operates on two layers. **Layer 1 (Win the Day)** is a daily dashboard built around floors, not targets — below-floor performance is rendered as neutral data, not failure. **Layer 2 (Build Your Character)** is a Fallout-themed weekly gamification system that rewards consistency at 60%+ and caps active goals at 3–5 per week, mirroring a coaching session's focus constraint. Together, the layers create a closed loop designed to keep the user engaged through hard weeks, not just easy ones.

The sole user is Elizabeth: mid-30s, ADHD, desk job with morning workouts Mon–Wed, retroactive food logging via Cronometer, and coaching sessions with Alex. Her primary interaction point is her phone, her hardest days are weekends, and her current patchwork system (Cronometer + Apple Watch + texts from coach + mental goals list) has no connective layer. Vault 1 is that layer.

### What Makes This Special

Three design decisions in combination that no existing tool offers:

1. **Floor-based success model.** Below-target is amber, not red. Not failure — neutral data. This single visual decision removes the shame trigger that breaks most habit systems for ADHD users. It is not a feature. It is the architecture.

2. **Cheat Codes (coaching externalization).** Strategies from coaching sessions are always visible on the dashboard — surfaced at the moment of a food or habit decision, not buried in a text from last Tuesday. The app functions as persistent external memory for a coaching relationship.

3. **Active goal constraint (3–5 per week).** The limit is the strategy. Deliberate focus on fewer things, chosen weekly, mirrors the "what are we working on this week?" structure of a coaching session. Doing less on purpose is the design — not a limitation of MVP scope.

---

## Project Classification

| Attribute | Value |
|---|---|
| **Project Type** | Web App (PWA) — mobile-first, installable, responsive 320px–768px |
| **Domain** | General / Personal Wellness — no regulatory requirements, no compliance constraints |
| **Complexity** | Low-Medium — single user, no external integrations in MVP, ADHD-aware UX is thoughtful but not technically complex |
| **Project Context** | Greenfield — building from scratch |

---

## Success Criteria

### User Success

Success for Vault 1 is behavioral, not numerical. The product is working when Elizabeth demonstrates these behavioral shifts:

- **Stays in the system through hard weeks** — a rough day or rough week does not trigger a login gap longer than 3 days
- **Coaching strategies are applied at the moment of decision** — Cheat Codes are being read, not ignored, during food and habit decisions
- **Active goals are remembered mid-week** — can name all 3–5 active goals without opening the app
- **Pre-logging improves** — food logged same-day or next-morning for 4+ days/week (vs. catching up days later)
- **Sunday planning becomes routine** — feels like a 5-minute ritual, not a work task; completed at least 3 of every 4 Sundays
- **No shame spiral lasting more than 2 days** — the floor system and no-streak design do their job

The "aha moment" success scenario: a rough Thursday, goes over calories, doesn't log until Friday morning — opens the app expecting to feel bad, sees amber (not failure), sees 68% consistency, presses Day Complete, gets XP, comes back Sunday. The spiral didn't happen.

### Business Success

Vault 1 has no business model — it is a personal tool. "Business success" is personal objective success:

**4–6 weeks:**
- Weekly planning ritual completed 3 of first 4 Sundays
- App opened and dashboard checked 5+ days/week
- Pre-logging rate: food logged same-day or next-morning for 4+ days/week
- At least one rough week navigated without a multi-day login gap

**3 months:**
- Weekly consistency % averaging 65%+ across the month
- Cheat Codes updated and actively referenced
- No shame spiral lasting longer than 2 days before returning
- Sunday planning feels routine, not a chore

**6–12 months:**
- Measurable progress toward 30 lb outcome goal (tracked separately — a result of process, not the process metric)
- Character at Level 5+ (reflects sustained engagement)
- Planning and logging feel automatic — habits, not decisions

### Technical Success

- PWA installable and reliable on mobile (primary device) — no friction to open
- Responsive at 320px–768px with no layout failures
- Core daily interactions (log, Day Complete, check goals) completable in under 60 seconds
- No data loss — daily logs and goal state persist reliably
- Offline-capable for core logging actions (poor connectivity during commute)

### Measurable Outcomes

| Metric | Target | How Measured |
|---|---|---|
| Weekly consistency % | ≥ 65% | Calculated in-app each week |
| Day Complete presses | ≥ 5/week | In-app tracking |
| Weekly planning ritual | Completed each Sunday | Boolean per week |
| Days since last login | ≤ 2 (no long gaps) | In-app login tracking |
| Pre-logging rate | 4+ days/week same-day or next-morning | Log timestamp vs. log date |
| Active goal recall | Can name all 3–5 without checking | Self-assessed monthly |

**Failure conditions to watch:**
- Gamification gaming (pressing Day Complete without tracking, fake XP)
- Planning ritual consistently skipped (ritual too heavy — needs to feel like a 5-minute win)
- Login gaps > 5 days (early warning of full abandonment)

---

## Product Scope

### MVP — Minimum Viable Product

The complete core loop: daily tracking without shame + coaching strategies at point of need + weekly planning ritual that prevents "fresh start Monday."

- User setup and onboarding (targets, floors, Cheat Codes, initial goals)
- Win the Day dashboard (floor-based progress bars, Cheat Codes always visible, Day Complete, mood tagging)
- Available Goals library (create, edit, delete)
- Weekly Active Goal selection (3–5 enforced, progress tracked)
- Weekly Planning Ritual (prior week review, consistency %, goal selection for next week)
- Fallout theme + PWA (Vault-Tec palette, installable, responsive)

**MVP go-signal for Phase 2:** 4+ weeks of consistent use with 65%+ weekly consistency average.

### Post-MVP & Vision

Phase 2 (gamification + adaptive layer), Phase 3 (Apple Health integration, native logging), and Phase 4+ (coach-facing view, multi-user expansion) are detailed in the Project Scoping & Phased Development section, including rationale, gate criteria, and risk mitigation.

---

## User Journeys

### Journey 1: Elizabeth — The Core Daily Loop (Success Path)

*Where we meet her:* It's 8:47am on a Tuesday. Elizabeth is at her desk, post-commute, coffee in hand. She worked out at 4:45am. She didn't log yesterday's food — she rarely does in the evening.

*The opening:* She opens Vault 1 on her phone. The app prompts: "Yesterday not closed — want to complete it now?" She taps yes, quickly logs yesterday's calories and protein from memory (roughly accurate, good enough), and presses Day Complete. The day closes. No red numbers. No guilt about logging late.

*Rising action:* She swipes to today. Her progress bars are at zero — expected. Her three active goals for the week are visible: calorie floor, protein floor, and "walk 3 days." Her Cheat Codes are there: "Eat the protein first," "Plan the snack before you need it," "One rough day is just data." She's not going to need them right now, but they're there.

*Climax:* At lunch, she's deciding whether to get the sandwich or the salad. She glances at her phone. Protein bar: 340/120g. The Cheat Code catches her eye: "Eat the protein first." She gets the higher-protein option without deliberating.

*Resolution:* At 9pm, she's at 1,840 cal / 118g protein / 7,200 steps. Floor on protein. Above floor on calories. Just below target on steps. She presses Day Complete. Mood: "solid." The app shows her weekly consistency: 3/4 days completed, two active goals green. She closes the app. Tomorrow she'll check again.

**Requirements revealed:** Dashboard with real-time progress bars, Cheat Codes persistent and always visible, Day Complete workflow, yesterday's completion prompt on login, mood tagging.

---

### Journey 2: Elizabeth — The Rough Thursday (ADHD Edge Case)

*Where we meet her:* It's Thursday evening, 9:30pm. Work was hard. She ate lunch late, went over calories, skipped the afternoon walk. She hasn't opened the app since Tuesday morning. The old pattern: avoid the app, feel guilty, avoid more.

*The opening:* She opens Vault 1. The old app (Cronometer) would show her a red number at 2,200 calories and a broken streak. Vault 1 shows her: calories at amber (above target — logged, not judged), protein at green (she hit the floor), steps at amber. Two of three active goals still green this week.

*Rising action:* She hesitates at Day Complete. Nothing is "done" the way she wanted it. But the button isn't locked. She presses it. Mood: "rough." The app doesn't respond with a lecture or a streak warning. It logs the day and shows her weekly: 3 of 4 days completed, 2 of 3 active goals on track, 68% consistency.

*Climax:* 68%. The app labels it: "Surviving the Wasteland." Not "failed." Not "needs improvement." Just — still in the game. She didn't need to have a perfect week to stay in the system.

*Resolution:* Friday morning she opens the app again. The Thursday log is there, closed, not catastrophic. She logs breakfast. The spiral didn't happen. Sunday she plans next week without shame about Thursday.

**Requirements revealed:** Floor-based color system (amber ≠ failure), Day Complete always pressable, no streak mechanics, weekly consistency % with tier labels, emotional safety as a first-class design constraint.

---

### Journey 3: Elizabeth — Sunday Planning Ritual

*Where we meet her:* It's Sunday at 11am. She's done meal prep. The weekly planning ritual is next — the thing she used to skip because it felt like homework.

*The opening:* She opens Vault 1's weekly planning view. Last week's summary loads: each active goal with days completed, a simple grid. Protein floor: 5/7. Calorie floor: 4/7. Walk 3 days: 3/3 (goal met). Weekly consistency: 71%. "Surviving the Wasteland."

*Rising action:* The app surfaces a suggestion: "You hit the walk goal 3/3 — consider keeping it. Protein floor was close — worth another week." She reviews each goal: keep, keep, swap "daily steps check-in" for "pre-log lunch." Her Cheat Codes feel stale — she updates one based on something Alex said last week via text.

*Climax:* She selects next week's 3 active goals. The app confirms: 3 selected (maximum focus maintained). She presses "Start Week." The dashboard resets. New goals visible.

*Resolution:* The whole ritual took 8 minutes. Not a work task — a ritual. Monday-her will open the app knowing exactly what she's tracking.

**Requirements revealed:** Weekly planning screen, prior week goal summary by day, consistency % with tier labels, app-suggested goal carry/swap, Cheat Code editing, goal selection for next week with enforced 3–5 cap, week start trigger.

---

### Journey 4: Elizabeth — First-Time Setup (Onboarding)

*Where we meet her:* It's a Sunday afternoon, the first one. She's decided to build this for herself. She has her Cronometer targets in her head and three coaching tips from Alex's last text.

*The opening:* She creates her account — username and password, nothing else. She works through three onboarding steps: first her biometrics (she picks imperial since she thinks in lbs and feet), then her goal type ("Lose weight"), then her calorie target — she taps "Suggest one for me" and sees a TDEE-based recommendation she edits slightly before confirming. She also enters her protein and steps targets. The app calculates her floors: calorie floor = her BMR, protein floor = target × 0.8, steps floor = target × 0.5. Ceiling = calorie target + 200. She sees them. That feels right — achievable on a hard day.

*Rising action:* She types in her three Cheat Codes. "Eat the protein first." "Plan the snack before you need it." "One rough day is just data." She selects her first 3 active goals from the starter library: calorie floor, protein floor, walk 3 days/week.

*Climax:* She opens the dashboard for the first time. Everything she needs to track is already there. Progress bars at zero, goals listed, Cheat Codes visible. It looks like a Vault-Tec interface — retro, clean, hers.

*Resolution:* She logs today's food. Presses Day Complete. The first day is in the books. One Sunday afternoon to set up, and the system is live.

**Requirements revealed:** Account creation (username + password), biometrics collection (weight, height, age, sex, activity level, measurement system preference), goal type selection (lose/maintain/build), calorie target with TDEE-based suggestion option, 1,400 cal hard minimum, BMR-based floor calculation, ceiling = target + 200, protein and steps target entry, Cheat Code entry (max 3), starter goal library, goal selection, first-run dashboard state.

---

### Journey Requirements Summary

| Capability Area | Driven By |
|---|---|
| Floor-based progress bars (amber/green/blue) | Journey 1, 2 |
| Cheat Codes always visible on dashboard | Journey 1, 2 |
| Day Complete — always pressable, mood tagging | Journey 1, 2 |
| Yesterday's completion prompt on login | Journey 1 |
| Weekly consistency % with tier labels | Journey 2, 3 |
| No streaks, no red failure states | Journey 2 |
| Weekly planning screen with prior-week summary | Journey 3 |
| Active goal management + 3–5 enforcement | Journey 3, 4 |
| Cheat Code editing | Journey 3 |
| Target entry + automatic floor calculation | Journey 4 |
| Account creation (minimal) | Journey 4 |
| Starter goal library | Journey 4 |

*Note: Alex (coach) has no direct app interaction — no journey mapped. There is no admin, moderation, or API consumer in MVP scope.*

---

## Domain-Specific Requirements

### Data Privacy & Ownership

Personal health-adjacent data (food logs, mood tags, step counts, habit patterns, coaching strategies) is stored server-side. No third-party data sharing, no analytics services that receive personal log data. No regulatory compliance required (not a clinical tool, not HIPAA-applicable). User owns their data; export capability deferred to Phase 2.

### Technical Constraints

**Authentication & Sessions**
- Username + password authentication (no OAuth required for MVP)
- Persistent sessions following standard app practices — user should not need to re-authenticate on each use
- Password reset flow required (email-based or equivalent)
- Passwords hashed with bcrypt or Argon2; session tokens stored securely (HttpOnly cookies or equivalent)

**Offline Behavior**
- Core logging actions (calories, protein, steps, workout checkbox, Day Complete) must work offline
- Logs queue locally when offline and sync automatically when connectivity is restored
- No silent data loss — if a sync fails, the local record is retained until confirmed

**PWA & Platform**
- Service worker required for offline support and installability
- Web app manifest for "Add to Home Screen" on iOS and Android
- HTTPS required (PWA install requirement + session security)

**Apple Health Integration Path (Future Constraint)**
- HealthKit is iOS-native only; PWA browsers cannot access it directly
- Phase 3 Apple Health integration will require a native iOS app, a React Native/Flutter wrapper, or a companion native sync app
- The MVP PWA architecture does not block this path — the backend data model should be designed with HealthKit data shapes in mind (steps as integer, workouts as boolean/duration) to ease future integration

### Accessibility

ADHD-aware UX philosophy baked into all design decisions, with WCAG 2.1 Level AA compliance required (see Non-Functional Requirements). Key design principles:
- Low cognitive load: one primary action per screen state
- Clear visual hierarchy: progress bars, color zones, and Cheat Codes scannable at a glance
- No shame-inducing feedback: no red states, no streak counters, no "you failed" language anywhere in the UI
- Touch targets minimum 44×44px per iOS HIG and WCAG mobile guidance

### Risk Mitigations

| Risk | Mitigation |
|---|---|
| Data loss (sole user, no redundancy) | Reliable server-side persistence; Phase 2 adds JSON export |
| Offline sync conflict (rare — single user, single device) | Last-write-wins acceptable; log timestamps as tiebreaker |
| Session security | HttpOnly cookies, HTTPS enforced, no sensitive data in localStorage |
| HealthKit path locked out by PWA choice | Documented constraint; native wrapper planned for Phase 3 |

---

## Innovation & Novel Patterns

### Detected Innovation Areas

**1. Inverted Feedback Architecture**
Every existing habit tracker is built on the assumption that visible data → motivation. Vault 1 challenges this at the architecture level: for ADHD brains, visible data about failure → avoidance. The entire UX is designed around this inversion. Floor-based progress bars, shame-free color zones, no streak counters, and tier labels that treat 60% as a win are all expressions of this single insight.

**2. Calorie-Asymmetric Color Zone Model**
Calories are architecturally different from protein and steps — going significantly over is a meaningful signal, not a bonus. The color model reflects this asymmetry:

| Zone | Calories | Protein / Steps |
|---|---|---|
| Below floor | Amber-low (too low — neutral) | Amber (neutral) |
| Floor → target | Green (sweet spot) | Green (on track) |
| Target → target+threshold | Amber-over (soft miss — data, not failure) | Blue (bonus) |
| Above target+threshold | Orange ("Danger Zone") | N/A |

No red states anywhere. The orange Danger Zone is honest signal without shame trigger. Label language should be Fallout-neutral (e.g., "Rad Zone"), not judgmental. Threshold value (e.g., +200 kcal) to be validated against coaching guidance.

**3. Coaching Externalization as First-Class Feature**
Cheat Codes are architecturally primary — always visible, always on the dashboard, treated as load-bearing content rather than an optional notes field. The innovation is positioning coaching memory as infrastructure, not a feature.

**4. Active Goal Constraint as Design Principle**
A cap of 3–5 active goals per week is the product, not a limitation. Deliberate focus on fewer things, chosen weekly, mirrors the structure of a coaching session. No existing consumer habit app enforces intentional focus constraint as a primary design decision.

**5. ADHD-Native, Not ADHD-Adapted**
Built from the inside out by someone with ADHD for themselves — every decision originates from lived experience of exactly where these systems break down.

### Market Context & Competitive Landscape

Vault 1 operates in a distinct product category — **shame-proof habit infrastructure** — that existing tools are not attempting to occupy. Each tool below is succeeding at something different:

| Tool | What It's Actually Doing |
|---|---|
| Cronometer | Nutrition database with a logging UI — excellent at data, not solving the shame spiral |
| Habitica | Gamified task manager — rewards completion, still penalizes inconsistency |
| Finch / Reflectly | Emotional wellness framing — no nutrition/habit integration |
| Notion/Bullet Journal | Flexible personal system — entirely user-constructed, no ADHD-native structure |
| **Vault 1** | Shame-proof habit infrastructure — floor-based UX + coaching memory + focused goals, built ADHD-native |

### Validation Approach

**Proxy metric:** Login frequency after rough days. If the floor system works, login gaps should stay ≤ 2 days even after above-target days.

**Rough day definition:** A day where fewer than 50% of active goals are achieved at Day Complete. Computed automatically — no extra tracking required. Backend logs a `roughDay` boolean at Day Complete time (derived: active goals hit / total active goals < 0.5).

**Direct signal:** Day Complete pressed on days where no metrics hit target — the behavior the architecture is designed to enable.

**Qualitative signal:** Does the app feel like relief rather than judgment after a hard day? Verifiable within the first month of use.

The 4-week MVP evaluation period is specifically designed to validate this assumption before Phase 2 investment.

### Risk Mitigation

| Innovation Risk | Mitigation |
|---|---|
| Floor system feels "too easy" and loses pull | Tier labels ("Surviving the Wasteland" → "Thriving" → "Elite") provide aspiration without punishment |
| Calorie Danger Zone triggers shame response | No red; orange is informational. Fallout-neutral label language required |
| Gamification gaming (XP without behavior) | XP deferred to Phase 2; MVP proves behavioral loop first |
| Goal constraint feels restrictive | 3–5 range (not 3 hard cap); user chooses weekly within that range |
| Innovation too personal to generalize | MVP is explicitly for one user; expansion only after proven system |

---

## Web App Specific Requirements

### Project-Type Overview

Vault 1 is a **Single Page Application (SPA)** delivered as a **Progressive Web App (PWA)**. All navigation and state transitions happen client-side — no full-page reloads. The app is installable on mobile home screens and functions as a near-native experience on iOS and Android.

The SPA architecture supports: fast transitions between dashboard, weekly planning, and settings views; offline capability via service worker + local data queue; persistent state across navigation without losing mid-entry form data (critical for logging flows).

### Browser Matrix

| Browser | Platform | Priority | Notes |
|---|---|---|---|
| Safari | iOS (iPhone) | P1 — Primary | Dominant use case; all PWA behavior must work here |
| Chrome | Android mobile | P2 | Secondary mobile target |
| Chrome | Desktop | P2 | Desktop logging sessions |
| Safari | macOS desktop | P2 | Same engine as iOS; low extra effort |
| Firefox | Desktop | P3 | Best-effort; no special optimizations |

**iOS Safari PWA constraints to account for:**
- Service worker support exists but is more limited than Chrome — offline strategy must be tested on iOS Safari specifically
- "Add to Home Screen" on iOS uses Apple's Web App manifest interpretation — test installability on iOS
- Push notifications not available in iOS PWA (not needed for MVP, but relevant for Phase 2 reminders)

### Responsive Design

- Mobile-first: 320px–768px is the primary design range
- Desktop layout: content should be readable and usable at 1024px+, but not optimized — phone is primary
- No horizontal scroll at any supported viewport
- Vault-Tec / Fallout retro-futuristic visual theme applied consistently across all breakpoints

### Performance Targets

| Metric | Target | Rationale |
|---|---|---|
| Time to Interactive (mobile) | < 3 seconds on 4G | Phone use during commute — must feel instant |
| Core logging action (log + Day Complete) | < 60 seconds end-to-end | Established success criterion |
| Offline action availability | Immediate (no wait) | Must work during underground commute |
| Bundle size (initial load) | < 250KB gzipped | PWA on mobile network |
| App launch from home screen | < 2 seconds | Installed PWA should feel native |

### SEO Strategy

Not applicable. Vault 1 has no public-facing pages — all content is behind authentication. No SEO optimization required.

### Accessibility Level

WCAG 2.1 Level AA required (see Non-Functional Requirements). ADHD-aware UX philosophy applied throughout: touch targets minimum 44×44px, single primary action per screen state, no shame-inducing visual language.

### Implementation Considerations

- **State management:** SPA with local state + sync queue for offline-first logging. Lightweight state solution (Zustand, Pinia, or similar) preferred over heavy frameworks
- **Routing:** Client-side routing with distinct routes for: dashboard, weekly planning, goals library, settings/profile, onboarding
- **Data sync:** Local-first architecture — writes go to local store immediately, sync to server asynchronously. User never waits for network on core actions
- **No SSR required:** No SEO needs, no public pages — client-side rendering only simplifies deployment
- **Deployment:** Static asset hosting (Vercel, Netlify, or similar) + separate API backend

---

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-Solving MVP — validates a single behavioral hypothesis before investing in gamification and adaptive layers.

**The hypothesis:** An inverted feedback architecture (floor-based neutral states, no streaks, coaching surfaced at point of need) will keep a user with ADHD engaged through rough days and rough weeks, breaking the shame-and-spiral pattern that causes abandonment of existing tools.

**MVP is validated when:** 4+ weeks of consistent use with 65%+ weekly consistency average — proving the behavioral loop works before Phase 2 investment.

**Resource Profile:** Solo developer building for personal use. All scope decisions weight toward minimum viable over completeness.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:** All four (daily loop, rough day recovery, Sunday planning ritual, first-time setup). The product is not useful without all four — they form a single closed loop.

**Must-Have Capabilities:**

| Feature | Rationale |
|---|---|
| Account creation (username + password + password reset) | Entry point; required for session persistence |
| Target entry + automatic floor calculation | Setup requires this to be meaningful |
| Cheat Code entry (max 3) | Core innovation — must be in MVP |
| Starter goal library + goal creation/edit/delete | Required for weekly planning ritual |
| Win the Day dashboard — floor-based progress bars (calorie-asymmetric model) | Core hypothesis being tested |
| Cheat Codes always visible on dashboard | Core innovation — must be in MVP |
| Day Complete — always pressable, mood tagging | Critical to rough day recovery journey |
| Yesterday's completion prompt on login | Supports retroactive logging pattern |
| Active goal selection (3–5 enforced, weekly) | Core design constraint — must be enforced |
| Weekly consistency % calculation with tier labels | Validates behavioral loop |
| Weekly planning screen with prior-week summary + goal selection | Sunday ritual journey |
| App-suggested goal carry/swap | Reduces planning friction — keeps ritual under 10 min |
| Fallout / Vault-Tec visual theme | Identity and engagement |
| PWA (service worker, manifest, offline logging queue) | Mobile-first; offline logging during commute is critical |
| `roughDay` boolean logged at Day Complete | Enables innovation validation metric |

**Explicitly Out of MVP:**

| Feature | Reason |
|---|---|
| XP, levels, SPECIAL stats | Core loop must prove itself first |
| Bunker progression | Depends on leveling system |
| Encounters system | Valuable but not load-bearing |
| Maintenance Mode | Builds on proven floor system |
| Cronometer CSV import | Manual logging sufficient; desktop-only export is friction |
| Outcome goals + weight tracking | Emotionally loaded; independent of core loop |
| Character creation (full Fallout) | Simplified onboarding covers the need |
| Apple Health integration | Requires native app — Phase 3 |
| Push notifications | Not available on iOS PWA — Phase 2 |

### Post-MVP Features

**Phase 2 — Adaptive & Gamified Layer** *(unlocked after 4+ weeks / 65%+ consistency)*
- XP, levels, SPECIAL stats
- Bunker progression with functional bonuses
- Encounters system (plan challenges, earn XP for reflection)
- Maintenance Mode (deliberate reduced-target state)
- Cronometer CSV import
- Outcome goals + weight tracking (weekly average only)
- JSON data export

**Phase 3 — Depth & Integration**
- Apple Health integration (requires native iOS app or wrapper)
- Advanced analytics: mood trends, consistency charts, XP history
- Native logging (replace Cronometer dependency)
- Push notifications (via native wrapper)

**Phase 4+ — Potential Expansion**
- Coach-facing view (Alex sees active goals + Cheat Codes)
- Apple Watch native app
- Opening to others with ADHD + coaching needs

### Risk Mitigation Strategy

**Technical Risks:**
- *Offline sync on iOS Safari* — most complex PWA constraint. Prototype service worker + sync queue early; test on actual iOS before building dependent features
- *Local-first data sync conflicts* — low risk (single user, single device); last-write-wins policy documented
- *HealthKit future path* — data model designed with HealthKit shapes now to avoid migration cost later

**Behavioral Risks:**
- *Core hypothesis fails* — floor system doesn't prevent avoidance. `roughDay` boolean + login gap tracking provide early signal within first 2 weeks
- *Gamification gaming* — Day Complete pressed without genuine tracking. XP deferred to Phase 2; MVP measures behavior before adding reward layer

**Resource Risks:**
- *Solo developer, personal project* — no team buffer, built in personal time. MVP is intentionally minimal; any scope creep deferred to Phase 2 gate
- *Premature Phase 2 scope creep* — Phase 2 gate is explicit (4 weeks / 65%+) and documented — not a judgment call

---

## Functional Requirements

### User Account Management

- **FR1:** User can create an account with a username and password
- **FR2:** User can log in with username and password
- **FR3:** User can remain logged in across app sessions without re-authenticating
- **FR4:** User can reset their password
- **FR5:** User can log out

### Setup & Configuration

- **FR6:** User can provide biometrics (weight, height, age, biological sex, activity level) and set daily targets for calories, protein, and steps during onboarding
- **FR7:** The system automatically calculates floor and ceiling values from biometrics and targets: calorieFloor = BMR calculated via Mifflin-St Jeor equation; calorieCeiling = calorieTarget + 200; proteinFloor = round(proteinTarget × 0.8); stepsFloor = round(stepsTarget × 0.5). Calorie entries below 1,400 cal are rejected at input regardless of calculated floor.
- **FR8:** User can update their targets at any time
- **FR9:** User can create up to 3 Cheat Codes (coaching strategy reminders)
- **FR10:** User can edit and delete existing Cheat Codes

### Daily Tracking

- **FR11:** User can log daily values for calories, protein, steps, and workout completion
- **FR12:** User can view their current day's progress as color-coded progress bars reflecting floor-based zones
- **FR13:** The system applies a calorie-asymmetric color zone model to the calorie progress bar (below-floor: amber-low; floor→target: green; target→threshold: amber-over; above threshold: orange)
- **FR14:** The system applies a standard color zone model to protein and steps progress bars (below-floor: amber; floor→target: green; above-target: blue)
- **FR15:** User can view their Cheat Codes on the daily dashboard at all times, without any navigation required
- **FR16:** User can press Day Complete at any time regardless of whether daily metrics were achieved
- **FR17:** User can select a mood tag when pressing Day Complete
- **FR18:** The system prompts the user to complete the previous day if it was not closed at login
- **FR19:** The system records a `roughDay` flag at Day Complete time (derived: fewer than 50% of active goals achieved that day)

### Goals Management

- **FR20:** User can create goals in a personal goals library
- **FR21:** User can specify a goal type (daily metric-based or weekly frequency-based)
- **FR22:** User can edit goals in their library
- **FR23:** User can delete goals from their library
- **FR24:** The system provides a starter library of pre-defined goals available during onboarding and goal selection
- **FR25:** User can select 3–5 active goals per week from their goals library
- **FR26:** The system enforces a minimum of 3 and maximum of 5 concurrently active goals
- **FR27:** User can view their active goals and per-goal progress on the daily dashboard

### Weekly Planning

- **FR28:** User can access a weekly planning view
- **FR29:** User can view the prior week's results per active goal (days achieved vs. total days)
- **FR30:** User can view their weekly consistency percentage
- **FR31:** The system displays a tier label corresponding to weekly consistency % (60–74%: "Surviving the Wasteland"; 75–89%: "Thriving"; 90%+: "Elite")
- **FR32:** The system suggests which goals to keep, drop, or add based on prior week performance
- **FR33:** User can select active goals for the upcoming week (3–5 enforced)
- **FR34:** User can start a new week, which resets the dashboard to the newly selected active goal set
- **FR35:** User can edit Cheat Codes from within the weekly planning view

### Data Integrity & Offline

- **FR36:** User can perform core logging actions (calories, protein, steps, workout, Day Complete) while offline
- **FR37:** The system queues offline actions and syncs them automatically when connectivity is restored
- **FR38:** The system retains local records until server sync is confirmed — no silent data loss on failed sync
- **FR39:** User's data (daily logs, goals, configuration, weekly history) persists reliably across sessions

### Progressive Web App

- **FR40:** User can install the app to their mobile device home screen
- **FR41:** The app is accessible and functional across iOS Safari (P1), Chrome mobile, and desktop browsers
- **FR42:** The app layout adapts responsively for mobile (320px–768px primary) and desktop viewports

### System Tracking

- **FR43:** The system records login timestamps to support login gap monitoring
- **FR44:** The system calculates weekly consistency % as active goal days achieved divided by total possible active goal days for the current week

---

## Non-Functional Requirements

### Performance

- **NFR-P1:** Dashboard (daily view) is interactive within 3 seconds on a mid-range mobile device on 4G connectivity
- **NFR-P2:** User-initiated tracking actions (log food, mark habit, complete day) provide visual feedback within 300ms; full save completes within 1 second under normal conditions
- **NFR-P3:** App shell loads from service worker cache within 1 second on repeat visits (offline or online)
- **NFR-P4:** Offline-to-online transition is transparent — queued actions show no error state; sync happens silently in the background

### Security

- **NFR-S1:** All data transmitted between client and server uses HTTPS/TLS
- **NFR-S2:** Personal health and behavioral data stored server-side is encrypted at rest
- **NFR-S3:** Authentication sessions persist across visits (remember-me); users can sign out and invalidate the session
- **NFR-S4:** Each user's data is strictly isolated — no cross-user data access is possible at any layer
- **NFR-S5:** Password reset is available via standard email-based recovery

### Reliability

- **NFR-R1:** All tracking actions performed offline are queued locally and synced when connectivity is restored — no data is silently lost
- **NFR-R2:** Sync failures retry automatically (minimum 3 attempts with exponential backoff) before surfacing a non-blocking notification to the user
- **NFR-R3:** All core tracking features function fully in offline mode; only sync-dependent features (cross-device access) are unavailable offline
- **NFR-R4:** App data is not lost during PWA updates or service worker refreshes

### Accessibility

- **NFR-A1:** All user-facing interfaces meet WCAG 2.1 Level AA standards
- **NFR-A2:** All interactive elements are keyboard navigable and screen reader compatible
- **NFR-A3:** Color is never the sole means of conveying information — status indicators include text labels or icons alongside color
- **NFR-A4:** All interactive tap/click targets are minimum 44×44px
- **NFR-A5:** Primary action areas display no more than 5 items — cognitive load reduction is a first-class design constraint
