---
name: codex-driven-development
description: Use INSTEAD OF superpowers:subagent-driven-development when executing an approved implementation plan. Codex implements the tasks in batches through the codex:codex-rescue subagent; Claude coordinates, keeps the ledger and reviews.
---

# Codex-Driven Development

An adaptation of `superpowers:subagent-driven-development`
([obra/superpowers](https://github.com/obra/superpowers), MIT, © 2025 Jesse Vincent) to the
Claude + Codex split: **Claude coordinates and reviews; Codex implements.** Everything this skill
does not change is done as in the original (ledger, preflight, fix loop, final review).

Superpowers scripts (the version folder changes when the plugin updates):

```bash
SDD=$(ls -d ~/.claude/plugins/cache/claude-plugins-official/superpowers/*/skills/subagent-driven-development | tail -1)
```

## Before starting

1. The plan has already been approved by the user. That "yes" to the plan covers every batch:
   do not ask again between batches, except for the original's four stops (something
   irreversible, something security-sensitive, push/merge/publish, a broken plan).
2. Work on a branch, never on `main`/`master`. In repos with a protected branch, work on your own
   branch and land the result through a PR/MR.
3. Workspace and ledger: `bash "$SDD/scripts/sdd-workspace" PLAN_FILE` and the `progress.md`
   ledger as in the original. After a context compaction, send the ledger + `git log`.
4. Read `$SDD/references/preflight.md` and run the conflict scan.

## Batches instead of single tasks

A Codex run starts cold and re-reads the repo: do not launch one per 5-minute task. Group
**consecutive tasks that share files or interfaces**, 3 to 5 per batch (the whole plan if it is
short). Never run two Codex batches in parallel.

For each batch:

1. Record `BASE=$(git rev-parse HEAD)` in the ledger.
2. Generate one brief per task: `bash "$SDD/scripts/task-brief" PLAN_FILE N`.
3. Launch **one** `Agent` with `subagent_type: "codex:codex-rescue"` and this brief:

```
Implement tasks N..M of the plan. First read these briefs, in order; they are your
requirements with the exact values: <brief paths>.
Context: <one line on where this fits>. Interfaces from earlier batches: <signatures>.
Ambiguities already resolved: <decisions>.
Rules: TDD (failing test → minimal code → green test), one commit per task,
commit messages with your usual co-author line (do not remove it), do not touch files outside
the briefs, do not launch subagents, do not push or merge.
When done, write <workspace>/batch-K-report.md with, per task: files touched, commits, test
command and its result, and open questions. Last line of the report and of your reply:
STATUS: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED.
If information is missing, do NOT guess: stop, write NEEDS_CONTEXT and the question.
```

4. Depending on the status: `DONE` → review. Anything else → read
   `$SDD/references/handling-reports.md`. If it is `NEEDS_CONTEXT`, answer and resume the same
   work by asking `codex:codex-rescue` to continue (`--resume`).

**Sandbox note.** Codex's sandbox can only write inside the directory it was launched from. If
the plan runs in a git worktree whose `.git` metadata lives in another folder, Codex cannot
commit: launch it from the worktree, tell it to leave its changes uncommitted, and have Claude
create the commits after reviewing them.

## Review (Claude)

- Diff package: `bash "$SDD/scripts/review-package" PLAN_FILE BASE HEAD`.
- Batch reviewer: a general-purpose `Agent` with **model: sonnet**, using the
  `$SDD/task-reviewer-prompt.md` template (briefs + report + package + global constraints).
- On top of that, Claude runs the tests itself once per batch; Codex's report does not replace
  that check.
- If there are findings: read `$SDD/references/fix-loop.md` before each round. Rounds 1-3 go to
  `codex:codex-rescue` with `--resume`; rounds 4-5 get a new brief and `--fresh`.
- Complete the batch in the ledger as in the original.

## Final

- Whole-branch review with **model: opus**, following `$SDD/references/final-review.md`.
- If the plan changes the structure (modules, services, tables), offer the user an `archify`
  before/after diagram (architecture delta or `erd`) to review the PR/MR. Local, in `.archify/`;
  not committed.
- **Record in git, not in files.** Superpowers deletes its workspace when it finishes, and the
  goal is not to pile up documents. Before deleting it, move what matters into git:
  - The **PR/MR description**, in the user's language and plain words: what was asked (link to
    the spec or handoff if there is one), what was decided (every `Ruling:` line from the
    ledger, with its reason), what Codex did (batches and commits), what Claude reviewed and
    what was fixed, and the tests (command and result).
  - If the work does not end in a PR/MR, the same goes in the body of the last commit.
  - No log files are created inside the repo.
- Wrap-up: open the PR/MR and share the link. **Never** merge locally, **never** delete the
  branch or the worktree holding it.
- Tell the user what Codex did (batches, commits) and what Claude did (plan, review, fixes
  requested).
