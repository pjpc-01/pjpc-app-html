# Project Technical Debt & Compiler Fix List

This file tracks the current TypeScript errors in the project to ensure a systematic resolution without introducing new bugs.

## ✅ Fixed (2026-06-20 Batch)

- [x] `lib/pocketbase.ts`: Fixed invalid characters and property assignments (lines 93, 94, 165).
- [x] `app/components/teacher-workspace/AttendanceManagement.tsx`: Fixed syntax error on line 6.
- [x] `app/api/announcements/[id]/route.ts`: Fixed params → Promise<params> (Next.js 15).
- [x] `app/api/courses/[id]/route.ts`: Fixed params → Promise<params> (Next.js 15).
- [x] `app/api/attendance/checkin/route.ts`: Fixed authenticateAdmin() → pb.admins.authWithPassword().
- [x] `app/api/attendance/analytics/route.ts`: Created missing API route.
- [x] `app/layout.tsx`: Added `dynamic = 'force-dynamic'` → fixes useSearchParams() Suspense in all pages.
- [x] `hooks/useFeesConfig.ts`: Already `USE_MOCK_FEES = false` (blueprint was stale).

## 🟡 Remaining (non-blocking build — fixed during `next build`)

### API Routes
- [ ] `app/api/assignment-stats/route.ts`: Fix implicit 'any' indexing on empty objects `{}`.
- [ ] `app/api/billing/auto-generate/route.ts`: Fix empty object `{}` missing `name`, `amount`.
- [ ] `app/api/import/google-sheets/route.ts`: Fix `string | undefined` → `string`.
- [ ] `app/api/integrated-cards/route.ts`: Fix missing `issuedDate`, `lastUsed`, `cardId`, `updateData`, `authError`, `nfcError`.
- [ ] `app/api/nfc/devices/route.ts`: Fix missing properties in `NFCDevice` Omit type.
- [ ] `app/api/nfc/url-access/route.ts`: Fix missing methods in `UnifiedCardSystem`.
- [ ] `app/api/points-monitor/route.ts`: Fix implicit `any[]` type.
- [ ] `app/api/events/route.ts`: Fix `checkForUpdates` compatibility.
- [ ] `app/api/student-cards/attendance/route.ts`: Multiple TS errors.
- [ ] `app/api/server-config/route.ts`: Multiple TS errors.

### Components (UI only, no build impact)
- [ ] `app/components/student/StudentManagement.tsx`: ~42 errors — missing imports, missing props.
- [ ] `app/components/management/simple-teacher-management.tsx`: ~28 errors.
- [ ] `app/components/systems/communication-system.tsx`: ~20 errors.
- [ ] `app/components/management/assignment-management.tsx`: ~20 errors.
- [ ] `app/components/dashboards/education-tab.tsx`: ~17 errors.
- [ ] `app/components/teacher-workspace/index.ts`: ~16 errors.
- [ ] `app/components/management/teacher-management.tsx`: ~15 errors.
- [ ] `app/components/teacher/TeacherDetails.tsx`: ~13 errors.
- [ ] `hooks/useStudentCards.ts`: ~9 errors.
- [ ] `app/components/finance/BankReconciliation.tsx`: ~9 errors.

### Library Code (WebUSB/Serial types — non-critical)
- [ ] `lib/usb-nfc-reader.ts`: ~24 errors — `navigator.usb`/`navigator.serial` type errors (requires custom types for WebUSB/WebSerial). Non-critical — NFC hardware only.

## Notes
- Build passes cleanly — all 103 pages compile without errors (`npx next build --no-lint`).
- ~539 TS errors remain in `npx tsc --noEmit`, mostly in complex UI components.
- Priority: these are non-blocking for dev/build. Fix on-demand when editing specific files.
