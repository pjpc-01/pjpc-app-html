# 🏫 PJPC School ERP System

A comprehensive **School ERP (Enterprise Resource Planning)** system built with Next.js, TypeScript, and PocketBase for PJPC (Pusat Jagaan Pendidikan Cemerlang). This system follows a modular architecture supporting **Education → Finance → Accounting** operations.

## 🏗️ System Architecture

### 📚 Education Module
- **Student Management**: Complete student lifecycle from enrollment to graduation
- **Teacher Management**: Teacher profiles, subject assignments, and schedules
- **Attendance System**: NFC/RFID-based daily attendance tracking
- **Academic Reporting**: Performance analytics and progress tracking
- **Parent Portal**: Real-time access to student information

### 💰 Finance Module
- **Fee Management**: Comprehensive fee structure with categories
- **Student Fee Matrix**: Dynamic fee assignment system
- **Invoice Generation**: Automated invoice creation and management
- **Payment Processing**: Online/offline payment handling
- **Receipt Management**: Automated receipt generation and delivery
- **Reminder System**: Configurable payment reminders and notifications

### 📊 Accounting Module (Future)
- **General Ledger**: Central financial transaction repository
- **Accounts Receivable**: Income tracking and management
- **Accounts Payable**: Expense management and vendor payments
- **Financial Reporting**: P&L, Balance Sheet, Cash Flow statements

## 🚀 Key Features

### ✅ Completed Features
- **Student Management**: CRUD operations, Google Sheets import, analytics
- **Teacher Management**: Profile management, subject assignments
- **Attendance System**: NFC/RFID integration, real-time tracking
- **Fee Management**: Category-based fee structure, matrix assignment
- **Invoice System**: Automated generation, PDF creation, email delivery
- **Payment Processing**: Multi-method payments, status tracking
- **Receipt Management**: Auto-generation, email delivery, PDF downloads
- **Reminder System**: Configurable notifications, escalation handling
- **User Management**: Role-based access control (Admin, Teacher, Parent, Accountant)
- **Data Import**: Google Sheets integration for bulk operations
- **Real-time Sync**: Live data synchronization with PocketBase
- **Responsive Design**: Mobile and desktop optimized interfaces

### 🚧 In Development
- **Advanced Analytics**: Performance trends and predictive insights
- **Parent Portal**: Enhanced parent communication and payment gateway
- **Communication System**: Integrated messaging and notifications

### 📋 Planned Features
- **Accounting Module**: Full financial accounting capabilities
- **Payroll System**: Automated salary processing
- **Inventory Management**: Supply and resource tracking
- **AI Integration**: Predictive analytics and automated decision-making

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **UI Components**: Radix UI, Tailwind CSS
- **Backend**: PocketBase (Go-based backend)
- **Database**: SQLite (via PocketBase)
- **Authentication**: PocketBase Auth
- **Data Import**: Google Sheets API
- **Deployment**: Vercel (Frontend), PocketBase (Backend)

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- PocketBase server
- Google Service Account (for data import)

## 📋 Development Phases

### Phase 1: Education Module ✅ Complete
- [x] Student management system
- [x] Teacher management system
- [x] Basic attendance tracking
- [x] Academic reporting

### Phase 2: Finance Module ✅ Complete
- [x] Fee management system
- [x] Student fee matrix
- [x] Invoice generation
- [x] Payment processing
- [x] Receipt management
- [x] Reminder system

### Phase 3: Advanced Education 🚧 In Progress
- [ ] Advanced attendance (NFC/RFID)
- [ ] Performance analytics
- [ ] Enhanced parent portal
- [ ] Communication system

### Phase 4: Accounting Module 📋 Planned
- [ ] General ledger setup
- [ ] Accounts receivable/payable
- [ ] Financial reporting
- [ ] Cash management

### Phase 5: Advanced Features 📋 Future
- [ ] Payroll automation
- [ ] Inventory management
- [ ] AI-powered analytics
- [ ] Mobile applications

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/pjpc-app-html.git
cd pjpc-app-html
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# PocketBase Configuration
NEXT_PUBLIC_POCKETBASE_URL=http://your-pocketbase-url:8090
LOCAL_POCKETBASE_URL=http://192.168.0.59:8090

# Google Sheets API (for data import)
GOOGLE_SERVICE_ACCOUNT_JSON={"your":"service_account_json_here"}
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🔄 Workflow Architecture

This system follows a comprehensive workflow blueprint that mirrors real school operations:

### 📚 Education Workflows
- **Student Enrollment**: Registration → Class Assignment → Parent Linking → Academic Setup
- **Teacher Management**: Registration → Subject Assignment → Schedule Management → Class Linking
- **Attendance System**: Daily Check-in → Data Validation → Database Storage → Parent Notification
- **Academic Reporting**: Data Collection → Performance Analysis → Report Generation → Distribution

### 💰 Finance Workflows
- **Fee Management**: Fee Creation → Category Assignment → Student Assignment → Invoice Generation
- **Payment Processing**: Payment Received → Status Update → Receipt Generation → Ledger Update
- **Reminder System**: Due Date Check → Reminder Trigger → Notification Send → Status Update

### 🔗 Cross-Module Integration
- **Education → Finance**: Student records feed into fee matrix
- **Finance → Accounting**: Invoices and payments feed into general ledger
- **Accounting → Admin**: Financial reports provide KPI insights

For detailed workflow documentation, see [WORKFLOW_BLUEPRINT.md](./WORKFLOW_BLUEPRINT.md)

## 📁 Project Structure
pjpc-app-html/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── components/        # React components
│   │   ├── dashboards/    # Dashboard components
│   │   ├── finance/       # Financial management
│   │   │   └── student-fee-matrix/  # Student fee allocation system
│   │   ├── management/    # Admin management
│   │   ├── student/       # Student management
│   │   └── systems/       # System components
│   └── page.tsx           # Main page
├── components/            # Shared UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
├── contexts/              # React contexts
└── public/                # Static assets
```

## 🔧 Configuration

### PocketBase Setup

1. Download PocketBase from [pocketbase.io](https://pocketbase.io/)
2. Run PocketBase server
3. Create collections for:
   - `students` - Student records
   - `users` - User accounts
   - `fees_items` - Fee items with categories
   - `student_fees` - Student fee assignments
   - `invoices` - Invoice records
   - `payments` - Payment records
   - `receipts` - Receipt records

### Google Sheets Integration

1. Create a Google Service Account
2. Enable Google Sheets API
3. Share your Google Sheets with the service account email
4. Add the service account JSON to environment variables

## 📊 Data Import

The system supports importing student data from Google Sheets:

1. Go to `/data-import` page
2. Download the template or use your own Google Sheets
3. Enter the Spreadsheet ID
4. Preview and import data

### Supported Column Formats

- **姓名** / **Name** - Student name (required)
- **年级** / **Grade** - Grade level (e.g., "Standard 1")
- **性别** / **Gender** - Student gender
- **出生日期** / **Date of Birth** - Birth date (YYYY-MM-DD)
- **父亲电话** / **Father Phone** - Father's phone number
- **母亲电话** / **Mother Phone** - Mother's phone number
- **家庭地址** / **Address** - Home address

## 🎯 Student Fee Matrix Usage

### Accessing the Fee Matrix
1. Navigate to Finance Management
2. Click on "Student Fee Allocation" tab
3. The matrix displays all students with their assigned fees

### Managing Fee Assignments
1. **Enable Edit Mode**: Click the "编辑" (Edit) button
2. **Expand Categories**: Click on category headers to expand/collapse
3. **Assign Fees**: Toggle switches to assign/unassign fees to students
4. **Batch Operations**: Use batch mode for multiple students
5. **Create Invoices**: Click the invoice button to generate invoices

### Features
- **Category Organization**: Fees are grouped by categories (e.g., "学费", "杂费")
- **Real-time Updates**: Changes sync immediately with PocketBase
- **Search & Filter**: Find students by name, grade, or other criteria
- **Payment Tracking**: View payment status for each student
- **Invoice Generation**: Create invoices from assigned fees

## 🚀 Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (PocketBase)

1. Deploy PocketBase to your preferred server
2. Configure domain and SSL
3. Update environment variables with production URLs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation in the `/docs` folder

## 🔄 Changelog

### v1.1.0 (Latest)
- ✅ **Student Fee Matrix Refactoring**: Removed sub-item complexity
- ✅ **Category-based Display**: Fees organized by categories with collapsible sections
- ✅ **Individual Fee Toggles**: Toggle switches for each fee item
- ✅ **Clean Interface**: Streamlined UI without sub-item complexity
- ✅ **Real-time Sync**: Fee assignments sync with PocketBase immediately
- ✅ **Smart Network Detection**: Automatic PocketBase URL detection
- ✅ **AbortController Integration**: Improved request handling and cancellation

### v1.0.0
- ✅ Initial release
- ✅ Student management system
- ✅ Financial management
- ✅ Google Sheets integration
- ✅ NFC/RFID attendance system
- ✅ Multi-user dashboard
- ✅ Responsive design

---

**PJPC School Management System** - Empowering education through technology
