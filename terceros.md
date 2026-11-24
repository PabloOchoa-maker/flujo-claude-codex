# Piezas de terceros

Este repo **no copia** código de otros proyectos: el instalador las trae desde su origen. Aquí está de
dónde sale cada una y qué papel cumple en el flujo.

| Pieza | Origen | Licencia | Para qué se usa | Cómo se instala |
|---|---|---|---|---|
| Superpowers | [obra/superpowers](https://github.com/obra/superpowers) | MIT | `brainstorming`, `writing-plans`, `systematic-debugging`, `verification-before-completion`, worktrees y cierre por PR | Dentro de Claude Code: `/plugin install superpowers@claude-plugins-official` |
| Plugin de Codex | [openai/codex-plugin-cc](https://github.com/openai/codex-plugin-cc) | Apache-2.0 | Subagente `codex:codex-rescue`: Codex implementa los lotes | `/plugin marketplace add openai/codex-plugin-cc` y `/plugin install codex@openai-codex` |
| BMAD Method | [bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) | ver su `LICENSE` | Skills de requisitos: `bmad`, `bmad-forge-idea`, `bmad-spec`, `bmad-product-brief`, `bmad-prd`, `bmad-architecture`, `bmad-create-epics-and-stories`, `bmad-preview-ticketing`, `bmad-sprint-planning`, `bmad-project-context`, `bmad-advanced-elicitation`, `bmad-correct-course`, `bmad-retrospective`, `bmad-walkthrough` | `npx skills add bmad-code-org/BMAD-METHOD@<skill> -g -y` o su instalador oficial `npx bmad-method install` |
| grilling | [mattpocock/skills](https://github.com/mattpocock/skills) | MIT | Entrevista por rondas que usa `/analista` | `npx skills add mattpocock/skills@grilling -g -y` |
| archify | [tt-a1i/archify](https://github.com/tt-a1i/archify) | Apache-2.0 | Diagramas interactivos (incluido el de este repo) | `npx skills add tt-a1i/archify@archify -g -y` |

## Notas

- Los nombres de algunas skills de BMAD cambian entre versiones (la rama v7 reorganiza el catálogo).
  Si `verificar.ps1` marca alguna como faltante, instala BMAD con su instalador oficial y elige el
  módulo de planificación.
- BMAD pide Node 20.12+, Python 3.10+ y [`uv`](https://docs.astral.sh/uv/).
- archify consulta si hay versiones nuevas; se apaga con la variable `ARCHIFY_UPDATE_CHECK_DISABLED=1`.
- Superpowers tiene telemetría opcional; se apaga con `SUPERPOWERS_DISABLE_TELEMETRY=1`.

## Lo que sí va incluido y por qué es legal

Dos cosas de este repo contienen o derivan de trabajo ajeno. Ambas tienen licencias permisivas
que permiten redistribuir, con la condición de conservar su aviso de copyright y su licencia:

| Archivo | Qué contiene de terceros | Licencia | Aviso incluido |
|---|---|---|---|
| `docs/index.html` | El visor de archify v3.2.0 que genera el diagrama, la fuente JetBrains Mono y el motor Pele, embebidos en el HTML | MIT (archify, Pele) · SIL OFL 1.1 (JetBrains Mono) | [`docs/licencias/`](docs/licencias/) |
| `skills/codex-driven-development/` | Adaptación propia de la skill `subagent-driven-development` de Superpowers; usa sus scripts desde la instalación del plugin, no los copia | MIT (Superpowers) | [`docs/licencias/superpowers-LICENSE.txt`](docs/licencias/superpowers-LICENSE.txt) |

Todo lo demás (`analista`, los hooks, las reglas, los scripts de instalación) es propio de este repo y
va bajo su licencia MIT.
