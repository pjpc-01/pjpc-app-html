# Codemagic简化构建指南

## 当前状态
- AltStore已安装到iPhone ✅
- 代码已准备就绪 ✅
- 需要构建.ipa文件 ⏳

## 在Codemagic页面操作：

### 步骤1：跳过环境变量
- **不要填写任何环境变量**
- **直接点击"Start new build"**

### 步骤2：选择构建配置
- 选择分支：`flutter`
- 选择工作流：`ios-workflow`
- 点击"Start build"

### 步骤3：等待构建完成
- 构建时间：约10-15分钟
- 构建完成后会生成.ipa文件
- 下载.ipa文件到电脑

## 如果构建失败：

### 替代方案1：使用GitHub Actions
1. 清理大文件
2. 重新推送代码
3. GitHub Actions自动构建

### 替代方案2：使用其他云服务
- Bitrise
- AppCenter
- Firebase App Distribution

### 替代方案3：手动构建（需要Mac）
```bash
flutter build ios --release --no-codesign
```

## 下一步
构建完成后，通过AltStore安装.ipa文件到iPhone
