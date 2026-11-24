# Checks that the workflow is installed.
# Usage:  powershell -ExecutionPolicy Bypass -File install\verify.ps1
$claude = Join-Path $HOME '.claude'
$failures = 0
function Test-Item($ok, $msg) {
  if ($ok) { Write-Host "  [ok]      $msg" -ForegroundColor Green }
  else     { Write-Host "  [missing] $msg" -ForegroundColor Yellow; $script:failures++ }
}

Write-Host "`nSkills"
$skillDirs = @((Join-Path $claude 'skills'), (Join-Path $HOME '.agents\skills'))
foreach ($s in 'analista', 'codex-driven-development', 'grilling', 'archify', 'bmad', 'bmad-forge-idea',
               'bmad-spec', 'bmad-prd', 'bmad-architecture', 'bmad-preview-ticketing', 'bmad-sprint-planning',
               'bmad-project-context', 'bmad-walkthrough') {
  $found = $skillDirs | Where-Object { Test-Path (Join-Path $_ "$s\SKILL.md") }
  Test-Item ([bool]$found) $s
}

Write-Host "`nHooks"
foreach ($h in 'router-prompt.mjs', 'git-guards.mjs') {
  Test-Item (Test-Path (Join-Path $claude "hooks\$h")) "file $h"
}
$settings = Join-Path $claude 'settings.json'
$txt = if (Test-Path $settings) { Get-Content $settings -Raw } else { '' }
Test-Item ($txt -match 'router-prompt\.mjs') 'router-prompt registered in settings.json'
Test-Item ($txt -match 'git-guards\.mjs')    'git-guards registered in settings.json'

Write-Host "`nHook behavior"
$router = Join-Path $claude 'hooks\router-prompt.mjs'
if (Test-Path $router) {
  $out = '{"prompt":"implement the login endpoint"}' | node $router
  Test-Item ($out -match 'CLAUDE \+ CODEX FLOW') 'the router reminds the split on a code message'
}
$guards = Join-Path $claude 'hooks\git-guards.mjs'
if (Test-Path $guards) {
  $out = '{"tool_input":{"command":"git branch -D test"},"cwd":"."}' | node $guards
  Test-Item ($out -match '"deny"') 'git-guards blocks "git branch -D"'
}

Write-Host "`nRules and tools"
$md = Join-Path $claude 'CLAUDE.md'
Test-Item ((Test-Path $md) -and ((Get-Content $md -Raw) -match 'Teamwork: Claude Code \+ Codex')) 'rules in ~/.claude/CLAUDE.md'
Test-Item ([bool](Get-Command codex -ErrorAction SilentlyContinue)) 'Codex CLI'

Write-Host "`nThe plugins (superpowers, codex) are checked inside Claude Code with /plugin."
if ($failures -eq 0) { Write-Host "`nAll good." -ForegroundColor Green }
else { Write-Host "`n$failures item(s) to fix. See THIRD-PARTY.md." -ForegroundColor Yellow; exit 1 }
