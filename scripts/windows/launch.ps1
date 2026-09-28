param(
  [switch]$NoBrowser,
  [string]$DataRoot = ''
)

$ErrorActionPreference = 'Stop'
$appRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
if (-not $DataRoot) { $DataRoot = Join-Path $env:LOCALAPPDATA 'ONUR Task Manager' }
$dataRoot = [IO.Path]::GetFullPath($DataRoot)
$port = 5181
$url = "http://127.0.0.1:$port"

function Show-LaunchError([string]$message) {
  Add-Type -AssemblyName System.Windows.Forms
  [void][System.Windows.Forms.MessageBox]::Show($message, 'ONUR Task Manager', 'OK', 'Error')
}

function Open-OTM([bool]$setupRequired) {
  if ($NoBrowser) { return }
  if ($setupRequired) {
    Start-Process -FilePath 'notepad.exe' -ArgumentList ('"' + $keyPath + '"')
    Start-Process -FilePath "$url/setup"
  } else {
    Start-Process -FilePath "$url/login"
  }
}

try {
  New-Item -ItemType Directory -Path $dataRoot -Force | Out-Null
  $keyPath = Join-Path $dataRoot 'setup-key.txt'
  if (-not (Test-Path -LiteralPath $keyPath)) {
    $bytes = New-Object byte[] 32
    $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    $key = ([BitConverter]::ToString($bytes)).Replace('-', '').ToLowerInvariant()
    Set-Content -LiteralPath $keyPath -Value $key -Encoding Ascii
  } else {
    $key = (Get-Content -LiteralPath $keyPath -Raw).Trim()
  }
  if ($key.Length -lt 64) { throw 'Boshlang‘ich kalit fayli yaroqsiz.' }

  # Wrangler reads local secrets next to its generated config, not from the source directory.
  $varsPath = Join-Path $appRoot 'dist\server\.dev.vars'
  Set-Content -LiteralPath $varsPath -Value "OTM_SETUP_SECRET=$key" -Encoding Ascii

  $pidPath = Join-Path $dataRoot 'server.pid'
  if (Test-Path -LiteralPath $pidPath) {
    $savedPid = 0
    [void][int]::TryParse((Get-Content -LiteralPath $pidPath -Raw).Trim(), [ref]$savedPid)
    if ($savedPid -gt 0 -and (Get-Process -Id $savedPid -ErrorAction SilentlyContinue)) {
      try {
        $response = Invoke-WebRequest -Uri "$url/api/v1/auth/setup" -UseBasicParsing -TimeoutSec 3
        if ($response.StatusCode -eq 200) {
          Open-OTM ([bool](($response.Content | ConvertFrom-Json).setupRequired))
          exit 0
        }
      } catch { }
    }
  }

  if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
    throw "Mahalliy $port port band. U yerdagi dasturni yopib, ONUR Task Manager'ni qayta oching."
  }

  $node = Join-Path $appRoot 'node.exe'
  $wrangler = 'node_modules/wrangler/bin/wrangler.js'
  if (-not (Test-Path -LiteralPath $node)) { throw 'Ichki ishga tushirgich topilmadi.' }
  $quotedData = '"' + $dataRoot + '"'
  foreach ($migration in @('0000_clever_warstar.sql', '0001_otm_accounts.sql', '0002_password_resets.sql')) {
    $marker = Join-Path $dataRoot ($migration + '.done')
    if (Test-Path -LiteralPath $marker) { continue }
    $migrationLog = Join-Path $dataRoot 'migration.log'
    $migrationError = Join-Path $dataRoot 'migration-error.log'
    $arguments = @($wrangler, 'd1', 'execute', 'DB', '--local', '--config', 'dist/server/wrangler.json', '--persist-to', $quotedData, '--file', "drizzle/$migration")
    $result = Start-Process -FilePath $node -ArgumentList $arguments -WorkingDirectory $appRoot -WindowStyle Hidden -RedirectStandardOutput $migrationLog -RedirectStandardError $migrationError -Wait -PassThru
    if ($result.ExitCode -ne 0) {
      throw "Ma'lumotlar bazasini tayyorlashda xato yuz berdi. Tafsilot: $migrationError"
    }
    Set-Content -LiteralPath $marker -Value 'done' -Encoding Ascii
  }

  $stdout = Join-Path $dataRoot 'server.log'
  $stderr = Join-Path $dataRoot 'server-error.log'
  $arguments = @($wrangler, 'dev', '--config', 'dist/server/wrangler.json', '--local', '--persist-to', $quotedData, '--ip', '127.0.0.1', '--port', "$port", '--inspector-port', '0')
  $server = Start-Process -FilePath $node -ArgumentList $arguments -WorkingDirectory $appRoot -WindowStyle Hidden -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru
  Set-Content -LiteralPath $pidPath -Value $server.Id -Encoding Ascii

  $ready = $false
  for ($attempt = 0; $attempt -lt 60; $attempt++) {
    if ($server.HasExited) { break }
    try {
      $response = Invoke-WebRequest -Uri "$url/api/v1/auth/setup" -UseBasicParsing -TimeoutSec 2
      if ($response.StatusCode -eq 200) { $ready = $true; break }
    } catch { }
    Start-Sleep -Milliseconds 500
  }
  if (-not $ready) { throw "OTM ishga tushmadi. Tafsilot: $stderr" }

  Open-OTM ([bool](($response.Content | ConvertFrom-Json).setupRequired))
} catch {
  Show-LaunchError $_.Exception.Message
  exit 1
}
