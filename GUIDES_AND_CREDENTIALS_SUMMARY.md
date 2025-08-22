# 📚 PJPC Application Guides & Credentials Summary

## 🎯 Overview

This document provides a comprehensive overview of all available guides and credentials for the PJPC application. The documentation has been organized and consolidated for better maintainability and easier navigation.

## 📋 Available Guides

### 1. **Core Documentation**
- **README.md** - Main project documentation and quick start guide
- **PROJECT_STRUCTURE.md** - Complete project structure and architecture documentation

### 2. **Complete Setup Guide**
- **POCKETBASE_SETUP_GUIDE.md** - Comprehensive setup guide covering:
  - PocketBase installation and configuration
  - Network setup and firewall configuration
  - DDNS configuration for remote access
  - Environment configuration
  - Port management and troubleshooting

### 3. **HTTPS & NFC Setup**
- **SMART_HTTPS_GUIDE.md** - Complete HTTPS and NFC setup guide covering:
  - Smart HTTPS server configuration
  - Mobile NFC functionality setup
  - SSL certificate generation
  - Troubleshooting and security considerations

### 4. **Feature-Specific Guides**
- **AI_USER_APPROVAL_SYSTEM.md** - AI-powered user approval system documentation
- **USER_APPROVAL_SYSTEM_COMPLETION.md** - User approval system completion status
- **STUDENT_FEE_MATRIX_GUIDE.md** - Student fee matrix system documentation
- **ATTENDANCE_SETUP.md** - Attendance system configuration guide
- **CSV_IMPORT_GUIDE.md** - Data import functionality guide
- **GOOGLE_SHEETS_SETUP.md** - Google Sheets API integration guide

## 🔧 Configuration Files

### Environment Configuration
- **env.example** - Environment configuration template
- **.env.local** - Local environment variables (not in Git)

### Application Configuration
- **package.json** - Dependencies and scripts
- **next.config.mjs** - Next.js configuration
- **tailwind.config.ts** - Tailwind CSS configuration
- **tsconfig.json** - TypeScript configuration

## 🚀 Startup Scripts

### Development Servers
- **start-dev.ps1** - Standard development server startup
- **start-smart.ps1** - Smart HTTPS server startup (recommended for NFC)
- **start-ngrok.bat** - Ngrok tunnel for external access

### Server Files
- **smart-https-server.js** - Advanced HTTPS server with automatic certificate generation

## 🔐 Credentials & Security

### PocketBase Access
- **URL**: `http://pjpc.tplinkdns.com:8090/_/`
- **Email**: `pjpcemerlang@gmail.com`
- **Password**: `0122270775Sw!`

### Environment Variables
```bash
# PocketBase Configuration
NEXT_PUBLIC_POCKETBASE_URL=http://pjpc.tplinkdns.com:8090
PORT=3000
NODE_ENV=development

# Google Sheets API (Optional)
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./serviceAccountKey.json
```

## 📱 Access URLs

### Local Development
- **Application**: `http://localhost:3000`
- **HTTPS Application**: `https://localhost:3000`
- **PocketBase Admin**: `http://localhost:8090/_/`
- **PocketBase API**: `http://localhost:8090/api/`

### Network Access
- **Application**: `http://192.168.x.x:3000`
- **HTTPS Application**: `https://192.168.x.x:3000`
- **PocketBase**: `http://192.168.x.x:8090`

### Remote Access (DDNS)
- **Application**: `http://pjpc.tplinkdns.com:3000`
- **HTTPS Application**: `https://pjpc.tplinkdns.com:3000`
- **PocketBase**: `http://pjpc.tplinkdns.com:8090`

### Mobile NFC Pages
- **NFC Test**: `https://192.168.x.x:3000/mobile-nfc-test`
- **NFC Main**: `https://192.168.x.x:3000/mobile-nfc`

## 🔍 Quick Troubleshooting

### Common Issues

#### 1. PocketBase Connection Failed
- Check if PocketBase is running on port 8090
- Verify `NEXT_PUBLIC_POCKETBASE_URL` in `.env.local`
- Ensure firewall allows port 8090

#### 2. HTTPS Server Issues
- Run `.\start-smart.ps1` for automatic HTTPS setup
- Check if port 3000 is available
- Verify SSL certificate generation

#### 3. Mobile NFC Not Working
- Ensure using HTTPS connection
- Check if device supports NFC
- Verify browser permissions

#### 4. Network Access Issues
- Check firewall rules for ports 3000-3010 and 8090
- Verify router port forwarding
- Test with `ping [YOUR_IP]`

## 📊 Project Status

### ✅ Working Features
- **Student Management**: Full CRUD operations with PocketBase
- **Financial Management**: Complete fee, invoice, and payment system
- **Student Fee Matrix**: Category-based fee allocation
- **Authentication**: PocketBase authentication system
- **Mobile NFC**: HTTPS-enabled NFC functionality
- **User Approval**: AI-powered approval workflow
- **Data Import**: CSV and Google Sheets integration

### 🔧 Technical Stack
- **Frontend**: Next.js 14 with App Router
- **Backend**: Next.js API Routes
- **Database**: PocketBase
- **UI**: Tailwind CSS + shadcn/ui
- **Authentication**: PocketBase Auth
- **HTTPS**: Custom smart HTTPS server
- **NFC**: Web NFC API

### 📁 Organized Structure
- **Finance Components**: Organized into logical subdirectories
- **Clean Codebase**: Removed 30+ unnecessary files
- **Consolidated Documentation**: Combined duplicate guides
- **Streamlined Scripts**: Essential startup scripts only

## 🎯 Getting Started

### 1. Initial Setup
```bash
# Clone repository
git clone https://github.com/pjpc-01/pjpc-app-html.git
cd pjpc-app-html

# Install dependencies
npm install

# Copy environment configuration
cp env.example .env.local

# Start development server
npm run dev
```

### 2. HTTPS Setup (for NFC)
```bash
# Start smart HTTPS server
.\start-smart.ps1
```

### 3. PocketBase Setup
- Follow **POCKETBASE_SETUP_GUIDE.md** for complete setup
- Configure collections and API rules
- Set up DDNS for remote access

## 📞 Support

### Documentation Priority
1. **POCKETBASE_SETUP_GUIDE.md** - Complete setup instructions
2. **SMART_HTTPS_GUIDE.md** - HTTPS and NFC configuration
3. **PROJECT_STRUCTURE.md** - Architecture and organization
4. **Feature-specific guides** - For specific functionality

### Troubleshooting Resources
- Check individual guide troubleshooting sections
- Review console logs for error messages
- Verify network connectivity and firewall settings
- Test with different browsers and devices

## 🔄 Recent Updates

### Documentation Consolidation
- ✅ **Combined HTTPS guides** into single comprehensive guide
- ✅ **Merged setup guides** into complete setup documentation
- ✅ **Removed redundant files** for cleaner structure
- ✅ **Updated project structure** documentation
- ✅ **Streamlined navigation** with clear guide organization

### Project Cleanup
- ✅ **Removed 30+ unnecessary files**
- ✅ **Organized finance components** into subdirectories
- ✅ **Consolidated startup scripts**
- ✅ **Cleaned documentation** structure

## 🎉 Summary

The PJPC application now has:

- ✅ **Comprehensive documentation** covering all aspects
- ✅ **Organized and clean** project structure
- ✅ **Consolidated guides** for easier maintenance
- ✅ **Complete setup instructions** for all components
- ✅ **Troubleshooting resources** for common issues
- ✅ **Security considerations** for development and production

All guides are now up-to-date and reflect the current clean project structure! 🚀
