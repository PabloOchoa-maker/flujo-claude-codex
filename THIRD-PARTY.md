# Third-party pieces

This repo **does not copy** code from other projects: the installer fetches each piece from its
source. Here is where each one comes from and the role it plays in the workflow.

| Piece | Source | License | Used for | How it is installed |
|---|---|---|---|---|
| Superpowers | [obra/superpowers](https://github.com/obra/superpowers) | MIT | `brainstorming`, `writing-plans`, `systematic-debugging`, `verification-before-completion`, worktrees and closing through a PR | Inside Claude Code: `/plugin install superpowers@claude-plugins-official` |
| Codex plugin | [openai/codex-plugin-cc](https://github.com/openai/codex-plugin-cc) | Apache-2.0 | The `codex:codex-rescue` subagent: Codex implements the batches | `/plugin marketplace add openai/codex-plugin-cc` and `/plugin install codex@openai-codex` |
| BMAD Method | [bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) | see its `LICENSE` | Requirements skills: `bmad`, `bmad-forge-idea`, `bmad-spec`, `bmad-product-brief`, `bmad-prd`, `bmad-architecture`, `bmad-create-epics-and-stories`, `bmad-preview-ticketing`, `bmad-sprint-planning`, `bmad-project-context`, `bmad-advanced-elicitation`, `bmad-correct-course`, `bmad-retrospective`, `bmad-walkthrough` | `npx skills add bmad-code-org/BMAD-METHOD@<skill> -g -y` or its official installer `npx bmad-method install` |
| grilling | [mattpocock/skills](https://github.com/mattpocock/skills) | MIT | The round-based interview `/analista` uses | `npx skills add mattpocock/skills@grilling -g -y` |
| archify | [tt-a1i/archify](https://github.com/tt-a1i/archify) | Apache-2.0 | Interactive diagrams (including this repo's) | `npx skills add tt-a1i/archify@archify -g -y` |

## Notes

- Some BMAD skill names change between versions (the v7 branch reorganizes the catalog). If
  `verify.ps1` reports one as missing, install BMAD with its official installer and pick the
  planning module.
- BMAD needs Node 20.12+, Python 3.10+ and [`uv`](https://docs.astral.sh/uv/).
- archify checks for new versions; turn that off with the `ARCHIFY_UPDATE_CHECK_DISABLED=1`
  variable.
- Superpowers has optional telemetry; turn it off with `SUPERPOWERS_DISABLE_TELEMETRY=1`.

## What is included and why that is allowed

Two things in this repo contain or derive from someone else's work. Both have permissive licenses
that allow redistribution, on the condition that their copyright notice and license are kept:

| File | Third-party content | License | Notice included |
|---|---|---|---|
| `docs/index.html` | The archify v3.2.0 viewer that renders the diagram, the JetBrains Mono font and the Pele engine, embedded in the HTML | MIT (archify, Pele) · SIL OFL 1.1 (JetBrains Mono) | [`docs/licenses/`](docs/licenses/) |
| `skills/codex-driven-development/` | An adaptation of the Superpowers `subagent-driven-development` skill; it uses Superpowers' scripts from the plugin install, it does not copy them | MIT (Superpowers) | [`docs/licenses/superpowers-LICENSE.txt`](docs/licenses/superpowers-LICENSE.txt) |

Everything else (`analista`, the hooks, the rules, the install scripts) belongs to this repo and
is under its MIT license.
