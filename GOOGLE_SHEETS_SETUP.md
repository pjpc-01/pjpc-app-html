# Google Sheets API 设置指南

## 问题说明
数据导入功能需要Google Sheets API的配置才能正常工作。当前显示"Environment credentials not configured"错误是因为缺少Google Service Account凭据。

## 解决步骤

### 1. 访问Google Cloud Console
- 打开浏览器，访问：https://console.cloud.google.com/
- 使用你的Google账户登录

### 2. 创建或选择项目
- 点击页面顶部的项目选择器
- 如果没有项目，点击"新建项目"
- 输入项目名称（例如：pjpc-data-import）
- 点击"创建"

### 3. 启用Google Sheets API
- 在左侧菜单中选择"API和服务" > "库"
- 搜索"Google Sheets API"
- 点击"Google Sheets API"
- 点击"启用"按钮

### 4. 创建服务账户
- 在左侧菜单中选择"API和服务" > "凭据"
- 点击"创建凭据" > "服务账户"
- 输入服务账户名称（例如：pjpc-sheets-service）
- 点击"创建并继续"
- 在"授予此服务账户访问权限"步骤中，选择"角色" > "基本" > "查看者"
- 点击"完成"

### 5. 生成密钥文件
- 在服务账户列表中，点击刚创建的服务账户
- 切换到"密钥"选项卡
- 点击"添加密钥" > "创建新密钥"
- 选择"JSON"格式
- 点击"创建"
- 浏览器会自动下载JSON密钥文件

### 6. 配置环境变量
- 打开项目根目录下的 `.env.local` 文件
- 找到 `# GOOGLE_SERVICE_ACCOUNT_JSON=your-json-here` 这一行
- 删除 `#` 注释符号
- 将下载的JSON文件内容复制粘贴到等号后面
- 确保JSON格式正确（所有引号都需要保留）

### 7. 示例配置
```env
# 在 .env.local 文件中
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"your-project-id","private_key_id":"abc123","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n","client_email":"your-service@your-project.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/your-service%40your-project.iam.gserviceaccount.com"}
```

### 8. 重启开发服务器
```bash
# 停止当前服务器 (Ctrl+C)
# 重新启动
npm run dev
```

### 9. 设置Google Sheets文档权限
- 打开你要导入的Google Sheets文档
- 点击右上角的"共享"按钮
- 在"添加人员和群组"中输入你的服务账户邮箱（在JSON文件中的client_email字段）
- 选择"查看者"权限
- 点击"发送"

## 测试配置

1. 访问数据导入页面：http://localhost:3001/data-import
2. 输入你的Google Sheets文档ID
3. 点击"检查环境"按钮
4. 如果显示"环境配置正常"，说明配置成功

## 常见问题

### Q: 如何获取Google Sheets文档ID？
A: 在Google Sheets的URL中，文档ID是 `/d/` 和 `/edit` 之间的部分：
```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
                                                      ↑ 这里是文档ID ↑
```

### Q: JSON格式错误怎么办？
A: 确保：
- 没有多余的换行符
- 所有引号都是英文引号
- JSON格式完整且有效

### Q: 权限被拒绝怎么办？
A: 检查：
- 服务账户邮箱是否已添加到Google Sheets的共享列表中
- 服务账户是否有正确的权限
- Google Sheets API是否已启用

## 安全注意事项

- 不要将包含真实凭据的 `.env.local` 文件提交到Git
- 定期轮换服务账户密钥
- 只给服务账户必要的最小权限
