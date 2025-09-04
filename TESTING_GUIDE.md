# PJPC Flutter 应用测试指南

## 🧪 测试方法总览

### 1. 开发环境测试

#### 启动Android模拟器
```bash
# 启动可用的模拟器
flutter emulators --launch Small_Phone

# 或者创建新的模拟器
flutter emulators --create --name test_device
```

#### 运行应用
```bash
# 在模拟器上运行
flutter run

# 在特定设备上运行
flutter run -d Small_Phone

# 在Chrome浏览器上运行（Web版本）
flutter run -d chrome
```

### 2. 真机测试

#### Android真机测试
1. **启用开发者选项**：
   - 设置 → 关于手机 → 连续点击"版本号"7次
   - 返回设置 → 开发者选项 → 启用"USB调试"

2. **连接设备**：
   ```bash
   # 检查连接的设备
   flutter devices
   
   # 运行到真机
   flutter run -d <device_id>
   ```

3. **安装APK**：
   ```bash
   # 构建APK
   flutter build apk --debug
   
   # 安装到设备
   flutter install
   ```

#### iOS真机测试（需要Mac）
```bash
# 在iOS设备上运行
flutter run -d ios

# 构建iOS应用
flutter build ios --debug
```

### 3. 功能测试清单

#### 🔐 认证功能测试
- [ ] 启动页面显示正常
- [ ] 登录页面UI正确
- [ ] 输入验证工作正常
- [ ] 登录成功跳转到仪表板
- [ ] 登录失败显示错误信息
- [ ] 记住登录状态

#### 📊 仪表板测试
- [ ] 管理员仪表板显示正确
- [ ] 教师仪表板功能完整
- [ ] 家长仪表板信息准确
- [ ] 会计仪表板数据正确
- [ ] 角色切换正常
- [ ] 统计数据显示

#### 👥 学生管理测试
- [ ] 学生列表加载正常
- [ ] 搜索功能工作
- [ ] 年级过滤正确
- [ ] 学生卡片显示完整
- [ ] 添加学生功能
- [ ] 编辑学生功能
- [ ] 删除学生功能

#### ⏰ 考勤系统测试
- [ ] 考勤记录显示
- [ ] 今日考勤统计
- [ ] 历史记录查看
- [ ] NFC扫描功能（需要真机）
- [ ] 考勤打卡流程
- [ ] 考勤数据同步

#### 💰 财务系统测试
- [ ] 发票列表显示
- [ ] 支付记录查看
- [ ] 财务统计正确
- [ ] 数据图表显示
- [ ] 财务数据同步

#### 🔧 通用功能测试
- [ ] 页面导航正常
- [ ] 返回按钮功能
- [ ] 刷新功能工作
- [ ] 加载状态显示
- [ ] 错误处理正确
- [ ] 主题切换正常

### 4. 性能测试

#### 内存使用测试
```bash
# 运行性能分析
flutter run --profile

# 查看内存使用
flutter run --trace-startup
```

#### 网络测试
- [ ] 网络连接正常
- [ ] 数据加载速度
- [ ] 离线状态处理
- [ ] 网络错误处理

### 5. 兼容性测试

#### Android版本测试
- [ ] Android 8.0+ (API 26+)
- [ ] 不同屏幕尺寸
- [ ] 不同分辨率
- [ ] 横屏/竖屏切换

#### iOS版本测试（需要Mac）
- [ ] iOS 11.0+
- [ ] iPhone不同尺寸
- [ ] iPad适配
- [ ] 横屏/竖屏切换

### 6. NFC功能测试（需要真机）

#### 硬件要求
- Android设备支持NFC
- iOS设备支持NFC（iPhone 7+）

#### 测试步骤
1. 确保设备NFC功能已开启
2. 准备NFC测试卡片
3. 打开应用考勤页面
4. 点击"开始扫描"
5. 将NFC卡片靠近设备
6. 验证扫描结果

### 7. 后端连接测试

#### PocketBase服务器测试
```bash
# 检查服务器连接
curl https://pjpc.tplinkdns.com:8090/api/health

# 测试API端点
curl https://pjpc.tplinkdns.com:8090/api/collections/users
```

#### 数据同步测试
- [ ] 登录后数据加载
- [ ] 学生数据同步
- [ ] 考勤数据同步
- [ ] 财务数据同步
- [ ] 实时更新功能

### 8. 自动化测试

#### 单元测试
```bash
# 运行单元测试
flutter test

# 运行特定测试
flutter test test/widget_test.dart
```

#### 集成测试
```bash
# 运行集成测试
flutter test integration_test/
```

### 9. 调试技巧

#### 查看日志
```bash
# 运行并查看日志
flutter run --verbose

# 查看设备日志
flutter logs
```

#### 热重载
- 在开发过程中使用 `r` 键热重载
- 使用 `R` 键热重启
- 使用 `q` 键退出

#### 调试模式
```bash
# 调试模式运行
flutter run --debug

# 发布模式运行
flutter run --release
```

### 10. 常见问题解决

#### 构建问题
```bash
# 清理项目
flutter clean

# 重新获取依赖
flutter pub get

# 重新构建
flutter build apk --debug
```

#### 设备连接问题
```bash
# 检查Flutter环境
flutter doctor

# 检查设备连接
flutter devices

# 重启ADB
adb kill-server
adb start-server
```

#### 网络问题
- 检查PocketBase服务器状态
- 确认网络连接正常
- 检查防火墙设置
- 验证API端点可访问

### 11. 测试报告模板

#### 测试结果记录
```
测试日期: ___________
测试人员: ___________
测试设备: ___________
测试版本: ___________

功能测试结果:
- 认证功能: ✅/❌
- 仪表板: ✅/❌
- 学生管理: ✅/❌
- 考勤系统: ✅/❌
- 财务系统: ✅/❌
- NFC功能: ✅/❌

发现问题:
1. ________________
2. ________________
3. ________________

建议改进:
1. ________________
2. ________________
3. ________________
```

## 🚀 快速开始测试

### 立即开始测试
1. **启动模拟器**：
   ```bash
   flutter emulators --launch Small_Phone
   ```

2. **运行应用**：
   ```bash
   flutter run
   ```

3. **开始功能测试**：
   - 按照上面的测试清单逐项检查
   - 记录发现的问题
   - 验证所有功能正常工作

### 真机测试准备
1. **Android设备**：
   - 启用开发者选项和USB调试
   - 连接设备到电脑
   - 运行 `flutter run`

2. **iOS设备**（需要Mac）：
   - 连接iPhone到Mac
   - 信任开发者证书
   - 运行 `flutter run -d ios`

---

**开始测试您的PJPC学校管理系统Flutter应用吧！** 🎉
