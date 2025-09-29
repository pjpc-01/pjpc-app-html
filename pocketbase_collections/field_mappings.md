# PocketBase 字段映射文档

## 最后更新：2025-09-29

### 重要集合字段映射

#### 1. Teachers 集合 (pbc_2907260911)

**核心字段：**
- `id` (text, 主键, 必需) - 15位随机字符串
- `name` (text, 可选) - 教师姓名
- `user_id` (text, 可选) - 用户ID
- `email` (email, 可选) - 邮箱地址
- `phone` (text, 可选) - 电话号码
- `status` (select, 可选) - 状态: "active", "inactive"
- `permissions` (select, 可选) - 权限: "normal_teacher", "senior_teacher", "admin"

**关系字段：**
- `center_assignment` (relation, 可选) - 关联到 centers 集合 (pbc_2011403882)

**安全字段：**
- `security_status` (select, 可选) - 安全状态: "normal", "suspicious", "locked"
- `verification_level` (select, 可选) - 验证级别: "normal", "high", "emergency"
- `encryption_algorithm` (select, 可选) - 加密算法: "AES-128", "AES-192", "AES-256", "ChaCha20"

#### 2. Students 集合 (pbc_3827815851)

**核心字段：**
- `id` (text, 主键, 必需) - 系统生成ID
- `student_id` (text, 可选) - 学生编号
- `student_name` (text, 必需) - 学生姓名
- `standard` (text, 必需) - 年级
- `center` (select, 可选) - 中心
- `parentName` (text, 必需) - 家长姓名
- `status` (select, 必需) - 状态

**安全字段：**
- `security_status` (select, 可选) - 安全状态
- `verification_level` (select, 可选) - 验证级别
- `cardStatus` (select, 可选) - 卡片状态

#### 3. Classes 集合 (pbc_2478702895)

**核心字段：**
- `id` (text, 主键, 必需) - 系统生成ID
- `name` (text, 可选) - 班级名称
- `level` (text, 可选) - 级别
- `section` (text, 可选) - 班级
- `description` (text, 可选) - 描述
- `room` (text, 可选) - 教室
- `max_capacity` (number, 可选) - 最大容量
- `current_students` (number, 可选) - 当前学生数
- `status` (select, 可选) - 状态

**关系字段：**
- `course_id` (relation, 可选) - 关联到 courses 集合
- `teacher_id` (relation, 可选) - 关联到 teachers 集合
- `center` (relation, 可选) - 关联到 centers 集合

### 查询语法注意事项

#### 关系字段查询
- 查询中心：`center.name = "WX 01"` (不是 `center = "WX 01"`)
- 查询教师：`teacher_id = "teacher_id_value"`
- 查询课程：`course_id = "course_id_value"`

#### 字段验证
- 所有字段都是可选的，除了主键
- 关系字段需要提供有效的关联ID
- select 字段需要提供预定义的值

### API 修复要点

1. **Classes API**: 使用 `center.name` 而不是 `center` 进行查询
2. **Teachers API**: 字段映射要匹配实际数据库结构
3. **Students API**: 字段验证要基于实际存在的字段
4. **Points API**: 支持多种字段名格式 (`studentId` 和 `student_id`)

### 访问规则

#### Teachers 集合
- `listRule`: `@request.auth.role = "admin" || @request.auth.role = "teacher"`
- `viewRule`: `@request.auth.role = "admin" || @request.auth.role = "teacher"`
- `createRule`: `@request.auth.role = "admin"`
- `updateRule`: `@request.auth.role = "admin"`
- `deleteRule`: `@request.auth.role = "admin"`

### 重要提醒

1. 所有集合ID都是动态生成的，不要硬编码
2. 关系字段查询需要使用正确的语法
3. 字段验证要基于实际数据库结构
4. 访问规则已经配置，API需要正确的认证
