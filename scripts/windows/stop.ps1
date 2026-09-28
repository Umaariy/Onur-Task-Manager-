$pidPath = Join-Path (Join-Path $env:LOCALAPPDATA 'ONUR Task Manager') 'server.pid'
if (-not (Test-Path -LiteralPath $pidPath)) { exit 0 }
$serverId = 0
[void][int]::TryParse((Get-Content -LiteralPath $pidPath -Raw).Trim(), [ref]$serverId)
if ($serverId -gt 0) { Stop-Process -Id $serverId -ErrorAction SilentlyContinue }
Remove-Item -LiteralPath $pidPath -ErrorAction SilentlyContinue
