# Claude Code + Codex workflow

A workflow for coding with two AI agents: **Claude Code thinks and reviews, Codex writes the
code.** You decide what gets built and give the "yes" before anything is implemented.

**[See the interactive diagram →](https://pabloochoa-maker.github.io/flujo-claude-codex/)**

## Why

A single agent that understands, plans, implements and reviews burns a lot of tokens and ends up
reviewing its own work. Splitting the work lets each one do what it does best:

| Who | Does | Doesn't |
|---|---|---|
| **You** | Describe the idea, approve the plan, review the PR | — |
| **Claude Code** | Understands, interviews you, writes requirements and the plan, reviews the diff and runs the tests | Implement the big work |
| **Codex** | Implements the plan in batches, with TDD and one commit per task | Decide the design, push or merge |
| **git** | Stores requirements, plans and the record of the work (the PR description) | — |

It follows **spec-driven development**: before any code is written, the idea becomes
requirements, acceptance criteria and a plan in batches, each task with the test that proves it
is done.

## The flow

```
idea → bmad-forge-idea (optional) → /analista → writing-plans → your "yes" → Codex implements → Claude reviews → PR
                                        │                                          ▲               │
                         small feature: brainstorming                              └──── fix ──────┘
```

1. **Define.** `/analista` classifies the request (level 0-4), interviews you with `grilling` and
   writes the requirements to `docs/` with a handoff (`docs/handoff-specifier.md`). For a small
   feature, `brainstorming` is enough.
2. **Plan.** `writing-plans` turns the handoff into a plan of tasks, each with its test, saved in
   `docs/briefs/`.
3. **Approve.** Your "yes" to the plan is the permission to delegate all its batches.
4. **Implement.** `codex-driven-development` groups tasks into batches of 3 to 5 and hands them to
   Codex on a branch or worktree.
5. **Review.** Claude reads the diff and runs the tests itself. If something fails, it goes back
   to Codex.
6. **Close.** A PR is opened describing what was asked, what was decided, what each agent did and
   the tests. There is never a local merge and branches are never deleted.

## What's in this repo

```
claude/CLAUDE-section.md          split rules, appended to ~/.claude/CLAUDE.md
claude/settings.hooks.json        hook registration
hooks/router-prompt.mjs           reminds the split when a message is about code or requirements
hooks/git-guards.mjs              blocks commits and pushes to main, local merges and branch deletion
skills/analista/                  requirements → docs/ + handoff for the plan
skills/codex-driven-development/  runs the plan with Codex in batches while Claude reviews
install/install.ps1               installs all of the above and the third-party pieces
install/verify.ps1                checks that everything works
docs/                             the diagram (index.html), its archify source and licenses
THIRD-PARTY.md                    where every piece that is not part of this repo comes from
```

Superpowers, the Codex plugin, BMAD, `grilling` and archify are **not copied**: the installer
fetches them from their original repositories. See [THIRD-PARTY.md](THIRD-PARTY.md).

The skills and rules talk to you and write documents in your own language.

## Installation (Windows)

You need [Claude Code](https://docs.claude.com/claude-code), the
[Codex CLI](https://github.com/openai/codex) signed in, Node 20+, git and, for BMAD,
Python 3.10+ and `uv`.

```powershell
git clone https://github.com/PabloOchoa-maker/flujo-claude-codex.git
cd flujo-claude-codex
powershell -ExecutionPolicy Bypass -File install\install.ps1
```

Then, inside Claude Code:

```
/plugin install superpowers@claude-plugins-official
/plugin marketplace add openai/codex-plugin-cc
/plugin install codex@openai-codex
/codex:setup
```

Do not turn on Codex's *review gate*. On Windows, if Codex rejects every command, add this to
`~/.codex/config.toml`:

```toml
[windows]
sandbox = "unelevated"
```

Check the installation:

```powershell
powershell -ExecutionPolicy Bypass -File install\verify.ps1
```

The installer backs up `settings.json` and `CLAUDE.md` before touching them (`*.bak-<date>`) and
does not duplicate anything if you run it twice.

## Regenerating the diagram

```powershell
node ~/.claude/skills/archify/bin/archify.mjs finalize workflow docs/workflow.archify.json docs/index.html --quality showcase
```

## License

MIT for what belongs to this repo ([LICENSE](LICENSE)). Third-party pieces keep their own.
