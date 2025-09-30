# 功能入口点文档

## 新创建功能的入口点

### 1. 教师薪资管理功能

#### 入口点
- **主入口**: `lib/screens/teacher/teacher_salary_management_screen.dart`
- **导航路径**: 主页 → 教师薪资管理
- **权限要求**: 仅管理员可访问

#### 相关文件
- **Provider**: `lib/providers/teacher_salary_provider.dart`
- **服务**: `lib/services/pocketbase_service.dart` (薪资相关API方法)
- **子页面**:
  - `lib/screens/teacher/add_edit_salary_record_screen.dart` - 添加/编辑薪资记录
  - `lib/screens/teacher/add_edit_salary_structure_screen.dart` - 添加/编辑薪资结构

#### 功能特性
- 薪资记录管理（创建、编辑、删除、查看）
- 薪资结构管理（职位、部门、雇佣类型等）
- 薪资统计和报表
- 支持多种薪资类型（月薪、时薪、奖金、加班费等）

### 2. 教师请假管理功能

#### 入口点
- **主入口**: `lib/screens/teacher/teacher_leave_management_screen.dart`
- **导航路径**: 主页 → 教师请假管理
- **权限要求**: 管理员和教师都可访问

#### 相关文件
- **Provider**: `lib/providers/teacher_leave_provider.dart`
- **服务**: `lib/services/pocketbase_service.dart` (请假相关API方法)
- **子页面**:
  - `lib/screens/teacher/add_edit_leave_record_screen.dart` - 添加/编辑请假记录

#### 功能特性
- 请假记录管理（创建、编辑、查看）
- 请假余额管理
- 请假审批状态管理（仅管理员）
- 请假统计和报表
- 支持紧急程度分类

### 3. 增强的教师考勤功能

#### 入口点
- **主入口**: `lib/screens/attendance/attendance_dashboard_screen.dart`
- **导航路径**: 主页 → 考勤管理
- **权限要求**: 管理员和教师都可访问

#### 新增功能
- 详细考勤统计（工作时长、加班时间、迟到早退等）
- 月度考勤报表
- 考勤异常检测
- 效率分数计算
- 准时率统计

## 导航集成

### 主页导航 (`lib/screens/home/home_screen.dart`)

#### 管理员功能
```dart
case 'teacher_salary_management':
  Navigator.push(context, MaterialPageRoute(
    builder: (context) => const TeacherSalaryManagementScreen()
  ));
  break;

case 'teacher_leave_management':
  Navigator.push(context, MaterialPageRoute(
    builder: (context) => const TeacherLeaveManagementScreen()
  ));
  break;
```

#### 教师功能
```dart
case 'my_salary_records':
  Navigator.push(context, MaterialPageRoute(
    builder: (context) => const TeacherSalaryManagementScreen()
  ));
  break;

case 'my_leave_records':
  Navigator.push(context, MaterialPageRoute(
    builder: (context) => const TeacherLeaveManagementScreen()
  ));
  break;

case 'my_attendance_records':
  Navigator.push(context, MaterialPageRoute(
    builder: (context) => const AttendanceDashboardScreen()
  ));
  break;
```

### Provider注册 (`lib/main.dart`)

```dart
providers: [
  // ... 其他Provider
  ChangeNotifierProvider(create: (context) => TeacherSalaryProvider()),
  ChangeNotifierProvider(create: (context) => TeacherLeaveProvider()),
  // ... 其他Provider
],
```

## 权限控制

### 功能访问权限
- **教师薪资管理**: 仅管理员
- **教师请假管理**: 管理员和教师
- **我的薪资**: 仅教师（查看自己的薪资）
- **我的请假**: 仅教师（管理自己的请假）
- **我的考勤**: 仅教师（查看自己的考勤）

### 操作权限
- **创建薪资记录**: 仅管理员
- **编辑薪资记录**: 仅管理员
- **删除薪资记录**: 仅管理员
- **创建请假记录**: 管理员和教师
- **编辑请假记录**: 管理员和教师
- **审批请假**: 仅管理员

## 使用流程

### 管理员使用流程
1. 登录系统（管理员角色）
2. 在主页看到"教师薪资管理"和"教师请假管理"功能
3. 点击进入相应管理界面
4. 可以创建、编辑、删除薪资和请假记录
5. 可以查看统计报表

### 教师使用流程
1. 登录系统（教师角色）
2. 在主页看到"我的薪资"、"我的请假"、"我的考勤"功能
3. 点击进入相应界面
4. 可以查看自己的薪资记录
5. 可以创建和编辑自己的请假记录
6. 可以查看自己的考勤记录和统计

## 数据流

### 薪资数据流
1. 用户操作 → UI界面
2. UI界面 → Provider (TeacherSalaryProvider)
3. Provider → PocketBaseService
4. PocketBaseService → PocketBase API
5. 返回数据 → Provider → UI界面

### 请假数据流
1. 用户操作 → UI界面
2. UI界面 → Provider (TeacherLeaveProvider)
3. Provider → PocketBaseService
4. PocketBaseService → PocketBase API
5. 返回数据 → Provider → UI界面

## 注意事项

1. **权限检查**: 所有功能都有权限检查，确保用户只能访问授权的内容
2. **数据隔离**: 教师只能查看和操作自己的数据
3. **错误处理**: 所有操作都有完整的错误处理机制
4. **响应式设计**: 界面支持不同屏幕尺寸
5. **实时更新**: 使用Provider模式确保数据实时更新

