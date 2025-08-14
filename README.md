# PJPC School Management System

A comprehensive school management system built with Next.js, TypeScript, and PocketBase for PJPC (Pusat Jagaan Pendidikan Cemerlang).

## 🚀 Features

### Student Management
- ✅ Add, edit, and delete student records
- ✅ Import student data from Google Sheets
- ✅ Filter students by grade level (Primary/Secondary)
- ✅ Search and sort student information
- ✅ Student statistics and analytics

### Financial Management
- ✅ Fee management and tracking
- ✅ Invoice generation and management
- ✅ Payment processing and reconciliation
- ✅ Receipt generation
- ✅ Financial reports and analytics
- ✅ Reminder system for overdue payments

### User Management
- ✅ Role-based access control (Admin, Teacher, Parent, Accountant)
- ✅ User authentication and authorization
- ✅ Dashboard for different user types

### Additional Features
- ✅ NFC/RFID attendance system
- ✅ Data import from Google Sheets
- ✅ Responsive design for mobile and desktop
- ✅ Real-time data synchronization with PocketBase

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

## 📁 Project Structure

```
pjpc-app-html/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── components/        # React components
│   │   ├── dashboards/    # Dashboard components
│   │   ├── finance/       # Financial management
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
   - `fees` - Fee records
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

### v1.0.0 (Current)
- ✅ Initial release
- ✅ Student management system
- ✅ Financial management
- ✅ Google Sheets integration
- ✅ NFC/RFID attendance system
- ✅ Multi-user dashboard
- ✅ Responsive design

---

**PJPC School Management System** - Empowering education through technology
