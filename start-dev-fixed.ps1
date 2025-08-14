# 修复 OpenSSL 兼容性问题的启动脚本
param(
    [Parameter(Mandatory=$false)]
    [int]$Port = 3000
)

Write-Host "🔧 启动 PJPC 应用 (修复 OpenSSL 问题)..." -ForegroundColor Green
Write-Host "📍 端口: $Port" -ForegroundColor Yellow
Write-Host "🌐 访问地址: http://localhost:$Port" -ForegroundColor Cyan
Write-Host ""

# 设置环境变量解决 OpenSSL 问题
$env:NODE_OPTIONS = "--openssl-legacy-provider"
$env:PORT = $Port

Write-Host "✅ 已设置 NODE_OPTIONS=--openssl-legacy-provider" -ForegroundColor Green
Write-Host "✅ 已设置 PORT=$Port" -ForegroundColor Green
Write-Host ""

# 启动开发服务器
try {
    npm run dev
} catch {
    Write-Host "❌ 启动失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 提示:" -ForegroundColor Yellow
    Write-Host "1. 确保已安装依赖: npm install" -ForegroundColor White
    Write-Host "2. 检查 .env.local 文件配置" -ForegroundColor White
    Write-Host "3. 尝试其他端口: .\start-dev-fixed.ps1 -Port 3001" -ForegroundColor White
}
