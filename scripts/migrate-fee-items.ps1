# PowerShell script to run the fee items migration
Write-Host "🔄 Starting fee items migration..." -ForegroundColor Yellow

# Check if Node.js is available
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if the migration script exists
$scriptPath = "migrate-fee-items-to-full-details.js"
if (-not (Test-Path $scriptPath)) {
    Write-Host "❌ Migration script not found: $scriptPath" -ForegroundColor Red
    exit 1
}

# Check if PocketBase is running
Write-Host "🔍 Checking if PocketBase is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8090/api/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ PocketBase is running" -ForegroundColor Green
} catch {
    Write-Host "❌ PocketBase is not running. Please start PocketBase first." -ForegroundColor Red
    Write-Host "💡 You can start PocketBase using: ./pocketbase serve" -ForegroundColor Cyan
    exit 1
}

# Run the migration script
Write-Host "🚀 Running migration script..." -ForegroundColor Yellow
try {
    node $scriptPath
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Migration failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        exit $LASTEXITCODE
    }
} catch {
    Write-Host "❌ Error running migration script: $_" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 Fee items migration process completed!" -ForegroundColor Green
