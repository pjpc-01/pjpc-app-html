# 📚 作业布置集合 (homework_assignments) 字段需求

基于马来西亚教育体系的智能作业布置功能，以下是 `homework_assignments` 集合需要的字段结构。

## 🏷️ 集合基本信息
- **名称 (Name):** `homework_assignments`
- **类型 (Type):** `Base`
- **描述:** 存储老师布置的作业信息

## 📋 必需字段列表

### 🔑 基本信息字段
1. **`id`**
   - **类型:** Text (T)
   - **约束:** 自动生成
   - **描述:** 作业唯一标识符

2. **`title`**
   - **类型:** Text (T)
   - **约束:** Nonempty (必填)
   - **描述:** 作业标题

3. **`description`**
   - **类型:** Text (T)
   - **约束:** Nonempty (必填)
   - **描述:** 作业描述/内容

4. **`subject`**
   - **类型:** Select (☰)
   - **可选值:** `math`, `malay`, `english`, `chinese`, `science`, `moral`, `history`, `geography`, `art`, `pe`, `music`, `ict`
   - **选择方式:** Single (单选)
   - **约束:** Nonempty (必填)
   - **描述:** 科目

5. **`grade`**
   - **类型:** Select (☰)
   - **可选值:** `std1`, `std2`, `std3`, `std4`, `std5`, `std6`, `frm1`, `frm2`, `frm3`, `frm4`, `frm5`
   - **选择方式:** Single (单选)
   - **约束:** Nonempty (必填)
   - **描述:** 年级

6. **`due_date`**
   - **类型:** Date (📅)
   - **约束:** Nonempty (必填)
   - **描述:** 截止日期

### 👨‍🏫 教师相关字段
7. **`teacher_id`**
   - **类型:** Relation (🔗)
   - **关联集合:** `teachers`
   - **约束:** Nonempty (必填)
   - **描述:** 布置作业的老师ID

8. **`teacher_name`**
   - **类型:** Text (T)
   - **约束:** Nonempty (必填)
   - **描述:** 老师姓名

9. **`teacher_department`**
   - **类型:** Text (T)
   - **描述:** 老师部门（用于判断小学/中学）

10. **`teacher_position`**
    - **类型:** Text (T)
    - **描述:** 老师职位（用于判断教育级别）

### 🎯 作业属性字段
11. **`difficulty_level`**
    - **类型:** Select (☰)
    - **可选值:** `easy`, `medium`, `hard`
    - **选择方式:** Single (单选)
    - **默认值:** `medium`
    - **描述:** 难度等级

12. **`status`**
    - **类型:** Select (☰)
    - **可选值:** `active`, `completed`, `cancelled`
    - **选择方式:** Single (单选)
    - **默认值:** `active`
    - **描述:** 作业状态

### 📁 文件附件字段
13. **`attached_files`**
    - **类型:** File (📁)
    - **配置:** Multiple (多文件)
    - **描述:** 附件文件（支持PDF, DOC, DOCX, JPG, PNG）

14. **`file_count`**
    - **类型:** Number (#)
    - **默认值:** 0
    - **描述:** 附件文件数量

### 📊 统计字段
15. **`assigned_students_count`**
    - **类型:** Number (#)
    - **默认值:** 0
    - **描述:** 分配的学生数量

16. **`submitted_count`**
    - **类型:** Number (#)
    - **默认值:** 0
    - **描述:** 已提交的学生数量

17. **`graded_count`**
    - **类型:** Number (#)
    - **默认值:** 0
    - **描述:** 已批改的数量

### 🏫 马来西亚教育体系字段
18. **`education_level`**
    - **类型:** Select (☰)
    - **可选值:** `primary`, `secondary`
    - **选择方式:** Single (单选)
    - **描述:** 教育级别（小学/中学）

19. **`school_type`**
    - **类型:** Text (T)
    - **描述:** 学校类型（马来西亚特色）

### 📝 其他字段
20. **`instructions`**
    - **类型:** Text (T)
    - **描述:** 特殊说明或要求

21. **`created_at`**
    - **类型:** Date (📅)
    - **约束:** 自动生成
    - **描述:** 创建时间

22. **`updated_at`**
    - **类型:** Date (📅)
    - **约束:** 自动更新
    - **描述:** 更新时间

## 🔗 关联集合

### 需要关联的集合
1. **`teachers`** - 教师信息
2. **`students`** - 学生信息（用于分配作业）
3. **`classes`** - 班级信息（可选）

## 📋 索引建议

### 建议创建的索引
1. **`teacher_id`** - 按老师查询作业
2. **`grade`** - 按年级查询作业
3. **`subject`** - 按科目查询作业
4. **`due_date`** - 按截止日期排序
5. **`status`** - 按状态筛选
6. **`education_level`** - 按教育级别筛选

## 🔐 权限设置

### 建议的权限规则
1. **创建权限:** 只有老师可以创建作业
2. **查看权限:** 老师可以查看自己布置的作业，学生可以查看分配给自己的作业
3. **编辑权限:** 只有布置作业的老师可以编辑
4. **删除权限:** 只有布置作业的老师可以删除

## 📊 查询示例

### 常用查询场景
1. **按老师查询作业:**
   ```javascript
   filter = "teacher_id = 'teacher_123'"
   ```

2. **按年级查询作业:**
   ```javascript
   filter = "grade = 'std1'"
   ```

3. **按科目查询作业:**
   ```javascript
   filter = "subject = 'math'"
   ```

4. **查询即将到期的作业:**
   ```javascript
   filter = "due_date >= '2024-01-01' && due_date <= '2024-01-07'"
   ```

5. **查询小学/中学作业:**
   ```javascript
   filter = "education_level = 'primary'"
   ```

## ⚠️ 注意事项

1. **数据一致性:** 确保 `teacher_id` 和 `teacher_name` 的一致性
2. **文件管理:** 附件文件需要定期清理，避免存储空间浪费
3. **权限控制:** 确保只有相关老师可以管理自己的作业
4. **备份策略:** 作业数据需要定期备份
5. **性能优化:** 大量作业时需要考虑分页和索引优化

## 🚀 扩展建议

### 未来可能需要的字段
1. **`tags`** - 作业标签
2. **`estimated_time`** - 预计完成时间
3. **`points`** - 作业分值
4. **`prerequisites`** - 前置作业要求
5. **`resources`** - 参考资料链接
6. **`rubric`** - 评分标准

## 👨‍🏫 老师集合字段说明

### 用于判断教育级别的字段
基于现有的 `teachers` 集合，以下字段可用于判断老师是教小学还是中学：

1. **`department`** (Text)
   - 部门字段，可以设置为：
     - `Primary School` / `小学部`
     - `Secondary School` / `中学部`
     - `Standard Department` / `标准部门`

2. **`position`** (Text)
   - 职位字段，可以设置为：
     - `Primary Teacher` / `小学老师`
     - `Secondary Teacher` / `中学老师`
     - `Standard Teacher` / `标准老师`

### 建议的老师数据设置
为了正确识别老师身份，建议在 `teachers` 集合中设置：

**小学老师示例：**
- `department`: "Primary School" 或 "小学部"
- `position`: "Primary Teacher" 或 "小学老师"

**中学老师示例：**
- `department`: "Secondary School" 或 "中学部"  
- `position`: "Secondary Teacher" 或 "中学老师"

### 系统判断逻辑
系统会根据以下关键词自动判断老师身份：
- **小学老师关键词**: `primary`, `小学`, `standard`
- **中学老师关键词**: `secondary`, `中学`, `form`

---

**文档生成时间:** ${DateTime.now().toString().substring(0, 19)}
**版本:** 1.0
**适用系统:** 马来西亚教育体系智能作业管理系统
