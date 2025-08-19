# Project Structure Documentation

## 📁 Root Directory Structure

```
pjpc-app-html-main/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── attendance/           # Attendance API endpoints
│   │   ├── import/               # Data import API endpoints
│   │   ├── nfc/                  # NFC/RFID API endpoints
│   │   └── pocketbase/           # PocketBase proxy API
│   ├── checkin/                  # Check-in page
│   ├── components/               # App-specific components
│   │   ├── dashboards/           # Dashboard components
│   │   ├── data-import/          # Data import components
│   │   ├── features/             # Feature components
│   │   ├── finance/              # Finance management components
│   │   ├── management/           # Management components
│   │   ├── student/              # Student management components
│   │   └── systems/              # System components
│   ├── data-import/              # Data import page
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   ├── loading.tsx               # Loading component
│   └── page.tsx                  # Home page
├── components/                   # Shared components
│   ├── features/                 # Shared feature components
│   ├── shared/                   # Shared utility components
│   └── ui/                       # UI component library
├── contexts/                     # React contexts
│   └── pocketbase-auth-context.tsx
├── hooks/                        # Custom React hooks
├── lib/                          # Utility libraries
├── public/                       # Static assets
├── scripts/                      # Build/deployment scripts (empty)
├── styles/                       # Additional styles
├── .eslintrc.json               # ESLint configuration
├── .gitignore                   # Git ignore rules
├── components.json              # UI components configuration
├── next.config.mjs              # Next.js configuration
├── next-env.d.ts                # Next.js TypeScript definitions
├── package.json                 # Dependencies and scripts
├── postcss.config.mjs           # PostCSS configuration
├── tailwind.config.ts           # Tailwind CSS configuration
└── tsconfig.json                # TypeScript configuration
```

## 🎯 Key Directories Explained

### `/app` - Next.js App Router
- **`/api`**: All API endpoints (attendance, import, NFC, PocketBase proxy)
- **`/components`**: App-specific React components organized by feature
- **`/checkin`**: Student check-in functionality
- **`/data-import`**: Data import functionality

### `/app/components` - Feature Components
- **`/dashboards`**: Dashboard components for different user roles
- **`/finance`**: Financial management components (invoices, payments, fees, student fee matrix)
- **`/management`**: Management components (students, teachers, users, courses)
- **`/student`**: Student-specific management components
- **`/systems`**: System components (auth, NFC, attendance, security)
- **`/features`**: Feature components (analytics, scheduling, resources)

### `/app/components/finance` - Finance Components
- **`/student-fee-matrix/`**: Student fee allocation system
  - `StudentFeeMatrix.tsx`: Main matrix component with category-based fee display
  - `StudentCard.tsx`: Individual student card with collapsible fee categories
  - `StudentFeeMatrixHeader.tsx`: Header with edit/batch mode controls
  - `SearchAndFilter.tsx`: Search and filtering functionality
- **`FeeManagement.tsx`**: Fee items management with category grouping
- **`InvoiceManagement.tsx`**: Invoice creation and management
- **`PaymentManagement.tsx`**: Payment tracking and management
- **`ReceiptManagement.tsx`**: Receipt generation and management
- **`FinancialReports.tsx`**: Financial reporting and analytics
- **`ToggleSwitch.tsx`**: Reusable toggle switch component

### `/components` - Shared Components
- **`/ui`**: Reusable UI component library (buttons, cards, forms, etc.)
- **`/shared`**: Shared utility components (error boundaries, navigation)
- **`/features`**: Shared feature components

### `/hooks` - Custom React Hooks
- **`useStudents.ts`**: Student data management (PocketBase integration)
- **`useDashboardStats.ts`**: Dashboard statistics
- **`useFinancialStats.ts`**: Financial statistics
- **`useInvoices.ts`**: Invoice management with AbortController
- **`usePayments.ts`**: Payment management
- **`useReceipts.ts`**: Receipt management
- **`useStudentFees.ts`**: Student fee assignments with real-time updates
- **`useFees.ts`**: Fee items management (PocketBase integration)
- **`useNFC.ts`**: NFC/RFID functionality
- **`useReminders.ts`**: Reminder management

### `/lib` - Utility Libraries
- **`pocketbase.ts`**: PocketBase client with smart network detection
- **`pocketbase-students.ts`**: PocketBase student data functions
- **`nfc-rfid.ts`**: NFC/RFID functionality
- **`utils.ts`**: General utility functions
- **`pdf-generator.ts`**: PDF generation utilities
- **`template-renderer.ts`**: Template rendering utilities
- **`google-sheets.ts`**: Google Sheets integration
- **`receipt-utils.ts`**: Receipt utility functions

### `/contexts` - React Contexts
- **`pocketbase-auth-context.tsx`**: Authentication context with smart connection

## 🔧 Import/Export Structure

### Student Data Flow
- **UI Components**: Import `Student` interface from `@/hooks/useStudents`
- **Real Data**: Fetched from PocketBase via `useStudents` hook
- **Field Mapping**: Automatic conversion between PocketBase and UI formats
- **API Routes**: Use PocketBase functions for data import

### Fee Management Flow
- **Fee Items**: Import `Fee` interface from `@/types/fees`
- **Student Fee Matrix**: Category-based grouping with collapsible sections
- **Real-time Updates**: Student fee assignments sync with PocketBase
- **Toggle Switches**: Individual fee item assignment controls

### Component Imports
- **UI Components**: Import from `@/components/ui/*`
- **Shared Components**: Import from `@/components/shared/*`
- **Feature Components**: Import from `@/app/components/*`
- **Hooks**: Import from `@/hooks/*`
- **Utilities**: Import from `@/lib/*`

## ✅ Current Status

### Working Features
- ✅ **Student Management**: Real PocketBase data with full CRUD operations
- ✅ **Dashboard System**: Multi-role dashboards
- ✅ **Financial Management**: Complete invoice, payment, fee management
- ✅ **Student Fee Matrix**: Category-based fee allocation system
- ✅ **Authentication**: PocketBase authentication system
- ✅ **UI Components**: Complete component library
- ✅ **API Infrastructure**: All API routes functional
- ✅ **Network Detection**: Smart PocketBase URL detection

### Student Fee Matrix Features
- ✅ **Category Grouping**: Fees organized by categories with collapsible sections
- ✅ **Individual Fee Toggles**: Toggle switches for each fee item
- ✅ **Edit Mode**: Toggle switches only active in edit mode
- ✅ **Batch Mode**: Support for batch operations
- ✅ **Real-time Updates**: Fee assignments update totals immediately
- ✅ **Search & Filter**: Student search and grade filtering
- ✅ **Invoice Creation**: Generate invoices from assigned fees
- ✅ **Payment Status**: Track payment status for each student

### Data Sources
- **Student Data**: Real PocketBase data (119 students: 97 primary + 22 secondary)
- **Fee Items**: Real PocketBase data with category organization
- **Student Fee Assignments**: Real PocketBase data with real-time sync
- **PocketBase**: Fully integrated with smart network detection
- **Authentication**: PocketBase authentication active

### Build Status
- ✅ **TypeScript**: All types correctly defined
- ✅ **Import/Export**: All paths correctly resolved
- ✅ **Build Process**: Successful production build
- ✅ **No Errors**: Clean compilation
- ✅ **Linter**: All linter errors resolved

## 🚀 Deployment Ready

The project is now:
- ✅ **Organized**: Clear directory structure
- ✅ **Clean**: No unused components or debug code
- ✅ **Functional**: All features working with real PocketBase data
- ✅ **Production Ready**: Successful build with no errors
- ✅ **Maintainable**: Clear separation of concerns
- ✅ **Modern UI**: Category-based fee matrix with intuitive controls

## 🔄 Recent Updates

### Student Fee Matrix Refactoring (Latest)
- ✅ **Removed Sub-item Functionality**: Simplified to individual fee items
- ✅ **Category-based Display**: Fees grouped by categories with collapsible sections
- ✅ **Toggle Switch Controls**: Individual fee item assignment
- ✅ **Removed Unused Components**: Deleted BatchOperationsDialog, FeeCard, SubItemForm
- ✅ **Clean Interface**: Streamlined UI without sub-item complexity
- ✅ **Real-time Sync**: Fee assignments sync with PocketBase immediately
