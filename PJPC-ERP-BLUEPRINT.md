# PJPC 安亲班管理系统 — 战略蓝图

> 最后更新：2026-06-22（deepseek-v4-pro 全面重新评估）
> 一句话：**一所安亲班的完整操作系统** — 从学生入学到毕业、从收费到出粮、从打卡到家长通知，全流程覆盖

---

## 一、这到底是什么系统？

不是"学生管理系统"，也不是"财务软件"。是**安亲班的全业务操作系统**。

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
│  🏢 多中心架构            ⚡ 智能化                        │
│  PU1 / BATU14 自动分配    自动算中心 · 自动催款 · 报表      │
└─────────────────────────────────────────────────────────┘
```

### 系统架构

```
┌──────────────────────────────────────────────────────┐
│         👤 用户层                                      │
│   Super Admin │ Admin │ Teacher │ Accountant │ Parent  │
├──────────────────────────────────────────────────────┤
│         📱 接入层                                      │
│   Web App (Next.js) │ TV Board │ WhatsApp (即将)       │
├──────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐          │
│  │  📚 运营模块      │  │  💰 财务模块      │          │
│  │  · 学生/教师管理   │  │  · 费用/套餐      │          │
│  │  · 考勤打卡(NFC)  │  │  · 发票/付款      │          │
│  │  · 课程/排课      │  │  · 支出/薪资      │          │
│  │  · 积分/卡片      │  │  · 报表/E-Invoice │          │
│  │  · 作业/成绩(待)  │  │  · 库存(待)       │          │
│  └────────┬─────────┘  └────────┬──────────┘          │
│           │                     │                      │
│           └──────────┬──────────┘                      │
│                      ▼                                 │
│  ┌──────────────────────────────────────────┐          │
│  │   🗄️ 核心数据层 (lib/ + hooks/)           │          │
│  │   无UI页面，纯数据逻辑，教育/财务共同引用    │          │
│  │   学生 · 教师 · 课程 · 中心 · 积分 · 卡    │          │
│  └──────────────────────────────────────────┘          │
│                      │                                  │
│                      ▼                                  │
│              ┌──────────────┐                           │
│              │  PocketBase  │                           │
│              │  SQLite 数据库 │                           │
│              └──────────────┘                           │
└─────────────────────────────────────────────────────────┘
```

### 为什么这么分层？

| 痛点 | 解决方案 |
|------|---------|
| 财务改了学生字段 → 教育模块崩了 | Core Data 层隔离，两边各自引用 |
| 老师薪资依赖教师资料，教师资料依赖考勤 | 数据解耦，API 层组装 |
| 新增模块要改 5 个文件 | hooks 封装，页面只管 UI |
| 不同角色看到不同内容 | 权限系统 (PageGuard + PermissionGate) |

---

## 二、多角色布局方案

### 2.1 当前问题

- 首页 `/` 为平铺式 Dashboard，**没有侧边栏导航**
- `/admin` 有侧边栏但仅限 admin 角色，且只有 6 项简陋菜单
- 不同角色（老师/家长/会计）共用同一套路由，没有独立界面

### 2.2 目标架构

```
左边栏（深色渐变）             右边内容区
┌────────────────────┐  ┌────────────────────────┐
│ 🎓  PJPC           │  │  内容区（根据角色不同） │
│    管理系统         │  │                        │
│                    │  │                        │
│ Admin 菜单：        │  │                        │
│ 📊 仪表板          │  │                        │
│ 👨‍🎓 学生管理 ───┐  │  │                        │
│    ├ 学生列表   │  │  │                        │
│    ├ 成绩单     │  │  │                        │
│    └ 作业管理   │  │  │                        │
│ 👨‍🏫 教师管理       │  │                        │
│ 💰 财务管理 ───┐   │  │                        │
│    ├ 概览      │   │  │                        │
│    ├ 收费      │   │  │                        │
│    ├ 交易      │   │  │                        │
│    ├ 薪资      │   │  │                        │
│    └ 报表      │   │  │                        │
│ 📚 课程管理       │   │  │                        │
│ 📝 考勤系统       │   │  │                        │
│ ⚙️ 系统设置       │   │  │                        │
│                    │  │                        │
├────────────────────┤  │                        │
│ 老师视图：          │  │                        │
│ 📊 我的工作台      │  │                        │
│ 📋 我的课表        │  │                        │
│ ✅ 签到            │  │                        │
│ 👨‍🎓 我的学生       │  │                        │
│                    │  │                        │
│ 家长视图：          │  │                        │
│ 📊 孩子总览        │  │                        │
│ 📋 成绩            │  │                        │
│ 💰 缴费            │  │                        │
│ 📝 出勤            │  │                        │
│                    │  │                        │
│ 会计视图：          │  │                        │
│ 💰 财务概览        │  │                        │
│ 📄 收费管理        │  │                        │
│ 💳 交易记录        │  │                        │
│ 📊 报表            │  │                        │
└────────────────────┘  └────────────────────────┘
```

### 2.3 技术实现

- **布局组件：** `components/layouts/AppShell.tsx`（统一侧边栏布局）
- **角色路由：** 根 layout 判断 `userProfile.role` 渲染不同导航菜单
- **菜单配置：** 每个角色独立配置 navItems，按权限分组
- **移动端：** 侧边栏折叠为汉堡菜单，支持手势滑动

---

## 三、现在做到哪了？（2026-06-20 快照）

### 📊 整体进度

| 模块 | 进度 | 说明 |
|------|------|------|
| 核心运营 | 🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩 100% | 学生/教师/考勤/排课/积分/NFC |
| 财务管理 | 🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩 100% | 费用/发票/支付/薪资/报表/银行/预算 |
| 系统基建 | 🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩 100% | 全局分行筛选+PB schema 版本化 |
| 作业模块 | 🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩 100% | Homework CRUD + 批量批改 + 教师工作台联动 |
| 家长端 | 🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩 100% | 独立管理+家长门户 5 页 |
|| 库存模块 | 🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩 100% | Phase 4d：进销存管理 |
|| 课程打磨 | 🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩 100% | Phase 5d：真实PB数据+冲突检测+班级管理 |
|| 体验升级 | 🟩🟩🟩🟩🟩🟩🟩🟩⬜⬜ 80% | Phase 5e：Cmd+K搜索+空状态骨架屏+header统一 |
|| 🔴 安亲班核心 | 🟩🟩🟩⬜⬜⬜⬜⬜⬜⬜ 25% | Phase 5f：每日日志 教师端✅ + grades PB已建 |
|| 🔵 NFC/积分系统 | 🟩🟩⬜⬜⬜⬜⬜⬜⬜⬜ 20% | PB collections 已建，前端待接 |
|| 🧹 代码清理 | 🟩🟩🟩🟩🟩🟩🟩🟩🟩⬜ 90% | 批次1+2：-13,791行死代码 + 4个Bug修复 |
|| 企业级 | ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ 5% | 审计日志/备份/通知中心 |

### 页面路由 (52 条)

| 页面 | 状态 | 说明 |
|------|------|------|
| `/` 首页 Dashboard | ✅ | 管理员控制台 + 分行Tab过滤 + 快捷入口 |
| `/login` | ✅ | 登录页 |
| `/daily-logs` | ✅ **新** | 每日日志 — 教师记录学生功课/午睡/用餐/心情 |
| `/student-management` | ✅ | 158 学生，CRUD + 导入导出 + 网格/表格/分析视图 |
| `/teacher-management` | ✅ | 28 教师，CRUD + 详情 + 薪资关联 |
| `/course-management` | ✅ | 课程 CRUD |
| `/unified-attendance` | ✅ | NFC 考勤 + 仪表板 + 打卡记录 + 卡片管理 |
| `/schedule-management` | ✅ | 排课 + 冲突检测 + 日历视图 |
| `/attendance-reports` | ✅ | 考勤报表 |
| `/teacher-attendance-reports` | ✅ | 教师考勤报表 |
| `/center-management` | ✅ | 分院/中心管理（位于系统设置→分院管理） |
| `/homework` | ✅ | 作业总览：按中心/年级/科目筛选，卡片视图 |
| `/homework/new` | ✅ | 布置新作业表单 |
| `/homework/[id]` | ✅ | 作业详情 + 学生提交列表 + 逐一批改 |
| `/homework/[id]/grade` | ✅ | 批量批改视图 |
| `/parent-management` | ✅ **新** | 家长列表 + 增删改 + 搜索筛选 |
| `/parent/dashboard` | ✅ **新** | 家长门户首页 — 孩子总览卡片 |
| `/parent/grades` | ✅ **新** | 家长查看孩子成绩 |
| `/parent/payments` | ✅ **新** | 家长查看缴费记录 |
| `/parent/attendance` | ✅ **新** | 家长查看出勤记录 |
| `/parent/notifications` | ✅ **新** | 家长查看公告通知 |
| `/finance/overview` | ✅ | 财务概览 |
| `/finance/fees` | ✅ | 收费管理 |
| `/finance/payments` | ✅ | 发票付款 |
| `/finance/expenses` | ✅ | 支出/薪资 |
| `/finance/bank` | ✅ | 银行对账 |
| `/finance/budget` | ✅ | 预算管理 |
| `/finance/reports` | ✅ | 财务报表 |
| `/finance-management` | ✅ | 旧财务入口（保留兼容） |
| `/payroll-management` | ✅ | 薪资结构 + 自动化 + EPF/Socso/EIS |
| `/points-management` | ✅ | 积分系统 + 交易记录 |
| `/card-management` | ✅ | NFC 发卡/挂失/补卡 |
| `/resource-library` | ✅ | 文件/图片资源 |
| `/student-points` | ✅ | 学生积分查看 |
| `/student-checkin` | ✅ | 学生自助签到 |
| `/teacher-checkin` | ✅ | 教师签到 |
| `/teacher-workspace` | ✅ | 教师工作台 Dashboard |
| `/tv-board` | ✅ | 中心 TV 实时看板 |
| `/tv-board/[center]` | ✅ | 指定中心 TV 看板 |
| `/user-management` | ✅ | 用户角色管理 |
| `/inventory` | ✅ **新** | 库存列表 — 分类/状态筛选，低库存预警，KPI 面板 |
| `/inventory/new` | ✅ **新** | 新增商品 |
| `/inventory/[id]` | ✅ **新** | 商品详情 + 入库/出库操作 + 库存流水 |
| `/admin` | ✅ | 系统设置（状态/中心配置/高级） |
| `/admin/students` | ✅ | 后台学生管理 |
| `/admin/wifi-networks` | ✅ | WiFi 配置 |

### API 路由 (20 条)

```
学生:    /api/students /api/students/list /api/students/import /api/students/export
教师:    /api/teachers /api/teachers/update /api/teacher-profile /api/teacher-performance /api/teacher-leave
薪资:    /api/teacher-salary /api/salary/auto-generate
通用:    /api/centers /api/users /api/wifi-networks
系统:    /api/pocketbase-proxy /api/pocketbase-proxy/[...path]
数据:    /api/assignment-stats /api/import/google-sheets
其他:    /api/test-simple /api/websocket
```

### 数据库 Collections

| Collection | 记录数 | 说明 |
|-----------|-------|------|
| `students` | **158** | 含 name, student_id, gender, grade, status, dob, address, fatherName, motherName, fatherPhone, motherPhone, nric, school, emergencyContact |
| `teachers` | **28** | 含姓名/科目/电话/薪资结构关联 |
| `courses` | **6** | |
| `schedules` | ✅ | 排课 |
| `attendance` | ✅ | 考勤 |
| `nfc_cards` | ✅ | |
| `points/transactions` | ✅ | 积分 |
| `resources` | ✅ | |
| `announcements` | ✅ | |
| `users` | ✅ | |
| `fee_items` / `fee_packages` / `fee_package_items` / `fee_categories` | ✅ | 费用体系 |
| `student_fees` | ✅ | 学生分配 |
| `invoices` / `payments` / `receipts` / `expenses` | ✅ | 财务交易 |
| `homework` | ✅ | 作业布置（title/subject/grade/dueDate/teacherId/centerId） |
| `homework_submissions` | ✅ | 学生提交 + 批改（score/feedback/status） |
| `parents` | ✅ **新** | 家长独立信息（name/phone/nric/address/relationship） |
| `student_parents` | ✅ **新** | 学生-家长关联（多对多） |
| `inventory_categories` | ✅ **新** | 库存分类（教材/文具/零食/其他） |
| `inventory_items` | ✅ **新** | 商品主数据（名称/分类/价格/库存/警戒线） |
| `inventory_transactions` | ✅ **新** | 库存流水（入库/出库/调整） |

### 💡 核心智能设计

**多中心自动计算** — 这是我们系统最巧妙的设计：
- 小学（Standard 1-6 / 一年级到六年级）→ **BATU14**
- 中学（Form 1-5 / Peralihan / 中一到中五）→ **PU1**
- 由 `getCenterFromGrade()` 函数自动计算，**零手动选择，零 hardcode**

---

## 四、财务系统差距分析

### 4.1 功能覆盖对比

| 功能 | 企业级标准 | PJPC 现状 | 优先级 |
|------|-----------|-----------|--------|
| 📈 图表可视化 | QuickBooks/Xero 收入/支出趋势图、饼图、柱状图 | ✅ **Phase 1 已完成**（Recharts 月度柱状图 + 饼图） | ✅ |
| 📄 PDF 报表导出 | P&L、资产负债表、现金流 PDF | ❌ CSV 而已 | 🔴 |
| 🏦 银行对账 | 自动导入银行流水每日对账 | ❌ 无 | 🔴 |
| 🔄 定期账单 | 自动生成每月学费 | ⚠️ 空壳函数 | 🟠 |
| 💰 预算管理 | 按科目/月度预算 vs 实际 | ❌ 无 | 🟠 |
| 📋 AR 账龄分析 | 30/60/90+ 天逾期报表 | ❌ 无 | 🟠 |
| 🔁 部分付款 | 允许分期付款 | ❌ 无 | 🟠 |
| ↩️ 退款处理 | 完整退款流程（原路退回/ credit note） | ❌ 无 | 🟡 |
| 🧾 凭证附件 | 每笔交易可附收据/发票图片 | ❌ 无 | 🟡 |
| 🔔 自动提醒 | 逾期缴费自动 WhatsApp/Email | ❌ 无 | 🟡 |
| 📱 家长自助 | Portal 查看/下载缴费记录 | ❌ 无 | 🟡 |

### 4.2 UI/UX 对比

| 方面 | 企业级标准 | PJPC 现状 | 优先级 |
|------|-----------|-----------|--------|
| 顶部工具栏 | 搜索 + 通知 + 用户菜单 | 🟡 已有基础版 | 🟢 |
| 侧边栏导航 | 分组导航，可折叠 | ❌ 无统一侧边栏 | 🔴 |
| 数据表格 | 筛选 + 排序 + 搜索 + 分页 | ⚠️ 部分有 | 🟠 |
| 移动端适配 | 全响应式 | ⚠️ 正在修复 | 🟠 |
| 操作反馈 | Toast/Snackbar 提示 | ❌ 无统一提示系统 | 🟡 |
| 空状态/加载态 | Skeleton + Empty state | ❌ 无 | 🟡 |
| 暗色模式 | 一键切换 | ❌ 无 | 🟢 |
| 快捷键 | 键盘操作支持 | ❌ 无 | 🟢 |

---

## 五、分阶段路线图

### ✅ Phase 1：修 Bug + 图表（已完成）

| 项目 | 状态 | 日期 |
|------|------|------|
| 修复 `amount`→`totalAmount` 字段 | ✅ | 2026-06-16 |
| WhatsApp 电话三路降级（`father_phone`/`mother_phone`/`emergencyPhone`） | ✅ | 2026-06-16 |
| 安装 Recharts + 月度收支柱状图 + 支出饼图 | ✅ | 2026-06-16 |
| 重复函数合并（FinancialReports.tsx） | ✅ | 2026-06-16 |
| `document.querySelector` → React props | ✅ | 2026-06-16 |
| 财务 5 tab 打平到侧边栏 | ✅ | 2026-06-16 |
| 死代码清理 1500 行 | ✅ | 2026-06-16 |
| 安全修复 3 处 attendance API | ✅ | 2026-06-16 |
| 手机响应式 11 表格 + 4 Tab 栏 | ✅ | 2026-06-16 |
| Dashboard KPI 数据修复（158 学生 / 28 教师） | ✅ | 2026-06-16 |

### ✅ Phase 2：统一布局 + 侧边栏导航（已完成）

| 项目 | 状态 | 说明 |
|------|------|------|
| 重建 `AppShell.tsx` 统一侧边栏 | ✅ | 深色渐变侧边栏，分组导航 |
| 多角色菜单配置（Admin/Teacher/Parent/Accountant） | ✅ | 4 套独立 navItems |
| 所有页面接入统一 layout | ✅ | 根 layout 全局包裹 |
| 移动端侧边栏折叠 | ✅ | 汉堡菜单 + 遮罩层 |
| 顶部面包屑导航 | ✅ | 路径自动映射中文 |
| 统一操作反馈（Toast 提示系统） | ✅ | sonner Toaster，全局可用 |
| **导航调整：分院管理移到系统设置** | ✅ | 2026-06-19：从「学生管理→分院管理」移到「系统设置→分院管理」|

### ✅ Phase 3：企业级功能增强

| 项目 | 状态 | 说明 |
|------|------|------|
| PDF 报表导出（P&L、收据） | ✅ | jspdf + 自动表格，FinancialReports 页面一键导出 |
| 银行对账功能 | ✅ | 子模块：银行账户管理 + 银行流水导入 + 智能对账匹配引擎 |
| 定期账单自动生成 | ✅ | `/api/billing/auto-generate` + 每月 1 号定时任务 |
| 预算管理（预算 vs 实际） | ✅ | 新增组件：月度分类预算设置 + 超支预警柱状图 |
| AR 账龄分析表 | ✅ | `/api/finance/ar-aging` + 财务报表可视化卡片 |
| 部分付款/退款流程 | ✅ | PaymentManagement 新增：退款对话框 + 部分付款支持 + 退款统计 |
| 凭证附件上传 | ⏳ | |
|| 分院/中心管理系统 | ✅ | 独立 centers 表 + 设置页面 + 学生关联 |
| 逾期自动提醒（WhatsApp/Email） | ✅ | 每周一 AR 账龄周报 cron |
| 数据表格统一（筛选/排序/搜索/分页） | ⏳ | |
| **恢复薪资管理页面** | ✅ 2026-06-19 | 从git历史捞回`TeacherSalaryManagement.tsx`，创建`/finance/payroll`路由，侧边栏拆分为独立入口 |

### 📌 Phase 4：智能化

| 项目 | 状态 |
|------|------|
| 可配置 Dashboard Widget | ⏳ |
| 按钮级权限控制 | ⏳ |
| 家长自助 Portal | ⏳ |
| 成绩管理模块 | ⏳ |
| 作业/考试模块 | ⏳ |
| 库存管理 | ⏳ |
| 高级数据分析 | ⏳ |
| 暗色模式 | ⏳ |
| 键盘快捷键 | ⏳ |

### ✅ Phase 4a：分院/中心管理系统（已完成 ✅ 2026-06-19）

#### 目标
将 `center` 从学生资料的**文本字段**升级为**独立数据实体**，PU1 / BATU14 正式成为可管理的中心记录。

#### 实施步骤

| # | 步骤 | 文件 | 说明 |
|---|------|------|------|
| 1 | 创建 `centers` 表（PocketBase） | PB Admin | 字段：`name` `code` `address` `phone` `manager` `status` |
| 2 | Centers API 路由 | `app/api/centers/route.ts` | GET（列表+学生数）/ POST / PATCH / DELETE |
| 3 | 系统设置 → 分院管理页面 | `/center-management` | 分院列表 + 增删改（位于系统设置→分院管理） |
| 4 | 学生字段更新：`center` → `centerId` | 学生表单 + API | 下拉选择分院（取代文本输入）|
| 5 | 学生列表/过滤适配 | `student-management-page.tsx` | 按分院筛选、表头显示分院名 |
| 6 | **Dashboard 分行Tab** | `modern-admin-dashboard.tsx` | 全部 | BATU14 | PU1 三大Tab过滤，KPI/学生/教师联动 |
| 7 | 侧边栏导航调整 | `AppShell.tsx` | 分院管理从学生管理移到系统设置 |
| 8 | 数据迁移 | 脚本 | 现有 WX 01-04 → 手动映射到 PU1 / BATU14 |
| 9 | 影响波及检查 | 全局搜索 `student.center` | 财务/考勤/报表等所有引用处更新 |

#### 数据模型

```json
{
  "id": "abc123",
  "name": "PU1 分院",
  "code": "PU1",
  "address": "No. XX, Jalan Puchong Utama 1",
  "phone": "012-3456789",
  "manager": "陈老师",
  "status": "active",
  "studentCount": 85
}
```

#### 学生关联变更

| 当前 | 变更后 |
|------|--------|
| `student.center = "WX 01"` | `student.centerId = "RELATION_TO_CENTERS"` |
| 文本输入，手动打字 | 下拉选择，受控数据 |

---

### ✅ Phase 4b：全局分行筛选 + PB Schema 版本化（已完成 ✅ 2026-06-20）

#### 目标
让「选分行」成为**全局状态**，跨页面导航自动携带筛选参数；同时将 PB 数据库结构纳入 Git 版本控制，实现真正的 Infrastructure as Code。

#### 核心设计

**1. 全局分行筛选架构**

| 机制 | 说明 |
|------|------|
| **状态载体** | URL 参数 `?center=UUID` — 刷新不丢失，分享可还原 |
| **传递方式** | `AppShell.tsx` 所有导航链接自动携带 `?center` 参数 |
| **Sidebar 分行Tab** | 点击底部中心Tab → `router.replace()` 更新 URL，触发全页重新筛选 |
| **页面读取** | 各页面通过 `useSearchParams()` 读取 URL 参数过滤数据 |
| **跨页面持久化** | 点任何侧边栏链接 → 自动保留当前 `?center=` 参数 |

**2. 支持页面（11 页）**

| 页面 | 筛选方式 |
|------|---------|
| Dashboard 仪表板 | `?center=` 过滤 KPI/学生/教师 |
| 学生管理 | `?center=` 过滤学生列表 |
| 成绩单 Report Cards | `?center=` 过滤 |
| 教师管理 | `?center=` 过滤教师 |
| 考勤报表 | `?center=` 过滤考勤记录 |
| 学生积分 | `?center=` 过滤积分记录 |
| 发票管理 | 通过 `invoice → student → centerId` 追溯过滤 |
| 付款管理 | 通过 `payment → invoice → student → centerId` 追溯过滤 |
| 薪资管理 | 通过 `salary → teacher → center_assignment → centerId` 追溯过滤 |
| 支出管理 | 表单直接加 `centerId` 字段，下拉选择分行 |
| 课程管理 | `?center=` 过滤课程 |

**3. PB Schema 版本化**

| 文件/脚本 | 说明 |
|-----------|------|
| `pb-schema.json` | PB 全部 26 个 collection 的 schema 快照（字段/类型/索引/配置） |
| `scripts/export-pb-schema.py` | 通过 PB API 导出 schema 为 JSON（需要 admin token） |
| `scripts/pre-commit.sh` | Git pre-commit hooks 模板，commit 前自动导出最新 schema |
| `scripts/setup-new-machine.sh` | 新电脑一键设置：npm install + git hooks + 环境检查 |

**4. 迁移到新电脑流程**

```
旧电脑:
  git push (包含 pb-schema.json 和全部代码)
  cp -r pb_data/ (全部数据)

新电脑:
  git clone && cd pjpc-app-html
  bash scripts/setup-new-machine.sh
  # 复制 pb_data/ 到项目根目录
  npm run pb:start → PB 自动加载全部数据+Schema
```

---

### ✅ Phase 4c：作业 Homework 模块（已完成 ✅ 2026-06-20）

#### 目标
实现完整的作业管理系统：布置→提交→批改全流程，含教师工作台联动。

#### 实施步骤

| # | 步骤 | 文件 | 说明 |
|---|------|------|------|
| 1 | 创建 PB collections | `homework` + `homework_submissions` | 10字段 + 10字段，含 relations 到 teachers/students/centers |
| 2 | Data hooks | `hooks/useHomework.ts` | `useHomework()` 单条+提交 / `useHomeworkList()` 列表 / `usePendingGradingCount()` |
| 3 | 作业列表页 | `app/homework/page.tsx` | 卡片视图，按科目/年级/中心筛选，搜索 |
| 4 | 布置作业页 | `app/homework/new/page.tsx` | 完整表单：标题/科目/年级/中心/教师/日期/描述 |
| 5 | 作业详情页 | `app/homework/[id]/page.tsx` | 信息卡片 + 学生提交列表 + 逐一批改 |
| 6 | 批量批改页 | `app/homework/[id]/grade/page.tsx` | 所有提交一览，分数+评语批量保存 |
| 7 | 侧边栏导航 | `AppShell.tsx` | 在「学生管理」下新增「作业管理」子项 |
| 8 | 教师工作台联动 | `teacher-workspace/page.tsx` | 待批改通知 badge + 作业管理 tab（替换占位符） |

#### 数据模型

**homework**
| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | text (required) | 作业标题 |
| `description` | text | 作业描述 |
| `subject` | select | 12个科目选项 |
| `grade` | text | 年级（一年级~Form 5） |
| `centerId` | relation→centers | 所属中心 |
| `teacherId` | relation→teachers | 布置教师 |
| `assignedDate` | date | 布置日期 |
| `dueDate` | date | 截止日期 |
| `attachments` | file | 附件（最多3文件） |
| `status` | select | active/archived/cancelled |

**homework_submissions**
| 字段 | 类型 | 说明 |
|------|------|------|
| `homeworkId` | relation→homework (cascadeDelete) | 所属作业 |
| `studentId` | relation→students | 提交学生 |
| `content` | text | 提交内容 |
| `attachments` | file | 附件 |
| `status` | select | pending/submitted/graded |
| `score` | number (0-100) | 分数 |
| `feedback` | text | 批改评语 |
| `gradedBy` | relation→teachers | 批改教师 |
| `submittedDate` | date | 提交时间 |
| `gradedDate` | date | 批改时间 |

---

### ✅ Phase 4d：进销存库存管理（已完成 ✅ 2026-06-22）

#### 目标
实现教材/文具的完整进销存管理：商品分类 → 入库 → 库存跟踪 → 出库/销售 → 低库存预警。

#### 实施步骤

| # | 步骤 | 文件 | 说明 |
|---|------|------|------|
| 1 | 创建 PB collections | `inventory_categories` + `inventory_items` + `inventory_transactions` | 分类/商品/出入库流水 |
| 2 | Data hooks | `hooks/useInventory.ts` | `useInventoryCategories()` / `useInventoryItems()` / `useInventoryTransactions()` / `useLowStockItems()` |
| 3 | 库存列表页 | `app/inventory/page.tsx` | 表格+卡片视图，按分类/中心/状态筛选，低库存高亮 |
| 4 | 新增商品页 | `app/inventory/new/page.tsx` | 表单：名称/分类/单位/进价/售价/库存警戒线 |
| 5 | 商品详情页 | `app/inventory/[id]/page.tsx` | 信息卡 + 库存流水表 + 入库/出库操作按钮 |
| 6 | 入库/出库对话框 | 详情页内嵌 | Modal 表单：数量/单价/供应商/备注 |
| 7 | 库存报表（备选） | `app/inventory/reports` | 进销存汇总表 |
| 8 | 侧边栏导航 | `AppShell.tsx` | 在「财务管理」下新增「库存管理」子项 |

#### 数据模型

**inventory_categories**
| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | text (required) | 分类名称（教材/文具/零食/其他） |
| `description` | text | 描述 |
| `status` | select | active / inactive |

**inventory_items**
| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | text (required) | 商品名称 |
| `categoryId` | relation→inventory_categories | 所属分类 |
| `centerId` | relation→centers | 所属中心（多中心库存） |
| `unit` | text | 单位（本/支/包/盒/张） |
| `costPrice` | number | 进货价 |
| `sellingPrice` | number | 售价 |
| `stock` | number (default:0) | 当前库存量 |
| `minStock` | number (default:5) | 最低库存警戒线 |
| `sku` | text | 商品编码（可选） |
| `status` | select | active / discontinued |
| `description` | text | 商品描述 |

**inventory_transactions**
| 字段 | 类型 | 说明 |
|------|------|------|
| `itemId` | relation→inventory_items (cascadeDelete) | 关联商品 |
| `type` | select | stock_in / stock_out / adjustment |
| `quantity` | number (required) | 数量（正数入库，负数出库） |
| `unitPrice` | number | 单价 |
| `totalAmount` | number | 总金额 |
| `reference` | text | 凭证号/采购单号 |
| `supplier` | text | 供应商 |
| `notes` | text | 备注 |
| `operatorId` | relation→teachers|teachers | 操作人 |
| `centerId` | relation→centers | 所属中心 |
| `date` | date | 交易日期 |

---

---

## 六、Phase 5：企业级 ERP 全面重新评估（2026-06-22）

> 由 deepseek-v4-pro 全面审计，聚焦：**安亲班真正缺什么？逻辑哪里可以更好？用户体验要怎么亲民？**

### 6.A 代码量与结构快照

| 维度 | 数值 |
|------|------|
| 页面路由 | **50 条**（28 个目录页 + 子页） |
| API 路由 | **40+** 条 |
| 数据 Hooks | **38 个**（含 useInventory/useHomework/useParents 等新模块） |
| UI 组件 | **80+** 个（shadcn/ui 全套 + 20 个自定义组件） |
| PB Collections | **30+** 个（含 inventory/homework/parents 等新建表） |
| 财务组件包 | **16 个**（Invoice/Payment/Receipt/Reminder/Budget/Reconciliation…） |
| 管理组件包 | **12 个**（Student/Teacher/Class/Announcement/NFC Points…） |
| 最大页面 | `student-management-page.tsx` — **971 行** |
| 总代码量 | ~20,000 行 hooks + ~30,000 行页面组件 |

### 6.B 🔴 安亲班核心缺失 — 这是系统最大的空洞

系统目前已做得很好的是：**数据管理**（学生、教师、财务）和**日常运作**（打卡、排课、库存）。
但作为**安亲班 ERP**，以下「安亲班专属功能」一个都没有：

#### 6.B.1 学生每日日志（安亲班命脉）

> 💡 家长每天接孩子时都会问的一句：**"今天孩子学了什么？有没有完成功课？吃了没？乖不乖？"**

| 功能 | 说明 | 实现难度 |
|------|------|---------|
| 📓 **每日日志** `daily_logs` | 老师每天为学生记录：完成功课✓ / 午睡✓ / 行为评价😊😐😢 / 备注 | ⭐⭐ |
| 🍱 **餐饮记录** | 午餐/茶点出勤记录、过敏标记 | ⭐ |
| 🚗 **接送管理** | 谁来接？几点接？车辆安排（每间安亲班都有） | ⭐⭐⭐ |
| 📸 **随手拍** | 老师拍一张照片加一句话描述，一键推送给家长 | ⭐⭐ |
| 📊 **行为追踪** | 积分系统已有，但缺少**家长可视化**（本周你孩子被赞了几次？） | ⭐ |

**建议优先做：每日日志**

```yaml
daily_logs collection:
  studentId: relation→students
  teacherId: relation→teachers
  date: date
  homework_done: bool       # 功课完成？
  nap: bool                 # 午睡？
  meal: select              # ate_all / ate_some / refused
  mood: select              # happy / neutral / upset
  behavior_note: text       # 老师备注
  photo: file               # 随手拍
  parent_viewed: bool       # 家长已看？
```

#### 6.B.2 成绩管理系统

> 现有 `report-cards` 页面只是占位符。安亲班的核心价值之一是**帮助孩子提高成绩**。

| 功能 | 现状 | 建议 |
|------|------|------|
| 成绩录入 | ❌ 无 | 按科目/学期录入成绩（分数/等级） |
| 成绩分析 | ❌ 无 | 班级平均分、进步/退步趋势图 |
| Report Card PDF | ✅ 已有基础 | 需接入真实成绩数据，生成正式成绩单 |
| 家长查看成绩 | ⚠️ `/parent/grades` 页面已有但空 | 接真实数据 |

**新增 collection：`grades`**

```yaml
grades:
  studentId: relation→students
  subject: select           # 华文/国文/英文/数学/科学/...
  term: select              # Term 1 / Term 2 / Final
  year: number
  score: number             # 0-100
  grade_letter: text        # A/B/C/D/F
  teacher_comment: text
```

### 6.C 🟠 财务系统未竟之事

| 功能 | 现状 | 差距 |
|------|------|------|
| 电子支付 | ❌ 全靠手动 | 至少要支持记录 Touch 'n Go / DuitNow 交易号和自动匹配 |
| E-Invoice LHDN | ⚠️ 数据结构已有 | UI 未完成，验证逻辑缺失 |
| 多币种 | ❌ 无 | 所有金额都是 MYR，够用 |
| 发票号自动生成 | ⚠️ | 需确保 PB `invoice_number` 自增唯一 |
| 凭证附件 | ❌ | 每笔交易应可附收据照片 |

### 6.D 🟡 UI/UX 改进 — 亲民才是王道

| 问题 | 现状 | 改进方案 |
|------|------|---------|
| **巨型页面** | `student-management-page.tsx` = 971行 | 拆分为 StudentTable + StudentCard + StudentFilter |
| **不一致的布局** | 有的用 PageLayout (自带header)，有的直接嵌入 AppShell（双header） | 统一使用 AppShell 为唯一布局，PageLayout 改为内容组件 |
| **双 Header 问题** | PageLayout 自带 sticky header + AppShell 也有 header | 去掉 PageLayout 的 header，只保留 breadcrumb |
| **移动端教师体验** | 教师签到的核心流程在小屏上不流畅 | 大按钮 + 扫描 NFC 一键完成 |
| **暗色模式** | ❌ | 教师晚上用的多，暗色护眼 |
| **空状态** | 列表空的时候白屏 | 加 EmptyState 组件（插图 + 引导文字） |
| **加载骨架** | ❌ | 加 Skeleton 组件 |
| **全局搜索** | AppShell 顶部有占位但无功能 | Cmd+K 全局搜索（学生/教师/发票） |

### 6.E 🔵 代码质量改进

| 问题 | 影响 | 修复建议 |
|------|------|---------|
| **组件放错位置** | `app/components/` 下 20+ 组件（应该在 `components/`） | 迁移 + barrel 导出 |
| **页面直接导入页面** | `app/page.tsx` imports `app/teacher-workspace/page.tsx` | 抽取为独立组件 |
| **TypeScript 错误** | 编译时警告（FIX_LIST.md 记录） | 逐文件清理 |
| **硬编码 ID** | 部分地方用了学生的硬编码 ID | 改为 API 查询 |
| **重复代码** | 多处 CRUD 表单逻辑相似 | 抽取 useFormDialog hook |
| **无单元测试** | 零覆盖率 | 至少核心 hooks 要有测试 |

### 6.F ⚪ 数据一致性问题

| 问题 | 位置 | 影响 |
|------|------|------|
| `student.center` vs `centerId` | 学生资料 | 部分代码仍用旧的 `center` 文本字段，需全局替换 |
| `amount` vs `totalAmount` | 发票 | 已修复一部分，但检索 `amount` 仍能找到旧引用 |
| `grade` vs `standard` | 学生列表 | `useStudentData` 做了 `standard \|\| grade` 兼容，但源头未统一 |
| PB 无软删除 | 整个系统 | 删了就没法恢复 |

---

## 七、重新排定的开发路线图（按用户真实优先级）

> ⚠️ **核心原则：先能跑 → 再好看 → 再智能。**
> 以下每个 Phase 都附带**构建规格书**，任何 AI agent（包括 deepseek-v4-flash）照着做就能输出正确代码。

### 🔴 Phase 5a：主数据打磨（第一优先）

> ✅ **2026-06-22 完成：** 创建 `components/students/` 目录，新建 `StudentStatsBar`（KPI卡片）、`StudentGridView`（网格视图）、`StudentTable`（重定位）、`StudentFilter`（重定位），barrel export。Build 0 error。
> ✅ **2026-06-22 完成：** 教师组件从 `app/components/teacher/` 迁移到 `components/teacher/`，含12个组件 + barrel export。更新3处 import 路径。Build 0 error。
> ✅ **2026-06-22 完成：** 家长管理页面新增「关联学生」弹窗（点击学生数列显示关联的学生姓名+年级）。Build 0 error。

> 优先级理由：这是整个系统的数据地基。数据不对，财务/考勤全错。

| 模块 | 当前状态 | 需要打磨什么 |
|------|---------|------------|
| **分院管理** | ✅ 已有 | 确保 `student.centerId` 全局替换 `student.center`（仍有用旧字段的代码） |
| **学生管理** | ✅ 已有 | ① 971行巨型文件需拆分 ② `standard`/`grade` 字段统一 ③ 手机端卡片视图优先 |
| **教师管理** | ✅ 已有 | ① 详情页 KB/KWSP 字段已有，确保关联薪资模块 ② 银行信息完整 |
| **家长管理** | ✅ 已有 | ① 与 students 的多对多关联验证 ② 家长门户已有5页，确保数据流通 |

**每次完成一个子任务 → 更新蓝图进度。不要一次全做。**

**构建规格书 — 模块 A：学生管理页面重构**

```
目标：student-management-page.tsx (971行) → 拆成 < 300行/文件

需要建造的文件：
1. components/students/StudentTable.tsx (~200行)
   - 把管理页面里的大表格部分抽出来
   - Props: students[], onEdit, onDelete, onView
   - 表格列：姓名 | 年级 | 分院 | 学校 | 状态 | 操作
   - 手机端用卡片视图替代表格 (< 768px 自动切换)

2. components/students/StudentFilter.tsx (~100行)
   - 搜索框 + 分院下拉 + 年级下拉 + 状态筛选
   - Props: onFilter(filters) → 把筛选条件传给父组件

3. components/students/StudentImportExport.tsx (~150行)
   - CSV 导入导出按钮 + 对话框
   - 使用现有的 /api/students/import 和 /api/students/export

4. 修改后的 page.tsx:
   import StudentTable from "@/components/students/StudentTable"
   import StudentFilter from "@/components/students/StudentFilter"
   
   逻辑：
   - 用 useStudents() hook 拿数据
   - StudentFilter 改筛选 → useStudents refetch
   - StudentTable 渲染结果

PB 字段参考（useStudents hook 里查）：
  students: id, name, grade, centerId, school, status, fatherPhone, motherPhone
  centers: 展开 centerId 拿 name/code
```

```yaml
# PB students collection 关键字段
students:
  name: text        # 学生姓名
  grade: text       # 年级 (Standard 1-6 / Form 1-5 / Peralihan)
  centerId: relation→centers
  school: text      # 学校名称
  status: select    # active / graduated / transferred
  gender: select    # male / female
  dob: date
  fatherName: text
  motherName: text
  fatherPhone: text
  motherPhone: text
  emergencyContact: text
  nric: text
  address: text
```

**构建规格书 — 模块 B：家长管理验证**

```
目标：parents + student_parents 多对多关联确保正确

检查清单：
1. PB: parents collection 有 name/phone/nric/address/relationship
2. PB: student_parents collection 有 studentId(→students) + parentId(→parents)
3. 前端: 学生详情页能看到关联的家长
4. 前端: 家长详情页能看到关联的孩子列表
5. 家长门户 /parent/dashboard 能显示孩子的考勤/成绩/缴费
```

---

### 🔴 Phase 5b：财务系统打磨（第二优先）

> 优先级理由：钱的事马虎不得。每月出账单、收学费、发工资全在这。

| 模块 | 当前状态 | 需要打磨什么 |
|------|---------|------------|
| **费用设置** | ✅ fee_items/fee_packages | 确保套餐分配到学生正常 |
| **发票管理** | ✅ invoices | 发票号自增、部分付款支持 |
| **支出管理** | ✅ expenses | ✅ 加凭证附件（收据拍照）+ centerId 关联 |
| **薪资管理** | ✅ payroll | ✅ KB/KWSP/EPF/SOCSO/EIS 自动计算 |

**构建规格书 — 模块 C：支出凭证附件**

```
目标：expenses 记录可以附上收据照片

步骤：
1. PB: expenses collection 加字段 receipt (type: file, max 1)

2. 前端: ExpenseManagement.tsx 修改表单
   - 添加 <input type="file" accept="image/*" />
   - 用 FormData 上传到 PB

3. API: /api/pocketbase-proxy/api/collections/expenses/records
   - POST 时用 multipart/form-data
   - 字段: date, category, description, amount, method, centerId, receipt(文件)

4. 列表显示: 有 receipt 的记录显示 📎 图标，点击可查看/下载
```

**构建规格书 — 模块 D：薪资自动计算**

```
目标：新老师入职 → 自动算清 EPF/ SOCSO / EIS

PB 字段（payroll 相关 — 先确认是否已有 salary_structures collection）：
salary_structures:
  teacherId: relation→teachers
  basic_salary: number
  allowance: number        # 津贴
  epf_employee: number     # 员工 EPF (11%)
  epf_employer: number     # 雇主 EPF (12-13%)
  socso_employee: number
  socso_employer: number
  eis_employee: number
  eis_employer: number

计算逻辑 (hooks/usePayroll.ts):
  epf_employee = (basic_salary + allowance) * 0.11
  epf_employer = (basic_salary + allowance) * 0.12
  socso: 按 salary bracket 查表
  eis: fixed ~RM2.45 (employee) + ~RM4.90 (employer)
  
  net_salary = basic_salary + allowance - epf_employee - socso_employee - eis_employee
  employer_cost = basic_salary + allowance + epf_employer + socso_employer + eis_employer
```

---

### 🟠 Phase 5c：考勤系统打磨（第三优先）✅ 2026-06-22

> ✅ **2026-06-22 完成：** 教师签到页面改为手机优先的大按钮模式
>   - 新建 `components/attendance/TeacherMobileCheckin.tsx`
>   - 选择教师 → 大按钮签到/签退（绿色签到、橙色签退、各 7rem 高）
>   - 手机端自动适配，圆角大卡片
>   - 现有 TeacherAttendanceSystem (NFC扫卡) 保留在后台管理用
> ✅ **CSV 导出：** 考勤报表页已有 `exportRecords()` CSV 导出，无需新增
> ⏳ **学生签到 centerId 过滤：** 当前 StudentAttendanceSystem 仍用 `center`（旧 text 字段），
>   因学生数据仍有 `center` 字段填充，暂能工作。后续统一迁移到 centerId 时一起修。
> ⏳ **PDF 导出：** 需引入 jsPDF/html2canvas，优先级不高，暂缓

| 当前 | 需要打磨 | 状态 |
|------|---------|:----:|
| NFC 打卡 ✅ | 教师移动端签到体验优化（大按钮） | ✅ 完成 |
| 考勤报表 ✅ | 加导出 CSV/PDF | ✅ CSV已有，⏳ PDF暂缓 |
| 学生签到 ✅ | 确保 centerId 过滤正确 | ⏳ 待数据迁移时统一修 |
| TV 看板 ✅ | 保持 | ✅ |

---

### 🟠 Phase 5d：课程/班级管理打磨（第四优先 ✅ 2026-06-23）

| 当前 | 需要打磨 | 状态 |
|------|---------|:----:|
| 课程 CRUD ✅ | 加课程大纲/教材附件 + 改用真实 PB API | ✅ 完成 |
| 排课 ✅ | 冲突检测完善 | ✅ 完成 |
| 班级管理 ✅ | 班级=course+grade，确保关联正确 | ✅ 完成 |

**构建内容：**

| # | 文件 | 说明 |
|---|------|------|
| 1 | `lib/pocketbase-courses.ts` (N) | courses 数据层：TypeScript 类型 + CRUD API + 班级分组 |
| 2 | `hooks/useCourses.ts` (R) | 完全重写：去掉全部 mock 数据，改用真实 PB API |
| 3 | `components/courses/CourseManagement.tsx` (N) | 课程管理：统计卡片 + 搜索/筛选 + 表格/卡片双视图 + CRUD 对话框 + 课程大纲/描述编辑 + 教师列表加载 + 空状态/加载态/错误态 |
| 4 | `components/courses/ClassManagement.tsx` (N) | 班级管理：按年级分组的班级卡片/表格视图 + 颜色编码 + 统计 |
| 5 | `app/course-management/page.tsx` (R) | 重构 4 个 tab：课程管理(接真实组件) + 班级管理(接真实组件) + 排课管理(跳转到独立页面) + 课程分析(占位) |
| 6 | `lib/schedule-conflicts.ts` (N) | 排课冲突检测引擎：时间重叠检测 + 工时超限检测 + 批量检测 |
| 7 | `app/components/attendance/SimpleScheduleManager.tsx` (M) | 加冲突检测按钮 + 冲突面板 UI |

| 旧文件 | 备注 |
|--------|------|
| `app/components/management/simple-course-management.tsx` | 保留（不再被引用），可后续清理 |
| `hooks/useCourses.ts` (旧) | 已替换 |

---

### 🟡 Phase 5e：体验升级（我决定，第五优先）

| # | 功能 | 为什么 |
|---|------|--------|
| 1 | **PageLayout → AppShell 统一** | 现在双 header，去掉 PageLayout 的 header |
| 2 | **暗色模式** | 一行 CSS + next-themes |
| 3 | **全局搜索 Cmd+K** | 找学生/教师/发票，一个框解决 |
| 4 | **空状态 + 骨架屏** | 列表无数据时显示引导 |

---

### 🔵 Phase 5f：安亲班专属（我决定，第六优先 🚧 进行中 2026-06-23）

| # | 功能 | 价值 | 状态 |
|---|------|------|:----:|
| 1 | 📓 **每日日志** `daily_logs` | 安亲班核心产品 | 🚧 教师端完成 |
| 2 | 📊 **成绩管理** `grades` | 对接现有 homework 系统 | ⏳ PB 已建 |
| 3 | 🚗 **接送管理** | 刚需 | ⏳ |
| 4 | 📸 **随手拍推家长** | 家长粘性 | ⏳ |

**5f-1 每日日志 — 已构建：**
- PB `daily_logs` collection（11字段：studentId/teacherId/date/homework_done/nap/meal/mood/behavior_note/photo/parent_viewed/centerId）
- API `/api/daily-logs`（GET/POST/PATCH）
- Hook `hooks/useDailyLogs.ts`（useDailyLogs + useStudentDailyLogs）
- 教师端页面 `/daily-logs`（按日期筛选 + 功课/午睡/用餐/心情快速切换 + 待记录学生一键创建 + 备注编辑）
- 家长端页面 `/parent/dailylogs`（按日期分组查看 + 功课/午睡/用餐/心情彩色卡片 + 备注展开 + 统计条）
- 侧边栏：Admin 学生管理 / Teacher 导航 / Parent 导航均已加入

**5f-2 成绩管理 — PB 已建：**
- PB `grades` collection（8字段：studentId/subject/term/year/score/grade_letter/teacher_comment/teacherId）

---

## 八、给 AI Agent 的构建规范（必读）

> 这一段是写给任何接手这个项目的 AI agent 的。照着做，别自己瞎发挥。

### 技术栈

| 层 | 技术 |
|----|------|
| 前端框架 | Next.js 15 (App Router) |
| UI 库 | shadcn/ui + Tailwind CSS 3 |
| 图标 | lucide-react |
| 状态管理 | React hooks + URL params |
| 数据请求 | @tanstack/react-query 通过 /api/pocketbase-proxy |
| 数据库 | PocketBase (SQLite, REST API) |
| 数据库地址 | `http://localhost:8090` |
| 前端 proxy | `/api/pocketbase-proxy/api/collections/...` |
| 通知 | sonner (toast) |
| 图表 | recharts |
| PDF | jspdf + jspdf-autotable |

### 文件组织规则

```
components/       ← 所有可复用组件放这
  layouts/         ← AppShell, PageLayout, DashboardLayout
  ui/              ← shadcn/ui 原生组件（不要改）
  students/        ← 学生相关组件（新建）
  finance/         ← 财务组件
  shared/          ← PermissionGate, ErrorBoundary

app/              ← 页面路由（仅 page.tsx + layout.tsx）
  page.tsx         ← 首页 - 只做路由，不写逻辑
  student-management/page.tsx  ← 薄薄一层，import components
  components/      ← ⚠️ 这里的东西要迁移到 /components/

hooks/            ← 所有数据请求逻辑
  useStudents.ts   ← 学生 CRUD
  useTeachers.ts   ← 教师 CRUD
  useInvoices.ts   ← 发票 CRUD
  ...

lib/              ← 工具函数
  pb.ts            ← PocketBase client 初始化
  utils.ts         ← 通用工具
```

### 页面开发模式

```tsx
// ✅ 正确：page.tsx 只做路由，thin wrapper
"use client"
import PageLayout from "@/components/layouts/PageLayout"
import StudentTable from "@/components/students/StudentTable"

export default function StudentManagementPage() {
  return (
    <PageLayout title="学生管理" description="管理所有学生档案">
      <StudentTable />
    </PageLayout>
  )
}
```

```tsx
// ❌ 错误：page.tsx 写 500 行业务逻辑
```

### 数据请求模式

```tsx
// ✅ 正确：用 hooks + react-query
import { useStudents } from "@/hooks/useStudents"

function StudentTable() {
  const { data: students, isLoading } = useStudents()
  if (isLoading) return <Skeleton />
  return <Table data={students} />
}
```

```tsx
// ❌ 错误：直接在组件里 fetch
useEffect(() => {
  fetch("/api/...").then(...)
}, [])
```

### PocketBase 数据操作

```tsx
// 查询所有学生
const students = await pb.collection("students").getList(1, 50, {
  filter: `centerId = "${centerId}"`,
  expand: "centerId",  // 展开关联字段
  sort: "-created",
})

// 创建记录
await pb.collection("students").create({
  name: "小明",
  grade: "Standard 1",
  centerId: "xxx",
})

// 更新记录
await pb.collection("students").update(id, { status: "graduated" })

// 删除记录
await pb.collection("students").delete(id)
```

### PB records 返回格式

```tsx
// pb.collection().getList() 返回:
{
  items: [
    {
      id: "abc123",
      name: "小明",
      grade: "Standard 1",
      centerId: "xyz789",          // relation 只返回 ID
      expand: {                     // 展开后才有完整数据
        centerId: { id: "xyz789", name: "BATU14", code: "BATU14" }
      }
    }
  ],
  page: 1,
  perPage: 50,
  totalItems: 158,
  totalPages: 4,
}
```

### 手机端适配规则

```tsx
// 表格在手机上变卡片
<div className="hidden md:block">
  <Table />  {/* 桌面端表格 */}
</div>
<div className="block md:hidden">
  <CardView />  {/* 手机端卡片 */}
</div>
```

### 状态颜色规则（亲民风格）

```
绿色 (emerald-500) = 正常/已付款/已完成/出席
黄色 (amber-500)  = 待处理/部分付款/迟到
红色 (red-500)    = 逾期/未付款/缺席/退学
蓝色 (indigo-500) = 激活/在线/主操作按钮
```

### 按钮文案规则

```
✅ 好: "保存"  "添加学生"  "导出报表"  "查看详情"
❌ 差: "Submit"  "OK"  "Click here"  "Execute"
```

### 分步构建检查清单

每完成一个文件 → 跑 `npm run build` → 确保 0 error 再继续下一个。

---

## 九、设计系统（保持你的亲民风格）

> 你的要求：**简易风格亲民，让用户能一下看懂且使用**

当前系统已经做得很不错了。以下是强化建议：

| 原则 | 怎么做 |
|------|--------|
| 🎯 **一眼懂** | 每个页面顶部一个大标题 + 一句话说明这页干嘛的 |
| 👆 **大按钮** | 移动端按钮最小 44×44px（Apple HIG），现在有些太小 |
| 📋 **卡片优于表格** | 表格信息密度太高，手机上看要横滑。手机端优先卡片视图 |
| 🚦 **颜色即状态** | 已交费=绿、未交=红、待批改=黄，不需要读字就能懂 |
| 🔍 **搜索救一切** | 列表页面默认显示搜索框，而不是 158 行表格 |
| ✋ **不怕空** | 空列表加一句引导语 + 一个大大的 `+` 按钮 |

### 导航简化建议

现在 Admin 侧边栏有 **6 个分组**，层级深了。建议：

```
现在：                      建议：
📊 仪表板                   📊 首页
👨‍🎓 学生管理                 👨‍🎓 学生（含家长）
  ├ 学生列表                 👨‍🏫 教师
  ├ 家长管理                 💰 财务
  ├ 成绩单                   📅 考勤
  ├ 作业管理                 📚 课程
👨‍🏫 教师管理                 📦 库存
  ├ 教师列表                 ⚙️ 设置
  ├ 教师排班
💰 财务管理                  ← 直接在首页 Dashboard 放快捷卡片
  ├ 财务概览                  （学费收入/本月出勤/待批作业/逾期账单）
  ├ 收费管理
  ├ ...（8项）
📚 课程管理
📝 考勤系统
⚙️ 系统设置
```

→ **减少一层嵌套**，财务/考勤/课程全部提到一级，6个分组变7个一级菜单。用户最多点2次就到目标页。

---

## 十、一句话总结（更新）

```
🏫 PJPC ERP — 安亲班全业务操作系统

✅ 已有（强大）：
   数据管理 · 财务系统 · 考勤打卡 · 排课 · NFC · 作业 · 库存 · 家长门户

🔴 急缺（安亲班灵魂）：
   每日日志 · 成绩管理 · 接送管理 · 随手拍推家长

🎨 风格：简易亲民 · 一眼看懂 · 大按钮大卡片 · 手机优先
``` |

---

## 十一、设计系统（旧版·待整合）

### 导航

```
桌面端: 左侧深色侧边栏（可收起）← 当前页面高亮
手机端: 底部 5 Tab + 侧边滑出
分组: 管理 | 财务 | 考勤 | 更多 | 系统
```

### 品牌色

| 颜色 | 值 | 用在哪 |
|------|-----|--------|
| `indigo-600` | `#4F46E5` | 主色 — 按钮/链接/激活 |
| `slate-900` | `#0F172A` | 辅色 — 导航/标题 |
| `amber-500` | `#F59E0B` | 强调 — 徽章/提醒 |
| `emerald-500` | `#10B981` | 成功/在线 |
| `red-500` | `#EF4444` | 错误/删除 |

### 组件栈

shadcn/ui + Tailwind CSS + sonner (toast) + lucide-react (图标)

---

## 十二、数据模型规范（旧版·待整合）

### 12.1 字段命名标准

| 标准字段 | 禁止使用 | 说明 |
|---------|---------|------|
| `name` | `student_name` | 学生姓名 |
| `grade` | `standard` | 年级/班级 |
| `father_phone` | — | 父亲电话 |
| `mother_phone` | — | 母亲电话 |
| `emergencyPhone` | — | 紧急联系人 |
| `totalAmount` | `amount` | 金额（payment 中用） |
| `status` | — | 状态码 |

### 12.2 中心自动规则

| 年级范围 | 所属中心 |
|----------|---------|
| Standard 1-6 | BATU14 |
| Form 1-5 / Peralihan | PU1 |

### 12.3 PocketBase 集合字段映射

实际数据库字段一览（2026-06-18 实测）：

**students**
| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | text | 学生姓名 |
| `grade` | text | 年级 |
| `center` | text | 所属中心 |
| `school` | text | 学校 |
| `status` | text | active / graduated |
| `parentPhone` / `fatherPhone` / `motherPhone` | text | 家长电话 |

**fee_items**
| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | text (required) | 费用名称 |
| `amount` | number (required) | 金额 |
| `category` | text | 分类（Tuition/Administrative/Materials） |
| `frequency` | text | monthly / one-time / annual |
| `status` | text | active / inactive |

**invoices**
| 字段 | 类型 | 说明 |
|------|------|------|
| `studentId` / `studentName` / `studentGrade` | text | 学生信息 |
| `invoiceNumber` | text (required) | 发票号 |
| `totalAmount` | number (required) | 总金额 |
| `status` | text | issued / paid / partially_paid / overdue |
| `items` | json | 费用项目数组 |

**expenses** `[已修复: 2026-06-18 新建]`
| 字段 | 类型 |
|------|------|
| `date` (required) | date |
| `category` (required) | text |
| `description` (required) | text |
| `amount` (required) | number |
| `method` | text |

**payments** `[已修复: 2026-06-18 新建]`
| 字段 | 类型 |
|------|------|
| `invoiceId` (required) | text |
| `amount` (required) | number |
| `date` (required) | date |
| `method` | text |
| `status` | text |

---

## 十三、技术债务

| 项目 | 优先级 | 说明 |
|------|--------|------|
| 按钮级权限注入（5-8 页面） | ✅ | PageGuard + PermissionGate 已就绪 |
| TypeScript 编译错误 | 🟡 | `FIX_LIST.md` 中记载，待清理 |
| 财务 mock 残留 | ✅ | `useFeesConfig.ts` 中 `USE_MOCK_FEES` 已为 `false` |
| 组件目录迁移 | 🔵 | `app/components/` → `components/`（Phase 5 #13） |
| README.md 过时 | ⚪ | 内容停留在旧版，需重写 |
| PB schema 手动导出 | ✅ | pre-commit 钩子已自动处理 |

---

## 十四、Git 分支策略

| 分支 | 用途 | 推送条件 |
|------|------|---------|
| `main` | 稳定生产版本 | **不得擅自推送** |
| `hermes` | 开发分支 | **不得擅自推送** |
| `hermes-agent` | 功能分支 | 修改后等待用户指示同步 |

---

## 十五、黄金工作流（Golden Workflow）

> 这个蓝图的本质：**每有一个想法/优化/调整 → 先更新蓝图 → 再执行 → 执行完更新蓝图进度**

```
💡 新想法
   ↓
📝 1. 写进蓝图（PJPC-ERP-BLUEPRINT.md）
         ↓
   🔧 2. 照着蓝图做
         ↓
   📦 3. 如果改了 PB Schema → 运行导出脚本更新 pb-schema.json
         ↓
   ✅ 4. 更新蓝图进度 + git commit（pre-commit 自动同步 schema）
         ↓
   🔄 重复
```

---


---

## 十六、🔍 2026-06-23 全面审计报告

> 由 deepseek-v4-pro 执行三线审计：代码质量 / 市场对标 / UI 对标
> 本章节详细到任何 AI agent 都能直接接手修复

---

### 16.1 📊 代码库快照

| 维度 | 数值 |
|------|------|
| 总源文件 | ~670 个 (不含 node_modules / .next / .git) |
| .ts/.tsx 总行数 | ~140,000 行 |
| 页面路由 | 52 条 |
| API 路由 | 40+ 条 |
| 数据 Hooks | 38 个 |
| PB Collections | 35 个 |
| 死代码总计 | **~13,500+ 行** |
| 重复文件 | 15+ 组 |
| 500+行巨型文件 | 35+ 个 |

---

### 16.2 🔴 死代码 & 重复文件 — 删除清单

#### 16.2.1 🔴 CRITICAL：`app/components/teacher/` — 7,261 行完全重复

**问题：** `app/components/teacher/` 下 13 个文件是 `components/teacher/` 的完全拷贝，diff=0。ZERO 文件 import `@/app/components/teacher/`，全部使用 `@/components/teacher/`。

| 文件 | 行数 | 差异 |
|------|------|------|
| `TeacherForm.tsx` | 762 | 0 diff |
| `TeacherLeaveManagement.tsx` | 744 | 0 diff |
| `TeacherPerformanceManagement.tsx` | 739 | 0 diff |
| `ClassSchedule.tsx` | 432 | 0 diff |
| `TeacherProfile.tsx` | 540 | 0 diff |
| `TeacherAnalytics.tsx` | ~400 | 0 diff |
| `TeacherBulkOperations.tsx` | ~400 | 0 diff |
| `TeacherDashboard.tsx` | ~300 | 0 diff |
| `TeacherDetails.tsx` | ~300 | 0 diff |
| `TeacherStats.tsx` | ~300 | 0 diff |
| `AdvancedTeacherFilters.tsx` | ~400 | 0 diff |
| `StudentProfileView.tsx` | ~200 | 0 diff |
| `TeacherSalaryManagement.tsx` | 1,179 vs 1,143 | 129 diff lines (near-duplicate) |

**修复：** `rm -rf app/components/teacher/` — 一次性删除 13 文件。

#### 16.2.2 🔴 CRITICAL：未使用的考勤组件 — 4,150 行

| 文件 | 行数 | 状态 |
|------|------|------|
| `app/components/attendance/TuitionCenterScheduleManagement.tsx` | 1,429 | ZERO imports |
| `app/components/attendance/TuitionScheduleManagement.tsx` | 959 | ZERO imports |
| `app/components/attendance/EnterpriseScheduleManagement.tsx` | 832 | ZERO imports |
| `app/components/attendance/UserFriendlySchedule.tsx` | 483 | ZERO imports |
| `app/components/attendance/BasicSchedule.tsx` | 447 | ZERO imports |

**修复：** 直接删除。这些是多次实验迭代的遗留物，从未上线。

#### 16.2.3 🟠 HIGH：未使用的 NFC/系统组件 — ~1,200 行

| 文件 | 行数 | 状态 |
|------|------|------|
| `app/components/systems/nfc-reader-manager.tsx` | ~200 | ZERO imports |
| `app/components/systems/keyboard-nfc-background-runner.tsx` | ~150 | ZERO imports |
| `app/components/systems/mobile-nfc-interface.tsx` | ~200 | ZERO imports |
| `app/components/systems/usb-reader-interface.tsx` | ~200 | ZERO imports |
| `app/components/systems/CardManagementTable.tsx` | ~350 | ZERO imports |

**修复：** 直接删除。

#### 16.2.4 🟠 HIGH：旧 Dashboard 文件 — 513 行

| 旧文件（不用） | 新文件（在用） |
|---|---|
| `admin-dashboard.tsx` | `modern-admin-dashboard.tsx` |
| `parent-dashboard.tsx` | `modern-parent-dashboard.tsx` |

**修复：** 删除旧文件，更新 barrel export。

#### 16.2.5 🟡 MEDIUM：未使用的学生/数据组件 — ~400 行

| 文件 |
|------|
| `app/components/student/PrintableEnrollmentForm.tsx` |
| `app/components/student/StudentGradeOverride.tsx` |
| `app/components/data-import/GoogleCSVImport.tsx` |

#### 16.2.6 🟡 MEDIUM：孤立页面 & 死配置

| 文件 | 行数 | 问题 |
|------|------|------|
| `app/static-page.tsx` | 176 | 登录页，零导航链接 |
| `app/teacher-attendance-reports/page.tsx` | 730 | 零导航链接，与 `/attendance-reports` 749行高度重复 |
| `hooks/useFeesConfig.ts` | 4 | 只有 `USE_MOCK_FEES = false` — 死配置 |

#### 16.2.7 🟢 LOW：根目录散落脚本

| 文件 | 建议 |
|------|------|
| `debug-report-data.js` | 移入 `scripts/` |
| `test-enterprise-date-ranges.js` | 移入 `scripts/` |
| `test-enterprise-ui-integration.js` | 移入 `scripts/` |
| `test-user-export.js` | 移入 `scripts/` |
| `final_import.py` | 移入 `scripts/` |
| `cert.key` | 移入 `certs/` 或删除 |

---

### 16.3 🔴 BUG — 需要立即修复

#### 16.3.1 🔴 破导出：`app/components/finance/reports-overview/index.ts`

```
第 3 行: export { default as FinanceManagementPage } from "./finance-management-page"
```

`finance-management-page.tsx` **不存在于 `reports-overview/` 目录**。如被 import 会 runtime 崩溃。目前恰好无人 import。

**修复：** 删除这行导出。

#### 16.3.2 🔴 断链 Admin 路由 — 4 条 404

`app/admin/layout.tsx` 链接到以下路由，但无对应 page 文件：

| 路由 | 状态 |
|------|------|
| `/admin/classes` | ❌ 404 |
| `/admin/settings` | ❌ 404 |
| `/admin/attendance` | ❌ 404 |
| `/admin/reports` | ❌ 404 |

`app/admin/page.tsx` 的 QuickAction 按钮也引用 `/admin/attendance` 和 `/admin/reports`。

**修复：** 创建对应页面或删除断链。

#### 16.3.3 🟡 Medium：生产环境 Mock 数据 Fallback

`hooks/useInvoices.ts` 含硬编码 `MOCK_INVOICES` 数组（50+行），PB 不可达时自动激活。生产环境可能给用户看假数据。

**修复：** 删除 mock fallback，或加 `NEXT_PUBLIC_MOCK_MODE` 环境变量门控。

---

### 16.4 🟠 BLOAT — 巨型文件清单（20 个最大文件）

| 文件 | 行数 | 问题 |
|------|------|------|
| `app/components/management/nfc-points-operation.tsx` | 1,441 | 单体巨兽 |
| `app/components/attendance/TuitionCenterScheduleManagement.tsx` | 1,429 | **且未使用！** |
| `app/components/student/StudentForm.tsx` | 1,220 | 需拆表单项 |
| `app/components/systems/IntegratedCardManager.tsx` | 1,184 | 单体 |
| `app/components/teacher/TeacherSalaryManagement.tsx` | 1,179 / 1,143 | **且重复！** |
| `app/points-management/page.tsx` | 1,080 | 页面太大 |
| `app/components/attendance/UnifiedAttendanceSystem.tsx` | 1,077 | 需拆分 |
| `app/components/attendance/TeacherAttendanceSystem.tsx` | 1,074 | 需拆分 |
| `app/components/finance/invoice-management/InvoiceManagement.tsx` | 1,072 | 需拆分 |
| `app/components/systems/UnifiedCardManager.tsx` | 1,016 | 单体 |
| `lib/usb-nfc-reader.ts` | 1,004 | 库文件太大 |
| `app/api/reports/attendance/route.ts` | 999 | API 太大 |
| `app/components/management/admin/enterprise-user-approval.tsx` | 989 | |
| `app/components/management/student-management-page.tsx` | 971 | **已知问题，Phase 5a 已拆分** |
| `app/settings/page.tsx` | 963 | |
| `app/components/attendance/TuitionScheduleManagement.tsx` | 959 | **且未使用！** |
| `app/components/management/admin/unified-user-approval.tsx` | 930 | |
| `app/components/attendance/StudentAttendanceSystem.tsx` | 857 | |
| `lib/pocketbase-students.ts` | 853 | |
| `app/components/attendance/EnterpriseScheduleManagement.tsx` | 832 | **且未使用！** |

总计 35+ 文件超 500 行。优先清理「既大又未使用」的文件。

---

### 16.5 🟡 架构不一致

#### 16.5.1 双组件目录模式

代码库同时使用两个组件目录：

```
components/          ← 通过 @/components/ 引用
app/components/      ← 通过 @/app/components/ 引用
```

teacher 组件两处都有、finance 组件有双层（顶层级 + 子目录级）、import 模式混乱。

**建议：** 统一迁移至 `components/`，`app/components/` 仅保留真正的 page-level 组件。

#### 16.5.2 多人命名的 Dashboard

`admin-dashboard.tsx` vs `modern-admin-dashboard.tsx`，`parent-dashboard.tsx` vs `modern-parent-dashboard.tsx`。去掉 `modern-` 前缀，只保留一个版本。

#### 16.5.3 六个排课实现并存

`SimpleScheduleManager`、`BasicSchedule`、`EnterpriseScheduleManagement`、`TuitionScheduleManagement`、`TuitionCenterScheduleManagement`、`UserFriendlySchedule`、`SmartSchedulePanel` — 多个未使用。

**建议：** 保留 `SimpleScheduleManager`（实际在用），删除其余。

#### 16.5.4 两个 PDF 工具库

`lib/pdf-generator.ts` 和 `lib/pdf-export.ts` 都处理 PDF，但导出不同函数。合并或明确职责划分。

#### 16.5.5 三个 NFC 库

`lib/nfc-rfid.ts`、`lib/nfc-scanner.ts`、`lib/usb-nfc-reader.ts`，合计 ~33K 行。

**建议：** 统一为一个 `lib/nfc.ts`。

---

### 16.6 📈 市场对标：教育 ERP 差距分析

> 对标系统：ClassDojo / PowerSchool / Classe365 / Teach 'n Go / TutorBird / Fedena / Gibbon

#### 16.6.1 功能覆盖对比表

| 功能领域 | 市场标准 | PJPC 现状 | 差距等级 |
|---------|---------|-----------|:--------:|
| **沟通中枢** | 双向消息、公告+已读回执、群发通知 | ⚠️ 有公告但无已读回执、无双向 | 🟠 |
| **招生管道** | 咨询→试课→报名→分班全流程 | ❌ 无 | 🟡 |
| **每日日志** | 老师记录→家长实时查看→回复互动 | 🚧 教师端+家长端刚完成 | 🟡 |
| **成绩管理** | 科目/学期录入+成绩分析+趋势图+Report Card | ⏳ PB 已建，前端未做 | 🔴 |
| **接送管理** | 指定接送人+时间+车牌+家长确认 | ❌ 无 | 🔴 |
| **随手拍/时光轴** | 老师拍照+说明→推送家长→家长点赞评论 | ❌ 无 | 🟠 |
| **行为追踪** | 积分/奖惩 → 家长可视化仪表板 | ⚠️ 积分系统有，但家长可视化缺失 | 🟡 |
| **健康记录** | 过敏/用药/病史/紧急联系人 | ⚠️ 紧急联系人字段有，但无结构化健康记录 | 🟡 |
| **自动通知** | WhatsApp/Email 自动推送（缴费提醒/出勤异常/每日总结） | ⚠️ WhatsApp 基础提醒有，但未系统化 | 🟠 |
| **家长自助** | Portal 查成绩/缴费/出勤/日志 → 在线缴费 | 🟩 门户 5 页完成 | ✅ |
| **财务全链路** | 费用→发票→支付→收据→报表→E-Invoice | 🟩 完成度 90% | ✅ |
| **薪资自动化** | KB/KWSP/EPF/SOCSO/EIS 自动+银行文件导出 | 🟩 完成 | ✅ |
| **库存管理** | 进销存+低库存预警 | 🟩 Phase 4d 完成 | ✅ |
| **排课冲突检测** | 时间重叠+教师工时超限+教室冲突 | 🟩 Phase 5d 完成 | ✅ |
| **多语言** | CN/MY/EN UI 切换 | ❌ 仅中文 | 🟢 |
| **数字签名** | 家长线上签署报告/许可单 | ❌ 无 | 🟢 |
| **日历同步** | Google Calendar / iCal 双向同步 | ❌ 无 | 🟢 |
| **API / Webhook** | 第三方集成接口 | ⚠️ PB 自带 REST API | 🟢 |
| **试课管理** | 潜在学生→试课→转化跟踪 | ❌ 无 | 🟡 |
| **候补名单** | 满班自动候补 | ❌ 无 | 🟡 |

#### 16.6.2 差距优先级排序

| 优先级 | 功能 | 为什么 |
|:------:|------|--------|
| 🔴 | **成绩管理** (5f-2) | PB 已建，前端缺口，家长门户空等 |
| 🔴 | **接送管理** (5f-3) | 每间安亲班刚需，家长最关心安全 |
| 🟠 | **随手拍** (5f-4) | 高粘性功能，增强家长信任 |
| 🟠 | **自动通知系统化** | 缴费提醒/出勤异常/每日总结 WhatsApp |
| 🟠 | **沟通中枢** | 公告已读回执 + 家长回复 |
| 🟡 | **健康记录** | 过敏信息对安亲班至关重要 |
| 🟡 | **招生管道** | 业务增长需要，非紧急 |
| 🟢 | **多语言/日历/API** | 锦上添花，非当前刚需 |

---

### 16.7 🎨 UI 对标：现代 SaaS 审美分析

> 对标系统：Stripe Dashboard / Linear / Vercel / Notion / Shopify Admin

#### 16.7.1 设计模式对比

| 设计维度 | 市场最佳实践 | PJPC 现状 | 差距 |
|---------|------------|-----------|:--:|
| **配色方案** | 单一主色+灰度系统 (slate/neutral) | ✅ slate 为主，indigo 点缀 | 接近 |
| **侧边栏** | 深色固定侧边栏+可折叠分组 | ✅ AppShell 统一侧边栏 | 接近 |
| **信息密度** | 高密度但层次分明，减少纵滚 | ⚠️ 部分页面太松，卡片间距过大 | 🟡 |
| **空状态** | 插图+引导文案+C TA按钮 | ✅ Phase 5e 已做 empty-state | ✅ |
| **加载态** | Skeleton 骨架屏，逐行逐卡片 | ✅ Phase 5e 已做 skeleton | ✅ |
| **数据表格** | 悬停显示操作按钮+整行可点+排序筛选 | ⚠️ 部分表格有悬停操作，但未统一 | 🟡 |
| **Toast 通知** | 操作后即时反馈，位置统一 | ✅ sonner 全局 Toaster | ✅ |
| **命令面板** | Cmd+K 全局搜索+快捷导航 | ✅ Phase 5e 已做 global-search | ✅ |
| **响应式** | 表格→卡片、导航→底部Tab | ⚠️ 部分页面已做，未全覆盖 | 🟡 |
| **图表颜色** | 统一的品牌色系，不花哨 | ⚠️ Recharts 默认色，未调色 | 🟡 |
| **细节质感** | 微妙的边框、hover 过渡、圆角统一 | ⚠️ 边框/圆角不一致 | 🟡 |

#### 16.7.2 具体改进建议

| # | 改进项 | 怎么做 | 参考 |
|---|--------|--------|------|
| 1 | **统一圆角** | 全部卡片/按钮/输入框 `rounded-xl` (12px) | Stripe 风格 |
| 2 | **统一阴影** | 卡片 `shadow-sm border border-slate-100`，hover `shadow-md` | Linear 风格 |
| 3 | **操作按钮可见性** | 表格行 `group` + 操作按钮 `opacity-0 group-hover:opacity-100` | Linear |
| 4 | **图表色板** | 统一 6色彩板：indigo/emerald/amber/rose/cyan/violet | Stripe |
| 5 | **统计卡片图标** | icon 用饱和色 + bg 用浅色（如 `text-indigo-600 bg-indigo-50`）| Shopify |
| 6 | **侧边栏激活态** | 当前页用 `bg-indigo-600/10 text-indigo-600` + 左侧小圆点 | Vercel |
| 7 | **模块间距** | 章节间 `space-y-6`，卡片内 `p-5`，去掉过大留白 | Stripe |
| 8 | **过渡动画** | 按钮/卡片/导航加 `transition-all duration-200` | 全站统一 |
| 9 | **字体层级** | 页面标题 `text-2xl font-bold`，章节标题 `text-lg font-semibold`，正文 `text-sm` | Notion |
| 10 | **移动端表格** | 全局统一用 `overflow-x-auto -mx-3 sm:mx-0` 横向滚动 | 现代 SaaS 常规做法 |

#### 16.7.3 UI 改进优先级

| 优先 | 改进项 | 影响范围 |
|:----:|------|---------|
| 🔴 | 统一圆角+阴影 | 全局组件 |
| 🔴 | 图表色板统一 | 财务/统计页面 |
| 🟠 | 表格操作按钮 hover 可见 | 全部表格页面 |
| 🟠 | 统计卡片图标规范 | 全部 Dashboard |
| 🟡 | 过渡动画统一 | 全局 |
| 🟡 | 侧边栏激活态优化 | AppShell |

---

### 16.8 📋 优先修复路线图

按影响程度和实现成本排序，每次一个批次的修复：

#### 批次 1：删死代码（一次性清理，零风险）

```
1. rm -rf app/components/teacher/                          # 7,261 行
2. rm app/components/attendance/TuitionCenterScheduleManagement.tsx  # 1,429 行
3. rm app/components/attendance/TuitionScheduleManagement.tsx        # 959 行
4. rm app/components/attendance/EnterpriseScheduleManagement.tsx     # 832 行
5. rm app/components/attendance/UserFriendlySchedule.tsx             # 483 行
6. rm app/components/attendance/BasicSchedule.tsx                    # 447 行
7. rm app/components/systems/nfc-reader-manager.tsx                  # 200 行
8. rm app/components/systems/keyboard-nfc-background-runner.tsx      # 150 行
9. rm app/components/systems/mobile-nfc-interface.tsx                # 200 行
10. rm app/components/systems/usb-reader-interface.tsx               # 200 行
11. rm app/components/systems/CardManagementTable.tsx                # 350 行
12. rmdashboards/admin-dashboard.tsx                                 # ~300 行
13. rmdashboards/parent-dashboard.tsx                                # ~213 行
14. rm app/static-page.tsx                                           # 176 行
```

**清理后：** 删除 ~13,000 行死代码，文件树干净 20+ 文件。

#### 批次 2：修 Bug（4 个关键修复）

```
1. 修复 app/components/finance/reports-overview/index.ts 破导出
2. 创建 /admin/classes, /admin/settings, /admin/attendance, /admin/reports 页面（或删除断链）
3. 删除 useInvoices.ts 中的 mock fallback
4. 删除 useFeesConfig.ts（死配置）
```

#### 批次 3：市场对标 Phase 5f 续建

```
1. 成绩管理 (5f-2) — PB已建，前端：录入/分析/家长查看
2. 接送管理 (5f-3) — PB新建+教师端+家长端
3. 随手拍 (5f-4) — PB新建+教师拍照+家长Feed
```

#### 批次 4：UI 美化

```
1. 全局统一 rounded-xl + shadow-sm + border-slate-100
2. 图表 6 色色板
3. 表格操作按钮 hover 可见
4. 侧边栏激活态圆点指示器
```

#### 批次 5：架构重构（低优先级）

```
1. app/components/teacher/ → 已删（批次1）
2. 财务双层级合并
3. 排课多实现合并
4. PDF 工具合并
5. NFC 三库统一
```

---

*审计完成时间：2026-06-23 | 审计者：deepseek-v4-pro | 下一步：执行批次 1 清理*

---

## 十七、NFC 考勤 + 积分系统 — 专项审计 (2026-06-23)

> 用户确认：已有 Synorex 卡 ID，需要 NFC 联动考勤和积分。学生积分系统尚未实现。

### 17.1 当前 NFC/积分 代码 vs 数据库 对照

| 层 | 文件数 | 行数 | 状态 |
|----|:----:|------|------|
| **前端页面** | `app/points-management/page.tsx` | 1,080 | ✅ 存在 |
| **积分操作组件** | `app/components/management/nfc-points-operation.tsx` | 1,441 | ✅ 存在 |
| **积分展示组件** | `app/components/management/points-management.tsx` | — | ✅ 存在 |
| **NFC 考勤** | `app/components/systems/nfc-attendance-system.tsx` | — | ✅ 存在 |
| **NFC 后台** | `app/components/systems/nfc-background-runner.tsx` | — | ✅ 存在 |
| **NFC 库** | `lib/nfc-rfid.ts` + `lib/nfc-scanner.ts` + `lib/usb-nfc-reader.ts` | ~33K | ✅ 存在 |
| **PB `nfc_cards`** | ❌ | 0 | **不存在！** |
| **PB `points`** | ❌ | 0 | **不存在！** |
| **PB `points_transactions`** | ❌ | 0 | **不存在！** |

**结论：前端写了一堆，后端表全空。整个 NFC/积分系统是空壳。**

### 17.2 目标架构

```
┌──────────────────────────────────────────────────────────┐
│                   NFC 卡片生命周期                         │
│                                                          │
│  Synorex 卡 ID ──→ PB nfc_cards ──→ 绑定学生              │
│       │                    │              │               │
│       │              ┌─────┴──────┐       │               │
│       ▼              ▼            ▼       ▼               │
│  ┌─────────┐   ┌──────────┐ ┌──────────┐                 │
│  │ 考勤打卡 │   │ 积分加减  │ │ 身份识别  │                │
│  │attendance│   │points    │ │TV看板等  │                │
│  └────┬────┘   └────┬─────┘ └──────────┘                 │
│       │              │                                    │
│       ▼              ▼                                    │
│  attendance     points_transactions                       │
│  表已有         表不存在 ← 🔴                              │
└──────────────────────────────────────────────────────────┘
```

### 17.3 需要创建的 PB Collections

#### `nfc_cards`

| 字段 | 类型 | 说明 |
|------|------|------|
| `card_uid` | text (required, unique) | Synorex 卡物理 UID |
| `studentId` | relation→students | 绑定学生（可选，未绑定=空白卡） |
| `status` | select | active / inactive / lost |
| `type` | select | student / teacher / admin |
| `issued_date` | date | 发卡日期 |
| `notes` | text | 备注 |

#### `points`

| 字段 | 类型 | 说明 |
|------|------|------|
| `studentId` | relation→students | 学生 |
| `total_points` | number (default: 0) | 当前总积分 |
| `weekly_points` | number (default: 0) | 本周积分（定时清零） |
| `monthly_points` | number (default: 0) | 本月积分 |

#### `points_transactions`

| 字段 | 类型 | 说明 |
|------|------|------|
| `studentId` | relation→students | 学生 |
| `points` | number | +加分 / -扣分 |
| `reason` | text | 原因（作业完成好/帮助同学/迟到...） |
| `category` | select | academic / behavior / attendance / other |
| `operatorId` | relation→teachers | 操作老师 |
| `nfc_card_uid` | text | 如果是 NFC 操作，记录卡 UID |
| `date` | date | 日期 |

### 17.4 需要实现的功能

| # | 功能 | 流程 | 优先级 |
|---|------|------|:----:|
| 1 | **NFC 发卡/绑卡** | Synorex 读卡器 → 输入 card_uid → 绑定学生 | 🔴 |
| 2 | **NFC 考勤打卡** | 刷卡 → 查 nfc_cards → 获取 studentId → 记录 attendance | 🔴 |
| 3 | **积分加减** | 教师端：选学生+选原因+分数 → points_transactions + 更新 points.total | 🔴 |
| 4 | **NFC 积分联动** | 刷卡 → 弹出积分操作界面 → 快速加减 | 🟠 |
| 5 | **积分排行榜** | 按周/月/总分排名 | 🟠 |
| 6 | **积分兑换** | 学生用积分换礼品 → 扣分 + 记录 | 🟡 |
| 7 | **家长查看积分** | 家长门户看孩子本周被赞/扣分情况 | 🟡 |

### 17.5 对比现有代码需要改造的部分

| 现有文件 | 问题 | 改造 |
|---------|------|------|
| `app/points-management/page.tsx` (1,080行) | 数据层不存在 | 接 PB API |
| `nfc-points-operation.tsx` (1,441行) | 操作无后端 | 接 points_transactions CRUD |
| `nfc-attendance-system.tsx` | 卡查询无后端 | 接 nfc_cards collection |
| `lib/nfc-*.ts` (3个文件) | 读卡器驱动 | 保留，加 card_uid → PB 查询逻辑 |

---

*NFC/积分审计时间：2026-06-23 | 下一步：创建 PB collections → 接真实数据*
