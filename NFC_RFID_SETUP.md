# NFC/RFID 打卡系统设置指南

## 概述

NFC/RFID打卡系统允许学生使用NFC或RFID卡进行快速打卡，提高考勤效率。

## 功能特性

### ✅ 已实现功能
- **卡管理**: 为学生分配和管理NFC/RFID卡
- **设备管理**: 管理读卡设备的状态和配置
- **实时打卡**: 模拟和记录学生打卡
- **记录查看**: 查看和管理打卡记录
- **统计报表**: 生成考勤统计和报表

### 🔧 硬件要求

#### 必需硬件
1. **NFC/RFID读卡器**
   - 支持NFC-A/B/F或RFID 13.56MHz
   - USB或网络连接
   - 建议品牌: ACR122U, OMNIKEY, 等

2. **NFC/RFID卡**
   - 学生个人卡
   - 支持ISO14443A标准
   - 建议容量: 1KB以上

#### 可选硬件
- **网络设备**: 路由器、交换机
- **备用电源**: UPS不间断电源
- **监控设备**: 摄像头、显示屏

## 软件设置

### 1. 系统配置

#### Firebase配置
确保Firebase项目已正确配置：
```javascript
// lib/firebase.ts
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  // ... 其他配置
}
```

#### Firestore规则
更新Firestore安全规则以支持NFC集合：
```javascript
// firestore.rules
match /nfc_cards/{cardId} {
  allow read, write: if true;
}

match /nfc_devices/{deviceId} {
  allow read, write: if true;
}

match /attendance_records/{recordId} {
  allow read, write: if true;
}
```

### 2. 硬件连接

#### 读卡器连接
1. **USB连接**
   ```bash
   # 检查设备是否被识别
   lsusb | grep -i nfc
   ```

2. **网络连接**
   ```bash
   # 配置网络设置
   ip addr add 192.168.1.100/24 dev eth0
   ```

#### 设备配置
```javascript
// 设备配置示例
{
  name: "主门读卡器",
  location: "学校正门",
  deviceType: "NFC",
  status: "online",
  ipAddress: "192.168.1.100",
  macAddress: "00:11:22:33:44:55",
  firmwareVersion: "v1.2.3"
}
```

## 使用指南

### 1. 添加学生卡

#### 通过界面添加
1. 进入考勤系统
2. 点击"启用NFC系统"
3. 选择"卡管理"标签
4. 点击"添加新卡"
5. 填写学生信息和卡号
6. 保存

#### 通过API添加
```bash
curl -X POST http://localhost:3000/api/nfc/cards \
  -H "Content-Type: application/json" \
  -d '{
    "cardNumber": "1234567890",
    "studentId": "G16",
    "studentName": "王小明",
    "cardType": "NFC",
    "status": "active",
    "issuedDate": "2024-01-01"
  }'
```

### 2. 配置设备

#### 添加设备
1. 选择"设备管理"标签
2. 点击"添加设备"
3. 填写设备信息
4. 保存

#### 设备状态监控
- **在线**: 设备正常工作
- **离线**: 设备连接中断
- **维护中**: 设备正在维护

### 3. 实时打卡

#### 模拟打卡
1. 选择"概览"标签
2. 选择打卡设备
3. 点击"开始模拟"
4. 系统会自动模拟卡读取

#### 真实打卡流程
1. 学生持卡靠近读卡器
2. 读卡器读取卡号
3. 系统验证卡有效性
4. 记录打卡时间和位置
5. 发送通知给家长

### 4. 查看记录

#### 打卡记录
- 时间戳
- 学生姓名
- 卡号
- 设备位置
- 打卡类型（签到/签退）
- 状态（成功/失败/重复）

#### 统计报表
- 今日打卡次数
- 出勤率统计
- 设备使用情况
- 异常记录分析

## API接口

### 打卡接口
```bash
POST /api/nfc/attendance
{
  "cardNumber": "1234567890",
  "deviceId": "device_001",
  "deviceName": "主门读卡器",
  "location": "学校正门"
}
```

### 卡管理接口
```bash
# 获取所有卡
GET /api/nfc/cards

# 根据学生ID获取卡
GET /api/nfc/cards?studentId=G16

# 添加新卡
POST /api/nfc/cards
```

### 设备管理接口
```bash
# 获取所有设备
GET /api/nfc/devices

# 添加新设备
POST /api/nfc/devices
```

## 故障排除

### 常见问题

#### 1. 读卡器无法识别
**症状**: 设备显示离线状态
**解决方案**:
- 检查USB连接或网络连接
- 确认设备驱动已安装
- 重启读卡器设备

#### 2. 卡无法读取
**症状**: 打卡失败，提示"Card not found"
**解决方案**:
- 确认卡已正确分配给学生
- 检查卡是否处于活跃状态
- 尝试重新发卡

#### 3. 重复打卡
**症状**: 系统提示"Duplicate attendance record"
**解决方案**:
- 系统已设置5分钟内防重复打卡
- 检查是否有误操作
- 如需强制打卡，可手动添加记录

#### 4. 网络连接问题
**症状**: API调用失败
**解决方案**:
- 检查网络连接
- 确认Firebase配置正确
- 查看浏览器控制台错误信息

### 调试工具

#### 浏览器开发者工具
```javascript
// 检查NFC系统状态
console.log('NFC Stats:', await fetch('/api/nfc/stats').then(r => r.json()))

// 查看打卡记录
console.log('Attendance Records:', await fetch('/api/nfc/attendance').then(r => r.json()))
```

#### 日志查看
```bash
# 查看应用日志
npm run dev

# 查看Firebase日志
firebase functions:log
```

## 安全考虑

### 数据安全
- 所有打卡数据存储在Firebase Firestore
- 数据传输使用HTTPS加密
- 定期备份重要数据

### 访问控制
- 只有授权用户可访问NFC系统
- 设备状态实时监控
- 异常行为自动报警

### 隐私保护
- 学生个人信息加密存储
- 打卡记录仅限相关人员查看
- 符合数据保护法规要求

## 扩展功能

### 未来计划
- [ ] 人脸识别集成
- [ ] 移动端APP
- [ ] 家长通知系统
- [ ] 考勤报表导出
- [ ] 设备远程管理

### 自定义开发
如需添加自定义功能，可参考以下文件：
- `lib/nfc-rfid.ts`: 核心业务逻辑
- `hooks/useNFC.ts`: 状态管理
- `app/components/nfc-attendance-system.tsx`: 界面组件
- `app/api/nfc/*`: API接口

## 技术支持

如有问题，请联系技术支持团队：
- 邮箱: support@example.com
- 电话: +886-2-1234-5678
- 在线文档: https://docs.example.com/nfc-system 