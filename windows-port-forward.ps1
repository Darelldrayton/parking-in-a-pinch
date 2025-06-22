# Run this PowerShell script as Administrator on Windows to forward ports from WSL2

Write-Host "Setting up port forwarding from Windows to WSL2..." -ForegroundColor Green

# Get WSL2 IP address
$wsl_ip = (wsl hostname -I).Trim()
Write-Host "WSL2 IP: $wsl_ip" -ForegroundColor Yellow

# Remove existing port proxy rules
Write-Host "Removing existing port forwarding rules..." -ForegroundColor Yellow
netsh interface portproxy delete v4tov4 listenport=3007 listenaddress=127.0.0.1 2>$null
netsh interface portproxy delete v4tov4 listenport=3008 listenaddress=127.0.0.1 2>$null
netsh interface portproxy delete v4tov4 listenport=8000 listenaddress=127.0.0.1 2>$null

# Add new port proxy rules
Write-Host "Adding new port forwarding rules..." -ForegroundColor Yellow
netsh interface portproxy add v4tov4 listenport=3008 listenaddress=127.0.0.1 connectport=3008 connectaddress=$wsl_ip
netsh interface portproxy add v4tov4 listenport=8000 listenaddress=127.0.0.1 connectport=8000 connectaddress=$wsl_ip

# Show current rules
Write-Host "`nCurrent port forwarding rules:" -ForegroundColor Green
netsh interface portproxy show v4tov4

Write-Host "`n✅ Port forwarding setup complete!" -ForegroundColor Green
Write-Host "You can now access:" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:3008" -ForegroundColor Cyan
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "`n⚠️ Note: You need to run this script as Administrator" -ForegroundColor Yellow