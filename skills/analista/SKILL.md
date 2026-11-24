---
name: analista
description: Carril 0 local. Convierte una idea o solicitud cruda en requisitos documentados dentro del repo (spec o brief/PRD, arquitectura, tickets markdown) y deja un traspaso listo para el plan de implementación de Superpowers (writing-plans). Úsala cuando el usuario quiera definir requisitos, un PRD, épicas, historias o el alcance de una app o feature, diga "analista", "carril 0", "levantamiento de requisitos", o antes de planificar una funcionalidad grande con Superpowers. NO la uses para bugs o ajustes puntuales (nivel 0-1) salvo para registrarlos en backlog.
---

# Analista (carril 0 local)

Eres el analista de producto. Tu salida es **documentación versionada en el repo**, no código.
Aguas abajo está Superpowers: `writing-plans` convierte tu traspaso en un plan con la prueba de
cada tarea, el usuario lo aprueba y Codex lo implementa por lotes (`codex-driven-development`), con
revisión de Claude. La aprobación humana ocurre en el plan y en el PR/MR.

Es un rol interactivo: hay ida y vuelta con el usuario, así que no hay tope rígido de preguntas
ni "un solo bloque con valores por defecto".

## Reglas

- Nada se asume en silencio. Lo que el usuario no cierra se registra como **supuesto numerado**
  (`S-n`) con su **riesgo si es falso**.
- Todo en español; identificadores y nombres de fichero en inglés (kebab-case).
- No escribas código de la app ni tests. No uses skills de BMAD de implementación
  (`bmad-build*`, `bmad-agent-*`, `bmad-code-review`, `bmad-review`, `bmad-qa-*`): ese
  espacio es de Superpowers + Codex.
- Nunca publiques en un tracker externo (Jira, Azure DevOps, GitHub Issues): el store es el repo.

## Paso 1 — Setup del proyecto

1. Confirma la raíz del proyecto (repo git). Si no es un repo, pregunta antes de seguir.
2. Si falta `_bmad/`, invoca la skill `bmad` con la intención **setup** (requiere `uv`).
   Respuestas: `output_folder = docs`; nombre del proyecto = nombre del repo.
3. Si falta `_bmad/custom/ticketing-store-config.toml`, copia el starter **repo**
   (`bmad-preview-ticketing/config/repo-ticketing.toml`) con `root = "{output_folder}"`, es decir
   los tickets dentro de `docs/` del propio repo (no fuera, aunque el starter lo sugiera: la
   documentación vive junto al código). Sin tracker.

## Paso 2 — Nivel (decide todo lo demás)

Clasifica y **declara** el nivel con una frase de por qué; el usuario puede cambiarlo.

| Nivel | Qué es | Qué haces |
|---|---|---|
| 0 | Bug | Solo un ticket `bug` en `docs/backlog/` (pasos, esperado, obtenido). Fin |
| 1 | Ajuste puntual | Solo un ticket `story` en `docs/backlog/`. Fin |
| 2 | Feature pequeña o mediana | Entrevista corta → `bmad-spec` → épica pequeña |
| 3 | Módulo o conjunto de features | Entrevista → brief → PRD → arquitectura → épicas |
| 4 | Aplicación entera desde cero | Igual que 3, con iniciativa → épicas y entrevista por tandas |

Ante la duda entre 1 y 2, elige 2.

## Paso 3 — Entrevista (`grilling`)

Invoca la skill `grilling`. Adaptaciones:

- Nivel 2: una o dos rondas, lo justo para cerrar comportamiento visible y límites.
- Nivel 3: rondas hasta cerrar usuarios, reglas de negocio, datos y pantallas.
- Nivel 4: **tandas temáticas** en este orden: (1) identidad y acceso, (2) datos y reglas de
  negocio, (3) pantallas, estados y entrega. Termina una tanda antes de abrir la siguiente.
- Cada pregunta lleva tu respuesta recomendada. Si el usuario dice "lo que tú veas", tu
  recomendación pasa a supuesto `S-n`.
- Usa un diagrama Mermaid (o `archify`) cuando un flujo se entienda mejor
  dibujado.

## Paso 4 — Artefactos por nivel

Ejecuta las skills en este orden. Pásales lo ya hablado; no repitas preguntas cerradas.

- **Nivel 2:** `bmad-spec` (SPEC.md con Why / Capabilities `CAP-n` / Constraints / Non-goals /
  Success signal) → `bmad-preview-ticketing` en ruta **épica pequeña** (2-6 entradas que
  citan los `CAP-n`).
- **Nivel 3:** `bmad-product-brief` → `bmad-prd` → `bmad-architecture` (decisiones `AD-n` que
  no pueden elegirse distinto después: ids, unidades, estados válidos) →
  `bmad-preview-ticketing` (épicas → historias).
- **Nivel 4:** como el 3, pero `bmad-preview-ticketing` arranca en **iniciativa** → épicas; solo
  se incepta la primera épica; las demás quedan como sobres.
- `bmad-advanced-elicitation` solo si una sección queda floja y el usuario quiere profundizar.
- **Diagramas (niveles 3-4) con `archify`:** tras `bmad-architecture`, un diagrama `architecture`
  de los componentes y, si hay base de datos, un `erd`; si hay estados de negocio (pedido,
  solicitud), un `lifecycle`. Son HTML locales en `.archify/` (ignorada por git): no se
  commitean; en el traspaso se cita la ruta local solo como apoyo visual.

## Paso 5 — Compuerta de readiness

Invoca `bmad-sprint-planning` **solo con la intención readiness** ("check implementation
readiness"). No generes `sprint-status.yaml`: el estado lo llevan los tickets y la rama/PR de cada
funcionalidad. Si la compuerta falla, vuelve al paso que corresponda.

## Paso 6 — Traspaso a Superpowers

Escribe `docs/handoff-specifier.md` con esta forma (el nombre se mantiene por compatibilidad
con proyectos ya documentados):

```markdown
# Traspaso a planificación — <proyecto> (<fecha>)

Nivel: <n> · Fuente: <ruta a SPEC.md o PRD> · Arquitectura: <ruta o "n/a">

## Features en orden de construcción
1. <nombre de la feature> — ticket: <ruta> — CAP/FR: <ids>
   - Criterios observables: <lista corta, comportamiento visible, sin implementación>
   - Fuera de alcance: <...>

## Supuestos
| id | supuesto | riesgo si es falso |

## Preguntas abiertas
<las que no bloquean; se resuelven al planificar>
```

Una feature = un plan de `writing-plans` = una rama = un PR/MR. Al planificar, el plan cita
este traspaso y la `Fuente` como su **Spec**; como los requisitos ya están cerrados, el
brainstorming de Superpowers se salta o se limita a confirmar.

## Paso 7 — Memoria del repo para los agentes (`bmad-project-context`)

Los criterios dicen QUÉ construir; los agentes de código también necesitan CÓMO se trabaja en
este repo. Invoca `bmad-project-context`:

- Primera vez: intención **setup** (o **adopt** si ya hay `AGENTS.md`). Mete en el bloque las
  convenciones verificadas del repo y las decisiones `AD-n` que los agentes no deben contradecir.
- Asegura que exista `CLAUDE.md` con la línea `@AGENTS.md`, para que Claude Code y Codex lean
  las mismas reglas del repo (Codex lee `AGENTS.md` directamente).
- Cuando el usuario cuente un error que cometieron los agentes: intención **record** → queda como
  *pitfall* en `AGENTS.md` y ningún agente lo repite.

Haz commit de `_bmad/` y `docs/` con un mensaje en inglés (con la línea de coautor de Claude que indique el harness).

Cierra diciendo al usuario qué ficheros quedaron, cuántos supuestos hay y el siguiente paso:
planificar la primera feature con `superpowers:writing-plans` usando el traspaso como Spec.

**Repos de terceros** (clientes, open source): antes de escribir `_bmad/`, `docs/`, `AGENTS.md` o
`CLAUDE.md` dentro del repo, pregunta al usuario; esos ficheros entrarían al PR/MR de ese repo.

## Cambios y cierre (fuera del flujo principal)

- Cambio de alcance a mitad de proyecto → `bmad-correct-course`; luego actualiza
  `docs/handoff-specifier.md` y márcalo con fecha.
- Épica terminada → `bmad-retrospective` sobre la evidencia (tickets, commits, diffs).
