# 教师NFC卡考勤系统指南

## 概述
教师打卡系统现在支持NFC卡扫描考勤，就像学生考勤系统一样。教师可以使用NFC卡快速进行签到和签退操作。

## 功能特性

### 1. NFC卡扫描
- **自动识别**：扫描NFC卡后自动填入教师信息
- **实时验证**：验证教师状态和权限
- **中心匹配**：确保教师属于当前中心
- **状态检查**：验证教师账户状态

### 2. 多种考勤方式
- **NFC卡扫描**：快速便捷的考勤方式
- **手动输入**：备用考勤方式
- **URL参数**：支持通过链接直接考勤

### 3. 安全验证
- **WiFi验证**：后台静默验证网络环境
- **教师状态**：检查教师账户是否激活
- **中心权限**：验证教师是否属于当前中心

## 使用流程

### 教师操作

1. **访问教师打卡页面**
   ```
   http://localhost:3002/teacher-checkin?center=wx01
   ```

2. **NFC卡扫描考勤**
   - 点击"扫描教师NFC卡"按钮
   - 将NFC卡靠近设备
   - 系统自动识别并填入教师信息
   - 点击"签到"或"签退"按钮

3. **手动输入考勤**
   - 手动输入教师ID和姓名
   - 点击"签到"或"签退"按钮

### 管理员操作

1. **配置教师NFC卡**
   - 在教师管理界面为教师分配NFC卡号
   - 确保NFC卡号唯一且正确

2. **管理WiFi网络**
   - 访问：`http://localhost:3001/admin/wifi-networks`
   - 配置允许的WiFi网络列表

## 技术实现

### 1. TeacherNFCScanner组件
```typescript
interface TeacherNFCScannerProps {
  onTeacherFound: (teacher: Teacher) => void
  onError: (error: string) => void
  centerId?: string
}
```

**主要功能：**
- NFC设备支持检测
- HTTPS环境验证
- NFC卡扫描和数据处理
- 教师信息查找和验证
- 错误处理和用户反馈

### 2. 教师API扩展
```typescript
// 支持NFC卡号查询
GET /api/teachers?nfcCard=1234567890
```

**查询参数：**
- `nfcCard`: NFC卡号
- `email`: 邮箱地址
- `teacherId`: 教师ID
- `userId`: 用户ID

### 3. 考勤记录增强
```typescript
interface TeacherAttendanceRecord {
  id: string
  teacherId: string
  teacherName: string
  centerId: string
  centerName: string
  timestamp: string
  type: 'check-in' | 'check-out'
  status: 'success' | 'failed'
  method: 'manual' | 'nfc' | 'url'  // 新增NFC方法
}
```

## 数据库要求

### 教师集合字段
确保教师集合包含以下字段：
- `nfc_card_number`: NFC卡号（必需）
- `name`: 教师姓名
- `email`: 邮箱地址
- `position`: 职位
- `department`: 部门
- `status`: 状态（active/inactive）
- `center_id`: 所属中心ID

### 考勤记录字段
考勤记录自动包含：
- `method`: 考勤方式（manual/nfc/url）
- `wifiNetwork`: WiFi网络信息
- `wifiVerified`: WiFi验证状态
- `networkInfo`: 网络详细信息

## 安全特性

### 1. WiFi网络验证
- 后台静默验证
- 多重验证机制
- 动态评分系统
- 隐蔽错误提示

### 2. 教师权限验证
- 状态检查（active/inactive）
- 中心权限验证
- NFC卡号唯一性
- 实时数据验证

### 3. 审计记录
- 完整的考勤记录
- 网络环境信息
- 设备特征记录
- 操作时间戳

## 故障排除

### 常见问题

1. **NFC扫描失败**
   - 检查设备是否支持NFC
   - 确认在HTTPS环境下使用
   - 检查NFC卡是否正常工作
   - 验证浏览器权限设置

2. **教师信息未找到**
   - 检查NFC卡号是否正确
   - 确认教师数据已同步
   - 验证教师状态是否激活
   - 检查中心ID匹配

3. **WiFi验证失败**
   - 检查网络连接状态
   - 确认WiFi网络配置
   - 验证设备权限设置
   - 检查系统时间同步

### 调试信息

系统会在控制台输出详细日志：
```javascript
// NFC扫描日志
console.log('📱 NFC卡片数据:', cardData)
console.log('✅ 找到教师:', teacher)

// WiFi验证日志
console.log('WiFi验证结果:', {
  isVerified,
  networkInfo,
  timestamp: new Date().toISOString()
})

// 考勤记录日志
console.log('✅ 教师考勤记录已保存:', result.data)
```

## 最佳实践

### 1. NFC卡管理
- 为每个教师分配唯一的NFC卡号
- 定期检查NFC卡状态
- 及时更新失效的NFC卡
- 建立NFC卡使用记录

### 2. 网络配置
- 定期更新WiFi网络列表
- 监控网络连接质量
- 设置合理的验证阈值
- 记录网络异常情况

### 3. 用户培训
- 提供NFC使用指导
- 说明考勤流程
- 解释错误信息
- 提供技术支持

## 总结

教师NFC卡考勤系统提供了：
- **便捷性**：快速扫描，自动填入信息
- **安全性**：多重验证，防止作弊
- **可靠性**：错误处理，状态监控
- **灵活性**：多种考勤方式，适应不同场景

通过NFC卡扫描，教师可以快速完成考勤操作，同时系统确保考勤的准确性和安全性。
