# PJPC 安亲班管理系统 — 战略蓝图

> 最后更新：2026-07-23（i18n 多语言 + 死代码清理 + 文件清理 + 全量审计）
> 一句话：**一所安亲班的完整操作系统** — 从学生入学到毕业、从收费到出粮、从打卡到家长通知，全流程覆盖

---

## 一、系统概况

```
┌─────────────────────────────────────────────────────────┐
│                   🏫 PJPC ERP                           │
│                                                         │
│  📋 学生生命周期          💰 钱的全链路                    │
│  入学 → 日常 → 毕业       费用设置 → 收费 → 支出 → 出粮    │
│                                                         │
│  📡 物理设备集成          👨‍👩‍👧 多角色访问                  │
│  NFC打卡器 · TV看板       管理员 · 老师 · 财务 · 家长      │
│                                                         │
│  🏢 多中心架构            🌐 多语言                        │
│  PU1 / BATU14 自动分配    中文 / English 切换              │
└─────────────────────────────────────────────────────────┘
```

### 系统架构

```
┌──────────────────────────────────────────────────────┐
│         👤 用户层                                      │
│   Super Admin │ Admin │ Teacher │ Accountant │ Parent  │
├──────────────────────────────────────────────────────┤
│         📱 接入层                                      │
│   Web App (Next.js 15) │ TV Board │ WhatsApp (即将)    │
├──────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐          │
│  │  📚 运营模块      │  │  💰 财务模块      │          │
│  │  · 学生/教师管理   │  │  · 费用/套餐      │          │
│  │  · 考勤打卡(NFC)  │  │  · 发票/付款      │          │
│  │  · 课程/排课      │  │  · 支出/薪资      │          │
│  │  · 积分/卡片      │  │  · 报表/银行对账   │          │
│  │  · 作业/成绩      │  │  · 预算/库存       │          │
│  │  · 每日日志/接送  │  │                  │          │
│  └────────┬─────────┘  └────────┬──────────┘          │
│           └──────────┬──────────┘                      │
│                      ▼                                 │
│  ┌──────────────────────────────────────────┐          │
│  │   🗄️ 核心数据层 (lib/ + hooks/)           │          │
│  │   学生 · 教师 · 课程 · 中心 · 积分 · 卡    │          │
│  └──────────────────────────────────────────┘          │
│                      │                                  │
│                      ▼                                  │
│              ┌──────────────┐                           │
│              │  PocketBase  │                           │
│              │  0.39.6 SQLite │                          │
│              └──────────────┘                           │
└─────────────────────────────────────────────────────────┘
```

### 技术栈

| 层 | 技术 |
|----|------|
| 前端框架 | Next.js 15 (App Router) |
| UI 库 | shadcn/ui + Tailwind CSS 3 |
| 设计系统 | Phantom Glass v3.0（灰白玻璃态） |
| 图标 | lucide-react |
| 状态管理 | React hooks + URL params |
| 数据请求 | @tanstack/react-query 通过 /api/pocketbase-proxy |
| 数据库 | PocketBase 0.39.6 (SQLite, REST API) |
| 数据库地址 | `http://localhost:8090` |
| 通知 | sonner (toast) |
| 图表 | recharts |
| PDF | jspdf + jspdf-autotable |
| 多语言 | contexts/language-context.tsx (1230+ keys, zh/en) |

---

## 二、多角色布局

### 侧边栏架构

- **布局组件：** `components/layouts/AppShell.tsx`（统一侧边栏布局）
- **用户控件：** 侧边栏底部集成用户头像、角色、在线状态、通知、登出
- **分行筛选：** 侧边栏底部全局 Tab（全部/PU1/BATU14），所有导航自动携带 `?center=` 参数
- **语言切换：** 侧边栏底部 + 登录页右上角（中文/EN）
- **角色路由：** 根 layout 判断 `userProfile.role` 渲染不同导航菜单
- **菜单配置：** 4 套独立 navItems（Admin/Teacher/Parent/Accountant）
- **移动端：** 侧边栏折叠为汉堡菜单，支持遮罩层关闭

### 导航分组（Admin）

```
📊 概览 → 仪表板 / 幻灯片 / TV看板
📚 教务 → 学生列表 / 学生报告 / 家长管理 / 作业管理 / 成绩管理 / 接送管理 / 每日日志 / 资源库 / 教师列表 / 教师考勤 / 课程管理
💰 财务 → 财务概览 / 收费管理 / 学生费用 / 发票管理 / 付款管理 / 收据管理 / 薪资管理 / 支出管理 / 银行对账 / 预算管理 / 财务报表 / 库存管理
⚙️ 系统 → 考勤中心 / 卡片管理 / 积分操作 / 积分规则 / 积分排行 / 用户管理 / 分行管理 / 系统设置 / 管理面板
```

---

## 三、当前状态快照（2026-07-23）

### 代码量

| 维度 | 数值 |
|------|------|
| 页面路由 | **52 条** |
| API 路由 | **90 条** |
| app/components | 95 个文件 |
| components | 101 个文件 |
| hooks | 34 个 |
| lib | 22 个 |
| contexts | 3 个 (auth + nfc-auth + language) |
| PB Collections（业务） | **51 个** |
| 翻译 key (zh/en) | **1230 个** |

### PB Collections（51 个业务表）

| Collection | 记录数 | 说明 |
|-----------|--------|------|
| `students` | 126 | 学生档案 |
| `teachers` | 29 | 教师档案 |
| `parents` | 172 | 家长档案 |
| `student_parents` | 172 | 学生-家长多对多 |
| `nfc_cards` | 126 | NFC 卡片 |
| `nfc_devices` | 2 | NFC 读卡器 |
| `points` | 136 | 学生积分 |
| `point_logs` | 57 | 积分变动日志 |
| `student_attendance` | 106 | 学生考勤 |
| `teacher_attendance` | 49 | 教师考勤 |
| `attendance_settings` | 1 | 考勤设置 |
| `student_fees` | 99 | 学生费用分配 |
| `fee_items` | 49 | 费用项目 |
| `fee_categories` | 8 | 费用分类 |
| `fee_packages` | 1 | 费用套餐 |
| `fee_package_items` | 3 | 套餐项目 |
| `invoices` | 2 | 发票 |
| `invoice_settings` | 3 | 发票设置 |
| `payments` | 1 | 付款记录 |
| `receipts` | 1 | 收据 |
| `receipt_settings` | 0 | 收据设置 |
| `refunds` | 3 | 退款 |
| `expenses` | 5 | 支出 |
| `budgets` | 3 | 预算 |
| `bank_accounts` | 2 | 银行账户 |
| `bank_transactions` | 14 | 银行流水 |
| `reconciliation_runs` | 3 | 对账记录 |
| `teacher_salary_structures` | 2 | 薪资结构 |
| `teacher_salary_records` | 4 | 薪资记录 |
| `salary_settings` | 0 | 薪资设置 |
| `teacher_leave_record` | 4 | 教师请假 |
| `courses` | 2 | 课程 |
| `schedules` | 2 | 排课 |
| `schedule_logs` | 0 | 排课日志 |
| `homework` | 4 | 作业 |
| `homework_submissions` | 0 | 作业提交 |
| `grades` | 0 | 成绩 |
| `daily_logs` | 0 | 每日日志 |
| `pickup_records` | 0 | 接送记录 |
| `photo_moments` | 0 | 随手拍 |
| `centers` | 2 | 分院 (PU1/BATU14) |
| `users` | 6 | 系统用户 |
| `role_permissions` | 6 | 角色权限 |
| `inventory_categories` | 5 | 库存分类 |
| `inventory_items` | 1 | 库存商品 |
| `inventory_transactions` | 0 | 库存流水 |
| `utility_bills` | 6 | 水电费 |
| `report_settings` | 1 | 报告设置 |
| `student_reports` | 2 | 学生报告 |
| `audit_logs` | 0 | 审计日志 |

### 页面路由 (52 条)

| 页面 | 说明 |
|------|------|
| `/` | 首页 Dashboard — 管理员控制台 + 分行Tab过滤 |
| `/login` | 登录页（含语言切换） |
| `/dashboard/slideshow` | 幻灯片仪表板 |
| `/education` | 教育概览 |
| `/student-management` | 学生管理 CRUD + 导入导出 |
| `/student-reports` | 学生报告列表 |
| `/student-report/[id]` | 学生报告详情 |
| `/parent-management` | 家长管理 CRUD |
| `/teacher-management` | 教师管理 CRUD + 薪资关联 |
| `/teacher-attendance-reports` | 教师考勤报表 |
| `/teacher-workspace` | 教师工作台 |
| `/course-management` | 课程管理 + 班级管理 + 排课 |
| `/homework` | 作业列表 |
| `/homework/new` | 布置作业 |
| `/homework/[id]` | 作业详情 + 批改 |
| `/homework/[id]/grade` | 批量批改 |
| `/grades` | 成绩管理 |
| `/daily-logs` | 每日日志 |
| `/pickup` | 接送管理 |
| `/attendance` | 统一考勤中心 (NFC) |
| `/card-management` | NFC 卡片管理 |
| `/points` | 积分操作 |
| `/points/rules` | 积分规则 |
| `/points/leaderboard` | 积分排行榜 |
| `/finance/overview` | 财务概览 |
| `/finance/fees` | 收费管理 |
| `/finance/student-fees` | 学生费用 |
| `/finance/invoices` | 发票管理 |
| `/finance/payments` | 付款管理 |
| `/finance/receipts` | 收据管理 |
| `/finance/payroll` | 薪资管理 |
| `/finance/expenses` | 支出管理 |
| `/finance/bank` | 银行对账 |
| `/finance/budget` | 预算管理 |
| `/finance/reports` | 财务报表 |
| `/inventory` | 库存列表 |
| `/inventory/new` | 新增商品 |
| `/inventory/[id]` | 商品详情 + 入库/出库 |
| `/center-management` | 分院管理 |
| `/user-management` | 用户角色管理 |
| `/settings` | 系统设置 |
| `/admin` | 系统仪表板 |
| `/resource-library` | 资源库 |
| `/tv-board` | TV 看板 |
| `/tv-board/[center]` | 指定中心 TV 看板 |
| `/parent/dashboard` | 家长门户 — 孩子总览 |
| `/parent/grades` | 家长查看成绩 |
| `/parent/payments` | 家长查看缴费 |
| `/parent/attendance` | 家长查看出勤 |
| `/parent/dailylogs` | 家长查看每日日志 |
| `/parent/notifications` | 家长查看通知 |
| `/finance-management` | 旧财务入口（保留兼容） |

### 核心智能设计

**多中心自动计算** — 小学（Standard 1-6）→ BATU14；中学（Form 1-5）→ PU1，由 `getCenterFromGrade()` 自动分配。

---

## 四、模块完成度

| 模块 | 进度 | 说明 |
|------|------|------|
| 学生/教师管理 | ✅ 100% | CRUD + 导入导出 + 多视图 |
| 财务系统 | ✅ 100% | 费用/发票/支付/薪资/报表/银行/预算 |
| NFC 考勤 | ✅ 95% | 双轨制(USB+手机NFC) + 统一考勤 + 积分联动 |
| 积分系统 | ✅ 95% | NFC刷卡积分 + 排行榜 + 规则 |
| 卡片管理 | ✅ 100% | 发卡/挂失/补卡 |
| 作业/成绩 | ✅ 100% | Homework CRUD + 批改 + 成绩录入分析 |
| 家长门户 | ✅ 100% | 6 页（dashboard/grades/payments/attendance/dailylogs/notifications） |
| 库存管理 | ✅ 100% | 进销存 + 低库存预警 |
| 课程/排课 | ✅ 100% | 课程 CRUD + 班级 + 冲突检测 |
| 每日日志 | ✅ UI 完成 | 教师端 + 家长端（PB 0 条记录，待投入使用） |
| 接送管理 | ✅ UI 完成 | 接送人管理 + 记录（PB 0 条记录） |
| 成绩管理 | ✅ UI 完成 | 录入/统计/分析（PB 0 条记录） |
| 多语言 i18n | ✅ 80% | 1230 key（zh/en）+ 导航栏已翻译 + 页面内容部分翻译 |
| 随手拍 | ❌ 0% | 老师拍照推送家长 |
| 暗色模式 | ❌ 0% | 教师晚上护眼 |
| 招生管道 | ❌ 0% | 咨询→试课→报名 |

---

## 五、NFC 双轨制

```
┌─────────────────────────────────────────────────────────┐
│  轨道 1: USB 读卡器（桌面端）                              │
│  ├─ 考勤：UnifiedAttendanceHub 键盘监听 → 自动打卡          │
│  ├─ 积分：PointsNfcScanner 键盘监听 → 弹出积分加减          │
│  └─ 登录：secure-login-form 键盘监听 → 教师 NFC 登录        │
│                                                          │
│  轨道 2: 手机 NFC（移动端）                                │
│  ├─ 考勤：Web NFC API (NDEFReader) → 打卡                  │
│  ├─ 积分：Web NFC API → 积分加减                           │
│  └─ 登录：Web NFC API → 教师 NFC 登录                      │
└─────────────────────────────────────────────────────────┘
```

关键：`hexToDecimal()` 统一 UID 格式，API 双字段搜索 `card_uid` + `nfc_uid`。

---

## 六、多语言 i18n（2026-07-23 新增）

### 架构

```
contexts/language-context.tsx
  ├─ LanguageProvider (包裹在 app/layout.tsx)
  ├─ useLanguage() hook → { language, setLanguage, t }
  ├─ 1230 个翻译 key (zh + en)
  └─ localStorage 持久化 ("pjpc_language")

components/LanguageSwitcher.tsx
  └─ 中文/EN 切换按钮（登录页右上角 + 侧边栏底部）
```

### 翻译覆盖

- ✅ 侧边栏导航（NAV_LABEL_MAP 映射）
- ✅ 面包屑导航
- ✅ 登录页文字
- ✅ 144 个组件文件的 UI 文字（按钮、标题、表头、placeholder）
- ⚠️ 部分三元表达式/模板字符串中的中文未翻译（约 30% 剩余）

### 不翻译的内容

- 数据值（学生名字、金额、日期、成绩）
- console.log / 开发者错误消息
- API 字段名

---

## 七、设计系统

### Phantom Glass v3.0

**唯一外观主题：** 幻影玻璃（灰白半透明 + backdrop-filter blur）

详见 `DESIGN.md`。

**核心色板：**
- 背景：灰白渐变 `#FAFAFA → #F5F5F5 → #EEEEEE`
- 玻璃层：半透明白 `rgba(255,255,255,0.55–0.70)` + blur
- 文字：深灰 `#212529` / 中灰 `#6c757d`
- 主色：中性灰 `#6c757d`
- 禁止：任何暖琥珀/棕/金/橙色调

### 状态颜色规则

```
绿色 (emerald-500) = 正常/已付款/已完成/出席
黄色 (amber-500)   = 待处理/部分付款/迟到
红色 (red-500)     = 逾期/未付款/缺席/退学
蓝色 (indigo-500)  = 激活/在线/主操作按钮
```

---

## 八、文件组织规则

```
components/       ← 所有可复用组件
  layouts/         ← AppShell, PageLayout, DashboardLayout
  ui/              ← shadcn/ui 原生组件（不要改）
  students/        ← 学生相关
  teacher/         ← 教师相关
  finance/         ← 财务组件
  courses/         ← 课程组件
  attendance/      ← 考勤组件
  shared/          ← PermissionGate, ErrorBoundary

app/              ← 页面路由（仅 page.tsx + layout.tsx）
  components/      ← page-level 组件（待迁移到 components/）

hooks/            ← 所有数据请求逻辑
lib/              ← 工具函数
contexts/         ← React Context (auth, nfc-auth, language)
pb_migrations/    ← PocketBase schema 迁移
scripts/          ← 工具脚本
templates/        ← CSV 模板等
```

### 开发模式

```tsx
// ✅ page.tsx 只做路由，thin wrapper
"use client"
import PageLayout from "@/components/layouts/PageLayout"
import StudentTable from "@/components/students/StudentTable"
export default function Page() {
  return <PageLayout title="..."><StudentTable /></PageLayout>
}

// ✅ 数据请求用 hooks + react-query
const { data, isLoading } = useStudents()
```

---

## 九、开发环境

| 项目 | 值 |
|------|-----|
| 项目路径 | `/home/pjpc/pjpc-app-prod` |
| Agent 同步仓 | `/home/pjpc/pjpc-app-agent` |
| Next.js | `localhost:3001` (next start) |
| PocketBase | `localhost:8090` |
| PB 二进制 | `pocketbase-0.39.6`（软链接 `pocketbase`） |
| Cloudflare Tunnel | 指向 3001 |
| 构建命令 | `npx next build` |
| 重启命令 | `systemctl --user restart pjpc-nextjs` |
| PB WorkDir | `/home/pjpc/pjpc-app-prod` |

### Git 分支

| 分支 | 用途 |
|------|------|
| `main` | 生产版本（`/home/pjpc/pjpc-app-prod`） |
| `hermes-agent` | 开发分支（`/home/pjpc/pjpc-app-agent`，port 3002） |
| `stable` | 备份稳定版 |

---

## 十、待办优先级

| # | 任务 | 难度 | 影响 | 说明 |
|---|------|:---:|:---:|------|
| 1 | 📸 **随手拍推家长** | ⭐⭐⭐ | 高 | 老师拍照→推送家长端通知 |
| 2 | 🌙 **暗色模式** | ⭐ | 高 | next-themes，教师晚上护眼 |
| 3 | 📝 **i18n 剩余 30%** | ⭐⭐ | 中 | 三元表达式/模板字符串中的中文 |
| 4 | 🔗 **student.center → centerId** | ⭐⭐ | 中 | 10 个文件统一字段引用 |
| 5 | 🏗️ **app/components/ → components/ 迁移** | ⭐⭐ | 低 | 11 个目录迁移 |
| 6 | 🧹 **巨型文件拆分** | ⭐⭐ | 低 | StudentForm 1220行, IntegratedCardManager 1184行 |
| 7 | 📦 **资源库完善** | ⭐⭐⭐ | 中 | 40行骨架→完整文件管理 |
| 8 | 🔐 **企业级功能** | ⭐⭐⭐⭐ | 低 | 审计日志/自动备份/通知中心 |

---

## 十一、黄金工作流

```
💡 新想法
   ↓
📝 1. 写进蓝图 (BLUEPRINT.md)
   ↓
🔧 2. 照着蓝图做
   ↓
📦 3. 改了 PB Schema → 运行导出脚本更新 pb-schema.json
   ↓
✅ 4. `npx next build` 验证 → 更新蓝图进度 → git commit
   ↓
🔄 重复
```

---

## 十二、给 AI Agent 的构建规范

1. **改代码前先 `git status` + `git log --oneline -3`** 了解当前状态
2. **改完必须 `npx next build`** 确保 0 error
3. **动 PB 数据前必须导出备份** `curl -s ... > /tmp/backup_{collection}_{timestamp}.json`
4. **软删除** `PATCH status=deleted`，不要物理删除
5. **日期用本地时间** `getFullYear/Month/Date`，不用 `toISOString().split('T')[0]`
6. **新功能照抄 invoice 的 UI 模式** — variant outline + ⚙图标 + 设置文字
7. **SPA 路由用 `usePathname()`** 不用 `window.location`
8. **`ndef.scan()` 不要传 `{signal}` 参数**
9. **先截图→搜索唯一文本定位文件→再改** — 不改无关文件
10. **`undo = git checkout` 恢复全部相关文件** — 不部分还原
