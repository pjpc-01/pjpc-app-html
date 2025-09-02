const fs = require('fs')
const path = require('path')

// 递归查找所有API路由文件
function findApiRoutes(dir) {
  const files = []
  const items = fs.readdirSync(dir)
  
  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory()) {
      files.push(...findApiRoutes(fullPath))
    } else if (item === 'route.ts' || item === 'route.js') {
      files.push(fullPath)
    }
  }
  
  return files
}

// 为API路由添加静态导出配置
function addStaticConfig(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    
    // 检查是否已经有静态配置
    if (content.includes('export const dynamic = \'force-static\'')) {
      console.log(`⏭️  跳过 ${filePath} (已有配置)`)
      return
    }
    
    // 在import语句后添加静态配置
    const lines = content.split('\n')
    let insertIndex = 0
    
    // 找到最后一个import语句
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) {
        insertIndex = i + 1
      }
    }
    
    // 插入静态配置
    lines.splice(insertIndex, 0, '', '// 静态导出配置', 'export const dynamic = \'force-static\'')
    
    const newContent = lines.join('\n')
    fs.writeFileSync(filePath, newContent, 'utf8')
    console.log(`✅ 已为 ${filePath} 添加静态配置`)
    
  } catch (error) {
    console.error(`❌ 处理 ${filePath} 失败:`, error.message)
  }
}

// 主函数
function main() {
  const apiDir = path.join(__dirname, '..', 'app', 'api')
  
  if (!fs.existsSync(apiDir)) {
    console.log('❌ API目录不存在')
    return
  }
  
  console.log('🔍 查找API路由文件...')
  const apiFiles = findApiRoutes(apiDir)
  
  console.log(`📁 找到 ${apiFiles.length} 个API路由文件`)
  
  for (const file of apiFiles) {
    addStaticConfig(file)
  }
  
  console.log('🎉 所有API路由已配置静态导出！')
}

main()
