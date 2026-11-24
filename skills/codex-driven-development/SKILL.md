---
name: codex-driven-development
description: Use INSTEAD OF superpowers:subagent-driven-development when executing an approved implementation plan. Codex implements the tasks in batches through the codex:codex-rescue subagent; Claude coordinates, keeps the ledger and reviews.
---

# Codex-Driven Development

Versión adaptada de `superpowers:subagent-driven-development`
([obra/superpowers](https://github.com/obra/superpowers), MIT, © 2025 Jesse Vincent) al reparto Claude + Codex:
**Claude coordina y revisa; Codex implementa.** Todo lo que esta skill no cambia se
hace como en la original (ledger, preflight, ciclo de correcciones, revisión final).

Scripts de Superpowers (la carpeta de versión cambia al actualizar):

```bash
SDD=$(ls -d ~/.claude/plugins/cache/claude-plugins-official/superpowers/*/skills/subagent-driven-development | tail -1)
```

## Antes de empezar

1. El plan ya está aprobado por el usuario. Ese «sí» al plan cubre todos los lotes:
   no se vuelve a preguntar entre lotes salvo por las cuatro paradas de la original
   (algo irreversible, algo sensible de seguridad, push/merge/publicar, plan roto).
2. Rama de trabajo, nunca `main`/`master`. En repos con rama protegida se trabaja en una rama propia y el resultado entra por MR.
3. Workspace y ledger: `bash "$SDD/scripts/sdd-workspace" PLAN_FILE` y el ledger
   `progress.md` como en la original. Tras compactar, manda el ledger + `git log`.
4. Lee `$SDD/references/preflight.md` y haz el escaneo de conflictos.

## Lotes en vez de tareas sueltas

Una ejecución de Codex arranca en frío y relee el repo: no se lanza una por tarea de
5 minutos. Agrupa **tareas consecutivas que comparten archivos o interfaces**, de 3 a 5
por lote (el plan entero si es corto). Nunca dos lotes de Codex en paralelo.

Por cada lote:

1. Anota `BASE=$(git rev-parse HEAD)` en el ledger.
2. Genera un brief por tarea: `bash "$SDD/scripts/task-brief" PLAN_FILE N`.
3. Lanza **un** `Agent` con `subagent_type: "codex:codex-rescue"` y este encargo:

```
Implementa las tareas N..M del plan. Lee primero estos briefs, en orden; son tus
requisitos con los valores exactos: <rutas de los briefs>.
Contexto: <una línea de dónde encaja>. Interfaces de lotes anteriores: <firmas>.
Ambigüedades ya resueltas: <decisiones>.
Reglas: TDD (prueba que falla → código mínimo → prueba en verde), un commit por tarea,
mensajes de commit con tu línea de coautor habitual (no la quites), no tocar archivos fuera de los briefs,
no lanzar subagentes, no hacer push ni merge.
Al terminar escribe <workspace>/batch-K-report.md con, por tarea: archivos tocados,
commits, comando de prueba y su resultado, y dudas. Última línea del reporte y de tu
respuesta: STATUS: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED.
Si te falta información, NO adivines: para, escribe NEEDS_CONTEXT y la pregunta.
```

4. Según el estado: `DONE` → revisión. Cualquier otro → lee
   `$SDD/references/handling-reports.md`. Si es `NEEDS_CONTEXT`, responde y reanuda
   el mismo trabajo pidiendo a `codex:codex-rescue` que continúe (`--resume`).

## Revisión (Claude)

- Paquete del diff: `bash "$SDD/scripts/review-package" PLAN_FILE BASE HEAD`.
- Revisor del lote: `Agent` general-purpose con **model: sonnet**, usando la plantilla
  `$SDD/task-reviewer-prompt.md` (briefs + reporte + paquete + restricciones globales).
- Además, Claude corre las pruebas él mismo una vez por lote; el reporte de Codex no
  sustituye esa comprobación.
- Si hay hallazgos: lee `$SDD/references/fix-loop.md` antes de cada ronda. Las rondas
  1-3 se piden a `codex:codex-rescue` con `--resume`; la 4-5, con un encargo nuevo y
  `--fresh`.
- Completa el lote en el ledger como la original.

## Final

- Revisión de toda la rama con **model: opus**, siguiendo `$SDD/references/final-review.md`.
- Si el plan cambia la estructura (módulos, servicios, tablas), ofrecer al usuario un diagrama
  `archify` del antes y después (architecture delta o `erd`) para revisar el MR. Local, en
  `.archify/`; no se commitea.
- **Registro en git, no en archivos.** Superpowers borra su carpeta de trabajo al terminar y
  la idea es no acumular documentos. Antes de borrarla, pasa lo que vale la pena a git:
  - La **descripción del PR/MR**, en español y lenguaje natural: qué se pidió (enlace a la
    spec o al traspaso si existe), qué se decidió (todas las líneas `Ruling:` del ledger, con
    su porqué), qué hizo Codex (lotes y commits), qué revisó Claude y qué se corrigió, y las
    pruebas (comando y resultado).
  - Si el trabajo no termina en PR/MR, lo mismo va en el cuerpo del último commit.
  - No se crean archivos de registro dentro del repo.
- Cierre: abrir PR/MR y dar el enlace. **Nunca** merge local, **nunca** borrar la rama
  ni el worktree que la sostiene.
- Contarle al usuario qué hizo Codex (lotes, commits) y qué hizo Claude (plan, revisión,
  correcciones pedidas).
