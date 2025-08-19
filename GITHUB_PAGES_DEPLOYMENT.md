# GitHub Pages 部署指南

## 概述

本项目已配置为支持GitHub Pages部署，确保移动设备和外网用户都能正常访问PocketBase服务器。

## 部署配置

### 1. 环境配置

- **本地开发**: `.env.local` - 使用内网地址
- **GitHub Pages**: `.env.production` - 使用DDNS地址

### 2. 网络检测优化

系统会自动检测部署环境：
- **GitHub Pages环境**: 直接使用DDNS地址 `http://pjpc.tplinkdns.com:8090`
- **本地环境**: 智能检测最佳连接

## 部署步骤

### 方法1: 使用部署脚本

```bash
# 构建并部署到gh-pages分支
npm run deploy
```

### 方法2: 手动部署

```bash
# 1. 构建项目
npm run build

# 2. 创建.nojekyll文件（防止GitHub Pages忽略下划线文件）
touch out/.nojekyll

# 3. 提交构建文件
git add out/
git commit -m "Deploy to GitHub Pages"

# 4. 推送到gh-pages分支
git subtree push --prefix out origin gh-pages
```

## 移动设备访问

### 访问地址
- **GitHub Pages**: `https://pjpc-01.github.io/pjpc-app-html`
- **移动NFC签到**: `https://pjpc-01.github.io/pjpc-app-html/mobile-nfc-test`
- **连接测试**: `https://pjpc-01.github.io/pjpc-app-html/mobile-connection-test`

### 网络配置
- ✅ **DDNS地址**: `http://pjpc.tplinkdns.com:8090` (外网可访问)
- ✅ **自动检测**: 系统自动选择最佳连接
- ✅ **移动优化**: 针对移动设备优化的界面

## 测试验证

### 1. 连接测试
访问 `/mobile-connection-test` 页面，验证：
- DDNS连接状态
- 网络延迟
- 连接稳定性

### 2. NFC功能测试
访问 `/mobile-nfc-test` 页面，验证：
- PocketBase服务器连接
- NFC功能可用性
- 数据同步功能

## 故障排除

### 常见问题

1. **连接失败**
   - 检查DDNS地址是否可访问
   - 确认PocketBase服务运行状态
   - 验证防火墙设置

2. **移动设备无法访问**
   - 确保使用HTTPS协议
   - 检查网络连接稳定性
   - 尝试刷新页面

3. **部署失败**
   - 检查GitHub Pages设置
   - 确认gh-pages分支存在
   - 验证构建输出目录

### 调试工具

- **网络测试**: `/mobile-connection-test`
- **控制台日志**: 查看浏览器开发者工具
- **连接状态**: 页面右上角的ConnectionStatus组件

## 维护说明

### 更新部署
每次代码更新后，需要重新部署：
```bash
npm run deploy
```

### 环境变量
如需修改配置，更新 `.env.production` 文件后重新部署。

### 监控
定期检查：
- GitHub Pages服务状态
- DDNS连接稳定性
- 移动设备访问情况

## 技术支持

如遇到问题，请检查：
1. GitHub Pages服务状态
2. DDNS连接状态
3. PocketBase服务器状态
4. 移动设备网络连接
