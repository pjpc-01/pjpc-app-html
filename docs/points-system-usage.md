# 积分系统使用指南

## 🎯 优化后的积分系统特性

### 1. 类型安全
- 使用 TypeScript 枚举替代字符串字面量
- 统一的接口定义和类型检查
- 更好的 IDE 支持和自动补全

### 2. 数据一致性
- 通过 `season_id` 关联赛季，支持动态赛季切换
- 统一的教师字段命名
- 基础实体接口减少重复代码

### 3. 审核流程
- 积分交易默认状态为 `pending`，需要审核
- 只有已批准的交易才会影响学生积分
- 支持交易状态追踪和管理

## 📋 核心类型定义

### 枚举类型

```typescript
// 积分交易类型
export enum TransactionType {
  Add = "add_points",        // 加分
  Deduct = "deduct_points",  // 扣分
  Redeem = "redeem_gift"     // 兑换礼品
}

// 积分交易状态
export enum TransactionStatus {
  Pending = "pending",       // 待审核
  Approved = "approved",     // 已通过
  Rejected = "rejected"      // 已拒绝
}

// 教师权限
export enum TeacherPermission {
  Normal = "normal_teacher",  // 普通教师
  Senior = "senior_teacher",  // 高级教师
  Admin = "admin"             // 管理员
}
```

### 核心接口

```typescript
// 基础实体接口
export interface BaseEntity {
  id: string
  created: string
  updated: string
}

// 积分赛季
export interface PointSeason extends BaseEntity {
  season_name: string
  start_date: string
  end_date: string
  is_active: boolean
  clear_date?: string
}

// 学生积分
export interface StudentPoints extends BaseEntity {
  student_id: string
  current_points: number
  total_earned: number
  total_spent: number
  season_id: string  // 关联到 PointSeason.id
}

// 积分交易
export interface PointTransaction extends BaseEntity {
  student_id: string
  teacher_id: string
  points_change: number
  transaction_type: TransactionType
  reason: string
  proof_image?: string
  status: TransactionStatus
  season_id: string  // 关联到 PointSeason.id
  gift_name?: string
  gift_points?: number
}
```

## 🚀 使用示例

### 1. 创建积分交易

```typescript
import { 
  PointTransactionCreateData, 
  TransactionType, 
  TransactionStatus 
} from '@/types/points'

// 创建加分交易（默认待审核）
const addPointsTransaction: PointTransactionCreateData = {
  student_id: 'student123',
  teacher_id: 'teacher456',
  points_change: 10,
  transaction_type: TransactionType.Add,
  reason: '课堂表现优秀',
  status: TransactionStatus.Pending  // 可选，默认为 Pending
}

// 创建扣分交易
const deductPointsTransaction: PointTransactionCreateData = {
  student_id: 'student123',
  teacher_id: 'teacher456',
  points_change: -5,
  transaction_type: TransactionType.Deduct,
  reason: '迟到',
  status: TransactionStatus.Pending
}
```

### 2. 使用工具函数

```typescript
import { 
  getTransactionTypeLabel,
  getTransactionStatusLabel,
  isTransactionApproved 
} from '@/types/points'

// 获取显示名称
const typeLabel = getTransactionTypeLabel(TransactionType.Add)  // "加分"
const statusLabel = getTransactionStatusLabel(TransactionStatus.Pending)  // "待审核"

// 检查交易状态
if (isTransactionApproved(transaction.status)) {
  console.log('交易已通过，可以更新学生积分')
}
```

### 3. 赛季管理

```typescript
import { PointSeason } from '@/types/points'

// 创建新赛季
const newSeason: Omit<PointSeason, 'id' | 'created' | 'updated'> = {
  season_name: '2024春季学期',
  start_date: '2024-03-01',
  end_date: '2024-06-30',
  is_active: true
}

// 获取当前活跃赛季
const activeSeason = await pb.collection('point_seasons')
  .getFirstListItem('is_active = true')
```

### 4. 积分查询和统计

```typescript
// 获取学生积分信息（包含赛季信息）
const studentPoints = await pb.collection('student_points')
  .getFirstListItem(`student_id = "${studentId}"`, {
    expand: 'season_id,student_id'
  })

// 获取学生的积分交易历史
const transactions = await pb.collection('point_transactions')
  .getList(1, 50, {
    filter: `student_id = "${studentId}"`,
    sort: '-created',
    expand: 'teacher_id,season_id'
  })
```

## 🔧 数据库迁移

### 运行迁移脚本

```bash
# 运行数据库迁移
node scripts/migrate-points-schema.js
```

迁移脚本会：
1. 创建默认赛季
2. 更新 `student_points` 表，添加 `season_id` 字段
3. 更新 `point_transactions` 表，添加 `season_id` 字段
4. 统一教师字段命名
5. 验证迁移结果

### 手动创建赛季

```typescript
// 在 PocketBase 管理界面创建 point_seasons 集合
// 或使用 API 创建赛季
const season = await pb.collection('point_seasons').create({
  season_name: '2024春季学期',
  start_date: '2024-03-01',
  end_date: '2024-06-30',
  is_active: true
})
```

## 📊 最佳实践

### 1. 积分交易审核流程

```typescript
// 1. 教师创建交易（状态为 pending）
const transaction = await createPointTransaction({
  student_id: 'student123',
  teacher_id: 'teacher456',
  points_change: 10,
  transaction_type: TransactionType.Add,
  reason: '课堂表现优秀'
})

// 2. 管理员审核
if (isTransactionPending(transaction.status)) {
  // 审核通过
  await pb.collection('point_transactions').update(transaction.id, {
    status: TransactionStatus.Approved
  })
  
  // 更新学生积分
  await updateStudentPoints(transaction.student_id, transaction.points_change)
}
```

### 2. 赛季切换

```typescript
// 结束当前赛季
await pb.collection('point_seasons').update(currentSeasonId, {
  is_active: false,
  clear_date: new Date().toISOString()
})

// 激活新赛季
await pb.collection('point_seasons').update(newSeasonId, {
  is_active: true
})
```

### 3. 数据一致性检查

```typescript
// 使用 PointsSyncService 修复数据一致性
import { pointsSyncService } from '@/app/tv-board/services/points-sync'

const result = await pointsSyncService.fixPointsConsistency()
console.log('修复结果:', result.summary)
```

## 🎉 总结

优化后的积分系统提供了：

✅ **类型安全** - 使用枚举和接口，减少运行时错误
✅ **数据一致性** - 通过关联表管理赛季，支持动态切换
✅ **审核流程** - 默认待审核状态，确保积分变更的合法性
✅ **代码复用** - 基础实体接口减少重复代码
✅ **易于维护** - 统一的字段命名和类型定义

这些改进使得积分系统更加健壮、可维护，并且为未来的功能扩展提供了良好的基础。
