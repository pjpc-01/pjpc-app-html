# Project Technical Debt & Compiler Fix List

This file tracks the current TypeScript errors in the project to ensure a systematic resolution without introducing new bugs.

## 🔴 Critical (Blockers)
- [ ] `lib/pocketbase.ts`: Fix invalid characters and property assignments (lines 93, 94, 165).
- [ ] `app/components/teacher-workspace/AttendanceManagement.tsx`: Fix syntax error on line 6 (Unexpected keyword/identifier).

## 🟡 High Priority (API & Core Logic)
- [ ] `app/api/announcements/[id]/route.ts`: Fix RouteHandlerConfig type mismatch (params should be a Promise).
- [ ] `app/api/courses/[id]/route.ts`: Fix RouteHandlerConfig type mismatch (params should be a Promise).
- [ ] `app/api/assignment-stats/route.ts`: Fix implicit 'any' indexing on empty objects `{}`.
- [ ] `app/api/integrated-cards/route.ts`: Fix missing properties (`issuedDate`, `lastUsed`) and undefined variables (`cardId`, `updateData`).
- [ ] `app/api/nfc/devices/route.ts`: Fix missing properties in `NFCDevice` Omit type.
- [ ] `app/api/nfc/url-access/route.ts`: Fix missing methods in `UnifiedCardSystem`.

## 🔵 Medium Priority (UI & Type Safety)
- [ ] `app/components/student/StudentManagement.tsx`: Fix missing imports (`Card`, `Button`, etc.) and missing `filteredStudents` prop.
- [ ] `app/components/systems/communication-system.tsx`: Fix missing `Tabs` components.
- [ ] `hooks/useAttendance.ts`: Fix `RecordModel` to `AttendanceRecord` type conversion.
- [ ] `hooks/useExpenses.ts`: Fix invalid properties in `fetchSecureData` options.
- [ ] `hooks/useFeeItems.ts`: Fix `frequency` type mismatch.

## ⚪ Low Priority (Clean-up)
- [ ] `lib/usb-nfc-reader.ts`: Fix `navigator.usb` and `navigator.serial` type errors (requires custom types for WebUSB/WebSerial).
- [ ] `app/tv-board/components/PageTransition.tsx`: Fix Framer Motion variants type mismatch.
