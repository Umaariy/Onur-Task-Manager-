param([switch]$SkipWebBuild)

$ErrorActionPreference = 'Stop'
$sourceRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$stage = Join-Path $sourceRoot 'work\installer-stage'
$expected = [IO.Path]::GetFullPath((Join-Path $sourceRoot 'work\installer-stage'))
if (-not [string]::Equals($stage, $expected, [StringComparison]::OrdinalIgnoreCase)) {
  throw 'Unexpected staging path.'
}

Push-Location $sourceRoot
try {
  if (-not $SkipWebBuild) {
    & npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw 'OTM build failed.' }
  }
  if (Test-Path -LiteralPath $stage) {
    Remove-Item -LiteralPath $stage -Recurse -Force
  }
  New-Item -ItemType Directory -Path $stage -Force | Out-Null
  $manifest = '{"name":"onur-task-manager-local-runtime","private":true,"version":"1.0.0","type":"module","dependencies":{"wrangler":"4.92.0"}}'
  [IO.File]::WriteAllText((Join-Path $stage 'package.json'), $manifest, (New-Object Text.UTF8Encoding($false)))
  & npm.cmd install --prefix $stage --omit=dev --no-audit --no-fund --ignore-scripts
  if ($LASTEXITCODE -ne 0) { throw 'Runtime dependency install failed.' }

  Copy-Item -LiteralPath (Join-Path $sourceRoot 'dist') -Destination $stage -Recurse -Force
  if (Test-Path -LiteralPath (Join-Path $stage 'dist\server\.dev.vars')) {
    throw 'Secret file found in build output; refusing to package it.'
  }
  New-Item -ItemType Directory -Path (Join-Path $stage 'drizzle') -Force | Out-Null
  foreach ($migration in @('0000_clever_warstar.sql', '0001_otm_accounts.sql', '0002_password_resets.sql')) {
    Copy-Item -LiteralPath (Join-Path $sourceRoot "drizzle\$migration") -Destination (Join-Path $stage 'drizzle') -Force
  }
  $node = (Get-Command node.exe -ErrorAction Stop).Source
  Copy-Item -LiteralPath $node -Destination (Join-Path $stage 'node.exe') -Force
  & node.exe (Join-Path $PSScriptRoot 'build-icon.mjs')
  if ($LASTEXITCODE -ne 0) { throw 'Icon build failed.' }

  $compiler = @(
    'C:\Program Files (x86)\NSIS\makensis.exe',
    'C:\Program Files\NSIS\makensis.exe'
  ) | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
  if (-not $compiler) { throw 'NSIS makensis.exe is required to build Setup.exe.' }
  Push-Location $PSScriptRoot
  try {
    & $compiler /V2 'otm-installer.nsi'
    if ($LASTEXITCODE -ne 0) { throw 'Installer compilation failed.' }
  } finally { Pop-Location }
  $installer = Join-Path (Split-Path $sourceRoot -Parent) 'ONUR-Task-Manager-Setup.exe'
  if (-not (Test-Path -LiteralPath $installer)) { throw 'Setup.exe not found after compilation.' }
  Write-Output $installer
} finally { Pop-Location }
