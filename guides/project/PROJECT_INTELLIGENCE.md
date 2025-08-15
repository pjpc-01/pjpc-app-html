# 🧠 PROJECT INTELLIGENCE FILE

**Purpose**: This file serves as a comprehensive reference for AI assistants to quickly understand your project structure, authentication setup, and key configurations without needing to re-analyze everything.

**Last Updated**: December 2024  
**Project**: PJPC App HTML - PocketBase Integrated Education Management System

## 🏗️ PROJECT OVERVIEW

### **Project Type**: Next.js 15 + TypeScript + PocketBase
### **Purpose**: Education Management System for After-School Programs
### **Architecture**: Full-stack with PocketBase backend
### **Authentication**: Custom PocketBase-based auth system

## 🔐 AUTHENTICATION ARCHITECTURE

### **Core Files**:
- `contexts/pocketbase-auth-context.tsx` - Main auth context
- `lib/pocketbase.ts` - PocketBase configuration
- `lib/auth-config.ts` - Centralized auth configuration
- `app/components/systems/auth/` - Login forms

### **Key Features**:
- ✅ Role-based access control (admin, teacher, parent, accountant)
- ✅ User registration with admin approval
- ✅ Password strength validation
- ✅ Session management
- ✅ Error handling with localization

### **User Roles & Permissions**:
```typescript
admin: ['all'] // Full access
teacher: ['students', 'attendance', 'grades']
parent: ['own_children', 'payments', 'schedule']
accountant: ['fees', 'payments', 'reports', 'invoices']
```

## 🌐 NETWORK CONFIGURATION

### **PocketBase URLs**:
- **Primary**: `http://pjpc.tplinkdns.com:8090` (DDNS)
- **Fallback**: `http://192.168.0.59:8090` (LAN)
- **Port**: 3001 (development)

### **Environment Variables** (Required):
```env
NEXT_PUBLIC_POCKETBASE_URL=http://pjpc.tplinkdns.com:8090
PORT=3001
NODE_ENV=development
```

## 📁 CRITICAL FILE STRUCTURE

### **Authentication Files**:
```
contexts/pocketbase-auth-context.tsx    # Main auth context
lib/pocketbase.ts                       # PocketBase config
lib/auth-config.ts                      # Auth configuration
app/components/systems/auth/            # Login forms
app/api/pocketbase/[...path]/route.ts   # API proxy
```

### **Dashboard Components**:
```
app/components/dashboards/
├── admin-dashboard.tsx
├── teacher-dashboard.tsx
├── parent-dashboard.tsx
└── accountant-dashboard.tsx
```

### **Financial System**:
```
app/components/finance/                 # Fee management
hooks/useFees.ts                       # Fee hooks
hooks/useInvoices.ts                   # Invoice hooks
hooks/usePayments.ts                   # Payment hooks
```

## 🔧 QUICK STARTUP COMMANDS

### **Development**:
```bash
npm run dev                    # Start development server
npm run verify:auth           # Verify authentication setup
npm run test:network          # Test network connectivity
```

### **Verification Scripts**:
```bash
node scripts/auth-verification.js    # Full auth verification
```

## 🚨 COMMON ISSUES & SOLUTIONS

### **1. Authentication Problems**:
- **Issue**: Connection failed to PocketBase
- **Solution**: Check if PocketBase server is running on configured URL
- **Command**: `npm run verify:auth`

### **2. Environment Variables**:
- **Issue**: Missing `.env.local` file
- **Solution**: Copy from `env.local.example`
- **Command**: `cp env.local.example .env.local`

### **3. Debug Logging**:
- **Issue**: Too many console.log statements
- **Files**: `lib/pocketbase.ts`, `contexts/pocketbase-auth-context.tsx`
- **Solution**: Use conditional logging for production

## 📊 POCKETBASE COLLECTIONS

### **Required Collections**:
- `users` - User authentication
- `students` - Student data
- `fees` - Fee management
- `invoices` - Invoice management
- `payments` - Payment tracking
- `receipts` - Receipt management
- `reminders` - Payment reminders

### **Collection Rules** (Example):
```javascript
{
  "listRule": "@request.auth.id != ''",
  "viewRule": "@request.auth.id != ''",
  "createRule": "@request.auth.id != ''",
  "updateRule": "@request.auth.id = id || @request.auth.role = 'admin'",
  "deleteRule": "@request.auth.role = 'admin'"
}
```

## 🛠️ DEVELOPMENT WORKFLOW

### **1. Startup Sequence**:
1. Ensure PocketBase server is running
2. Check environment variables
3. Run `npm run verify:auth`
4. Start development server: `npm run dev`

### **2. Testing Authentication**:
1. Register a new user
2. Test login with credentials
3. Verify role-based access
4. Test password reset functionality

### **3. Common Development Tasks**:
- **Add new feature**: Create component in appropriate dashboard
- **Fix auth issue**: Check `contexts/pocketbase-auth-context.tsx`
- **Update permissions**: Modify `lib/auth-config.ts`
- **Add API route**: Create in `app/api/`

## 🔍 DEBUGGING GUIDE

### **Authentication Issues**:
1. Check browser console for errors
2. Verify PocketBase connection: `npm run test:network`
3. Check user status in PocketBase admin
4. Verify collection permissions

### **Network Issues**:
1. Test both URLs: DDNS and LAN
2. Check firewall settings
3. Verify PocketBase server status
4. Test with `npm run test:network`

### **Performance Issues**:
1. Check for excessive console.log statements
2. Verify bundle size
3. Check API response times
4. Monitor memory usage

## 📝 KEY CONFIGURATIONS

### **Password Requirements**:
- Minimum length: 8 characters
- Must include: uppercase, lowercase, numbers, special characters
- Configurable in `lib/auth-config.ts`

### **Session Management**:
- Timeout: 24 hours
- Lockout after 5 failed attempts
- Lockout duration: 15 minutes

### **Error Messages**:
- Localized in Chinese
- Centralized in `lib/auth-config.ts`
- User-friendly and secure

## 🚀 PRODUCTION DEPLOYMENT

### **Pre-deployment Checklist**:
- [ ] Environment variables configured
- [ ] Debug logging disabled
- [ ] SSL certificates installed
- [ ] Database backups configured
- [ ] Monitoring set up

### **Security Hardening**:
```env
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_EMAIL_VERIFICATION_REQUIRED=true
NEXT_PUBLIC_LOG_LEVEL=warn
```

## 📞 SUPPORT RESOURCES

### **Documentation Files**:
- `AUTHENTICATION_SETUP_GUIDE.md` - Detailed setup instructions
- `AUTHENTICATION_VERIFICATION_REPORT.md` - Verification results
- `POCKETBASE_INTEGRATION_STATUS.md` - Integration status
- `VERIFICATION_REPORT.md` - Hook verification

### **Scripts**:
- `scripts/auth-verification.js` - Authentication verification
- `scripts/check-fees.js` - Fee checking

## 🎯 SUCCESS INDICATORS

### **Authentication Working When**:
- ✅ Users can register and login
- ✅ Role-based access control works
- ✅ Password reset functionality works
- ✅ Error messages are user-friendly
- ✅ No authentication errors in logs
- ✅ Response times under 2 seconds

### **System Healthy When**:
- ✅ `npm run verify:auth` shows all green
- ✅ PocketBase connection stable
- ✅ All API routes respond correctly
- ✅ No hardcoded credentials
- ✅ Environment variables properly set

## 🔄 MAINTENANCE TASKS

### **Monthly**:
- Run `npm run verify:auth`
- Update dependencies
- Review security settings
- Monitor authentication logs

### **Quarterly**:
- Full security audit
- Performance optimization
- Backup verification
- Documentation updates

---

## 💡 FOR AI ASSISTANTS

**When helping with this project**:

1. **Always check this file first** for project context
2. **Use the verification script** to diagnose issues: `npm run verify:auth`
3. **Check environment variables** before making changes
4. **Follow the established patterns** in existing components
5. **Test authentication flow** after any auth-related changes
6. **Use the centralized config** in `lib/auth-config.ts`
7. **Check PocketBase connection** if experiencing issues
8. **Follow the role-based permissions** when adding features

**Key Commands to Remember**:
```bash
npm run verify:auth    # Verify authentication setup
npm run dev           # Start development server
npm run test:network  # Test network connectivity
```

**Critical Files to Check**:
- `contexts/pocketbase-auth-context.tsx` - Auth logic
- `lib/pocketbase.ts` - PocketBase config
- `lib/auth-config.ts` - Auth configuration
- `.env.local` - Environment variables

---

**This file should be updated whenever significant changes are made to the project structure or authentication system.**
