# PJPC School Management System - Flutter Mobile App

这是PJPC学校管理系统的Flutter移动应用版本，支持Android和iOS平台。

## 🚀 功能特性

### 核心功能
- **多角色支持**: 管理员、教师、家长、会计
- **学生管理**: 学生信息CRUD、数据导入、年级分类
- **考勤系统**: NFC/RFID打卡、出勤统计
- **财务管理**: 费用管理、发票生成、支付跟踪
- **积分系统**: 学生积分管理
- **实时同步**: 与PocketBase后端实时数据同步

### 技术特性
- **跨平台**: 支持Android和iOS
- **现代化UI**: Material Design 3设计
- **状态管理**: Provider模式
- **网络请求**: Dio HTTP客户端
- **本地存储**: SharedPreferences
- **NFC支持**: 考勤打卡功能

## 📱 支持的平台

- **Android**: API 26+ (Android 8.0+)
- **iOS**: iOS 11.0+

## 🛠️ 技术栈

- **Flutter**: 3.8.1+
- **Dart**: 3.0.0+
- **状态管理**: Provider
- **网络请求**: Dio
- **后端**: PocketBase
- **NFC**: flutter_nfc_kit, nfc_manager
- **本地存储**: shared_preferences

## 📦 安装和运行

### 前提条件
- Flutter SDK 3.8.1或更高版本
- Android Studio / Xcode
- PocketBase服务器运行中

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd pjpc_app_flutter
   ```

2. **安装依赖**
   ```bash
   flutter pub get
   ```

3. **配置PocketBase**
   - 确保PocketBase服务器正在运行
   - 默认连接地址: `https://pjpc.tplinkdns.com:8090`
   - 可在`lib/services/pocketbase_service.dart`中修改

4. **运行应用**
   ```bash
   # Android
   flutter run
   
   # iOS
   flutter run -d ios
   ```

### 构建发布版本

```bash
# Android APK
flutter build apk --release

# Android App Bundle
flutter build appbundle --release

# iOS
flutter build ios --release
```

## 🏗️ 项目结构

```
lib/
├── main.dart                 # 应用入口
├── providers/                # 状态管理
│   ├── auth_provider.dart    # 认证状态
│   ├── student_provider.dart # 学生数据
│   ├── finance_provider.dart # 财务数据
│   └── attendance_provider.dart # 考勤数据
├── screens/                  # 页面
│   ├── splash_screen.dart    # 启动页
│   ├── auth/                 # 认证页面
│   └── dashboard/            # 仪表板
├── widgets/                  # 组件
│   ├── common/               # 通用组件
│   └── dashboard/            # 仪表板组件
├── services/                 # 服务
│   └── pocketbase_service.dart # PocketBase服务
└── utils/                    # 工具类
    ├── app_theme.dart        # 主题配置
    └── record_extensions.dart # Record扩展
```

## 🔧 配置说明

### PocketBase配置
在`lib/services/pocketbase_service.dart`中配置PocketBase服务器地址：

```dart
static const String _defaultUrl = 'https://your-pocketbase-url:8090';
```

### 权限配置

#### Android权限 (android/app/src/main/AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.NFC" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

#### iOS权限 (ios/Runner/Info.plist)
```xml
<key>NFCReaderUsageDescription</key>
<string>此应用需要NFC权限来进行考勤打卡</string>
```

## 📱 用户角色

### 管理员 (Admin)
- 学生管理
- 教师管理
- 财务管理
- 系统设置
- 数据统计

### 教师 (Teacher)
- 学生考勤
- 积分管理
- NFC打卡
- 学生信息查看

### 家长 (Parent)
- 孩子考勤查看
- 费用查看和支付
- 积分查看
- 联系老师

### 会计 (Accountant)
- 发票管理
- 支付记录
- 财务报告
- 费用统计

## 🔄 数据同步

应用使用PocketBase作为后端，支持：
- 实时数据同步
- 离线数据缓存
- 自动重连机制
- 数据冲突解决

## 🚀 部署

### Android部署
1. 生成签名密钥
2. 配置`android/app/build.gradle`
3. 运行`flutter build apk --release`

### iOS部署
1. 配置Apple Developer账户
2. 设置Bundle ID和证书
3. 运行`flutter build ios --release`

## 🐛 故障排除

### 常见问题

1. **NFC功能不工作**
   - 检查设备是否支持NFC
   - 确认权限已授予
   - 检查NFC是否已启用

2. **网络连接问题**
   - 检查PocketBase服务器状态
   - 确认网络连接正常
   - 检查防火墙设置

3. **构建失败**
   - 运行`flutter clean`
   - 删除`pubspec.lock`
   - 运行`flutter pub get`

## 📄 许可证

本项目采用MIT许可证 - 查看[LICENSE](LICENSE)文件了解详情。

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目。

## 📞 支持

如有问题或建议，请联系开发团队。