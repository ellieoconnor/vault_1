## Agent skills

### Issue tracker

GitHub Issues (canonical) + local markdown mirror in `.claude/local/issues/`
(agent working copies). No external PRs as triage surface — solo project.
See `docs/agents/issue-tracker.md`.

### Triage labels

Default label strings: `needs-triage`, `needs-info`, `ready-for-agent`,
`ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` at repo root + `docs/adr/` for architectural
decisions. See `docs/agents/domain.md`.
