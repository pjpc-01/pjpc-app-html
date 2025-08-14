# Simple PowerShell startup script
param(
    [Parameter(Mandatory=$false)]
    [int]$Port = 3001
)

Write-Host "Starting PJPC App Development Server..." -ForegroundColor Green
Write-Host "Port: $Port" -ForegroundColor Yellow
Write-Host "URL: http://localhost:$Port" -ForegroundColor Cyan
Write-Host ""

# Set environment variable and start
$env:PORT = $Port
npm run dev
