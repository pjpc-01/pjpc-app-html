# 考勤打卡功能设置指南

## 功能概述

考勤打卡系统支持NFC卡片读取，自动记录学生签到/签退信息，并提供完整的管理界面。

## 主要功能

### 1. 打卡页面
- **URL格式**: `/attendance?center=<center_id>`
- **功能**: 
  - 自动锁定中心ID
  - 多设备支持（前台、后门、移动设备）
  - NFC卡片读取
  - 实时显示打卡状态
  - 无需登录即可使用

### 2. 考勤管理
- 查看考勤记录
- 按日期、类型筛选
- 导出考勤数据
- 统计报表

### 3. 考勤设置
- 设置签到/签退时间
- 自动签退功能
- 邮件通知配置
- 考勤规则说明

### 4. 设备管理
- 多设备配置和管理
- 设备状态监控
- 设备类型支持（桌面、移动、平板）
- 设备位置管理

## 设置步骤

### 1. PocketBase 集合配置

#### 创建考勤集合 (attendance)
```json
{
  "id": "attendance",
  "name": "attendance",
  "schema": [
    {
      "id": "studentId",
      "name": "studentId",
      "type": "text",
      "required": true
    },
    {
      "id": "studentName", 
      "name": "studentName",
      "type": "text",
      "required": true
    },
    {
      "id": "centerId",
      "name": "centerId", 
      "type": "text",
      "required": true
    },
    {
      "id": "centerName",
      "name": "centerName",
      "type": "text",
      "required": true
    },
    {
      "id": "timestamp",
      "name": "timestamp",
      "type": "date",
      "required": true
    },
    {
      "id": "type",
      "name": "type",
      "type": "select",
      "required": true,
      "options": {
        "values": ["check-in", "check-out"]
      }
    },
    {
      "id": "status",
      "name": "status",
      "type": "select",
      "required": true,
      "options": {
        "values": ["success", "error"]
      }
    },
    {
      "id": "deviceId",
      "name": "deviceId",
      "type": "text",
      "required": false
    },
    {
      "id": "deviceName",
      "name": "deviceName",
      "type": "text",
      "required": false
    }
  ]
}
```

#### 创建中心集合 (centers)
```json
{
  "id": "centers",
  "name": "centers",
  "schema": [
    {
      "id": "name",
      "name": "name",
      "type": "text",
      "required": true
    },
    {
      "id": "address",
      "name": "address",
      "type": "text",
      "required": true
    },
    {
      "id": "phone",
      "name": "phone",
      "type": "text"
    },
    {
      "id": "email",
      "name": "email",
      "type": "email"
    },
    {
      "id": "status",
      "name": "status",
      "type": "select",
      "required": true,
      "options": {
        "values": ["active", "inactive"]
      }
    }
  ]
}
```

### 2. 学生数据准备

确保学生集合中包含以下字段：
- `studentId`: 学生ID（用于NFC卡片识别）
- `name`: 学生姓名
- `centerId`: 所属中心ID

### 3. 中心数据准备

在centers集合中添加中心信息：
```json
{
  "name": "示例中心",
  "address": "中心地址",
  "phone": "联系电话",
  "email": "邮箱",
  "status": "active"
}
```

## 使用方法

### 1. 访问打卡页面

每个中心有专属的打卡页面：
```
http://localhost:3000/attendance?center=CENTER_ID
```

### 2. NFC卡片配置

学生卡片需要写入学生ID信息，格式：
```
学生ID: STUDENT_UID
```

### 3. 打卡流程

1. 打开打卡页面
2. 选择打卡设备（前台、后门、移动设备）
3. 点击"启用NFC读卡"
4. 将学生卡靠近设备
5. 系统自动识别学生并记录考勤
6. 显示打卡结果（包含设备信息）

### 4. 测试模式

如果设备不支持NFC，可以使用"手动输入学生ID"功能进行测试。

## API接口

### 考勤记录API

#### POST /api/attendance
记录考勤信息
```json
{
  "studentId": "学生ID",
  "centerId": "中心ID", 
  "type": "check-in|check-out",
  "timestamp": "2024-01-01T08:00:00Z"
}
```

#### GET /api/attendance
查询考勤记录
```
/api/attendance?center=CENTER_ID&student=STUDENT_ID&date=2024-01-01
```

### 中心信息API

#### GET /api/centers
获取中心列表或特定中心信息
```
/api/centers
/api/centers?id=CENTER_ID
```

## 管理界面

### 考勤管理
- 路径: 在管理面板中添加考勤管理模块
- 功能: 查看、筛选、导出考勤记录（包含设备信息）

### 考勤设置  
- 路径: 在管理面板中添加考勤设置模块
- 功能: 配置考勤时间、通知等

### 设备管理
- 路径: 在管理面板中添加设备管理模块
- 功能: 管理打卡设备、监控设备状态、配置设备信息

## 注意事项

1. **NFC支持**: 需要设备支持Web NFC API
2. **HTTPS**: NFC功能需要HTTPS环境
3. **权限**: 需要用户授权NFC访问权限
4. **兼容性**: 主要在Chrome和Edge浏览器中支持

## 故障排除

### NFC无法启用
- 检查设备是否支持NFC
- 确认使用HTTPS协议
- 检查浏览器权限设置

### 学生无法识别
- 确认学生ID格式正确
- 检查学生数据是否存在
- 验证中心ID是否正确

### 考勤记录失败
- 检查PocketBase连接
- 确认集合权限设置
- 查看浏览器控制台错误信息

## 扩展功能

### 1. 考勤统计
- 月度考勤报表
- 出勤率统计
- 异常考勤分析

### 2. 通知功能
- 考勤异常邮件通知
- 微信/短信通知
- 实时推送

### 3. 高级功能
- 人脸识别打卡
- 地理位置验证
- 考勤规则引擎
