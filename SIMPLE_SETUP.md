# 简化数据导入设置指南

## 🚀 快速开始

### 第一步：配置环境变量

1. **复制您的服务账户JSON**
   - 将您的完整JSON内容复制到一行
   - 确保包含所有引号和大括号

2. **创建 `.env.local` 文件**
   ```bash
   # 在项目根目录创建 .env.local 文件
   GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"your-project-id","private_key_id":"your-private-key-id","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n","client_email":"your-service-account@your-project.iam.gserviceaccount.com","client_id":"your-client-id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com","universe_domain":"googleapis.com"}
   ```

### 第二步：共享Google Sheets

1. **打开您的Google Sheets文档**
2. **点击右上角的 "Share"**
3. **添加服务账户邮箱：**
   - `your-service-account@your-project.iam.gserviceaccount.com`
   - 权限设置为 "Editor"

### 第三步：使用导入工具

1. **访问：** `http://localhost:3000/data-import`
2. **输入您的Spreadsheet ID**
3. **选择 "使用预设凭据"**
4. **点击 "验证" 测试连接**
5. **点击 "预览数据" 查看数据**
6. **点击 "导入到Firestore" 完成导入**

## ✅ 优势

- **无需重复输入JSON** - 凭据已预设
- **只需输入Spreadsheet ID** - 操作简单
- **支持自定义凭据** - 如有需要可切换
- **自动数据映射** - 适配您的数据格式

## 🔧 故障排除

**如果遇到问题：**
1. 确保 `.env.local` 文件存在且格式正确
2. 确保Google Sheets已共享给服务账户
3. 确保Spreadsheet ID正确
4. 可以切换到 "使用自定义凭据" 模式

现在您只需要输入Spreadsheet ID就可以导入数据了！🚀 