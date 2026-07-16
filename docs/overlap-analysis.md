# Duplicate/Overlapping Functionality Analysis

> Generated: 2026-07-16  
> Scope: schedule, finance, attendance, homework/logs, parent, teacher pages  
> Method: Source code review of all page.tsx files and key components

---

## 1. Schedule: `schedule-management` vs `course-management` (CourseScheduling)

### Files
| File | Purpose |
|------|---------|
| `/app/schedule-management/page.tsx` | Dedicated schedule management page — teacher scheduling with week/month calendar views, attendance stats |
| `/app/course-management/page.tsx` (section 3: "排课管理") | Uses `<CourseScheduling>` from `/components/courses/CourseScheduling.tsx` |
| `/components/courses/CourseScheduling.tsx` (759 lines) | Course-based scheduling: maps courses → teachers → days/time slots |

### Why This Is Overlap
Both create time-based schedules involving teachers, courses (subjects), days of the week, and time slots:
- **schedule-management**: teacher-centric (employee scheduling + attendance tracking)
- **CourseScheduling**: course-centric (which course is taught when/where/by whom)

They both write to the PB `schedules` collection but approach it from different entry points — one targets employee attendance schedules, the other targets curriculum timetables.

### Suggested Consolidation
- Remove the "排课管理" section from `course-management/page.tsx` and add sidebar navigation from there to `/schedule-management` instead
- Or, refactor `CourseScheduling.tsx` to use `SimpleScheduleManager`'s API layer, keeping only the course-specific UI wrapper in CourseScheduling
- Either way, one data layer + one management UI

---

## 2. Finance: 7 Pages for a Single Domain

### Files
| Route | Component | Purpose |
|-------|-----------|---------|
| `/finance/overview` | `FinanceOverview` | Dashboard with charts and KPIs |
| `/finance/fees` | `FeeManagement` (384 lines) | Fee item definitions (CRUD) |
| `/finance/student-fees` | `StudentFeeMatrix` | Assign fees to students |
| `/finance/invoices` | `InvoiceManagement` | Create/manage invoices |
| `/finance/payments` | `PaymentManagement` | Process payments |
| `/finance/receipts` | `ReceiptManagement` | Issue receipts |
| `/finance-management` | (redirect → /finance/overview) | Legacy redirect |
| Plus: `/finance/expenses`, `/finance/bank`, `/finance/budget`, `/finance/reports`, `/finance/payroll` | | Additional finance sub-routes |

### Why This Is Overlap
These pages represent a **pipeline**, not duplicates — each handles a different stage (fee definition → student assignment → invoicing → payment → receipt). However, there are specific overlaps:

1. **`invoices` vs `payments` vs `receipts`**: Payments apply against invoices; receipts confirm payments. The `PaymentManagement` component likely shows invoice/payment reconciliation that duplicates what `InvoiceManagement` shows. The BLUEPRINT confirms `receipts` is explicitly a payment output.

2. **`fees` vs `student-fees`**: `FeeManagement` defines fee item templates; `StudentFeeMatrix` assigns them to students. These are cleanly separated in theory but the StudentFeeMatrix includes fee management UI inline, creating partial overlap.

3. **Legacy `/finance-management`** exists solely as a redirect — cleanup candidate.

4. Many of these were previously tabs in a single finance page that got "打平到侧边栏" (flattened to sidebar) per the BLUEPRINT.

### Suggested Consolidation
- Merge `fees` + `student-fees` into a single "Fee Configuration" page with tabs (Fee Items tab + Student Assignment tab)
- Explicitly connect `invoices`, `payments`, and `receipts` with shared state/refetch so they're clearly the same pipeline rather than separate silos
- Delete `/finance-management` if no external links reference it

---

## 3. Attendance: Multiple Overlapping Systems

### Files
| File | Purpose | Lines |
|------|---------|-------|
| `/app/attendance/page.tsx` | Uses `UnifiedAttendanceHub` + `AttendanceSettingsPanel` | 20 |
| `/app/components/systems/attendance-system.tsx` | Standalone attendance system (tabs student/teacher/NFC/reports) | 499 |
| `/app/components/systems/nfc-attendance-system.tsx` | NFC-specific attendance (imported by attendance-system.tsx) | 459 |
| `/app/schedule-management/page.tsx` | Contains attendance stats + teacher scheduling | 107 |
| `/app/teacher-attendance-reports/page.tsx` | Teacher-specific attendance reports | 730+ |
| `/app/card-management/page.tsx` | NFC card management (used by attendance) | — |

### Why This Is Overlap
1. **`attendance-system.tsx` vs `UnifiedAttendanceHub`**: `attendance-system.tsx` is a self-contained page-level component (calls `PageLayout`, `TabbedPage`, full tabs structure) that appears to duplicate what `UnifiedAttendanceHub` provides. The actual page at `/app/attendance/page.tsx` chose `UnifiedAttendanceHub` instead of `attendance-system.tsx`, suggesting `attendance-system.tsx` may be a predecessor that was replaced but not deleted.

2. **`attendance-system.tsx` imports `nfc-attendance-system.tsx`** — these are parent-child (not duplicate), but the parent component may be dead code.

3. **Teacher attendance** exists in three places:
   - `teacher-attendance-reports/page.tsx` (dedicated page, 730+ lines)
   - `schedule-management/page.tsx` (via `useAttendanceStats`)
   - Possibly within `attendance-system.tsx`

### Suggested Consolidation
- Remove `attendance-system.tsx` if `UnifiedAttendanceHub` fully replaces it (verify feature parity first)
- Unify teacher attendance: either fold it into the main `/attendance` page with a student/teacher toggle, or keep it separate but ensure `schedule-management` references it rather than duplicating the data
- Verify and clean up `attendance-system.tsx` (499 lines of likely dead code)

---

## 4. Homework vs Daily Logs — Partial Overlap

### Files
| File | Purpose |
|------|---------|
| `/app/homework/page.tsx` | Homework CRUD, list, filter by subject/grade |
| `/app/homework/new/page.tsx` | Create new homework |
| `/app/homework/[id]/page.tsx` | Homework details + submissions |
| `/app/homework/[id]/grade/page.tsx` | Batch grading |
| `/app/daily-logs/page.tsx` (323 lines) | Daily logs: track homework_done, nap, meal, mood, behavior |

### Why This Is Partial Overlap
**They track different things:**
- Homework: teacher-assigned tasks with full lifecycle (assign → submit → grade)
- Daily Logs: daily student well-being (did homework, napped, ate, mood)

**But there IS overlap:** Daily logs include a `homework_done` boolean that partially duplicates what the homework submission system tracks. A teacher records "homework done" in daily logs, while the homework system tracks submission counts. These are conceptually adjacent — one is "was homework completed?" (daily log), the other is "was homework submitted and graded?" (homework system).

### Suggested Consolidation
- No merge needed — they serve fundamentally different purposes
- But consider linking: add a link from daily logs → homework submissions for that student on that day, so the `homework_done` status can be backed by actual submission data
- Alternatively, remove the `homework_done` field from daily logs if homework submission data is authoritative

---

## 5. Points vs Grades — No Substantial Overlap

### Files
| File | Purpose |
|------|---------|
| `/app/points/page.tsx` (355 lines) | Points system: award/deduct, NFC scan, transaction history |
| `/app/points/leaderboard/page.tsx` | Student points leaderboard |
| `/app/points/rules/page.tsx` | Points rules configuration |
| `/app/grades/page.tsx` (215 lines) | Academic grade entry, statistics, per-subject/term tracking |

### Why This Is NOT Overlap
- **Points**: behavioral gamification system (daily behavior rewards)
- **Grades**: academic performance tracking (exam scores, letter grades)

**Verdict: No overlap.** They are complementary systems used for different purposes. Nothing to consolidate.

---

## 6. Parent Management vs Parent Portal Pages

### Files
| File | Role | Purpose |
|------|------|---------|
| `/app/parent-management/page.tsx` (318 lines) | **Admin** | Parent CRUD, list, search, student association |
| `/app/parent/dashboard/page.tsx` | **Parent** | Child overview cards with quick stats |
| `/app/parent/payments/page.tsx` | **Parent** | View payment/invoice history |
| `/app/parent/grades/page.tsx` | **Parent** | View grade history |
| `/app/parent/attendance/page.tsx` | **Parent** | View attendance records |
| `/app/parent/dailylogs/page.tsx` (182 lines) | **Parent** | View daily logs |
| `/app/parent/notifications/page.tsx` | **Parent** | View announcements |
| `/app/components/dashboards/parent-dashboard.tsx` | **Legacy?** | Possibly old version of parent dashboard |
| `/app/components/dashboards/modern-parent-dashboard.tsx` | **Modern** | Current parent dashboard |
| `/app/components/features/parent-interaction.tsx` (321 lines) | **Feature** | School-parent interaction: reports, meetings, leave, feedback |

### Why This Is Overlap
1. **`parent-management` vs `parent/*`**: These serve different audiences (admin vs parent). **Not overlap.**

2. **`parent-dashboard.tsx` vs `modern-parent-dashboard.tsx`**: Two components in the same directory with similar names — almost certainly a legacy replacement where the old one wasn't deleted. The actual parent route uses `modern-parent-dashboard.tsx`.

3. **`parent-interaction.tsx` vs parent portal pages**: This 321-line component provides parent-school interaction features (learning reports, parent-teacher meetings, leave requests, feedback) that partially overlap with:
   - `/parent/grades` (learning reports)
   - `/parent/attendance` (attendance shown in child cards)
   - `/parent/dailylogs` (daily status shown in reports)
   - It also adds NEW functionality not in the parent portal (leave requests, feedback)

### Suggested Consolidation
- Delete `parent-dashboard.tsx` (legacy, replaced by `modern-parent-dashboard.tsx`)
- Either fold `parent-interaction.tsx` features into the existing parent portal pages, or delete it if it's a design mockup/prototype (it uses hardcoded sample data like "王小明")
- The parent portal pages are cleanly organized as 6 sub-routes under `/parent/`

---

## 7. Teacher Management — Significant Overlap

### Files
| File | Lines | Purpose |
|------|-------|---------|
| `/app/teacher-management/page.tsx` | 118 | Admin: 3-tab management (TeachersTab + Leave + Performance) |
| `/app/teacher-workspace/page.tsx` | 442 | Teacher self-service: dashboard, students, schedule, assignments, stats |
| `/app/teacher-attendance-reports/page.tsx` | 730+ | Teacher attendance records with filters, stats, export |
| `/app/components/dashboards/teachers-tab.tsx` | — | Teacher list component (used by teacher-management) |
| `/app/components/management/teacher-management.tsx` | 610+ | Another full teacher management component |
| `/app/components/management/simple-teacher-management.tsx` | — | Legacy simple teacher management |

### Why This Is Overlap
1. **`teacher-management.tsx` (610 lines) vs `simple-teacher-management.tsx`**: Same directory, same purpose, one is "simple". The active page (`/app/teacher-management/page.tsx`) uses `TeachersTab` (from dashboards/), NOT either of these components — suggesting these are dead code.

2. **`teachers-tab.tsx` (used) vs `teacher-management.tsx` (unused?)**: Both show teacher lists with CRUD. `teacher-management.tsx` at 610+ lines is much more elaborate. Need to verify which is actually in use.

3. **Teacher attendance in 3 places**: The 730-line `teacher-attendance-reports` page duplicates teacher attendance tracking that exists in:
   - `schedule-management` (via stats)
   - Possibly in the attendance system components

4. **`teacher-management` (admin) vs `teacher-workspace` (teacher self-service)**: These serve different audiences and are **not overlap**.

### Suggested Consolidation
- Determine whether `teacher-management.tsx` (610 lines) and `simple-teacher-management.tsx` are dead code (unreferenced) — if so, delete them
- Ensure `TeachersTab` is the single source of truth for teacher list CRUD in admin
- Link `teacher-attendance-reports` from teacher-management as the attendance tab, rather than having it as a completely separate entry

---

## Summary

| # | Area | Verdict | Priority |
|---|------|---------|----------|
| 1 | Schedule: `schedule-management` vs `CourseScheduling` | ⚠️ **Partial overlap** — both write to PB schedules, approach different | Medium |
| 2 | Finance: 7+ separate pages | ⚠️ **Pipeline, not duplicate** — but `fees`/`student-fees` can merge, and some components blur boundaries | Low-Medium |
| 3 | Attendance: multiple systems | 🔴 **Likely dead code** — `attendance-system.tsx` (499 lines) may be replaced by `UnifiedAttendanceHub` | High |
| 4 | Homework vs Daily Logs | ✅ **No merge needed** — `homework_done` field overlaps conceptually but serves different tracking purpose | Low |
| 5 | Points vs Grades | ✅ **No overlap** — different purposes | None |
| 6 | Parent management vs portal | 🔴 **Dead component** — `parent-dashboard.tsx` likely legacy; `parent-interaction.tsx` hardcoded mock data | Medium |
| 7 | Teacher management | 🔴 **Likely dead code** — `teacher-management.tsx` (610 lines) and `simple-teacher-management.tsx` may be unreferenced | High |

### Biggest Cleanup Opportunities (High Priority)
1. **`attendance-system.tsx`** (499 lines) — verify if replaced by `UnifiedAttendanceHub`, delete if so
2. **`teacher-management.tsx`** (610 lines) + **`simple-teacher-management.tsx`** — verify if dead code
3. **`parent-dashboard.tsx`** — legacy version, replaced by `modern-parent-dashboard.tsx`

> **Note**: These are code-structural findings. Actual deletion should be preceded by verifying that no imports reference these files. Use `search_files` with target='content' to confirm zero references before deleting.
