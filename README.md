# 安亲班管理系统 (PJPC Management System)

一个现代化的教育管理系统，专为安亲班设计，提供完整的学生管理、教师管理、家长沟通和财务管理功能。

## 🚀 主要功能

### 👥 用户管理
- **多角色支持**: 管理员、教师、家长、会计
- **安全认证**: Firebase Authentication
- **权限控制**: 基于角色的访问控制
- **邮箱验证**: 安全的用户注册流程

### 📚 教育管理
- **学生管理**: 完整的学生档案和记录
- **课程管理**: 课程安排和教学计划
- **作业系统**: 作业布置和批改
- **考试系统**: 考试安排和成绩管理
- **出勤管理**: 门禁系统和出勤记录

### 💰 财务管理
- **费用管理**: 学费和其他费用管理
- **发票系统**: 自动生成发票
- **支付跟踪**: 支付状态和记录
- **财务报表**: 详细的财务分析

### 📊 数据分析
- **学习分析**: 学生学习进度分析
- **出勤统计**: 出勤率和趋势分析
- **财务报告**: 收入支出分析
- **系统监控**: 系统健康状态监控

### 🔄 数据导入
- **Google Sheets集成**: 从Google Sheets导入学生数据
- **批量导入**: 支持大量数据一次性导入
- **数据验证**: 自动验证数据格式和完整性
- **错误处理**: 详细的错误报告和修复建议

## 🛠️ 技术栈

### 前端
- **Next.js 15**: React框架，支持SSR和SSG
- **TypeScript**: 类型安全的JavaScript
- **Tailwind CSS**: 实用优先的CSS框架
- **shadcn/ui**: 现代化的UI组件库
- **Lucide React**: 精美的图标库

### 后端
- **Firebase**: 后端即服务
  - **Authentication**: 用户认证
  - **Firestore**: 实时数据库
  - **Storage**: 文件存储
- **Google Sheets API**: 数据导入功能

### 开发工具
- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化
- **TypeScript**: 静态类型检查

## 🚀 快速开始

### 环境要求
- Node.js 18+ 
- npm 或 pnpm
- Firebase项目
- Google Cloud项目（用于数据导入）

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/pjpc-01/pjpc-app-html.git
   cd pjpc-app-html
   ```

2. **安装依赖**
   ```bash
   npm install
   # 或
   pnpm install
   ```

3. **配置环境变量**
   ```bash
   cp env.example .env.local
   ```
   
   编辑 `.env.local` 文件，填入你的配置：
   ```env
   # Firebase配置
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   # ... 其他Firebase配置
   
   # Google Service Account (用于数据导入)
   GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   # 或
   pnpm dev
   ```

5. **访问应用**
   打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 📖 使用指南

### 数据导入
1. 访问 `/data-import` 页面
2. 输入你的Google Spreadsheet ID
3. 选择数据类型（小学/中学）
4. 点击"验证"检查数据格式
5. 点击"预览数据"查看导入内容
6. 点击"导入到Firestore"完成导入

### 用户注册
1. 访问系统首页
2. 点击"注册"标签
3. 填写个人信息和选择角色
4. 验证邮箱地址
5. 等待管理员审核

## 🔧 优化特性

### 性能优化
- **缓存机制**: 智能数据缓存，减少API调用
- **分页加载**: 大量数据的分页显示
- **防抖节流**: 优化用户交互性能
- **代码分割**: 按需加载组件

### 安全性
- **环境变量**: 敏感配置使用环境变量
- **输入验证**: 严格的数据验证和清理
- **错误处理**: 完善的错误边界和错误报告
- **权限控制**: 基于角色的访问控制

### 用户体验
- **响应式设计**: 支持桌面和移动设备
- **加载状态**: 友好的加载和错误提示
- **连接状态**: 实时显示系统连接状态
- **错误恢复**: 自动错误恢复和重试机制

### 开发体验
- **TypeScript**: 完整的类型定义
- **ESLint**: 代码质量检查
- **错误边界**: 优雅的错误处理
- **性能监控**: 内置性能监控工具

## 📁 项目结构

```
pjpc-app-html/
├── app/                    # Next.js 13+ App Router
│   ├── api/               # API路由
│   ├── components/        # 页面组件
│   └── data-import/      # 数据导入页面
├── components/            # 共享组件
│   ├── ui/               # UI组件库
│   ├── auth/             # 认证组件
│   └── features/         # 功能组件
├── contexts/             # React Context
├── hooks/                # 自定义Hooks
├── lib/                  # 工具库
└── public/               # 静态资源
```

## 🔍 调试工具

### 环境检查
访问 `/api/debug/check-env` 检查环境配置

### 权限测试
在数据导入页面使用"测试权限"功能

### 性能监控
使用内置的性能监控工具：
```javascript
import { performanceMonitor } from '@/lib/utils'

const stopTimer = performanceMonitor.startTimer('operation')
// ... 执行操作
stopTimer() // 输出执行时间
```

## 🚀 部署

### Vercel部署
1. 连接GitHub仓库到Vercel
2. 配置环境变量
3. 自动部署

### 其他平台
支持部署到任何支持Next.js的平台：
- Netlify
- Railway
- Heroku
- 自托管服务器

## 🤝 贡献

欢迎提交Issue和Pull Request！

### 开发规范
- 使用TypeScript
- 遵循ESLint规则
- 编写测试用例
- 更新文档

## 📄 许可证

MIT License

## 📞 支持

如有问题，请通过以下方式联系：
- 提交GitHub Issue
- 发送邮件到项目维护者

---

**注意**: 这是一个教育管理系统，请确保遵守相关的数据保护法规和隐私政策。
