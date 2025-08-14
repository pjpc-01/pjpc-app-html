# PowerShell 启动脚本 - 支持多端口启动
param(
    [Parameter(Mandatory=$false)]
    [int]$Port = 3001
)

Write-Host "🚀 启动 PJPC 应用开发服务器..." -ForegroundColor Green
Write-Host "📍 端口: $Port" -ForegroundColor Yellow
Write-Host "🌐 访问地址: http://localhost:$Port" -ForegroundColor Cyan
Write-Host ""

# 检查端口是否被占用
$portInUse = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "⚠️  警告: 端口 $Port 已被占用" -ForegroundColor Red
    Write-Host "尝试使用下一个可用端口..." -ForegroundColor Yellow
}

# 启动开发服务器
try {
    $env:PORT = $Port
    npm run dev
} catch {
    Write-Host "❌ 启动失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 提示:" -ForegroundColor Yellow
    Write-Host "1. 确保已安装依赖: npm install" -ForegroundColor White
    Write-Host "2. 检查 .env.local 文件配置" -ForegroundColor White
    Write-Host "3. 尝试其他端口: .\start-dev.ps1 -Port 3002" -ForegroundColor White
}
