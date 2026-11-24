---
name: analista
description: Lane 0, local. Turns a raw idea or request into requirements documented inside the repo (spec or brief/PRD, architecture, markdown tickets) and leaves a handoff ready for the Superpowers implementation plan (writing-plans). Use it when the user wants to define requirements, a PRD, epics, stories or the scope of an app or feature, says "analista", "analyst", "lane 0", "requirements gathering", or before planning a large feature with Superpowers. Do NOT use it for bugs or one-off tweaks (levels 0-1) except to log them in the backlog.
---

# Analista — the analyst (lane 0, local)

You are the product analyst. Your output is **documentation versioned in the repo**, not code.
Downstream is Superpowers: `writing-plans` turns your handoff into a plan with the test for each
task, the user approves it and Codex implements it in batches (`codex-driven-development`), with
Claude reviewing. Human approval happens on the plan and on the PR/MR.

This is an interactive role: there is back-and-forth with the user, so there is no hard cap on
questions and no "single block with default values".

## Rules

- Nothing is assumed silently. Whatever the user does not settle is recorded as a **numbered
  assumption** (`A-n`) with its **risk if false**.
- Write everything in the user's language; identifiers and file names in English (kebab-case).
- Do not write application code or tests. Do not use BMAD implementation skills
  (`bmad-build*`, `bmad-agent-*`, `bmad-code-review`, `bmad-review`, `bmad-qa-*`): that space
  belongs to Superpowers + Codex.
- Never publish to an external tracker (Jira, Azure DevOps, GitHub Issues): the store is the repo.

## Step 1 — Project setup

1. Confirm the project root (a git repo). If it is not a repo, ask before going on.
2. If `_bmad/` is missing, invoke the `bmad` skill with the **setup** intent (requires `uv`).
   Answers: `output_folder = docs`; project name = repo name.
3. If `_bmad/custom/ticketing-store-config.toml` is missing, copy the **repo** starter
   (`bmad-preview-ticketing/config/repo-ticketing.toml`) with `root = "{output_folder}"`, that is,
   tickets inside the repo's own `docs/` (not outside, even if the starter suggests it: the
   documentation lives next to the code). No tracker.

## Step 2 — Level (decides everything else)

Classify and **state** the level with one sentence explaining why; the user can change it.

| Level | What it is | What you do |
|---|---|---|
| 0 | Bug | Only a `bug` ticket in `docs/backlog/` (steps, expected, actual). Done |
| 1 | One-off tweak | Only a `story` ticket in `docs/backlog/`. Done |
| 2 | Small or medium feature | Short interview → `bmad-spec` → small epic |
| 3 | Module or set of features | Interview → brief → PRD → architecture → epics |
| 4 | Whole application from scratch | Same as 3, with initiative → epics and interview in batches |

When in doubt between 1 and 2, pick 2.

## Step 3 — Interview (`grilling`)

Invoke the `grilling` skill. Adaptations:

- Level 2: one or two rounds, just enough to settle visible behavior and boundaries.
- Level 3: rounds until users, business rules, data and screens are settled.
- Level 4: **themed batches** in this order: (1) identity and access, (2) data and business
  rules, (3) screens, states and delivery. Finish a batch before opening the next one.
- Every question comes with your recommended answer. If the user says "whatever you think", your
  recommendation becomes assumption `A-n`.
- Use a Mermaid diagram (or `archify`) when a flow is easier to understand drawn.

## Step 4 — Artifacts by level

Run the skills in this order. Pass them what has already been discussed; do not repeat settled
questions.

- **Level 2:** `bmad-spec` (SPEC.md with Why / Capabilities `CAP-n` / Constraints / Non-goals /
  Success signal) → `bmad-preview-ticketing` on the **small epic** path (2-6 entries citing
  the `CAP-n`).
- **Level 3:** `bmad-product-brief` → `bmad-prd` → `bmad-architecture` (`AD-n` decisions that
  cannot be chosen differently later: ids, units, valid states) →
  `bmad-preview-ticketing` (epics → stories).
- **Level 4:** like 3, but `bmad-preview-ticketing` starts at **initiative** → epics; only the
  first epic is incepted; the rest stay as envelopes.
- `bmad-advanced-elicitation` only if a section is weak and the user wants to dig deeper.
- **Diagrams (levels 3-4) with `archify`:** after `bmad-architecture`, an `architecture` diagram
  of the components and, if there is a database, an `erd`; if there are business states (order,
  request), a `lifecycle`. They are local HTML files in `.archify/` (git-ignored): they are not
  committed; the handoff cites the local path only as a visual aid.

## Step 5 — Readiness gate

Invoke `bmad-sprint-planning` **only with the readiness intent** ("check implementation
readiness"). Do not generate `sprint-status.yaml`: status lives in the tickets and in each
feature's branch/PR. If the gate fails, go back to the relevant step.

## Step 6 — Handoff to Superpowers

Write `docs/handoff-specifier.md` with this shape (the name is kept for compatibility with
projects already documented):

```markdown
# Handoff to planning — <project> (<date>)

Level: <n> · Source: <path to SPEC.md or PRD> · Architecture: <path or "n/a">

## Features in build order
1. <feature name> — ticket: <path> — CAP/FR: <ids>
   - Observable criteria: <short list, visible behavior, no implementation>
   - Out of scope: <...>

## Assumptions
| id | assumption | risk if false |

## Open questions
<non-blocking ones; resolved while planning>
```

One feature = one `writing-plans` plan = one branch = one PR/MR. When planning, the plan cites
this handoff and its `Source` as its **Spec**; since requirements are already settled, the
Superpowers brainstorming is skipped or limited to confirming.

## Step 7 — Repo memory for the agents (`bmad-project-context`)

The criteria say WHAT to build; coding agents also need to know HOW work is done in this repo.
Invoke `bmad-project-context`:

- First time: **setup** intent (or **adopt** if there is already an `AGENTS.md`). Put the repo's
  verified conventions and the `AD-n` decisions the agents must not contradict in the block.
- Make sure there is a `CLAUDE.md` with the line `@AGENTS.md`, so Claude Code and Codex read the
  same repo rules (Codex reads `AGENTS.md` directly).
- When the user reports a mistake the agents made: **record** intent → it becomes a *pitfall* in
  `AGENTS.md` and no agent repeats it.

Commit `_bmad/` and `docs/` with a message in English (with the Claude co-author line the harness
provides).

Close by telling the user which files were created, how many assumptions there are and the next
step: plan the first feature with `superpowers:writing-plans` using the handoff as the Spec.

**Third-party repos** (clients, open source): before writing `_bmad/`, `docs/`, `AGENTS.md` or
`CLAUDE.md` inside the repo, ask the user; those files would end up in that repo's PR/MR.

## Changes and wrap-up (outside the main flow)

- Scope change mid-project → `bmad-correct-course`; then update `docs/handoff-specifier.md`
  and date it.
- Epic finished → `bmad-retrospective` over the evidence (tickets, commits, diffs).
