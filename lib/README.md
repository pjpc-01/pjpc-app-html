# 项目文件结构说明

## 📁 新的文件组织结构

本项目已重新组织为基于功能模块的清晰结构，便于维护和扩展。

### 🎯 核心目录结构

```
lib/
├── features/                    # 功能模块目录
│   ├── auth/                   # 认证模块
│   │   ├── screens/            # 认证相关界面
│   │   ├── widgets/            # 认证相关组件
│   │   ├── services/           # 认证相关服务
│   │   └── providers/          # 认证相关状态管理
│   ├── attendance/             # 考勤模块
│   │   ├── screens/            # 考勤界面
│   │   ├── widgets/            # 考勤组件
│   │   ├── services/           # 考勤服务
│   │   └── providers/          # 考勤状态管理
│   ├── student/                # 学生管理模块
│   ├── teacher/                # 教师管理模块
│   ├── finance/                # 财务模块（薪资、支付）
│   ├── leave/                  # 请假模块
│   ├── nfc/                    # NFC功能模块
│   ├── notification/           # 通知模块
│   └── reports/                # 报表模块
├── shared/                     # 共享资源
│   ├── widgets/               # 通用组件
│   ├── services/              # 通用服务
│   ├── providers/             # 通用状态管理
│   └── utils/                 # 工具类
├── core/                      # 核心功能
│   ├── config/                # 配置文件
│   ├── theme/                 # 主题配置
│   └── constants/             # 常量定义
└── screens/                   # 遗留界面（待整理）
    ├── home/                  # 主页
    ├── profile/               # 个人资料
    ├── settings/              # 设置
    └── ...                    # 其他界面
```

### 🔧 功能模块说明

#### 1. **认证模块 (auth)**
- **功能**: 用户登录、权限管理
- **文件**: `login_screen.dart`, `auth_provider.dart`
- **位置**: `lib/features/auth/`

#### 2. **考勤模块 (attendance)**
- **功能**: 学生考勤、教师考勤、考勤统计
- **文件**: `attendance_management_screen.dart`, `attendance_provider.dart`
- **位置**: `lib/features/attendance/`

#### 3. **学生管理模块 (student)**
- **功能**: 学生信息管理、NFC配置
- **文件**: `student_management_screen.dart`, `student_provider.dart`
- **位置**: `lib/features/student/`

#### 4. **教师管理模块 (teacher)**
- **功能**: 教师信息管理、薪资管理、请假管理
- **文件**: `teacher_management_screen.dart`, `teacher_salary_management_screen.dart`
- **位置**: `lib/features/teacher/`

#### 5. **财务模块 (finance)**
- **功能**: 薪资管理、支付管理、财务统计
- **文件**: `teacher_salary_provider.dart`, `payment_provider.dart`
- **位置**: `lib/features/finance/`

#### 6. **请假模块 (leave)**
- **功能**: 请假申请、审批、统计
- **文件**: `teacher_leave_provider.dart`
- **位置**: `lib/features/leave/`

#### 7. **NFC模块 (nfc)**
- **功能**: NFC卡管理、扫描、配置
- **文件**: `nfc_management_optimized_v2.dart`, `nfc_card_provider.dart`
- **位置**: `lib/features/nfc/`

#### 8. **通知模块 (notification)**
- **功能**: 消息通知、公告管理
- **文件**: `notification_screen.dart`, `notification_provider.dart`
- **位置**: `lib/features/notification/`

#### 9. **报表模块 (reports)**
- **功能**: 数据分析、报表生成
- **文件**: `reports_screen.dart`, `analytics_screen.dart`
- **位置**: `lib/features/reports/`

### 🎨 共享资源说明

#### **通用组件 (shared/widgets)**
- 可复用的UI组件
- 如: `app_logo.dart`, `custom_button.dart`, `feature_card.dart`

#### **通用服务 (shared/services)**
- 跨模块使用的服务
- 如: `pocketbase_service.dart`, `permission_manager.dart`

#### **通用状态管理 (shared/providers)**
- 跨模块使用的状态管理
- 如: `class_provider.dart`, `points_provider.dart`

#### **工具类 (shared/utils)**
- 通用工具函数
- 如: `record_extensions.dart`, `app_theme.dart`

### 🏗️ 核心功能说明

#### **配置 (core/config)**
- 应用配置
- 如: `multi_role_config.dart`

#### **主题 (core/theme)**
- 应用主题配置
- 如: `app_theme.dart`

#### **常量 (core/constants)**
- 应用常量定义
- 如: `nfc_constants.dart`

### 📋 文件命名规范

1. **界面文件**: `功能名_screen.dart`
2. **组件文件**: `功能名_widget.dart` 或 `功能名_component.dart`
3. **服务文件**: `功能名_service.dart`
4. **状态管理**: `功能名_provider.dart`
5. **工具文件**: `功能名_utils.dart` 或 `功能名_helper.dart`

### 🔄 导入路径规范

```dart
// 功能模块内部导入
import '../widgets/component_name.dart';
import '../services/service_name.dart';

// 跨功能模块导入
import '../../features/other_feature/screens/screen_name.dart';

// 共享资源导入
import '../../shared/widgets/component_name.dart';
import '../../shared/services/service_name.dart';

// 核心功能导入
import '../../core/theme/app_theme.dart';
import '../../core/constants/constants.dart';
```

### ✅ 整理完成状态

- ✅ 功能模块分离
- ✅ 文件按功能分类
- ✅ 导入路径更新
- ✅ 空目录清理
- ✅ 文档说明完善

### 🚀 后续优化建议

1. **继续整理遗留界面**: 将 `screens/` 目录下的文件按功能分类
2. **创建模块索引文件**: 为每个功能模块创建 `index.dart` 文件
3. **统一命名规范**: 确保所有文件遵循命名规范
4. **添加模块文档**: 为每个功能模块添加详细说明

这样的文件结构使得项目更加清晰、易于维护和扩展！

