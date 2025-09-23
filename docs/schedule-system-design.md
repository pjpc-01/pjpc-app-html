# 安亲补习中心排班管理系统设计

## 系统概述

本排班管理系统专为安亲补习中心设计，支持三种不同类型的员工管理：全职员工、兼职员工和仅教书老师。系统提供智能排班、课程安排、考勤集成等功能。

## 员工类型定义

### 1. 全职员工 (Full-time)
- **管理层**
  - 中心负责人/校长：负责整体管理与决策
  - 副主任/协调员：协助管理日常事务
- **学术部门**
  - 学务主任：监督整体学业与学生学术表现
  - 班主任：负责班级学生的考勤、纪律、日常管理
  - 全职科任老师：辅导学生完成作业与课业

**特点：**
- 固定月薪制
- 每周工作40小时
- 承担管理职责
- 需要考勤打卡

### 2. 兼职员工 (Part-time)
- 兼职科任老师/辅导老师
- 兼职班主任
- 兼职行政人员

**特点：**
- 时薪制
- 每周工作15-25小时
- 灵活工作时间
- 需要考勤打卡

### 3. 仅教书老师 (Teaching-only)
- 外聘老师
- 临时代课老师
- 科目专家

**特点：**
- 按课时计费
- 每周工作10-15小时
- 仅负责教学
- 无需考勤打卡

## 排班模板系统

### 模板类型
1. **管理层标准班**
   - 工作时间：08:00-18:00
   - 工作天数：周一至周五
   - 休息时间：60分钟
   - 最大周工时：40小时

2. **全职教师班**
   - 工作时间：09:00-17:00
   - 工作天数：周一至周五
   - 休息时间：60分钟
   - 最大周工时：40小时

3. **兼职下午班**
   - 工作时间：14:00-18:00
   - 工作天数：周一至周五
   - 休息时间：0分钟
   - 最大周工时：20小时

4. **仅教书时段**
   - 工作时间：16:00-19:00
   - 工作天数：周一至周日
   - 休息时间：0分钟
   - 最大周工时：15小时

## 智能排班算法

### 评分系统
系统根据以下因素为员工评分：

1. **基础分数**
   - 教学经验：经验年数 × 2
   - 员工状态：活跃 +10，请假 -20

2. **匹配分数**
   - 科目匹配：+15分
   - 年级匹配：+10分
   - 中心匹配：+5分
   - 偏好时间匹配：+10分

3. **可用性检查**
   - 不可用日期：-50分
   - 已有排班：-100分

### 排班规则
1. 优先选择评分最高的员工
2. 避免员工超时工作
3. 平衡工作负载
4. 考虑员工偏好
5. 确保课程连续性

## 系统功能

### 1. 排班管理
- 日/周/月视图切换
- 拖拽式排班调整
- 批量排班操作
- 排班冲突检测

### 2. 智能排班
- 一键自动排班
- 智能员工匹配
- 排班优化建议
- 冲突自动解决

### 3. 课程管理
- 课程信息维护
- 教室资源管理
- 时间槽位配置
- 课程冲突检测

### 4. 员工管理
- 员工信息维护
- 技能标签管理
- 可用时间设置
- 偏好配置

### 5. 考勤集成
- 与现有考勤系统集成
- 自动考勤记录
- 工时统计
- 薪资计算

## 数据库设计

### 主要表结构

#### schedules 表
```sql
CREATE TABLE schedules (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  employee_type TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  class_id TEXT,
  class_name TEXT,
  subject TEXT,
  grade TEXT,
  center TEXT NOT NULL,
  room TEXT,
  status TEXT DEFAULT 'scheduled',
  is_overtime BOOLEAN DEFAULT FALSE,
  hourly_rate DECIMAL(10,2),
  total_hours DECIMAL(5,2),
  notes TEXT,
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### schedule_templates 表
```sql
CREATE TABLE schedule_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  work_days TEXT NOT NULL, -- JSON array
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_duration INTEGER DEFAULT 0,
  max_hours_per_week INTEGER NOT NULL,
  color TEXT NOT NULL,
  description TEXT,
  requirements TEXT, -- JSON array
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API 接口

### 排班管理
- `GET /api/schedule` - 获取排班数据
- `POST /api/schedule` - 创建排班
- `PUT /api/schedule` - 更新排班
- `DELETE /api/schedule` - 删除排班

### 排班模板
- `GET /api/schedule-templates` - 获取排班模板
- `POST /api/schedule-templates` - 创建排班模板
- `PUT /api/schedule-templates` - 更新排班模板
- `DELETE /api/schedule-templates` - 删除排班模板

### 智能排班
- `POST /api/schedule/auto-schedule` - 执行智能排班

## 使用指南

### 1. 设置员工信息
1. 在教师管理中添加员工
2. 设置员工类型（全职/兼职/仅教书）
3. 配置教授科目和年级
4. 设置可用时间和偏好

### 2. 配置排班模板
1. 根据员工类型创建排班模板
2. 设置工作时间和规则
3. 配置颜色和描述

### 3. 创建课程安排
1. 添加课程信息
2. 设置教室和时间
3. 配置学生人数限制

### 4. 执行智能排班
1. 选择排班日期范围
2. 设置筛选条件
3. 点击"智能排班"按钮
4. 系统自动匹配最佳员工

### 5. 手动调整排班
1. 在排班表格中查看安排
2. 拖拽调整时间
3. 点击编辑按钮修改详情
4. 保存更改

## 最佳实践

### 1. 排班规划
- 提前一周规划排班
- 考虑员工工作负载平衡
- 预留应急替代方案
- 定期检查排班冲突

### 2. 员工管理
- 及时更新员工信息
- 记录员工技能和认证
- 设置合理的可用时间
- 定期评估员工表现

### 3. 课程安排
- 合理分配教室资源
- 避免时间冲突
- 考虑学生年龄特点
- 预留缓冲时间

### 4. 系统维护
- 定期备份数据
- 监控系统性能
- 及时更新员工信息
- 收集用户反馈

## 扩展功能

### 1. 移动端支持
- 员工移动端查看排班
- 排班变更通知
- 请假申请功能

### 2. 高级分析
- 排班效率分析
- 员工工作负载统计
- 成本效益分析
- 预测性排班

### 3. 集成功能
- 薪资系统集成
- 考勤系统集成
- 学生管理系统集成
- 财务系统集成

## 技术栈

- **前端**: Next.js 14, React, TypeScript
- **UI组件**: shadcn/ui, Tailwind CSS
- **状态管理**: React Hooks
- **后端**: Next.js API Routes
- **数据库**: PocketBase
- **日期处理**: date-fns
- **图标**: Lucide React

## 部署说明

1. 确保PocketBase数据库已配置
2. 创建必要的数据库表
3. 配置环境变量
4. 部署到生产环境
5. 初始化默认数据

## 维护和支持

- 定期检查系统日志
- 监控数据库性能
- 及时修复bug
- 收集用户反馈
- 持续优化算法
