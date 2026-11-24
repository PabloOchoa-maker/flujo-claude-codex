# Installs the Claude Code + Codex workflow for the current user.
# Usage (from the repo root):  powershell -ExecutionPolicy Bypass -File install\install.ps1
# Idempotent: it can be run several times. It backs up whatever it modifies.
$ErrorActionPreference = 'Stop'

$repo    = Split-Path -Parent $PSScriptRoot
$claude  = Join-Path $HOME '.claude'
$stamp   = Get-Date -Format 'yyyyMMdd-HHmmss'

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

# 0. Requirements
Write-Step 'Checking requirements'
foreach ($cmd in 'node', 'git', 'npx') {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) { throw "'$cmd' is missing. Install it and run the script again." }
}
if (-not (Get-Command codex -ErrorAction SilentlyContinue)) {
  Write-Warning "Codex CLI not found. Install it (npm i -g @openai/codex) and sign in with 'codex login'."
}
New-Item -ItemType Directory -Force (Join-Path $claude 'skills'), (Join-Path $claude 'hooks') | Out-Null

# 1. This repo's skills
Write-Step 'Copying this repo''s skills (analista, codex-driven-development)'
foreach ($s in 'analista', 'codex-driven-development') {
  $dest = Join-Path $claude "skills\$s"
  New-Item -ItemType Directory -Force $dest | Out-Null
  Copy-Item (Join-Path $repo "skills\$s\*") $dest -Recurse -Force
}

# 2. Third-party skills, installed from their source
Write-Step 'Installing third-party skills from their source (npx skills)'
$thirdParty = @(
  'mattpocock/skills@grilling',
  'tt-a1i/archify@archify'
) + (@('bmad', 'bmad-forge-idea', 'bmad-spec', 'bmad-product-brief', 'bmad-prd', 'bmad-architecture',
       'bmad-create-epics-and-stories', 'bmad-preview-ticketing', 'bmad-sprint-planning',
       'bmad-project-context', 'bmad-advanced-elicitation', 'bmad-correct-course',
       'bmad-retrospective', 'bmad-walkthrough') | ForEach-Object { "bmad-code-org/BMAD-METHOD@$_" })
foreach ($t in $thirdParty) {
  Write-Host "  - $t"
  & npx --yes skills add $t -g -y
  if ($LASTEXITCODE -ne 0) { Write-Warning "  Could not install $t (see THIRD-PARTY.md)." }
}

# 3. Hooks
Write-Step 'Copying hooks'
Copy-Item (Join-Path $repo 'hooks\*.mjs') (Join-Path $claude 'hooks') -Force

Write-Step 'Registering hooks in settings.json'
$settingsPath = Join-Path $claude 'settings.json'
if (Test-Path $settingsPath) {
  Copy-Item $settingsPath "$settingsPath.bak-$stamp"
  $settings = Get-Content $settingsPath -Raw | ConvertFrom-Json
} else {
  $settings = [pscustomobject]@{}
}
$newHooks = (Get-Content (Join-Path $repo 'claude\settings.hooks.json') -Raw | ConvertFrom-Json).hooks
if (-not $settings.PSObject.Properties['hooks']) { $settings | Add-Member hooks ([pscustomobject]@{}) }
foreach ($eventName in $newHooks.PSObject.Properties.Name) {
  $list = @()
  if ($settings.hooks.PSObject.Properties[$eventName]) { $list = @($settings.hooks.$eventName) }
  foreach ($group in $newHooks.$eventName) {
    $cmd = $group.hooks[0].command
    $already = $list | Where-Object { $_.hooks | Where-Object { $_.command -eq $cmd } }
    if (-not $already) { $list += $group }
  }
  $settings.hooks | Add-Member $eventName $list -Force
}
$json = $settings | ConvertTo-Json -Depth 32
[System.IO.File]::WriteAllText($settingsPath, $json, (New-Object System.Text.UTF8Encoding $false))

# 4. Rules in CLAUDE.md
Write-Step 'Adding the rules to ~/.claude/CLAUDE.md'
$claudeMd = Join-Path $claude 'CLAUDE.md'
$marker = '## Teamwork: Claude Code + Codex'
$current = if (Test-Path $claudeMd) { Get-Content $claudeMd -Raw } else { '' }
if ($current -like "*$marker*") {
  Write-Host '  Already there; left untouched.'
} else {
  if (Test-Path $claudeMd) { Copy-Item $claudeMd "$claudeMd.bak-$stamp" }
  $section = Get-Content (Join-Path $repo 'claude\CLAUDE-section.md') -Raw
  [System.IO.File]::WriteAllText($claudeMd, ($current.TrimEnd() + "`n`n" + $section), (New-Object System.Text.UTF8Encoding $false))
}

Write-Step 'Done. One step is left, inside Claude Code:'
Write-Host @'
  /plugin install superpowers@claude-plugins-official
  /plugin marketplace add openai/codex-plugin-cc
  /plugin install codex@openai-codex
  /codex:setup          (do not turn on the review gate)

Then run:  powershell -ExecutionPolicy Bypass -File install\verify.ps1
'@
