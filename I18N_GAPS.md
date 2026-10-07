# 英文模式下残留中文清单（3706 处 / 157 个文件）

统计时间：2026-10-07   扫描范围：app/ + components/（不含语言字典）

## 根因

代码里普遍写成 `t("中文原文")`，但语言字典用的是 key 风格（`nav.students` / `report.average_score`），
两边对不上 → 全站 3758 处 t() 调用里只有 52 处能真正翻译，其余 3706 处英文模式下仍显示中文。

## 一、导航栏（只有 6 个词没映射，最好修）

AppShell.tsx 的 NAV_LABEL_MAP 缺这 6 个：

- 学生请假
- 活动管理
- 教师排班
- 教学评估
- 绩效管理
- 债务管理

## 二、教师评估 / 绩效相关（老板点名）

- app/teacher-teaching-report/page.tsx — 105 处
- app/teacher-performance/page.tsx — 4 处
- components/teacher/TeacherPerformanceManagement.tsx — 59 处
- components/teacher/TeacherSalaryManagement.tsx — 192 处
- components/teacher/TeacherStats.tsx — 27 处
- components/teacher/TeacherDetails.tsx — 26 处
- components/teacher/TeacherForm.tsx — 48 处
- components/teacher/TeacherBulkOperations.tsx — 65 处
- components/teacher/TeacherLeaveManagement.tsx — 55 处
- components/teacher/TeacherProfile.tsx — 40 处
- components/teacher/AdvancedTeacherFilters.tsx — 24 处
- components/teacher/TeacherDashboard.tsx — 20 处
- components/teacher/ClassSchedule.tsx — 19 处
- components/teacher/TeacherAnalytics.tsx — 30 处
- components/teacher/StudentProfileView.tsx — 20 处
- app/components/dashboards/teachers-tab.tsx — 21 处

## 三、全站最多的 40 个文件

-  192 处  components/teacher/TeacherSalaryManagement.tsx
-  105 处  app/teacher-teaching-report/page.tsx
-   94 处  app/components/student/StudentForm.tsx
-   89 处  app/components/finance/reports-overview/FinancialReports.tsx
-   79 处  app/components/attendance/LeaveManagement.tsx
-   75 处  app/components/report/ReportSettingsManager.tsx
-   73 处  app/components/finance/PaymentManagement.tsx
-   72 处  components/courses/CourseScheduling.tsx
-   65 处  components/teacher/TeacherBulkOperations.tsx
-   64 处  app/components/finance/BankReconciliation.tsx
-   61 处  app/teacher-workspace/page.tsx
-   59 处  components/teacher/TeacherPerformanceManagement.tsx
-   58 处  app/components/finance/invoice-management/InvoiceManagement.tsx
-   56 处  components/students/StudentLeaveManagement.tsx
-   56 处  app/components/finance/invoice-management/InvoiceSettingsManager.tsx
-   56 处  app/components/finance/invoice-management/InvoiceList.tsx
-   56 处  app/settings/page.tsx
-   55 处  components/teacher/TeacherLeaveManagement.tsx
-   55 处  app/components/finance/payment-management/ReminderManagement.tsx
-   54 处  app/points/page.tsx
-   52 处  app/components/features/resource-library.tsx
-   48 处  components/teacher/TeacherForm.tsx
-   48 处  app/components/report/PayslipSettingsManager.tsx
-   48 处  app/claim-form/page.tsx
-   47 处  app/components/dashboards/accountant-dashboard.tsx
-   47 处  app/student-report/[id]/StudentReportContent.tsx
-   46 处  app/components/finance/payment-management/ReceiptSettingsManager.tsx
-   46 处  app/card-management/page.tsx
-   45 处  components/shared/checkin-navigation.tsx
-   45 处  app/components/finance/DebtManagement.tsx
-   43 处  app/components/finance/ExpenseManagement.tsx
-   43 处  app/grades/page.tsx
-   40 处  components/teacher/TeacherProfile.tsx
-   37 处  app/components/dashboards/modern-admin-dashboard.tsx
-   37 处  app/student-reports/page.tsx
-   35 处  components/courses/ClassManagement.tsx
-   35 处  components/attendance/UnifiedAttendanceHub.tsx
-   33 处  app/components/attendance/CalendarScheduleView.tsx
-   33 处  app/education/page.tsx
-   32 处  app/pickup/page.tsx

## 四、建议

1. **导航栏**：补 6 个映射 + 6 条英文（几分钟，立竿见影）
2. **教师评估/绩效**：约 10 个文件 / 600+ 处，需补英文词条（可批量机翻 + 人工过一遍）
3. **全站**：3700+ 处属大工程，建议按模块分批（财务 → 学生 → 考勤 → 报表）
