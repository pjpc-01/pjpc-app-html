# Project Folder Structure

This document outlines the organized folder structure for the PJPC School Management System.

## App Components (`app/components/`)

### 📊 Dashboards (`dashboards/`)
All dashboard-related components for different user roles:
- `admin-dashboard.tsx` - Administrator dashboard
- `accountant-dashboard.tsx` - Accountant dashboard  
- `teacher-dashboard.tsx` - Teacher dashboard
- `parent-dashboard.tsx` - Parent dashboard
- `index.ts` - Clean exports

### 🛠️ Management (`management/`)
All management and administrative components:
- `teacher-management.tsx` - Teacher management interface
- `student-management-page.tsx` - Student management interface
- `assignment-management.tsx` - Assignment management
- `course-management.tsx` - Course management
- `user-management.tsx` - User management
- `index.ts` - Clean exports

#### Admin (`management/admin/`)
Admin-specific management components:
- `user-approval.tsx` - User approval interface

### 🔧 Systems (`systems/`)
Core system components:
- `attendance-system.tsx` - Attendance tracking system
- `nfc-attendance-system.tsx` - NFC-based attendance
- `communication-system.tsx` - Communication system
- `exam-system.tsx` - Examination system
- `security-monitoring.tsx` - Security monitoring
- `index.ts` - Clean exports

#### Auth (`systems/auth/`)
Authentication components:
- `login-form.tsx` - Login form
- `secure-login-form.tsx` - Secure login form

#### Data Import (`systems/data-import/`)
Data import functionality:
- `simple-import.tsx` - Simple import interface
- `google-sheets-import.tsx` - Google Sheets import
- `DataPreview.tsx` - Data preview component
- `ImportConfig.tsx` - Import configuration component
- `ImportStatus.tsx` - Import status component

### ⭐ Features (`features/`)
Feature-specific components:
- `learning-analytics.tsx` - Learning analytics
- `resource-library.tsx` - Resource library
- `schedule-management.tsx` - Schedule management
- `parent-interaction.tsx` - Parent interaction features
- `education-dropdown.tsx` - Education dropdown component
- `index.ts` - Clean exports

### 💰 Finance (`finance/`)
Financial management components:
- `FeeManagement.tsx` - Fee management (refactored)
- `InvoiceManagement.tsx` - Invoice management (refactored)
- `PaymentManagement.tsx` - Payment management
- `FinancialReports.tsx` - Financial reports
- `ReminderManagement.tsx` - Reminder management
- `InvoiceTemplateManager.tsx` - Invoice template management
- `finance-management-page.tsx` - Finance management page
- `index.ts` - Clean exports

#### Student Fee Matrix (`finance/student-fee-matrix/`)
All components related to student fee matrix functionality:
- `StudentFeeMatrix.tsx` - Main student fee matrix component
- `BatchOperationsDialog.tsx` - Batch operations dialog
- `StudentCard.tsx` - Individual student card
- `SearchAndFilter.tsx` - Search and filter functionality
- `StudentFeeMatrixHeader.tsx` - Header component
- `FeeCard.tsx` - Fee card component
- `index.ts` - Export file for clean imports

### 👥 Student (`student/`)
Student-related components:
- `StudentBulkActions.tsx` - Bulk student actions
- `StudentDetails.tsx` - Student details
- `StudentFilters.tsx` - Student filters
- `StudentForm.tsx` - Student form
- `StudentList.tsx` - Student list
- `StudentManagement.tsx` - Student management
- `StudentStats.tsx` - Student statistics
- `utils.ts` - Student utilities

## Global Components (`components/`)

### 🎨 UI (`ui/`)
Reusable UI components (Shadcn UI components)

### 🔗 Shared (`shared/`)
Shared/common components:
- `checkin-navigation.tsx` - Check-in navigation
- `error-boundary.tsx` - Error boundary component
- `firebase-status.tsx` - Firebase status component
- `theme-provider.tsx` - Theme provider
- `index.ts` - Clean exports

## Other Directories

### 📚 Hooks (`hooks/`)
Custom React hooks

### 🔄 Contexts (`contexts/`)
React context providers

### 📁 Lib (`lib/`)
Utility libraries and configurations

### 🌐 App (`app/`)
Next.js app directory with pages and API routes

## Import Examples

### Before (scattered imports):
```typescript
import { StudentFeeMatrix } from '@/components/features/StudentFeeMatrix'
import { AdminDashboard } from '@/app/components/admin-dashboard'
import { TeacherManagement } from '@/app/components/teacher-management'
```

### After (organized imports):
```typescript
import { StudentFeeMatrix } from '@/app/components/finance'
import { AdminDashboard } from '@/app/components/dashboards'
import { TeacherManagement } from '@/app/components/management'
```

## Benefits of This Structure

1. **Logical Grouping**: Related components are grouped together
2. **Easy Navigation**: Clear folder names make it easy to find components
3. **Scalable**: New components can be easily added to appropriate folders
4. **Clean Imports**: Index files provide clean import paths
5. **Maintainable**: Related functionality is co-located
6. **Team-Friendly**: New team members can quickly understand the structure

## Adding New Components

When adding new components, follow these guidelines:

1. **Dashboard Components**: Add to `app/components/dashboards/`
2. **Management Components**: Add to `app/components/management/`
3. **System Components**: Add to `app/components/systems/`
4. **Feature Components**: Add to `app/components/features/`
5. **Finance Components**: Add to `app/components/finance/`
6. **Student Components**: Add to `app/components/student/`
7. **Shared Components**: Add to `components/shared/`
8. **UI Components**: Add to `components/ui/`

Always update the corresponding `index.ts` file when adding new components to maintain clean imports.
