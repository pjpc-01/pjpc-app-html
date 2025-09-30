# 创建排班管理相关的PocketBase集合
# 需要在PocketBase管理界面中执行这些SQL

Write-Host "=== 创建排班管理数据库表 ===" -ForegroundColor Green

Write-Host "`n1. 创建 teacher_schedule 集合..." -ForegroundColor Yellow
Write-Host @"
-- 教师排班表
CREATE TABLE teacher_schedule (
    id TEXT PRIMARY KEY,
    created TEXT NOT NULL,
    updated TEXT NOT NULL,
    teacher_id TEXT NOT NULL,
    teacher_name TEXT NOT NULL,
    day_of_week TEXT NOT NULL, -- Monday, Tuesday, etc.
    start_time TEXT NOT NULL, -- HH:MM format
    end_time TEXT NOT NULL, -- HH:MM format
    shift_type TEXT NOT NULL, -- morning, afternoon, evening, full_day
    subject TEXT,
    classroom TEXT,
    branch_code TEXT,
    branch_name TEXT,
    is_active BOOLEAN DEFAULT true,
    notes TEXT
);

-- 创建索引
CREATE INDEX idx_teacher_schedule_teacher_id ON teacher_schedule(teacher_id);
CREATE INDEX idx_teacher_schedule_day ON teacher_schedule(day_of_week);
CREATE INDEX idx_teacher_schedule_active ON teacher_schedule(is_active);
"@

Write-Host "`n2. 创建 teacher_salary_structure 集合..." -ForegroundColor Yellow
Write-Host @"
-- 教师薪资结构表
CREATE TABLE teacher_salary_structure (
    id TEXT PRIMARY KEY,
    created TEXT NOT NULL,
    updated TEXT NOT NULL,
    teacher_id TEXT NOT NULL,
    teacher_name TEXT NOT NULL,
    position TEXT NOT NULL,
    department TEXT NOT NULL,
    employment_type TEXT NOT NULL, -- full_time, part_time, contract, intern
    effective_date TEXT NOT NULL,
    base_salary REAL NOT NULL,
    hourly_rate REAL DEFAULT 0,
    overtime_rate REAL DEFAULT 0,
    bonus_rate REAL DEFAULT 0,
    allowance_fixed REAL DEFAULT 0,
    allowance_transport REAL DEFAULT 0,
    allowance_meal REAL DEFAULT 0,
    allowance_housing REAL DEFAULT 0,
    allowance_medical REAL DEFAULT 0,
    allowance_other REAL DEFAULT 0,
    epf_rate REAL DEFAULT 11.0,
    socso_rate REAL DEFAULT 0,
    eis_rate REAL DEFAULT 0.2,
    tax_rate REAL DEFAULT 0,
    notes TEXT
);

-- 创建索引
CREATE INDEX idx_salary_structure_teacher_id ON teacher_salary_structure(teacher_id);
CREATE INDEX idx_salary_structure_effective_date ON teacher_salary_structure(effective_date);
"@

Write-Host "`n3. 增强 teacher_salary_record 集合..." -ForegroundColor Yellow
Write-Host @"
-- 为现有薪资记录表添加新字段
ALTER TABLE teacher_salary_record ADD COLUMN allowance_fixed REAL DEFAULT 0;
ALTER TABLE teacher_salary_record ADD COLUMN allowance_transport REAL DEFAULT 0;
ALTER TABLE teacher_salary_record ADD COLUMN allowance_meal REAL DEFAULT 0;
ALTER TABLE teacher_salary_record ADD COLUMN allowance_housing REAL DEFAULT 0;
ALTER TABLE teacher_salary_record ADD COLUMN allowance_medical REAL DEFAULT 0;
ALTER TABLE teacher_salary_record ADD COLUMN allowance_other REAL DEFAULT 0;
ALTER TABLE teacher_salary_record ADD COLUMN epf_deduction REAL DEFAULT 0;
ALTER TABLE teacher_salary_record ADD COLUMN socso_deduction REAL DEFAULT 0;
ALTER TABLE teacher_salary_record ADD COLUMN eis_deduction REAL DEFAULT 0;
ALTER TABLE teacher_salary_record ADD COLUMN tax_deduction REAL DEFAULT 0;
ALTER TABLE teacher_salary_record ADD COLUMN other_deductions REAL DEFAULT 0;
ALTER TABLE teacher_salary_record ADD COLUMN gross_salary REAL DEFAULT 0;
ALTER TABLE teacher_salary_record ADD COLUMN net_salary REAL DEFAULT 0;
ALTER TABLE teacher_salary_record ADD COLUMN attendance_rate REAL DEFAULT 0;
ALTER TABLE teacher_salary_record ADD COLUMN work_hours REAL DEFAULT 0;
ALTER TABLE teacher_salary_record ADD COLUMN overtime_hours REAL DEFAULT 0;
ALTER TABLE teacher_salary_record ADD COLUMN leave_deduction REAL DEFAULT 0;
ALTER TABLE teacher_salary_record ADD COLUMN calculation_data TEXT;
"@

Write-Host "`n4. 增强 teacher_attendance 集合..." -ForegroundColor Yellow
Write-Host @"
-- 为现有考勤表添加新字段
ALTER TABLE teacher_attendance ADD COLUMN work_hours REAL DEFAULT 0;
ALTER TABLE teacher_attendance ADD COLUMN overtime_hours REAL DEFAULT 0;
ALTER TABLE teacher_attendance ADD COLUMN efficiency_score REAL DEFAULT 0;
ALTER TABLE teacher_attendance ADD COLUMN punctuality_rate REAL DEFAULT 0;
"@

Write-Host "`n5. 设置API规则..." -ForegroundColor Yellow
Write-Host @"
-- teacher_schedule API规则
-- 创建规则：管理员和教师可以创建
-- 读取规则：管理员可以读取所有，教师只能读取自己的
-- 更新规则：管理员可以更新所有，教师只能更新自己的
-- 删除规则：仅管理员可以删除

-- teacher_salary_structure API规则
-- 创建规则：仅管理员可以创建
-- 读取规则：管理员可以读取所有，教师只能读取自己的
-- 更新规则：仅管理员可以更新
-- 删除规则：仅管理员可以删除
"@

Write-Host "`n=== 完成 ===" -ForegroundColor Green
Write-Host "请在PocketBase管理界面中执行上述SQL语句来创建必要的数据库表。" -ForegroundColor Cyan
Write-Host "创建完成后，排班管理功能就可以正常使用了！" -ForegroundColor Cyan
