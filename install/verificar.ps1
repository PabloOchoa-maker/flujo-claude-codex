# Comprueba que el flujo quedó instalado.
# Uso:  powershell -ExecutionPolicy Bypass -File install\verificar.ps1
$claude = Join-Path $HOME '.claude'
$fallos = 0
function Test-Item($ok, $msg) {
  if ($ok) { Write-Host "  [ok]    $msg" -ForegroundColor Green }
  else     { Write-Host "  [falta] $msg" -ForegroundColor Yellow; $script:fallos++ }
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
foreach ($h in 'router-prompt.mjs', 'candados-git.mjs') {
  Test-Item (Test-Path (Join-Path $claude "hooks\$h")) "archivo $h"
}
$settings = Join-Path $claude 'settings.json'
$txt = if (Test-Path $settings) { Get-Content $settings -Raw } else { '' }
Test-Item ($txt -match 'router-prompt\.mjs') 'router-prompt registrado en settings.json'
Test-Item ($txt -match 'candados-git\.mjs')  'candados-git registrado en settings.json'

Write-Host "`nComportamiento de los hooks"
$router = Join-Path $claude 'hooks\router-prompt.mjs'
if (Test-Path $router) {
  $out = '{"prompt":"implementa el endpoint de login"}' | node $router
  Test-Item ($out -match 'FLUJO CLAUDE \+ CODEX') 'el router recuerda el reparto ante un mensaje de código'
}
$candados = Join-Path $claude 'hooks\candados-git.mjs'
if (Test-Path $candados) {
  $out = '{"tool_input":{"command":"git branch -D prueba"},"cwd":"."}' | node $candados
  Test-Item ($out -match '"deny"') 'candados-git bloquea "git branch -D"'
}

Write-Host "`nReglas y herramientas"
$md = Join-Path $claude 'CLAUDE.md'
Test-Item ((Test-Path $md) -and ((Get-Content $md -Raw) -match 'Trabajo en equipo: Claude Code \+ Codex')) 'reglas en ~/.claude/CLAUDE.md'
Test-Item ([bool](Get-Command codex -ErrorAction SilentlyContinue)) 'CLI de Codex'

Write-Host "`nLos plugins (superpowers, codex) se comprueban dentro de Claude Code con /plugin."
if ($fallos -eq 0) { Write-Host "`nTodo en orden." -ForegroundColor Green }
else { Write-Host "`n$fallos punto(s) por resolver. Ver terceros.md." -ForegroundColor Yellow; exit 1 }
