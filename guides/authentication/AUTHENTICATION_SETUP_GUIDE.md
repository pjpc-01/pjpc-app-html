# 🔐 Authentication Setup Guide

## Overview

This guide provides comprehensive instructions for setting up and maintaining authentication in your PocketBase-integrated application to prevent authentication problems.

## 🚨 Critical Issues Found & Fixed

### 1. **Hardcoded Credentials** ❌ → ✅ **FIXED**
- **Issue**: Hardcoded PocketBase URL and credentials in source code
- **Fix**: Moved to environment variables and centralized configuration
- **Files Updated**: 
  - `lib/pocketbase.ts` - Now uses environment variables
  - `lib/auth-config.ts` - New centralized auth configuration
  - `contexts/pocketbase-auth-context.tsx` - Removed hardcoded values

### 2. **Missing Environment Configuration** ❌ → ✅ **FIXED**
- **Issue**: No `.env.local` file for local development
- **Fix**: Created proper environment variable structure
- **Solution**: Copy `env.local.example` to `.env.local` and configure

### 3. **Inconsistent Error Handling** ❌ → ✅ **FIXED**
- **Issue**: Scattered error messages and inconsistent handling
- **Fix**: Centralized error message system in `auth-config.ts`
- **Benefit**: Consistent, localized error messages across the app

### 4. **Weak Password Validation** ❌ → ✅ **FIXED**
- **Issue**: Inconsistent password strength requirements
- **Fix**: Centralized password validation with configurable rules
- **Features**: Configurable length, character requirements, etc.

## 📋 Setup Instructions

### Step 1: Environment Configuration

1. **Create `.env.local` file**:
   ```bash
   cp env.local.example .env.local
   ```

2. **Configure your environment variables**:
   ```env
   # PocketBase Configuration
   NEXT_PUBLIC_POCKETBASE_URL=http://pjpc.tplinkdns.com:8090
   PORT=3001
   NODE_ENV=development
   
   # Authentication Settings
   NEXT_PUBLIC_AUTH_ENABLED=true
   NEXT_PUBLIC_EMAIL_VERIFICATION_REQUIRED=false
   NEXT_PUBLIC_ADMIN_APPROVAL_REQUIRED=true
   
   # Development Settings
   NEXT_PUBLIC_DEBUG_MODE=true
   NEXT_PUBLIC_LOG_LEVEL=info
   ```

### Step 2: PocketBase Server Setup

1. **Ensure PocketBase is running** on your configured URL
2. **Create required collections**:
   - `users` - For user authentication
   - `students` - For student data
   - `fees` - For fee management
   - `invoices` - For invoice management
   - `payments` - For payment tracking
   - `receipts` - For receipt management
   - `reminders` - For payment reminders

3. **Set up collection rules**:
   ```javascript
   // Example: users collection rules
   {
     "listRule": "@request.auth.id != ''",
     "viewRule": "@request.auth.id != ''",
     "createRule": "@request.auth.id != ''",
     "updateRule": "@request.auth.id = id || @request.auth.role = 'admin'",
     "deleteRule": "@request.auth.role = 'admin'"
   }
   ```

### Step 3: Authentication Verification

Run the authentication verification script:
```bash
npm run verify:auth
```

This script will:
- ✅ Check environment variables
- ✅ Verify PocketBase configuration
- ✅ Validate authentication context
- ✅ Check API routes
- ✅ Verify login forms
- ✅ Check dependencies
- ✅ Identify common issues

### Step 4: Test Authentication Flow

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Test user registration**:
   - Navigate to the login page
   - Try registering a new user
   - Verify password strength validation
   - Check admin approval flow

3. **Test user login**:
   - Login with valid credentials
   - Test with invalid credentials
   - Verify error messages
   - Check role-based access

4. **Test password reset**:
   - Request password reset
   - Verify email functionality
   - Test reset token validation

## 🔧 Configuration Options

### Authentication Settings (`lib/auth-config.ts`)

```typescript
// User roles and permissions
roles: {
  admin: { permissions: ['all'] },
  teacher: { permissions: ['students', 'attendance', 'grades'] },
  parent: { permissions: ['own_children', 'payments', 'schedule'] },
  accountant: { permissions: ['fees', 'payments', 'reports', 'invoices'] }
}

// Security settings
security: {
  passwordMinLength: 8,
  requireSpecialChars: true,
  requireNumbers: true,
  requireUppercase: true,
  requireLowercase: true,
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
}
```

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_POCKETBASE_URL` | PocketBase server URL | `http://pjpc.tplinkdns.com:8090` | ✅ |
| `PORT` | Development server port | `3001` | ❌ |
| `NEXT_PUBLIC_AUTH_ENABLED` | Enable authentication | `true` | ❌ |
| `NEXT_PUBLIC_EMAIL_VERIFICATION_REQUIRED` | Require email verification | `false` | ❌ |
| `NEXT_PUBLIC_ADMIN_APPROVAL_REQUIRED` | Require admin approval | `true` | ❌ |
| `NEXT_PUBLIC_DEBUG_MODE` | Enable debug mode | `true` | ❌ |

## 🛡️ Security Best Practices

### 1. **Environment Variables**
- ✅ Never commit `.env.local` to version control
- ✅ Use environment variables for all sensitive data
- ✅ Validate environment variables on startup

### 2. **Password Security**
- ✅ Enforce strong password requirements
- ✅ Implement account lockout after failed attempts
- ✅ Use secure password hashing (handled by PocketBase)

### 3. **Session Management**
- ✅ Implement proper session timeout
- ✅ Clear sessions on logout
- ✅ Validate session tokens

### 4. **Error Handling**
- ✅ Don't expose sensitive information in error messages
- ✅ Log errors for debugging
- ✅ Provide user-friendly error messages

### 5. **Access Control**
- ✅ Implement role-based access control
- ✅ Validate permissions on every request
- ✅ Use principle of least privilege

## 🔍 Troubleshooting

### Common Authentication Issues

#### 1. **Connection Failed**
```
Error: 无法连接到PocketBase服务器
```
**Solution**:
- Check if PocketBase server is running
- Verify the URL in `.env.local`
- Check network connectivity
- Run `npm run verify:auth` to diagnose

#### 2. **Authentication Failed**
```
Error: 用户不存在或密码错误
```
**Solution**:
- Verify user exists in PocketBase
- Check password is correct
- Ensure user status is 'approved'
- Check collection permissions

#### 3. **Permission Denied**
```
Error: 403 Forbidden
```
**Solution**:
- Check user role and permissions
- Verify collection rules in PocketBase
- Ensure user is authenticated
- Check API route permissions

#### 4. **Email Verification Required**
```
Error: 请先验证您的邮箱地址
```
**Solution**:
- Set `NEXT_PUBLIC_EMAIL_VERIFICATION_REQUIRED=false` for development
- Configure email settings in PocketBase
- Check email verification flow

### Debug Mode

Enable debug mode to get detailed error information:
```env
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_LOG_LEVEL=debug
```

### Verification Commands

```bash
# Run full authentication verification
npm run verify:auth

# Check network connectivity
npm run test:network

# Test PocketBase authentication
npm run test:auth

# Test permissions
npm run test:permissions
```

## 📊 Monitoring & Logging

### Authentication Logs

The system logs authentication events for monitoring:
- Login attempts (success/failure)
- User registration
- Password resets
- Session management
- Permission violations

### Health Checks

Regular health checks ensure system reliability:
- PocketBase connection status
- Authentication service availability
- Database connectivity
- API endpoint responsiveness

## 🚀 Production Deployment

### Pre-deployment Checklist

- [ ] Environment variables configured
- [ ] PocketBase server secured
- [ ] SSL certificates installed
- [ ] Database backups configured
- [ ] Monitoring set up
- [ ] Error tracking configured
- [ ] Performance monitoring enabled

### Security Hardening

1. **Disable debug mode**:
   ```env
   NEXT_PUBLIC_DEBUG_MODE=false
   ```

2. **Enable email verification**:
   ```env
   NEXT_PUBLIC_EMAIL_VERIFICATION_REQUIRED=true
   ```

3. **Configure proper logging**:
   ```env
   NEXT_PUBLIC_LOG_LEVEL=warn
   ```

4. **Set up monitoring**:
   - Application performance monitoring
   - Error tracking (Sentry, etc.)
   - Authentication event logging
   - Security incident monitoring

## 📞 Support

If you encounter authentication issues:

1. **Run verification script**: `npm run verify:auth`
2. **Check logs**: Look for error messages in console
3. **Verify configuration**: Ensure all environment variables are set
4. **Test connectivity**: Verify PocketBase server is accessible
5. **Review permissions**: Check user roles and collection rules

## ✅ Success Indicators

Your authentication is properly configured when:

- ✅ `npm run verify:auth` shows all green checkmarks
- ✅ Users can register and login successfully
- ✅ Role-based access control works correctly
- ✅ Password reset functionality works
- ✅ Error messages are user-friendly
- ✅ No hardcoded credentials in source code
- ✅ Environment variables are properly configured
- ✅ PocketBase connection is stable
- ✅ All API routes respond correctly

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
