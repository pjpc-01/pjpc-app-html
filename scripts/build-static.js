const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 开始构建静态版本...')

// 临时重命名API目录以避免构建错误
const apiDir = path.join(__dirname, '..', 'app', 'api')
const apiBackupDir = path.join(__dirname, '..', 'app', 'api-backup')

try {
  // 备份API目录
  if (fs.existsSync(apiDir)) {
    if (fs.existsSync(apiBackupDir)) {
      fs.rmSync(apiBackupDir, { recursive: true, force: true })
    }
    fs.renameSync(apiDir, apiBackupDir)
    console.log('✅ API目录已临时重命名')
  }

  // 执行构建
  console.log('📦 执行Next.js构建...')
  execSync('cross-env NODE_ENV=production STATIC_EXPORT=true next build', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  })

  console.log('✅ 静态构建完成！')

} catch (error) {
  console.error('❌ 构建失败:', error.message)
  process.exit(1)
} finally {
  // 恢复API目录
  if (fs.existsSync(apiBackupDir)) {
    if (fs.existsSync(apiDir)) {
      fs.rmSync(apiDir, { recursive: true, force: true })
    }
    fs.renameSync(apiBackupDir, apiDir)
    console.log('✅ API目录已恢复')
  }
}

console.log('🎉 静态构建流程完成！')
console.log('📁 输出目录: ./out')
console.log('🌐 可以部署到GitHub Pages了！')
