# Google Sheets 学生数据导入 - 快速设置指南

## 🚀 快速开始

### 第一步：准备您的Google Sheets数据

确保您的表格格式如下（第一行为标题）：

| 姓名 | 年级 | 家长姓名 | 家长邮箱 | 电话 | 地址 | 入学日期 | 状态 |
|------|------|----------|----------|------|------|----------|------|
| 张三 | 三年级 | 张父 | zhang@example.com | 123-456-7890 | 北京市朝阳区 | 2024-01-15 | Active |
| 李四 | 四年级 | 李父 | li@example.com | 098-765-4321 | 上海市浦东新区 | 2024-01-16 | Active |

**必需列：** 姓名、年级、家长姓名、家长邮箱
**可选列：** 电话、地址、入学日期、状态

### 第二步：获取Spreadsheet ID

从您的Google Sheets URL中复制ID：
```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
                                                                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                                                        这就是您的Spreadsheet ID
```

### 第三步：设置Google Cloud Project

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用Google Sheets API：
   - 转到 "APIs & Services" → "Library"
   - 搜索 "Google Sheets API"
   - 点击启用

### 第四步：创建Service Account

1. 转到 "APIs & Services" → "Credentials"
2. 点击 "Create Credentials" → "Service Account"
3. 填写信息：
   - 名称：`student-import-service`
   - 描述：`用于导入学生数据的服务账户`
4. 点击 "Create and Continue"
5. 跳过可选步骤，点击 "Done"

### 第五步：生成Service Account Key

1. 点击刚创建的服务账户
2. 转到 "Keys" 标签
3. 点击 "Add Key" → "Create New Key"
4. 选择 "JSON" 格式
5. 下载JSON文件

### 第六步：共享Google Sheets

1. 打开您的Google Sheets文档
2. 点击右上角的 "Share"
3. 添加服务账户邮箱（在JSON文件中找到）：
   - 邮箱格式：`student-import-service@your-project-id.iam.gserviceaccount.com`
   - 权限设置为 "Editor"

### 第七步：使用导入工具

1. 访问：`http://localhost:3000/data-import`
2. 输入您的Spreadsheet ID
3. 粘贴整个JSON文件内容到凭据框
4. 点击 "Validate" 验证
5. 点击 "Preview Data" 预览
6. 点击 "Import to Firestore" 导入

## 🔧 常见问题

**Q: 提示"Invalid spreadsheet structure"**
A: 检查您的表格是否包含必需的列：姓名、年级、家长姓名、家长邮箱

**Q: 提示"No data found in spreadsheet"**
A: 确保服务账户有访问权限，Spreadsheet ID正确

**Q: 提示"Invalid JSON credentials"**
A: 确保完整复制了JSON文件内容，包括所有大括号

## 📞 需要帮助？

如果遇到问题，请检查：
1. Google Sheets API是否已启用
2. 服务账户是否有正确的权限
3. 表格格式是否符合要求
4. JSON凭据是否完整

导入成功后，您的学生数据将自动出现在系统的所有相关功能中！ 