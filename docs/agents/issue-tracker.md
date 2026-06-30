# Issue tracker: GitHub Issues + Local Markdown Mirror

Issues are tracked in **GitHub Issues** (canonical source of truth). Each issue also
has a **local markdown file** in `.claude/local/issues/` for agent-facing context —
richer spec, acceptance criteria, and implementation notes.

## GitHub Issues (canonical)

Use the `gh` CLI. Repo is inferred from `git remote -v`.

- **Create**: `gh issue create --title "..." --body "..."`
- **Read**: `gh issue view <number> --comments`
- **List**: `gh issue list --state open --json number,title,body,labels`
- **Label**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

## Local Markdown Files

Each issue has a corresponding file at `.claude/local/issues/<number>-<slug>.md`.
These carry fuller context than the GitHub issue body (acceptance criteria, linked
PRD sections, implementation notes).

When a skill says "publish to the issue tracker": create a GitHub issue AND write
a local file.
When a skill says "fetch the relevant ticket": read the local file first; fall back
to `gh issue view <number>` if no local file exists.

## Pull requests as a triage surface

**PRs as a request surface: no.** Solo project — external PRs are not a triage surface.
