// PreToolUse (Bash y PowerShell): candados de git para Claude y Codex.
//   1. Nada de commits directos en main/master.
//   2. Nada de push hacia main/master ni merge estando en main/master: todo entra por PR/MR.
//   3. Nunca borrar ramas (ni local ni remota).
// Solo afecta a comandos que lanza Claude Code; el git que escribes a mano en tu terminal no pasa por aquí.
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const PROTECTED = new Set(["main", "master"]);

let input;
try {
  input = JSON.parse(readFileSync(0, "utf8"));
} catch {
  process.exit(0);
}
const command = input?.tool_input?.command ?? "";
if (!/\bgit\b/.test(command)) process.exit(0);

const baseCwd = input.cwd || process.cwd();

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: `Candado de git: ${reason}`,
      },
    }),
  );
  process.exit(0);
}

// Cambios de rama dentro del mismo comando (git switch master && git commit ...).
const simulated = new Map();

function currentBranch(dir) {
  if (simulated.has(dir)) return simulated.get(dir);
  try {
    return execFileSync("git", ["-C", dir, "rev-parse", "--abbrev-ref", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5000,
    }).trim();
  } catch {
    return null;
  }
}

function tokenize(segment) {
  return (segment.match(/"[^"]*"|'[^']*'|\S+/g) ?? []).map((t) => t.replace(/^["']|["']$/g, ""));
}

// Separa el comando en tramos (&&, ||, ;, |, saltos de línea) y sigue los `cd`.
let dir = baseCwd;
for (const segment of command.split(/&&|\|\||;|\||\r?\n/)) {
  const tokens = tokenize(segment.trim());
  if (tokens.length === 0) continue;

  if (["cd", "Set-Location", "sl", "pushd"].includes(tokens[0]) && tokens[1]) {
    const home = process.env.USERPROFILE || process.env.HOME || "~";
    const target = tokens[1].replace(/^(~|\$HOME|\$env:USERPROFILE|\$env:HOME)(?=$|[\\/])/i, home);
    dir = path.resolve(dir, target);
    continue;
  }

  const gi = tokens.findIndex((t) => t === "git" || /[\\/]git(\.exe)?$/i.test(t));
  if (gi === -1) continue;

  // Opciones globales de git antes del subcomando (-C ruta, -c clave=valor, etc.).
  let repoDir = dir;
  let i = gi + 1;
  while (i < tokens.length && tokens[i].startsWith("-")) {
    if (tokens[i] === "-C" && tokens[i + 1]) {
      repoDir = path.resolve(dir, tokens[i + 1]);
      i += 2;
    } else if (tokens[i] === "-c" && tokens[i + 1]) {
      i += 2;
    } else {
      i += 1;
    }
  }
  const sub = tokens[i];
  const args = tokens.slice(i + 1);
  if (!sub) continue;

  if (sub === "switch" || sub === "checkout") {
    const create = args.findIndex((a) => /^(-c|-C|-b|-B|--create|--force-create)$/.test(a));
    const positional = args.filter((a) => !a.startsWith("-"));
    if (create !== -1 && args[create + 1]) simulated.set(repoDir, args[create + 1]);
    else if (positional.length === 1 && !args.includes("--")) simulated.set(repoDir, positional[0]);
  }

  if (sub === "commit") {
    const branch = currentBranch(repoDir);
    if (branch && PROTECTED.has(branch)) {
      deny(`no se hacen commits directos en '${branch}'. Crea una rama de funcionalidad (git switch -c feature/<tema>) y súbela por PR/MR.`);
    }
  }

  if (sub === "merge") {
    const branch = currentBranch(repoDir);
    if (branch && PROTECTED.has(branch) && !args.includes("--abort")) {
      deny(`no se mezcla nada estando en '${branch}'. Los cambios llegan a la rama principal solo por PR/MR.`);
    }
  }

  if (sub === "branch") {
    if (args.some((a) => /^(-d|-D|--delete)$/.test(a) || /^-[a-zA-Z]*[dD][a-zA-Z]*$/.test(a))) {
      deny("nunca se borran ramas.");
    }
  }

  if (sub === "push") {
    if (args.some((a) => a === "--delete" || a === "-d")) deny("nunca se borran ramas remotas.");
    if (args.some((a) => a === "--all" || a === "--mirror")) {
      deny("push --all/--mirror subiría también la rama principal. Sube solo tu rama.");
    }
    const refspecs = args.filter((a) => !a.startsWith("-")).slice(1); // el primero es el remoto
    if (refspecs.some((r) => r.startsWith(":"))) deny("nunca se borran ramas remotas.");
    const targets = refspecs.map((r) => r.replace(/^\+/, "").split(":").pop().replace(/^refs\/heads\//, ""));
    if (targets.some((t) => PROTECTED.has(t))) {
      deny(`no se sube directo a '${targets.find((t) => PROTECTED.has(t))}'. Sube tu rama y abre un PR/MR.`);
    }
    if (refspecs.length === 0 || targets.includes("HEAD")) {
      const branch = currentBranch(repoDir);
      if (branch && PROTECTED.has(branch)) {
        deny(`estás en '${branch}': este push iría directo a la rama principal. Crea una rama y abre un PR/MR.`);
      }
    }
  }
}
process.exit(0);
