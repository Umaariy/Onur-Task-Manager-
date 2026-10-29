# ONUR Task Manager - Windows Server installation
# Run in PowerShell AS ADMINISTRATOR from the app folder, e.g. D:\OnurTasks\app :
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\windows-server\install.ps1
#
# What it does:
#   1. checks Node.js 22.13+
#   2. installs packages and builds the server
#   3. creates ..\otm.env from the example (first time only)
#   4. registers Windows Task Scheduler jobs:
#        "ONUR Task Manager"         - starts at boot, restarts if it stops
#        "ONUR Task Manager Backup"  - daily backup at 02:00
#   5. starts the server and checks it answers
# Safe to run again (it updates the build and the scheduled tasks).

$ErrorActionPreference = 'Stop'
$app = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$base = Split-Path $app -Parent
$logs = Join-Path $base 'logs'
$envFile = Join-Path $base 'otm.env'

function Step($text) { Write-Host "`n==> $text" -ForegroundColor Cyan }

$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw 'PowerShell ni "Run as administrator" bilan oching.'
}

Step 'Node.js tekshirilmoqda'
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) { throw 'Node.js topilmadi. https://nodejs.org dan Node.js 22 LTS ni o''rnating va PowerShell ni qayta oching.' }
$node = $nodeCmd.Source
$version = (& $node --version).TrimStart('v')
$parts = $version.Split('.') | ForEach-Object { [int]$_ }
if ($parts[0] -lt 22 -or ($parts[0] -eq 22 -and $parts[1] -lt 13)) { throw "Node.js $version eski. Kamida 22.13 kerak." }
Write-Host "Node.js $version ($node)"
$npm = Join-Path (Split-Path $node -Parent) 'npm.cmd'

Step 'Papkalar'
New-Item -ItemType Directory -Force -Path $logs, (Join-Path $base 'data'), (Join-Path $base 'backups') | Out-Null
if (-not (Test-Path $envFile)) {
    Copy-Item (Join-Path $PSScriptRoot 'otm.env.example') $envFile
    Write-Host "Sozlamalar fayli yaratildi: $envFile  (OTM_PUBLIC_URL ni tekshiring)" -ForegroundColor Yellow
} else { Write-Host "Sozlamalar: $envFile" }

Step 'Paketlar o''rnatilmoqda (bir necha daqiqa)'
Push-Location $app
try {
    & $npm ci --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw 'npm ci bajarilmadi' }
    Step 'Server yig''ilmoqda (build)'
    & $npm run build
    if ($LASTEXITCODE -ne 0) { throw 'npm run build bajarilmadi' }
} finally { Pop-Location }

Step 'Windows Task Scheduler vazifalari'
$taskName = 'ONUR Task Manager'
$backupName = 'ONUR Task Manager Backup'
$startScript = Join-Path $app 'scripts\server\start.mjs'
$backupScript = Join-Path $app 'scripts\server\backup.mjs'
$serverLog = Join-Path $logs 'server.log'
$backupLog = Join-Path $logs 'backup.log'

$runAs = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

$serverAction = New-ScheduledTaskAction -Execute 'cmd.exe' -WorkingDirectory $app -Argument ('/c ""' + $node + '" --disable-warning=ExperimentalWarning "' + $startScript + '" >> "' + $serverLog + '" 2>&1"')
$serverTrigger = New-ScheduledTaskTrigger -AtStartup
Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
Register-ScheduledTask -TaskName $taskName -Action $serverAction -Trigger $serverTrigger -Principal $runAs -Settings $settings -Force | Out-Null

$backupAction = New-ScheduledTaskAction -Execute 'cmd.exe' -WorkingDirectory $app -Argument ('/c ""' + $node + '" --disable-warning=ExperimentalWarning "' + $backupScript + '" >> "' + $backupLog + '" 2>&1"')
$backupTrigger = New-ScheduledTaskTrigger -Daily -At 2:00am
$backupSettings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 2)
Register-ScheduledTask -TaskName $backupName -Action $backupAction -Trigger $backupTrigger -Principal $runAs -Settings $backupSettings -Force | Out-Null
Write-Host "Vazifalar: '$taskName', '$backupName'"

Step 'Server ishga tushirilmoqda'
Start-ScheduledTask -TaskName $taskName
$port = 5181
$portLine = Get-Content $envFile | Where-Object { $_ -match '^\s*PORT\s*=\s*(\d+)' } | Select-Object -First 1
if ($portLine -match '(\d+)') { $port = [int]$Matches[1] }
$ok = $false
for ($i = 0; $i -lt 30 -and -not $ok; $i++) {
    Start-Sleep -Seconds 2
    try { $r = Invoke-WebRequest -Uri "http://127.0.0.1:$port/api/v1/auth/setup" -UseBasicParsing -TimeoutSec 3; $ok = $r.StatusCode -eq 200 } catch { }
}
if (-not $ok) { throw "Server javob bermadi. Logni ko'ring: $serverLog" }

$dataDir = Join-Path $base 'data'
$dataLine = Get-Content $envFile | Where-Object { $_ -match '^\s*OTM_DATA_DIR\s*=\s*(.+)$' } | Select-Object -First 1
if ($dataLine -match '=\s*(.+)$') { $dataDir = $Matches[1].Trim() }
$keyFile = Join-Path $dataDir 'setup-key.txt'

Write-Host "`nTAYYOR. Server ishlayapti: http://127.0.0.1:$port" -ForegroundColor Green
Write-Host "Birinchi marta: shu serverda brauzerda http://127.0.0.1:$port/setup ni oching."
Write-Host "Sozlash kaliti fayli: $keyFile"
