# PJPC 安亲班管理系统 — 战略蓝图

> 最后更新：2026-06-19
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
│ 👨‍🎓 学生管理       │  │                        │
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

## 三、现在做到哪了？（2026-06-16 快照）

### 📊 整体进度

```
核心运营 ━ 🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩  已完成
财务管理 ━ 🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩  100%
系统基建 ━ 🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩  95%  (分院管理+侧边栏调整完成)
家长端   ━ ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜  0%
进销存   ━ ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜  0%
企业级   ━ ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜  0%
```

### 页面路由 (29 条)

| 页面 | 状态 | 说明 |
|------|------|------|
| `/` 首页 Dashboard | ✅ | 管理员控制台 + 分行Tab过滤 + 快捷入口 |
| `/login` | ✅ | 登录页 |
| `/student-management` | ✅ | 158 学生，CRUD + 导入导出 + 网格/表格/分析视图 |
| `/teacher-management` | ✅ | 28 教师，CRUD + 详情 + 薪资关联 |
| `/course-management` | ✅ | 课程 CRUD |
| `/unified-attendance` | ✅ | NFC 考勤 + 仪表板 + 打卡记录 + 卡片管理 |
| `/schedule-management` | ✅ | 排课 + 冲突检测 |
| `/attendance-reports` | ✅ | 考勤报表 |
| `/teacher-attendance-reports` | ✅ | 教师考勤报表 |
| `/center-management` | ✅ | 分院/中心管理（位于系统设置→分院管理） |
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

## 六、还有什么没做？（按真实优先级）

### 🔴 P0 — 必须尽快做

| # | 功能 | 为什么重要 | 状态 |
|---|------|-----------|------|
| 1 | 按钮级权限控制 | 现在老师能看到"删除学生"按钮，只是路由挡了。UI 层面也要遮 | ✅ 已完成 |
| 2 | **分院/中心管理** | PU1 / BATU14 两个中心独立运营，学生必须归属正确分院。含Dashboard分行Tab过滤 | ✅ **已完成 2026-06-19** |
| 3 | 作业 Homework 模块 | Synorex 有，家长会拿来对比。安亲班核心服务 | 🔴 **进行中** |
| 4 | 成绩单 Report Card PDF | 家长期末要的东西，直接影响口碑 | ✅ 已完成 |

#### Homework 模块规划

**两个核心 Collection：**

| Collection | 字段 | 说明 |
|-----------|------|------|
| `homework` | title, description, subject, grade, centerId(rel), teacherId(rel), assignedDate, dueDate, attachments(file), status | 作业布置 |
| `homework_submissions` | homeworkId(rel), studentId(rel), content, attachments(file), status(pending/submitted/graded), score(number), feedback, gradedBy(rel), submittedDate, gradedDate | 学生提交 + 批改 |

**页面路由：**

| 页面 | 说明 |
|------|------|
| `/homework` | 作业总览：按中心/年级/科目筛选，列表视图 |
| `/homework/new` | 布置新作业 |
| `/homework/[id]` | 作业详情 + 提交列表 + 批改 |
| `/homework/[id]/grade` | 批量批改视图 |

**侧边栏位置：** 放在「学生管理」下面，作为子项

**教师工作台联动：** 老师登录后在 teacher-workspace 看到待批改作业数

**家长端联动：**（P2 家长门户时做）|

### 🟡 P1 — 重要但不急

| # | 功能 | 说明 |
|---|------|------|
| 4 | 家长独立管理 | 目前家长信息嵌在学生字段里，应该独立出来 |
| 5 | 教师资料完善 | 薪资/考勤/排课都需要完整的教师资料 |
| 6 | 日历排课视图 | 现在只有表格，缺可视化日历 |
| 7 | E-Invoice | LHDN 合规要求 |
| 8 | WhatsApp 催款 | 逾期自动通知家长 |

### 🔵 P2 — 锦上添花

| # | 功能 | 说明 |
|---|------|------|
| 9 | 家长门户 | 家长登录查看孩子进度/缴费/成绩 |
| 10 | 库存管理 | 教材/文具进销存 |
| 11 | 批量开票 | 一次开全班发票 |
| 12 | 设置中心整合 | EPF/银行/支付方式/科目统一管理 |

### ⚪ P3 — 远期规划

| # | 功能 | 说明 |
|---|------|------|
| 13 | AI 助手 | 自动生成报告、数据分析 |
| 14 | 审计日志 | 操作追踪 |
| 15 | 国际化 | 中/英/马来三语 |
| 16 | E2E 测试 | 自动化测试覆盖 |

---

## 七、设计系统

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

## 八、数据模型规范

### 8.1 字段命名标准

| 标准字段 | 禁止使用 | 说明 |
|---------|---------|------|
| `name` | `student_name` | 学生姓名 |
| `grade` | `standard` | 年级/班级 |
| `father_phone` | — | 父亲电话 |
| `mother_phone` | — | 母亲电话 |
| `emergencyPhone` | — | 紧急联系人 |
| `totalAmount` | `amount` | 金额（payment 中用） |
| `status` | — | 状态码 |

### 8.2 中心自动规则

| 年级范围 | 所属中心 |
|----------|---------|
| Standard 1-6 | BATU14 |
| Form 1-5 / Peralihan | PU1 |

### 8.3 PocketBase 集合字段映射

实际数据库字段一览（2026-06-18 实测）：

**students**
| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | text | 学生姓名（前端用 `student_name \|\| name`） |
| `grade` | text | 年级（前端用 `standard \|\| grade`） |
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

⚠️ 注意：前端 `FinancialReports.tsx` 曾用 `amountPaid`（不存在），现已统一修复为 `amount`。
⚠️ `useFinancialStats.ts` 曾因 `safeInvoicesList` 变量提升导致 ReferenceError，已修复。

---

## 九、技术债务

| 项目 | 优先级 | 说明 |
|------|--------|------|
| 按钮级权限注入（5-8 页面） | 🔴 | PageGuard 已就绪，缺按钮级 |
| TypeScript 编译错误 | 🟡 | ~10 个错误在 `FIX_LIST.md` 中 |
| 财务 mock 残留 | 🟡 | `useFeesConfig.ts` 中 `USE_MOCK_FEES` 仍为 `true` |
| 组件目录迁移 | ⚪ | `app/components/` → `components/` |
| README.md 过时 | ⚪ | 内容停留在 97 学生时代 |

---

## 十、Git 分支策略

| 分支 | 用途 | 推送条件 |
|------|------|---------|
| `main` | 稳定生产版本 | **不得擅自推送** — 必须等用户明确说「push」/「推」|
| `hermes` | 开发分支 | **不得擅自推送** — 必须等用户明确说「push」/「推」|
| `hermes-agent` | 功能分支 | 修改后等待用户指示同步|

---

## 十一、黄金工作流（Golden Workflow）

> 这个蓝图的本质：**每有一个想法/优化/调整 → 先更新蓝图 → 再执行 → 执行完更新蓝图进度**

这是防止偏离方向的唯一方法。蓝图是 Single Source of Truth，必须走在代码前面。

```
💡 新想法
   ↓
📝 1. 写进蓝图（PJPC-ERP-BLUEPRINT.md）
         ↓
   🔧 2. 照着蓝图做
         ↓
   ✅ 3. 更新蓝图进度
         ↓
   🔄 重复
```

---

## 十二、一句话总结

```

我们正在 build 的是一个：
🏫 安亲班全业务操作系统
├── 覆盖学生完整生命周期（入学→日常→毕业）
├── 覆盖钱的全链路（设置→收费→支出→出粮）
├── 跨中心运营（PU1 / BATU14 自动分流）
├── 集成物理设备（NFC 打卡器、TV 看板）
├── 面向多角色（Admin / 老师 / 财务 / 家长）
├── 统一侧边栏导航（Phase 2 完成，分院管理已整合至系统设置）
└── 目标是超越 Synorex 的企业级解决方案

```

---

*本蓝图是活文档，随系统演进持续更新。*
