const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 开始构建简化静态版本...')

// 要排除的目录列表
const excludeDirs = [
  'app/mobile-checkin/[centerId]',
  'app/student-points/[cardNumber]',
  'app/teacher-points/[cardNumber]'
]

// 临时重命名有问题的目录
const tempDirs = []

try {
  // 重命名有问题的目录
  for (const dir of excludeDirs) {
    const fullPath = path.join(__dirname, '..', dir)
    const tempPath = fullPath + '-temp'
    
    if (fs.existsSync(fullPath)) {
      fs.renameSync(fullPath, tempPath)
      tempDirs.push({ original: fullPath, temp: tempPath })
      console.log(`✅ 临时重命名: ${dir}`)
    }
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
  // 恢复重命名的目录
  for (const { original, temp } of tempDirs) {
    if (fs.existsSync(temp)) {
      if (fs.existsSync(original)) {
        fs.rmSync(original, { recursive: true, force: true })
      }
      fs.renameSync(temp, original)
      console.log(`✅ 恢复目录: ${path.basename(original)}`)
    }
  }
}

console.log('🎉 简化静态构建流程完成！')
console.log('📁 输出目录: ./out')
console.log('🌐 可以部署到GitHub Pages了！')
