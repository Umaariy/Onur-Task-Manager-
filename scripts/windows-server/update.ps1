# ONUR Task Manager - update to the latest code from GitHub
# Run AS ADMINISTRATOR from the app folder (D:\OnurTasks\app):
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\windows-server\update.ps1
# Makes a backup first, then: git pull -> npm ci -> build -> restart.

$ErrorActionPreference = 'Stop'
$app = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$taskName = 'ONUR Task Manager'
$node = (Get-Command node).Source
$npm = Join-Path (Split-Path $node -Parent) 'npm.cmd'

Push-Location $app
try {
    Write-Host '==> Zaxira nusxa' -ForegroundColor Cyan
    & $node --disable-warning=ExperimentalWarning scripts\server\backup.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Zaxira nusxa olinmadi - yangilash to''xtatildi' }

    Write-Host '==> Yangi kod (git pull)' -ForegroundColor Cyan
    git pull --ff-only
    if ($LASTEXITCODE -ne 0) { throw 'git pull bajarilmadi' }

    Write-Host '==> Paketlar va build' -ForegroundColor Cyan
    & $npm ci --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw 'npm ci bajarilmadi' }

    Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like '*scripts\server\start.mjs*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
    & $npm run build
    if ($LASTEXITCODE -ne 0) { throw 'npm run build bajarilmadi - server to''xtagan holatda. Xatoni tuzatib, qayta ishga tushiring.' }
} finally { Pop-Location }

Write-Host '==> Qayta ishga tushirish' -ForegroundColor Cyan
Start-ScheduledTask -TaskName $taskName
Start-Sleep -Seconds 5
Write-Host 'TAYYOR. Brauzerda tekshirib ko''ring.' -ForegroundColor Green
