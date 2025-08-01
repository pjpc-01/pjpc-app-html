# 简化数据导入设置指南

## 🚀 快速开始

### 第一步：配置环境变量

1. **复制您的服务账户JSON**
   - 将您的完整JSON内容复制到一行
   - 确保包含所有引号和大括号

2. **创建 `.env.local` 文件**
   ```bash
   # 在项目根目录创建 .env.local 文件
   GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"pjpc-app-ai","private_key_id":"3942f2b66e7a04386095ed5896637555cc6d2561","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCSe8bzf/uo3/T4\nDPP+/9487ODmNoru8D1l938N8O3q+C18scL+AzQXHWyt7d6NxmnBdYdsdn5+95Ma\n95Q2qj+J+dJnqzrpMpvpsLTYrbb+YKbC62yz5JGVv2+4n3qIbsn7iTgWdom0AFtW\nAu5g2O0YOM4HX1sXW8KweBvKi++n2bbHjJvZK0JR03SHRubd867YSLWhYenvhsz1\nj/YTAccdUO3KhgBLppdilROLUYktDT+ZuyxzINtWrvR31gdnLCdCugt+O8kcJ8vB\nV8EheDotPEVaWg51pm/3gyhQl8HZ5CHoW+NykBT/C57iFieXSP5L0czHvYOrWIZE\nlW1b3Vb/AgMBAAECggEAPn43DRg7TbsqIA8qo04WyohGlICNek2c7B0QI+r3Haj+\ngvW1mjfUp83iWTujmHmfEa1p9qCA6/sEU9tu7HlqfRtLI/Y9vlJciPDd3pkR+mlS\ni9Lzf7XSVIAlEi9bj8wwOLM8bfzpV5VVYhcDCudRE2Xco/GPA6Kepzm+pYVY25MV\nrSi8tOzH0psVs42T9RDuiKbcXlb5+rLnLiUUtm+bi6mrnhTBVn8w6SOjPqsDLCMa\nYrvYlNR+O5aAtaD/08UjIlrB1P1IddaBSo9WyVNWxN9DwfwqMpxd9AY4FJxPn0j1\nemmWqVONrTZ+IaK/DOmZfwQv+KLdAsCwL18UGqtSDQKBgQDGAmKhTywEG5T9Csu7\nDbpcrsuPsnJRWVjv0cQcoSfFqkeKZ6gmh2/1245LHLtQq5jDLuznE4nWrShDH7PS\nuiysL3oGI35R3qQuOOsdfcW2wYa2eHTGhFMrLAeAp+tSfkD1ZBHWAjejXJJBA4wI\n1Hdy+sdMe+D/3cyCc8L6O/NtdQKBgQC9Ykdk1Kt0CX1l/NjcYNh1J+o72L0GI0Vr\nQ9TCdB+6wwSPdhv8FMqZVsAhhcpjmiH9RJc0DGbHWisGEtj1FY1DjFAjdkfVTxga\nbkFKgy/7rfsTG6J8UCQDdTn1fL+IUQ1dKztaCPUYeFmS07asCvLscYQae2tws8VL\nyWTg/bPgIwKBgCGPnfABX1CC7EnHXqihtwimh9IfSMkI/84GG9tOZVNXfTC0SQfe\nxNdDE2cfw4/0xbuvZG/2G9LLHpvh77Sz4YZ9tYz8zxhJSEKdWxxwiOZk/tRGrmRH\nYWFb4RmpXHVq+M+e2ncPgSarNg7W7xFAEc7nOoh4Jra3fUZPIKkRKD1RAoGAfeBc\n48AXVcEZADjXS2NzfCtTnQOqX/IBqhIj0Duu+0u0NEakwyBuqQzoF1/97cX84YI9\nnfLAPbDI9/h/DCePBV61xVxQ0o8HzkmKTCR2OCqjv0eW8Fm0FjhMlcac59Y3s72Q\nbX+WqPUVVGoz+JYucMnirFdsSjSy5nSuAH2gmVECgYEApqq52iIka5WQi9vGsl/v\nnGrw9cyaLuD7ZLAgOujEnFBs1FSSQ17P92VwXu8z+G2F7dUXUX8/bzZzPUPKWfpo\nv1sQGdSzeIWxTF6TebzNflempkXOp4lPG8rIITb11/RZylOso4dzQ5X+piqyptUz\n217acO0aShsSB8LXLcrI8Fo=\n-----END PRIVATE KEY-----\n","client_email":"pjpc-data@pjpc-app-ai.iam.gserviceaccount.com","client_id":"104983993086254811912","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/pjpc-data%40pjpc-app-ai.iam.gserviceaccount.com","universe_domain":"googleapis.com"}
   ```

### 第二步：共享Google Sheets

1. **打开您的Google Sheets文档**
2. **点击右上角的 "Share"**
3. **添加服务账户邮箱：**
   - `pjpc-data@pjpc-app-ai.iam.gserviceaccount.com`
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