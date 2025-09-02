# GitHub Pages 部署指南

## 概述
这个指南将帮助你使用GitHub Pages部署PJPC教育应用的prototype版本，供老师们临时使用。

## 部署步骤

### 1. 准备工作
- 确保你的代码已经推送到GitHub仓库
- 确保仓库是公开的（GitHub Pages免费版需要公开仓库）

### 2. 配置GitHub Pages
1. 进入你的GitHub仓库
2. 点击 "Settings" 标签
3. 滚动到 "Pages" 部分
4. 在 "Source" 下选择 "GitHub Actions"
5. 保存设置

### 3. 本地构建测试
在推送到GitHub之前，你可以本地测试构建：

```bash
# 安装依赖
npm install

# 构建静态版本
npm run build:static

# 本地预览（可选）
npx serve out
```

### 4. 推送代码
```bash
git add .
git commit -m "Add GitHub Pages deployment configuration"
git push origin main
```

### 5. 查看部署状态
- 进入GitHub仓库的 "Actions" 标签
- 查看部署工作流的状态
- 部署成功后，你的应用将在 `https://[你的用户名].github.io/[仓库名]` 可用

## 重要注意事项

### PocketBase连接
由于GitHub Pages是静态托管，无法运行服务器端代码，PocketBase连接需要通过以下方式处理：

1. **使用代理模式**：应用会自动检测到HTTPS环境并使用PocketBase代理
2. **确保PocketBase服务器可访问**：确保 `http://pjpc.tplinkdns.com:8090` 可以从外网访问

### 功能限制
- 某些需要服务器端处理的功能可能无法在静态部署中正常工作
- 文件上传功能需要特殊处理
- 实时功能可能需要WebSocket连接

### 环境变量
- 生产环境的环境变量需要在GitHub仓库的Settings > Secrets中配置
- 或者直接在代码中硬编码（不推荐用于敏感信息）

## 故障排除

### 构建失败
- 检查Node.js版本兼容性
- 确保所有依赖都已正确安装
- 查看GitHub Actions日志了解具体错误

### 页面无法访问
- 确认GitHub Pages已正确配置
- 检查仓库是否为公开
- 等待几分钟让DNS传播

### PocketBase连接问题
- 确认PocketBase服务器正在运行
- 检查网络连接和防火墙设置
- 验证DDNS配置是否正确

## 更新部署
每次推送到main分支时，GitHub Actions会自动重新构建和部署应用。

## 回滚
如果需要回滚到之前的版本：
1. 在GitHub仓库的Actions标签中找到成功的部署
2. 点击"Re-run jobs"重新部署该版本

## 快速开始
1. 确保代码已推送到GitHub
2. 在仓库设置中启用GitHub Pages
3. 选择"GitHub Actions"作为源
4. 推送代码触发自动部署
5. 等待部署完成，访问你的GitHub Pages URL
