## Trabajo en equipo: Claude Code + Codex

Objetivo: gastar menos tokens de Claude haciendo que Codex escriba el código. El hook
`~/.claude/hooks/router-prompt.mjs` (UserPromptSubmit) recuerda este reparto cuando el mensaje habla de código.

- **Claude** entiende, explica, diseña, especifica y revisa. Mide y analiza (scripts de un solo uso, evaluaciones).
- **Codex** implementa las tareas **grandes y bien acotadas** (subagente `codex:codex-rescue`, plugin Codex).
- **Antes de delegar**, decirle al usuario qué se delega y por qué, y esperar su sí.
- **El encargo es autocontenido**: objetivo, archivos, criterios de aceptación, cómo probar, qué no tocar. En proyectos con
  carpeta de encargos (p. ej. `docs/encargos/`), guardarlo ahí.
- **Al volver**: revisar el diff, ejecutar las pruebas y contarle al usuario qué hizo cada uno.
- **No delegar**: preguntas, cambios pequeños ni decisiones de diseño.
- **Nunca** activar el review gate de Codex.

## Superpowers (plugin) adaptado al flujo Claude + Codex

Estas reglas mandan sobre las skills de Superpowers (incluida la regla del «1 %» de `using-superpowers`):

- **Alcance.** Las skills de Superpowers solo aplican a trabajo de código dentro de un repositorio.
  Nada de Superpowers para documentos, investigaciones, memoria ni configuración. Las skills de
  proceso (brainstorming, writing-plans, ejecución de planes) solo para funcionalidades nuevas o
  cambios de varios archivos; **no** para preguntas, explicaciones ni cambios pequeños. Si el usuario
  dice «sin superpowers», no se usan en esa tarea. `systematic-debugging` sí ante cualquier bug no
  obvio, y `verification-before-completion` siempre antes de decir que algo está hecho.
- **Flujo completo:** idea a medio formar → `bmad-forge-idea` (opcional) →
  requisitos con **`/analista`** (nivel 2-4: `grilling` + BMAD → `docs/` + `docs/handoff-specifier.md`)
  → `writing-plans` con ese traspaso como Spec → «sí» del usuario → `codex-driven-development` →
  PR/MR. Para features chicas dentro de un producto ya definido, brainstorming en vez de `/analista`.
  Para revisar uno mismo un PR o commit, `bmad-walkthrough`. En repos de terceros (clientes, open
  source), preguntar antes de crear `_bmad/` o `docs/` dentro del repo.
- **Diagramas con `archify`:** mapas de repos atados al código, arquitectura/ERD/estados en
  `/analista` niveles 3-4 y antes/después para revisar PRs. Salen en `.archify/`, ignorada por git;
  no se commitean.
  [archify explainer: on-demand]
- **Registro de lo hecho = git.** Nada de archivos de registro: la descripción del PR/MR (o el
  cuerpo del último commit) cuenta en lenguaje natural qué se pidió, qué se decidió, qué hizo
  Codex, qué revisó Claude y las pruebas.
- **Planes** en `docs/encargos/AAAA-MM-DD-<tema>.md` si existe esa carpeta; si no, en `docs/superpowers/plans/`.
- **Ejecución.** Al terminar `writing-plans`, ofrecer como opción recomendada **«Codex»**. El «sí»
  del usuario al plan es el permiso para delegar todos sus lotes. Con «Codex» se usa la skill
  **`codex-driven-development`**, nunca `subagent-driven-development` (implementa con Claude).
  `executing-plans` (Claude implementa en línea) solo si el usuario lo pide.
- **Ramas.** `using-git-worktrees` sí. En `finishing-a-development-branch` la única salida es
  abrir PR/MR: **nunca** merge local, **nunca** borrar la rama ni descartar trabajo.
