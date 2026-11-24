// PreToolUse hook (Bash and PowerShell): git guards for Claude and Codex.
//   1. No direct commits on main/master.
//   2. No push to main/master and no merge while on main/master: everything lands through a PR/MR.
//   3. Never delete branches (local or remote).
// It only affects commands Claude Code runs; git you type by hand in your terminal is not checked.
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
        permissionDecisionReason: `Git guard: ${reason}`,
      },
    }),
  );
  process.exit(0);
}

// Branch switches inside the same command (git switch master && git commit ...).
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

// Split the command into segments (&&, ||, ;, |, newlines) and follow `cd`.
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

  // Global git options before the subcommand (-C path, -c key=value, etc.).
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
      deny(`no direct commits on '${branch}'. Create a feature branch (git switch -c feature/<topic>) and land it through a PR/MR.`);
    }
  }

  if (sub === "merge") {
    const branch = currentBranch(repoDir);
    if (branch && PROTECTED.has(branch) && !args.includes("--abort")) {
      deny(`no merging while on '${branch}'. Changes reach the main branch only through a PR/MR.`);
    }
  }

  if (sub === "branch") {
    if (args.some((a) => /^(-d|-D|--delete)$/.test(a) || /^-[a-zA-Z]*[dD][a-zA-Z]*$/.test(a))) {
      deny("branches are never deleted.");
    }
  }

  if (sub === "push") {
    if (args.some((a) => a === "--delete" || a === "-d")) deny("remote branches are never deleted.");
    if (args.some((a) => a === "--all" || a === "--mirror")) {
      deny("push --all/--mirror would also push the main branch. Push only your branch.");
    }
    const refspecs = args.filter((a) => !a.startsWith("-")).slice(1); // the first one is the remote
    if (refspecs.some((r) => r.startsWith(":"))) deny("remote branches are never deleted.");
    const targets = refspecs.map((r) => r.replace(/^\+/, "").split(":").pop().replace(/^refs\/heads\//, ""));
    if (targets.some((t) => PROTECTED.has(t))) {
      deny(`no pushing straight to '${targets.find((t) => PROTECTED.has(t))}'. Push your branch and open a PR/MR.`);
    }
    if (refspecs.length === 0 || targets.includes("HEAD")) {
      const branch = currentBranch(repoDir);
      if (branch && PROTECTED.has(branch)) {
        deny(`you are on '${branch}': this push would go straight to the main branch. Create a branch and open a PR/MR.`);
      }
    }
  }
}
process.exit(0);
