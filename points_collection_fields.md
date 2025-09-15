# 积分管理集合字段文档

## 积分记录集合 (points_transactions)

### 基础字段
- `id` - 记录ID (自动生成)
- `created` - 创建时间 (自动生成)
- `updated` - 更新时间 (自动生成)

### 业务字段
- `student_id` - 学生ID (关联students集合)
- `student_name` - 学生姓名 (冗余字段，便于查询)
- `transaction_type` - 交易类型
  - `add_points` - 增加积分
  - `deduct_points` - 扣除积分
  - `redeem` - 兑换礼物
- `points_change` - 积分变化数量 (正数为增加，负数为扣除)
- `reason` - 操作原因/说明
- `teacher_id` - 操作老师ID (关联teachers集合)
- `teacher_name` - 操作老师姓名 (冗余字段)
- `proof_image` - 凭证图片 (兑换礼物时使用)
- `status` - 状态
  - `pending` - 待处理
  - `approved` - 已批准
  - `rejected` - 已拒绝
- `notes` - 备注信息

### 索引字段
- `student_id` - 用于查询学生的积分记录
- `transaction_type` - 用于按类型筛选
- `created` - 用于按时间排序
- `status` - 用于状态筛选

## 学生积分汇总 (student_points_summary)

### 基础字段
- `id` - 记录ID
- `student_id` - 学生ID (关联students集合)
- `total_points` - 总积分
- `available_points` - 可用积分
- `used_points` - 已使用积分
- `last_updated` - 最后更新时间

## 使用说明

1. **积分记录**: 每次积分操作都会在 `points_transactions` 中创建一条记录
2. **积分汇总**: 定期更新 `student_points_summary` 中的积分统计
3. **权限控制**: 只有老师可以操作积分，学生只能查看
4. **数据一致性**: 通过触发器或定时任务保持汇总数据的准确性

## API 接口

### 创建积分记录
```
POST /api/collections/points_transactions/records
```

### 查询学生积分记录
```
GET /api/collections/points_transactions/records?filter=(student_id='{student_id}')
```

### 更新学生积分汇总
```
PATCH /api/collections/student_points_summary/records/{student_id}
```
