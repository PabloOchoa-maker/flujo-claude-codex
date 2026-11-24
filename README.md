# Flujo Claude Code + Codex

Un flujo de trabajo para programar con dos agentes: **Claude Code piensa y revisa, Codex escribe
el código.** Tú decides qué se construye y das el «sí» antes de que nada se implemente.

**[Ver el diagrama interactivo →](https://pabloochoa-maker.github.io/flujo-claude-codex/)**

## Por qué

Un solo agente que entiende, planifica, implementa y revisa gasta muchos tokens y se revisa a sí
mismo. Repartir el trabajo deja a cada uno en lo que hace mejor:

| Quién | Hace | No hace |
|---|---|---|
| **Tú** | Cuentas la idea, apruebas el plan, revisas el PR | — |
| **Claude Code** | Entiende, entrevista, escribe requisitos y plan, revisa el diff y corre las pruebas | Implementar lo grande |
| **Codex** | Implementa el plan por lotes, con TDD y un commit por tarea | Decidir el diseño, hacer push o merge |
| **git** | Guarda requisitos, planes y el registro de lo hecho (la descripción del PR) | — |

## El recorrido

```
idea → bmad-forge-idea (opcional) → /analista → writing-plans → tu «sí» → Codex implementa → Claude revisa → PR
                                         │                                       ▲              │
                         feature chica: brainstorming                            └── corregir ──┘
```

1. **Definir.** `/analista` clasifica el pedido (nivel 0-4), te entrevista con `grilling` y deja
   los requisitos en `docs/` con un traspaso (`docs/handoff-specifier.md`). Para una feature chica
   basta `brainstorming`.
2. **Planificar.** `writing-plans` convierte el traspaso en un plan con tareas y su prueba, guardado
   en `docs/encargos/`.
3. **Aprobar.** Tu «sí» al plan es el permiso para delegar todos sus lotes.
4. **Implementar.** `codex-driven-development` agrupa las tareas en lotes de 3 a 5 y se las pasa a
   Codex en una rama o worktree.
5. **Revisar.** Claude lee el diff y corre las pruebas él mismo. Si algo falla, vuelve a Codex.
6. **Cerrar.** Se abre un PR con lo pedido, lo decidido, lo que hizo cada agente y las pruebas.
   Nunca hay merge local ni se borran ramas.

## Qué trae este repo

```
claude/CLAUDE-seccion.md      reglas del reparto, se añaden a ~/.claude/CLAUDE.md
claude/settings.hooks.json    registro de los hooks
hooks/router-prompt.mjs       recuerda el reparto cuando el mensaje habla de código o de requisitos
hooks/candados-git.mjs        bloquea commits y push a main, merge local y borrar ramas
skills/analista/              requisitos → docs/ + traspaso para el plan
skills/codex-driven-development/   ejecuta el plan con Codex por lotes y Claude revisando
install/install.ps1           instala todo lo anterior y las piezas de terceros
install/verificar.ps1         comprueba que quedó funcionando
docs/                         el diagrama (index.html) y su fuente archify
terceros.md                   de dónde sale cada pieza que no es de este repo
```

Superpowers, el plugin de Codex, BMAD, `grilling` y archify **no se copian**: el instalador los trae
desde su repositorio original. Ver [terceros.md](terceros.md).

## Instalación (Windows)

Necesitas [Claude Code](https://docs.claude.com/claude-code), el
[CLI de Codex](https://github.com/openai/codex) con sesión iniciada, Node 20+, git y, para BMAD,
Python 3.10+ y `uv`.

```powershell
git clone https://github.com/PabloOchoa-maker/flujo-claude-codex.git
cd flujo-claude-codex
powershell -ExecutionPolicy Bypass -File install\install.ps1
```

Después, dentro de Claude Code:

```
/plugin install superpowers@claude-plugins-official
/plugin marketplace add openai/codex-plugin-cc
/plugin install codex@openai-codex
/codex:setup
```

No actives el *review gate* de Codex. En Windows, si Codex rechaza todos los comandos, añade esto a
`~/.codex/config.toml`:

```toml
[windows]
sandbox = "unelevated"
```

Comprueba la instalación:

```powershell
powershell -ExecutionPolicy Bypass -File install\verificar.ps1
```

El instalador hace copia de seguridad de `settings.json` y `CLAUDE.md` antes de tocarlos
(`*.bak-<fecha>`) y no duplica nada si lo corres dos veces.

## Regenerar el diagrama

```powershell
node ~/.claude/skills/archify/bin/archify.mjs finalize workflow docs/flujo.archify.json docs/index.html --quality showcase
```

## Licencia

MIT para lo que es de este repo ([LICENSE](LICENSE)). Las piezas de terceros conservan la suya.
