# Instala el flujo Claude Code + Codex en este usuario.
# Uso (desde la raíz del repo):  powershell -ExecutionPolicy Bypass -File install\install.ps1
# Es idempotente: se puede correr varias veces. Hace copia de seguridad de lo que modifica.
$ErrorActionPreference = 'Stop'

$repo    = Split-Path -Parent $PSScriptRoot
$claude  = Join-Path $HOME '.claude'
$stamp   = Get-Date -Format 'yyyyMMdd-HHmmss'

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

# 0. Requisitos
Write-Step 'Comprobando requisitos'
foreach ($cmd in 'node', 'git', 'npx') {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) { throw "Falta '$cmd'. Instálalo y vuelve a correr el script." }
}
if (-not (Get-Command codex -ErrorAction SilentlyContinue)) {
  Write-Warning "No encuentro el CLI de Codex. Instálalo (npm i -g @openai/codex) e inicia sesión con 'codex login'."
}
New-Item -ItemType Directory -Force (Join-Path $claude 'skills'), (Join-Path $claude 'hooks') | Out-Null

# 1. Skills propias
Write-Step 'Copiando skills propias (analista, codex-driven-development)'
foreach ($s in 'analista', 'codex-driven-development') {
  $dest = Join-Path $claude "skills\$s"
  New-Item -ItemType Directory -Force $dest | Out-Null
  Copy-Item (Join-Path $repo "skills\$s\*") $dest -Recurse -Force
}

# 2. Skills de terceros desde su origen
Write-Step 'Instalando skills de terceros desde su origen (npx skills)'
$terceros = @(
  'mattpocock/skills@grilling',
  'tt-a1i/archify@archify'
) + (@('bmad', 'bmad-forge-idea', 'bmad-spec', 'bmad-product-brief', 'bmad-prd', 'bmad-architecture',
       'bmad-create-epics-and-stories', 'bmad-preview-ticketing', 'bmad-sprint-planning',
       'bmad-project-context', 'bmad-advanced-elicitation', 'bmad-correct-course',
       'bmad-retrospective', 'bmad-walkthrough') | ForEach-Object { "bmad-code-org/BMAD-METHOD@$_" })
foreach ($t in $terceros) {
  Write-Host "  - $t"
  & npx --yes skills add $t -g -y
  if ($LASTEXITCODE -ne 0) { Write-Warning "  No se pudo instalar $t (ver terceros.md)." }
}

# 3. Hooks
Write-Step 'Copiando hooks'
Copy-Item (Join-Path $repo 'hooks\*.mjs') (Join-Path $claude 'hooks') -Force

Write-Step 'Registrando hooks en settings.json'
$settingsPath = Join-Path $claude 'settings.json'
if (Test-Path $settingsPath) {
  Copy-Item $settingsPath "$settingsPath.bak-$stamp"
  $settings = Get-Content $settingsPath -Raw | ConvertFrom-Json
} else {
  $settings = [pscustomobject]@{}
}
$nuevos = (Get-Content (Join-Path $repo 'claude\settings.hooks.json') -Raw | ConvertFrom-Json).hooks
if (-not $settings.PSObject.Properties['hooks']) { $settings | Add-Member hooks ([pscustomobject]@{}) }
foreach ($evento in $nuevos.PSObject.Properties.Name) {
  $lista = @()
  if ($settings.hooks.PSObject.Properties[$evento]) { $lista = @($settings.hooks.$evento) }
  foreach ($grupo in $nuevos.$evento) {
    $cmd = $grupo.hooks[0].command
    $ya = $lista | Where-Object { $_.hooks | Where-Object { $_.command -eq $cmd } }
    if (-not $ya) { $lista += $grupo }
  }
  $settings.hooks | Add-Member $evento $lista -Force
}
$json = $settings | ConvertTo-Json -Depth 32
[System.IO.File]::WriteAllText($settingsPath, $json, (New-Object System.Text.UTF8Encoding $false))

# 4. Reglas en CLAUDE.md
Write-Step 'Añadiendo reglas a ~/.claude/CLAUDE.md'
$claudeMd = Join-Path $claude 'CLAUDE.md'
$marca = '## Trabajo en equipo: Claude Code + Codex'
$actual = if (Test-Path $claudeMd) { Get-Content $claudeMd -Raw } else { '' }
if ($actual -like "*$marca*") {
  Write-Host '  Ya estaban; no se tocan.'
} else {
  if (Test-Path $claudeMd) { Copy-Item $claudeMd "$claudeMd.bak-$stamp" }
  $seccion = Get-Content (Join-Path $repo 'claude\CLAUDE-seccion.md') -Raw
  [System.IO.File]::WriteAllText($claudeMd, ($actual.TrimEnd() + "`n`n" + $seccion), (New-Object System.Text.UTF8Encoding $false))
}

Write-Step 'Listo. Falta un paso dentro de Claude Code:'
Write-Host @'
  /plugin install superpowers@claude-plugins-official
  /plugin marketplace add openai/codex-plugin-cc
  /plugin install codex@openai-codex
  /codex:setup          (no actives el review gate)

Luego corre:  powershell -ExecutionPolicy Bypass -File install\verificar.ps1
'@
