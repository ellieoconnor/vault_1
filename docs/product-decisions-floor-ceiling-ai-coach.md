# Product Decisions — Floor/Ceiling System & AI Coach Vision

**Date:** 2026-04-22
**Context:** Emerged during Story 2.1 implementation — original story was too simplified and needed a rethink.

---

## Floor & Ceiling System

### Hard Minimum (absolute block)
- No calorie entry below **1,400 cal** — rejected at input with a clear, kind message
- Applies to everyone regardless of biometrics
- 1,200 was considered but deemed too low for any adult body

### Floor (zone bottom)
- Calculated from **BMR using Mifflin-St Jeor equation**
- Requires biometrics — **non-negotiable**
- Floor = BMR (the biological minimum for that person's body)

### Ceiling (zone top)
- User's confirmed calorie target **+ 200 cal buffer**
- Going 50-150 over target is not a failure — ceiling absorbs that
- Above ceiling = yellow/red zone. Below floor = yellow/red in the other direction

---

## Onboarding Flow

```
Step 1 — Biometrics (required)
  Weight, height, age, biological sex, activity level
  → App calculates BMR + TDEE silently

Step 2 — Goal type
  [ Lose weight ] [ Maintain ] [ Build ]

Step 3 — Calorie target
  Option A: "Suggest one for me" → TDEE-based recommendation shown
  Option B: "I'll enter my own" → free entry, blocked below 1,400
  Either way, user sees and confirms the number
```

- Biometrics required for floor — no skip
- Target is always user-confirmed, never forced
- App suggests, user owns the decision

---

## Story 2.1 Impact (Correct Course required)

Current story was too simplified. Changes required:

- `UserConfig` schema needs biometrics fields: weight, height, age, sex, activity level
- Floor calculation must be BMR-based, not flat offset (`target - 250`)
- Onboarding form is significantly larger than originally designed
- New additive migration needed on top of existing `UserConfig` migration
- Goal type (lose / maintain / build) becomes a required field

---

## Database Architecture

**Keep:** Neon + Prisma as primary (all structured data)

**Add later:** pgvector extension on the same Neon instance
- No separate database needed
- Same connection string, same Prisma setup
- Enable when AI coaching is ready — zero infrastructure change

---

## AI Coach Vision (Future Epic)

### Scope — what the AI does
- Reads user history, stated goals, and observable patterns
- Answers conversational questions ("do I struggle on weekends?")
- Helps set and refine goals using the three-tier system
- Surfaces insights proactively

### Scope — what the AI does NOT do
- No medical advice
- No prescriptive health guidance
- Stays in the lane of: *your data, your goals, your patterns*

### Three-Tier Goal System
```
Values     → "I want to feel energetic"          (the why)
Outcome    → "Lose 20lbs by December"            (the what)
Process    → "Hit protein goal 5x/week"          (the how)
```

Goals stored as **first-class entities** with parent-child linking, not free text.
- Structured for querying progress
- Semantic embeddings for AI understanding

### Why Semantic (pgvector)
Pattern questions require retrieval across all history, not just recent rows. Semantic search finds relevant context that structured queries can't. Example: "do I tend to struggle on weekends?" — a semantic query across all logs finds the pattern; a structured query would require knowing to look for it.

### Goal Data Model (when ready)
```
Goal
  type: values | outcome | process
  statement: string (user's own words)
  createdAt: DateTime
  active: boolean
  linkedGoalId → parent goal (process → outcome → values)
```

---

## Next Steps

**Immediate:** Run `/bmad-bmm-correct-course` in a fresh window with this document as context to update Story 2.1 and assess ripple effects on PRD/architecture.

**Before AI coaching epic:** Design Goal data model as first-class entities and enable pgvector on Neon instance.
