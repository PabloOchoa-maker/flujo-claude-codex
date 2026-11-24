// Claude Code UserPromptSubmit hook.
// Reads the user's message, normalizes it (lowercase, no accents) and only injects context
// when it matches a rule. If nothing matches, it prints nothing.
// One process per message: avoids launching several scripts in parallel.
// Patterns match both English and Spanish keywords.
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
    // Requirements / product → analista skill
    match: /(requirement|user stor|acceptance criteria|\bprd\b|\bepics?\b|product brief|define (the )?scope|backlog|requisit|requerimient|historias? de usuario|criterios? de aceptacion|epicas?|levantamiento|definir (el )?alcance)/,
    text: "AUTOMATIC INSTRUCTION: The user is talking about requirements or product definition. Invoke the analista skill: classify the level 0-4, interview with grilling, produce the BMAD artifacts for that level and leave docs/handoff-specifier.md as the Spec for superpowers:writing-plans. If the idea is half-formed, offer bmad-forge-idea first. Do NOT use BMAD implementation skills (bmad-build, bmad-agent-*, bmad-code-review, bmad-qa-*): implementation goes through writing-plans + codex-driven-development. Every decision that is not settled is recorded as an explicit assumption with its risk.",
  },
  {
    // Claude + Codex flow: only when the message is about code.
    match: /(\bcode\b|implement|program|develop|feature|\bbug|\bfix|refactor|function|component|endpoint|\bapi\b|service|\btest|unit test|migration|\bschema|database|commit|\bpr\b|\bmr\b|merge|branch|deploy|script|codex|superpowers|implementation plan|codigo|desarroll|funcionalidad|arregl|corrig|funcion|componente|servicio|prueba unitaria|migracion|base de datos|rama|despleg|plan de implementacion)/,
    text: "CLAUDE + CODEX FLOW REMINDER: if this message involves writing or changing code, apply the split in ~/.claude/CLAUDE.md (\"Teamwork: Claude Code + Codex\"). Claude understands, explains, designs, specifies and reviews; large, well-scoped implementations are delegated to Codex (the codex:codex-rescue subagent) with a self-contained brief (goal, files, acceptance criteria, how to test, what not to touch). Before delegating, tell the user what you are delegating and why, and wait for their yes; when Codex comes back, review the diff, run the tests and say what each one did. Do not delegate questions, small changes or design decisions. Never turn on Codex's review gate. If the message does not involve code, ignore this reminder.",
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
