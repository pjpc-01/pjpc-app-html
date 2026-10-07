1|# 英文模式下残留中文清单（3706 处 / 157 个文件）
2|
3|统计时间：2026-10-07   扫描范围：app/ + components/（不含语言字典）
4|
5|## 根因
6|
7|代码里普遍写成 `t("中文原文")`，但语言字典用的是 key 风格（`nav.students` / `report.average_score`），
8|两边对不上 → 全站 3758 处 t() 调用里只有 52 处能真正翻译，其余 3706 处英文模式下仍显示中文。
9|
10|## 一、导航栏（只有 6 个词没映射，最好修）
11|
12|AppShell.tsx 的 NAV_LABEL_MAP 缺这 6 个：

---

## 更新（本轮实际结果）

### 已解决
- 英文兜底表从 **2696 → 3130 条**（+434），覆盖：请假/债务/考试目标/Kiosk/家长门户/教学评估/报表章节/费用分类/银行名/科目/角色权限/考勤状态/学期段/关系称谓。
- 导航栏 3 个漏词（学生请假 / 教学评估 / 债务管理）已补。
- `AppShell` 分行切换器「全部」走 `t("common.all")`；`DebtManagement` 汇总卡片 label/小字已包 `t()`。

### 关键教训（必须遵守）
**不要用 codemod 给「模块级常量数组」包 `t()`**。`t` 只在组件体内存在，包到组件外 → `ReferenceError: t is not defined` → layout chunk 崩 → **全站白屏**。
- 本次踩过：约 180 处被误包 → 已全部回退（`git` 还原 44 个文件）。
- 症状：build 成功（`ignoreBuildErrors: true`），但页面显示 "Application error: a client-side exception"。
- **验收陷阱**：只统计「残留中文」的探针会返回「0 条」的假通过（错误页是英文）。必须同时断言页面有真实内容 + 监听 `pageerror`。

### 剩余待办（正确修法）
模块级数组里的中文（表格列头、筛选项、图表标签、权限树、报表章节模板等），修法二选一：
1. **渲染处翻译**（推荐）：`{ROWS.map(r => ({...r, label: t(r.label)}))}` / `{t(col.label)}`
2. 把数组**移进组件体内**再包 `t()`

涉及文件（部分）：`app/components/attendance/*`(表头)、`components/teacher/AdvancedTeacherFilters.tsx`、`app/points/rules/page.tsx`、`app/pickup/page.tsx`、`app/parent/*`、`app/components/finance/AddFeeDialog.tsx`、`app/components/report/ReportSettingsManager.tsx`、`components/ui/global-search.tsx`、`components/admin/PermissionEditor.tsx`、`app/dashboard/slideshow/page.tsx`、`app/teacher-teaching-report/page.tsx`。

不建议翻译的（保持中文）：学生/教师姓名、DB 里的年级值（一年级/中一）、报告评语正文、科目/成绩的原始数据值。
