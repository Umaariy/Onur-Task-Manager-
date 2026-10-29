# Caddy (HTTPS) as an always-on Windows task.
# 1. Download caddy_windows_amd64.exe from https://caddyserver.com/download , rename to caddy.exe
#    and put it in D:\OnurTasks\caddy\
# 2. Copy scripts\windows-server\Caddyfile to D:\OnurTasks\caddy\Caddyfile and set your domain
# 3. Run AS ADMINISTRATOR:
#      powershell -NoProfile -ExecutionPolicy Bypass -File scripts\windows-server\install-caddy.ps1
# Requires: DNS A record -> this server's public IP, ports 80 and 443 open to this server.

$ErrorActionPreference = 'Stop'
$app = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$base = Split-Path $app -Parent
$caddyDir = Join-Path $base 'caddy'
$caddy = Join-Path $caddyDir 'caddy.exe'
$caddyfile = Join-Path $caddyDir 'Caddyfile'
$logs = Join-Path $base 'logs'
New-Item -ItemType Directory -Force -Path $caddyDir, $logs | Out-Null

if (-not (Test-Path $caddy)) { throw "caddy.exe topilmadi: $caddy" }
if (-not (Test-Path $caddyfile)) {
    Copy-Item (Join-Path $PSScriptRoot 'Caddyfile') $caddyfile
    throw "Caddyfile nusxalandi: $caddyfile - ichidagi domenni tekshirib, skriptni qayta ishga tushiring."
}

& $caddy validate --config $caddyfile --adapter caddyfile
if ($LASTEXITCODE -ne 0) { throw 'Caddyfile da xato bor' }

Write-Host '==> Windows firewall: 80 va 443 portlari' -ForegroundColor Cyan
foreach ($p in 80, 443) {
    if (-not (Get-NetFirewallRule -DisplayName "ONUR Caddy $p" -ErrorAction SilentlyContinue)) {
        New-NetFirewallRule -DisplayName "ONUR Caddy $p" -Direction Inbound -Protocol TCP -LocalPort $p -Action Allow | Out-Null
    }
}

$taskName = 'ONUR Caddy'
$runAs = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew
$action = New-ScheduledTaskAction -Execute 'cmd.exe' -WorkingDirectory $caddyDir -Argument ('/c ""' + $caddy + '" run --config "' + $caddyfile + '" --adapter caddyfile >> "' + (Join-Path $logs 'caddy.log') + '" 2>&1"')
Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger (New-ScheduledTaskTrigger -AtStartup) -Principal $runAs -Settings $settings -Force | Out-Null
Start-ScheduledTask -TaskName $taskName
Write-Host "TAYYOR. Bir daqiqadan keyin domeningizni brauzerda oching. Log: $logs\caddy.log" -ForegroundColor Green
