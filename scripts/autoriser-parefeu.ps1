# A lancer en PowerShell ADMINISTRATEUR (clic droit -> Executer en tant qu'administrateur)
# Autorise le telephone a joindre l'API (3001) et Expo (8081) sur ce PC

Write-Host "Regles pare-feu SecurityApp..." -ForegroundColor Cyan

$rules = @(
  @{ Name = "SecurityApp API 3001"; Port = 3001 },
  @{ Name = "SecurityApp Expo 8081"; Port = 8081 }
)

foreach ($r in $rules) {
  $existing = Get-NetFirewallRule -DisplayName $r.Name -ErrorAction SilentlyContinue
  if ($existing) {
    Remove-NetFirewallRule -DisplayName $r.Name -ErrorAction SilentlyContinue
  }
  New-NetFirewallRule -DisplayName $r.Name -Direction Inbound -LocalPort $r.Port -Protocol TCP -Action Allow -Profile Private | Out-Null
  Write-Host "  OK : port $($r.Port)" -ForegroundColor Green
}

# Node.js en entree (reseau prive)
$nodePath = "C:\Program Files\nodejs\node.exe"
if (Test-Path $nodePath) {
  netsh advfirewall firewall add rule name="SecurityApp Node.js entree" dir=in action=allow program="$nodePath" profile=private enable=yes 2>$null
  Write-Host "  OK : Node.js (entree, reseau prive)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Verifiez aussi : Wi-Fi en profil PRIVE (Parametres Windows)." -ForegroundColor Yellow
Write-Host "Test telephone : http://10.78.217.97:3001/api/health" -ForegroundColor Yellow
Write-Host "Si ca echoue encore = isolation Wi-Fi campus (hotspot telephone ou autre PC)." -ForegroundColor Yellow
