## Teamwork: Claude Code + Codex

Goal: spend fewer Claude tokens by having Codex write the code. The
`~/.claude/hooks/router-prompt.mjs` hook (UserPromptSubmit) reminds Claude of this split whenever
a message is about code.

- **Claude** understands, explains, designs, specifies and reviews. It also measures and analyzes
  (one-off scripts, evaluations).
- **Codex** implements **large, well-scoped** tasks (the `codex:codex-rescue` subagent from the
  Codex plugin).
- **Before delegating**, tell the user what is being delegated and why, and wait for their yes.
- **The brief is self-contained**: goal, files, acceptance criteria, how to test, what not to
  touch. In projects with a briefs folder (e.g. `docs/briefs/`), save it there.
- **When Codex comes back**: review the diff, run the tests and tell the user what each one did.
- **Do not delegate**: questions, small changes or design decisions.
- **Never** turn on Codex's review gate.
- Talk to the user and write documents in the user's language.

## Superpowers (plugin) adapted to the Claude + Codex flow

These rules take precedence over the Superpowers skills (including the "1%" rule in
`using-superpowers`):

- **Scope.** Superpowers skills only apply to code work inside a repository. No Superpowers for
  documents, research, memory or configuration. The process skills (brainstorming,
  writing-plans, plan execution) are only for new features or multi-file changes; **not** for
  questions, explanations or small changes. If the user says "no superpowers", they are not used
  for that task. `systematic-debugging` yes for any non-obvious bug, and
  `verification-before-completion` always before saying something is done.
- **Full flow:** half-formed idea → `bmad-forge-idea` (optional) → requirements with
  **`/analista`** (levels 2-4: `grilling` + BMAD → `docs/` + `docs/handoff-specifier.md`) →
  `writing-plans` with that handoff as the Spec → the user's "yes" → `codex-driven-development` →
  PR/MR. For small features inside an already defined product, brainstorming instead of
  `/analista`. To review a PR or commit yourself, `bmad-walkthrough`. In third-party repos
  (clients, open source), ask before creating `_bmad/` or `docs/` inside the repo.
- **Diagrams with `archify`:** repo maps tied to the code, architecture/ERD/state diagrams at
  `/analista` levels 3-4, and before/after views to review PRs. They go to `.archify/`, which is
  git-ignored; they are not committed.
  [archify explainer: on-demand]
- **The record of the work = git.** No log files: the PR/MR description (or the body of the last
  commit) tells in plain words what was asked, what was decided, what Codex did, what Claude
  reviewed and the tests.
- **Plans** go in `docs/briefs/YYYY-MM-DD-<topic>.md` if that folder exists; otherwise in
  `docs/superpowers/plans/`.
- **Execution.** After `writing-plans`, offer **"Codex"** as the recommended option. The user's
  "yes" to the plan is the permission to delegate all its batches. With "Codex", use the
  **`codex-driven-development`** skill, never `subagent-driven-development` (which implements
  with Claude). `executing-plans` (Claude implements inline) only if the user asks for it.
- **Branches.** `using-git-worktrees` yes. In `finishing-a-development-branch` the only way out is
  opening a PR/MR: **never** merge locally, **never** delete the branch or discard work.
