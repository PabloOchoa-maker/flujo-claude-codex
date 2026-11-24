// Hook UserPromptSubmit de Claude Code.
// Lee el mensaje del usuario, lo normaliza (minúsculas, sin tildes) y solo inyecta
// contexto cuando coincide con alguna regla. Si nada coincide, no imprime nada.
// Un solo proceso por mensaje: evita lanzar varios scripts en paralelo.
import { readFileSync } from "node:fs";

let prompt = "";
try {
  prompt = JSON.parse(readFileSync(0, "utf8")).prompt ?? "";
} catch {
  process.exit(0);
}
const text = prompt.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const rules = [
  {
    // Requisitos / producto → skill analista
    match: /(requisit|requerimient|\bprd\b|historias? de usuario|criterios? de aceptacion|epicas?|product brief|levantamiento|documento de requisit|definir (el )?alcance|backlog|requirement|user stor|acceptance criteria)/,
    text: "INSTRUCCION AUTOMATICA: El usuario habla de definicion de requisitos o de producto. Invoca la skill analista: clasifica el nivel 0-4, entrevista con grilling, produce los artefactos BMAD segun el nivel y deja docs/handoff-specifier.md como Spec para superpowers:writing-plans. Si la idea esta a medio formar, ofrece antes bmad-forge-idea. NO uses las skills de BMAD de implementacion (bmad-build, bmad-agent-*, bmad-code-review, bmad-qa-*): la implementacion va por writing-plans + codex-driven-development. Toda decision que no se cierre se registra como supuesto explicito con su riesgo.",
  },
  {
    // Flujo Claude + Codex: solo si el mensaje habla de código.
    match: /(codigo|implement|programa|desarroll|funcionalidad|feature|\bbug|arregl|corrig|refactor|funcion|componente|endpoint|\bapi\b|servicio|\btest|prueba unitaria|migracion|\bschema|base de datos|commit|\bpr\b|\bmr\b|merge|rama|deploy|despleg|script|codex|superpowers|plan de implementacion|\bcode\b|\bfix\b|branch)/,
    text: "RECORDATORIO FLUJO CLAUDE + CODEX: si este mensaje implica escribir o cambiar codigo, aplica el reparto de ~/.claude/CLAUDE.md («Trabajo en equipo: Claude Code + Codex»). Claude entiende, explica, disena, especifica y revisa; las implementaciones grandes y bien acotadas se delegan a Codex (subagente codex:codex-rescue) con un encargo autocontenido (objetivo, archivos, criterios de aceptacion, como probar, que no tocar). Antes de delegar, di al usuario que delegas y por que, y espera su si; al volver, revisa el diff, ejecuta las pruebas y cuenta que hizo cada uno. No delegues preguntas, cambios pequenos ni decisiones de diseno. Nunca actives el review gate de Codex. Si el mensaje no implica codigo, ignora este recordatorio.",
  },
];

const hits = rules.filter((r) => r.match.test(text)).map((r) => r.text);
if (hits.length > 0) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "UserPromptSubmit",
        additionalContext: hits.join("\n\n"),
      },
    }),
  );
}
