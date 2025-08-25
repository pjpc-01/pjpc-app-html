# 🚀 Complete PJPC Setup Guide

## 📋 Overview

This comprehensive guide covers the complete setup process for the PJPC application, including PocketBase configuration, network setup, DDNS configuration, and environment preparation.

## 🎯 Setup Components

- ✅ **PocketBase Setup** - Database and authentication system
- ✅ **Network Configuration** - Local and remote access setup
- ✅ **DDNS Configuration** - Dynamic DNS for remote access
- ✅ **Environment Setup** - Application configuration
- ✅ **Port Configuration** - Port management and firewall setup

## 🗄️ PocketBase Setup

### 1. Download and Install PocketBase

1. **Download PocketBase**:
   - Visit [pocketbase.io](https://pocketbase.io/)
   - Download the latest version for your platform
   - Extract to a dedicated folder (e.g., `C:\pocketbase`)

2. **Start PocketBase**:
   ```bash
   # Windows
   .\pocketbase.exe serve --http="0.0.0.0:8090"
   
   # Linux/macOS
   ./pocketbase serve --http="0.0.0.0:8090"
   ```

3. **Initial Setup**:
   - Access: `http://localhost:8090/_/`
   - Create admin account
   - Configure collections and rules

### 2. PocketBase Collections

The application requires these collections:

#### Users Collection
```json
{
  "name": "users",
  "type": "auth",
  "schema": [
    {
      "name": "name",
      "type": "text",
      "required": true
    },
    {
      "name": "email",
      "type": "email",
      "required": true,
      "unique": true
    },
    {
      "name": "role",
      "type": "select",
      "options": ["admin", "teacher", "parent", "student"]
    },
    {
      "name": "status",
      "type": "select",
      "options": ["active", "inactive", "pending"]
    }
  ]
}
```

#### Students Collection
```json
{
  "name": "students",
  "schema": [
    {
      "name": "student_name",
      "type": "text",
      "required": true
    },
    {
      "name": "student_id",
      "type": "text",
      "required": true,
      "unique": true
    },
    {
      "name": "standard",
      "type": "text"
    },
    {
      "name": "parent_contact",
      "type": "text"
    }
  ]
}
```

#### Fees Collection
```json
{
  "name": "fees",
  "schema": [
    {
      "name": "name",
      "type": "text",
      "required": true
    },
    {
      "name": "amount",
      "type": "number",
      "required": true
    },
    {
      "name": "category",
      "type": "text",
      "required": true
    },
    {
      "name": "description",
      "type": "text"
    }
  ]
}
```

### 3. PocketBase API Rules

Configure API rules for security:

```javascript
// Users collection - authenticated access only
@request.auth.id != "" && @request.auth.role = "admin"

// Students collection - read access for authenticated users
@request.auth.id != ""

// Fees collection - read access for authenticated users
@request.auth.id != ""
```

## 🌐 Network Configuration

### 1. Local Network Setup

#### Find Your Local IP
```bash
# Windows
ipconfig

# Linux/macOS
ifconfig
# or
ip addr
```

Look for your local IP (usually `192.168.x.x` or `10.x.x.x`)

#### Configure PocketBase for Network Access
```bash
# Start PocketBase on all interfaces
.\pocketbase.exe serve --http="0.0.0.0:8090"
```

#### Test Network Access
- **Local**: `http://localhost:8090`
- **Network**: `http://192.168.x.x:8090`

### 2. Firewall Configuration

#### Windows Firewall
```bash
# Allow PocketBase
netsh advfirewall firewall add rule name="PocketBase" dir=in action=allow protocol=TCP localport=8090

# Allow Node.js application
netsh advfirewall firewall add rule name="Node.js App" dir=in action=allow protocol=TCP localport=3000-3010
```

#### Linux Firewall (UFW)
```bash
sudo ufw allow 8090/tcp
sudo ufw allow 3000:3010/tcp
```

### 3. Router Configuration

1. **Port Forwarding**: Forward port 8090 to your server
2. **Static IP**: Assign static IP to your server
3. **DMZ**: Consider DMZ for development (not recommended for production)

## 🌍 DDNS Configuration

### 1. Choose a DDNS Provider

Popular options:
- **No-IP**: Free tier available
- **DuckDNS**: Free, simple setup
- **DynDNS**: Reliable, paid service
- **TP-Link DDNS**: If using TP-Link router

### 2. TP-Link DDNS Setup (Example)

1. **Access Router**: `192.168.0.1` or `192.168.1.1`
2. **Login**: Use admin credentials
3. **Navigate**: Advanced → Network → DDNS
4. **Configure**:
   - **Service Provider**: TP-Link
   - **Domain Name**: `yourname.tplinkdns.com`
   - **Username**: Your TP-Link account
   - **Password**: Your TP-Link password
   - **Status**: Enable

### 3. Update Application Configuration

Update your `.env.local` file:

```bash
# PocketBase Configuration
NEXT_PUBLIC_POCKETBASE_URL=http://yourname.tplinkdns.com:8090
PORT=3000
NODE_ENV=development
```

### 4. Test DDNS Access

- **Local**: `http://localhost:8090`
- **DDNS**: `http://yourname.tplinkdns.com:8090`

## 🔧 Environment Configuration

### 1. Create Environment File

Copy the example configuration:

```bash
# Copy example to local
cp env.example .env.local
```

### 2. Configure Environment Variables

Edit `.env.local`:

```bash
# ========================================
# 网络环境配置
# ========================================

# 局域网环境 (在中心时使用)
# LOCAL_POCKETBASE_URL=http://192.168.0.59:8090

# DDNS环境 (在家或外网时使用) - 推荐配置
NEXT_PUBLIC_POCKETBASE_URL=http://pjpc.tplinkdns.com:8090

# ========================================
# 开发环境配置
# ========================================

# 开发环境端口 (可选)
PORT=3000

# 环境变量
NODE_ENV=development

# ========================================
# Google Sheets API Configuration (SECURE)
# ========================================

# 将你的 serviceAccountKey.json 文件放在项目根目录
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./serviceAccountKey.json

# ========================================
# 安全说明
# ========================================

# - 私钥文件已添加到 .gitignore，不会被提交到Git
# - 凭据只在服务器端处理，不会暴露给前端
# - 请确保 serviceAccountKey.json 文件存在且可读
# - 复制此文件为 .env.local 并根据需要修改配置
```

### 3. Google Sheets API (Optional)

If using Google Sheets integration:

1. **Create Service Account**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project or select existing
   - Enable Google Sheets API
   - Create service account
   - Download JSON key file

2. **Place Key File**:
   ```bash
   # Place in project root
   cp ~/Downloads/service-account-key.json ./serviceAccountKey.json
   ```

## 🔌 Port Configuration

### 1. Default Ports

- **PocketBase**: 8090
- **Application**: 3000 (configurable)
- **HTTPS**: 3000 (same as application)

### 2. Port Management

#### Check Port Availability
```bash
# Windows
netstat -ano | findstr :3000

# Linux/macOS
netstat -tulpn | grep :3000
```

#### Change Application Port
Edit `.env.local`:
```bash
PORT=3001  # Change to available port
```

#### Update PocketBase URL
If changing PocketBase port:
```bash
NEXT_PUBLIC_POCKETBASE_URL=http://pjpc.tplinkdns.com:8091
```

### 3. Port Forwarding

For remote access, forward these ports:
- **8090**: PocketBase
- **3000**: Application (or your chosen port)

## 🚀 Application Startup

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
# Standard development
npm run dev

# With HTTPS (for NFC functionality)
.\start-smart.ps1
```

### 3. Verify Setup

Check these URLs:
- **Application**: `http://localhost:3000`
- **PocketBase Admin**: `http://localhost:8090/_/`
- **PocketBase API**: `http://localhost:8090/api/`

## 🔍 Troubleshooting

### Common Issues

#### 1. PocketBase Connection Failed

**Problem**: Application can't connect to PocketBase

**Solutions**:
1. **Check PocketBase Status**: Ensure PocketBase is running
2. **Verify URL**: Check `NEXT_PUBLIC_POCKETBASE_URL` in `.env.local`
3. **Network Access**: Test `http://localhost:8090` in browser
4. **Firewall**: Ensure port 8090 is open

#### 2. Port Already in Use

**Problem**: Port 3000 or 8090 is occupied

**Solutions**:
1. **Find Process**: `netstat -ano | findstr :3000`
2. **Kill Process**: `taskkill /F /PID <PID>`
3. **Change Port**: Update PORT in `.env.local`

#### 3. DDNS Not Working

**Problem**: Can't access via DDNS URL

**Solutions**:
1. **Check DDNS Status**: Verify DDNS is active in router
2. **Port Forwarding**: Ensure ports are forwarded correctly
3. **ISP Restrictions**: Some ISPs block port 80/443
4. **Test Locally**: Verify local access works first

#### 4. Google Sheets API Error

**Problem**: Google Sheets integration fails

**Solutions**:
1. **Check Key File**: Ensure `serviceAccountKey.json` exists
2. **API Enabled**: Verify Google Sheets API is enabled
3. **Permissions**: Check service account permissions
4. **File Path**: Verify path in `.env.local`

### Network Diagnostics

#### Test Network Connectivity
```bash
# Test PocketBase
curl http://localhost:8090/api/health

# Test application
curl http://localhost:3000

# Test DDNS
curl http://yourname.tplinkdns.com:8090/api/health
```

#### Check Firewall Rules
```bash
# Windows
netsh advfirewall firewall show rule name="PocketBase"

# Linux
sudo ufw status
```

## 🔒 Security Considerations

### Development Environment
- **Local Network Only**: Restrict access to local network
- **Strong Passwords**: Use strong admin passwords
- **Regular Updates**: Keep PocketBase updated
- **Backup Data**: Regular backups of PocketBase data

### Production Environment
- **HTTPS Only**: Use SSL certificates
- **Domain Setup**: Use proper domain names
- **Access Control**: Implement proper authentication
- **Monitoring**: Set up monitoring and logging
- **Backup Strategy**: Automated backup system

## 📊 Monitoring and Maintenance

### Health Checks

Monitor these endpoints:
- **PocketBase Health**: `http://localhost:8090/api/health`
- **Application Status**: `http://localhost:3000/api/health`
- **Database Status**: Check PocketBase admin panel

### Regular Maintenance

1. **Backup PocketBase Data**: Export collections regularly
2. **Update Dependencies**: `npm update`
3. **Monitor Logs**: Check application and PocketBase logs
4. **Performance**: Monitor response times and resource usage

## ✅ Setup Checklist

Before going live, verify:

- [ ] PocketBase is running and accessible
- [ ] Application starts without errors
- [ ] Database collections are configured
- [ ] Environment variables are set correctly
- [ ] Network access works (local and remote)
- [ ] DDNS is configured and working
- [ ] Firewall rules are in place
- [ ] Port forwarding is configured
- [ ] Google Sheets API is set up (if needed)
- [ ] HTTPS is working (for NFC functionality)
- [ ] All features are tested and working

## 🎉 Summary

This complete setup guide provides:

- ✅ **Step-by-step instructions** for all components
- ✅ **Network configuration** for local and remote access
- ✅ **DDNS setup** for dynamic IP management
- ✅ **Security considerations** for development and production
- ✅ **Troubleshooting guide** for common issues
- ✅ **Monitoring and maintenance** procedures

Your PJPC application is now ready for development and deployment! 🚀
