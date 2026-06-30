# Domain Docs

How the engineering skills should consume this repo's domain documentation.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root — domain vocabulary, ADHD UX invariants, tech
  stack, architectural rules, and current build status.
- **`docs/adr/`** — read any ADRs that touch the area you're about to work in.

If these files don't exist, proceed silently.

## File structure

Single-context repo:

```
/
├── CONTEXT.md
├── docs/adr/
└── apps/
    ├── frontend/
    └── backend/
```

## Use the glossary's vocabulary

When your output names a domain concept, use the term as defined in `CONTEXT.md`.
Key terms: Floor, Ceiling, Zone, Cheat Codes, Day Complete, roughDay, Active Goals,
Tier labels, Weekly Planning Ritual, Hard minimum.

Don't use synonyms the glossary avoids — e.g. don't say "threshold" for "floor",
don't say "disabled" for "Day Complete", don't say "failed" for an amber zone state.

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly:

> _Contradicts ADR-0003 (zone colors from zoneConstants.ts) — but worth reopening
> because…_
