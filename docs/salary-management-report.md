# PJPC 薪资管理模块调查报告

> 调查日期：2026-07-15
> 覆盖文件：`/home/pjpc/pjpc-app-html`

---

## 一、标签结构（Tab Structure）

### 页面入口
- **路由**：`/finance/payroll` → 组件 `components/teacher/TeacherSalaryManagement.tsx`（1397行）
- 入口来自 `AppShell.tsx` 左侧栏、`teacher-management.tsx` 教师列表的"薪资"按钮、以及全局搜索弹窗

### 三个标签页

| Tab ID | 中文名 | 功能 | 数据源 |
|--------|--------|------|--------|
| `structures` | **薪资结构** | 定义每位教师的薪酬模板：基本薪资、津贴、薪资类型（月薪/时薪/佣金），隐含 EPF/SOCSO/EIS 比率 | `teacher_salary_structures` 集合 |
| `records` | **薪资记录** | 每月实际发放记录：基本薪资、津贴、加班费、总薪资、净薪资、扣款明细、状态（草稿/已批准/已支付） | `teacher_salary_records` 集合 |
| `automation` | **自动化** | 自动生成月度薪资、绩效调薪、自动化频率设置 | 调用 API `/api/salary/auto-generate` 和 `/api/salary/performance-adjustment` |

### 薪资结构 vs 薪资记录 的本质区别

- **薪资结构**（Structure）：是 **"合同"级别** 的配置——一次设置长期有效。定义这位教师的底薪、津贴组成、扣款比率（EPF/SOCSO/EIS/tax）。每次自动生成薪资时，系统读取这个结构来计算。
- **薪资记录**（Record）：是 **"月度账单"**——每月生成一条，记录该月实际的总薪资、扣款金额、净薪资。可以有多条记录引用同一个结构。

**问题**：结构列表页面上不显示每个结构的 EPF/SOCSO 比率字段，用户看不到但系统确实存储了这些值（详见第二节）。

---

## 二、EPF/SOCSO 每教师独立配置

### 2.1 数据层：支持每教师独立

**Schema** (`lib/pocketbase-schema.ts` 第454-475行):
```typescript
interface TeacherSalaryStructure {
  id: string
  teacher_id: string
  base_salary: number
  // ... 津贴字段
  epf_rate: number     // 每教师独立 EPF 比率
  socso_rate: number   // 每教师独立 SOCSO 比率
  eis_rate: number     // 每教师独立 EIS 比率
  tax_rate: number     // 每教师独立 PCB 税率
  salary_type: 'monthly' | 'hourly' | 'commission'
  // ...
}
```

**API** (`app/api/teacher-salary/route.ts` 第126-129行):
创建/更新薪资结构时，API 接受并存储 `epf_rate`、`socso_rate`、`eis_rate`、`tax_rate` 字段——这些是**每个薪资结构独立**的。

### 2.2 UI 层：用户看不到也改不了每教师独立比率

这是 **最大的设计和可用性问题**：

**① 新建薪资结构对话框（第1063-1227行）**
表单字段只有：选择教师、薪资类型、基本薪资、固定津贴、交通津贴、餐费津贴、其他津贴、生效日期、结束日期、备注。
→ **没有 EPF/SOCSO/EIS/TAX 比率输入框**。
→ 提交时自动使用全局默认值（从 `globalRates` state 中读取，存储在 `localStorage` 中）。

**② 编辑薪资结构对话框（第438-458行）**
虽然代码中读取了 `structure.epf_rate`、`structure.socso_rate` 等字段，但**同样没有 UI 控件来展示或修改这些值**。

**③ 全局参数设置卡片（第648-716行）**
页面上方有一个"薪资参数设置"卡片，包含 EPF、SOCSO、EIS、PCB 四个输入框。它们控制 `globalRates` state（存于 `localStorage`），只用于**新建结构时的默认预填**。

### 2.3 设置页面的费率（`/settings`）

系统设置页面（`app/settings/page.tsx` 第56-64行）有专门的"EPF/Socso/EIS 费率"标签页，但：

```typescript
const handleSave = async (section: string) => {
  // ...
  await new Promise((r) => setTimeout(r, 800))  // ⚠️ 模拟保存，没有实际 API 调用
  setSaveSuccess(true)
  // ...
}
```
→ **保存按钮是模拟的**，没有写入 PocketBase，也没有被薪资模块引用。

**结论**：整个系统有**三个地方**存储 EPF/SOCSO 费率，彼此**互不关联**：
1. 设置页面的 React state（模拟保存，没人用）
2. 薪资管理页面的 `localStorage['salary_global_rates']`（填充新建结构的默认值）
3. 每个薪资结构 `teacher_salary_structures` 中的 `epf_rate`/`socso_rate`/`eis_rate`（真正生效的值——但用户看不到也改不了）

---

## 三、个人差异是否体现在计算中？

### 3.1 自动生成薪资（`/api/salary/auto-generate/route.ts`）

**第112行**：
```typescript
const epfDeduction = grossSalary * (structure.epf_rate || 0.11)
const socsoDeduction = grossSalary * (structure.socso_rate || 0.005)
const eisDeduction = grossSalary * (structure.eis_rate || 0.002)
```

→ 确实读取了**每个薪资结构的独立比率**。如果 A 教师结构 `epf_rate=0.11`、B 教师结构 `epf_rate=0.13`，他们的 EPF 扣款会不同。**数据层面上，个人差异被反映。**

但用户**无法在 UI 中设置这些差异**，所以实际应用中所有教师都用默认值。

### 3.2 计算准确性问题（Bug 列表）

| # | 问题 | 严重程度 | 说明 |
|---|------|---------|------|
| 1 | **SOCSO 计算不一致** | 🔴 高 | Hook (`usePayroll.ts`) 使用正确的**分段费率表**（SOCSO_BRACKETS），但 auto-generate API 使用**简单百分比** `grossSalary * structure.socso_rate`。结果不一致：Hook 按马来西亚 SOCSO 2025 费率表精确计算，API 只算了约 RM0-25（0.5%）。两个路径给不同答案。 |
| 2 | **雇主 EPF 完全缺失** | 🔴 高 | Schema 只定义了 `epf_rate`（雇员 11%），没有 `epf_employer_rate`。Auto-generate API 只算员工侧扣款。Hook 里有 `epfEmployerRate`（默认 0.12）但只在前端预览时用，不会存到数据库。雇主成本永远不记录。 |
| 3 | **性能调薪 API 集合名错误** | 🔴 高 | `performance-adjustment/route.ts` 第38行引用 `teacher_salary_structure`（**单数**），但主 API 用 `teacher_salary_structures`（**复数**）。如果 PocketBase 中用复数名，这个 API 会 404 报错。 |
| 4 | **PCB/TAX 太简化** | 🟡 中 | `taxDeduction = grossSalary * tax_rate` 只是简单乘法，没有马来西亚渐进式税阶（progressive tax brackets） |
| 5 | **EIS 封顶计算不一致** | 🟡 中 | Hook 有 `Math.min(grossSalary * eisRate, 2.45)` 封顶（正确），但 API 直接用 `grossSalary * eis_rate` 无封顶。高于 RM1,225 的教师会被多扣 EIS。 |
| 6 | **津贴计算只用了固定值** | 🟡 中 | auto-generate API 只累加 `allowance_fixed/transport/meal/other`，忽略了 `hourly_rate` 场景下的按小时津贴。 |
| 7 | **全局费率不持久** | 🟡 中 | 全局费率存在 `localStorage`，换浏览器/清缓存就丢失。也没有 API 后端存储。 |
| 8 | **设置页面的费率没人用** | 🟢 低 | 设置页面的 EPF/SOCSO/EIS 输入框保存到本地 React state，但薪资模块完全不读取这些值。 |

### 3.3 关键文件清单

| 文件 | 作用 | 行数 |
|------|------|------|
| `components/teacher/TeacherSalaryManagement.tsx` | 薪资管理主 UI（3 个标签页） | 1397 |
| `hooks/usePayroll.ts` | 薪资计算 Hook（SOCSO 分段表在这里） | 188 |
| `app/api/teacher-salary/route.ts` | 薪资结构和记录的 CRUD API | 266 |
| `app/api/salary/auto-generate/route.ts` | 自动生成月度薪资 | 190 |
| `app/api/salary/performance-adjustment/route.ts` | 绩效调薪 | 191 |
| `lib/pocketbase-schema.ts` | TeacherSalaryStructure/Record 接口定义 | ~55 |
| `lib/pocketbase-teachers.ts` | 教师数据接口（含 epfNo, socsoNo） | 491 |
| `app/settings/page.tsx` | 系统设置（含费率标签页，但模拟保存） | 765 |
| `app/finance/payroll/page.tsx` | 路由页面（包装 TeacherSalaryManagement） | 21 |

### 3.4 总体评价

| 维度 | 评分 | 说明 |
|------|------|------|
| Tab 结构清晰度 | ★★★☆☆ | 三个 Tab 职责分明，但薪资结构列表缺少 EPF/SOCSO 可见列 |
| 每教师独立配置能力 | ★★★★☆ | 数据模型支持（`epf_rate` 等字段在 structure 级别），但 UI 完全不暴露 |
| 计算准确性 | ★★☆☆☆ | SOCSO 分段表在 hook 里是对的，但 API 用错了；雇主 EPF 全缺 |
| 数据一致性 | ★☆☆☆☆ | 三套费率不互通，性能调薪集合名拼写可能不一致 |
| UI 完整度 | ★★☆☆☆ | 全局费率有 UI 但没持久化，每教师费率有数据模型但没 UI |

### 3.5 建议修复优先级

1. **P0** — 在薪资结构创建/编辑对话框中加入 EPF/SOCSO/EIS/TAX 独立比率的输入字段（当前它们被自动填入但用户看不到）
2. **P0** — 统一 SOCSO 计算方式：API 应使用 `usePayroll.ts` 中的分段费率表
3. **P0** — 修复性能调薪 API 的集合名拼写（`teacher_salary_structure` → `teacher_salary_structures`）
4. **P1** — 在 `teacher_salary_structures` 添加 `epf_employer_rate` 字段，在 auto-generate 中计算雇主成本
5. **P1** — 为 EIS 添加封顶逻辑（与 hook 一致）
6. **P1** — 将全局费率存储到 PocketBase（或通过设置 API 持久化）
7. **P2** — 在薪资结构列表表格中添加 EPF/SOCSO 比率列
8. **P2** — 将雇主成本字段（epf_employer, socso_employer, eis_employer）加入 `teacher_salary_records` 集合
