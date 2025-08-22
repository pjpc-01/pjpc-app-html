# 🚀 Complete HTTPS & NFC Setup Guide

## 📋 Overview

This comprehensive guide covers everything you need to set up HTTPS for your PJPC application, including mobile NFC functionality support. The smart HTTPS server provides automatic SSL certificate generation and seamless NFC integration.

## 🎯 Features

- ✅ **Automatic SSL Certificate Generation** - No manual certificate setup required
- ✅ **Mobile NFC Support** - Full NFC functionality on mobile devices
- ✅ **Smart Port Detection** - Automatically finds available ports
- ✅ **Fallback Support** - HTTP fallback if HTTPS fails
- ✅ **Cross-platform** - Works on Windows, macOS, and Linux
- ✅ **Production Ready** - Secure HTTPS with valid certificates

## 🚀 Quick Start

### 1. Start Smart HTTPS Server

```bash
# Option 1: Using PowerShell script
.\start-smart.ps1

# Option 2: Direct Node.js execution
node smart-https-server.js

# Option 3: Using npm script (if configured)
npm run smart
```

### 2. Access Your Application

Once started, you'll see output like:

```
🎉 智能HTTPS服务器启动成功！
📱 本地访问: https://localhost:3000
🌐 网络访问: https://192.168.0.72:3000
📋 手机NFC页面: https://192.168.0.72:3000/mobile-nfc
🧪 NFC测试页面: https://192.168.0.72:3000/mobile-nfc-test
```

### 3. Mobile NFC Access

- **Local Testing**: `https://localhost:3000/mobile-nfc`
- **Network Access**: `https://[YOUR_IP]:3000/mobile-nfc`
- **NFC Test Page**: `https://[YOUR_IP]:3000/mobile-nfc-test`

## 🔧 Configuration

### Environment Variables

Your `.env.local` file should contain:

```bash
# PocketBase Configuration
NEXT_PUBLIC_POCKETBASE_URL=http://pjpc.tplinkdns.com:8090
PORT=3000
NODE_ENV=development

# Google Sheets API Configuration (Optional)
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./serviceAccountKey.json
```

### Port Configuration

The smart server automatically detects available ports in this order:
- 3000 (default)
- 3001, 3002, 3003, 3004, 3005
- 3006, 3007, 3008, 3009, 3010

To customize port range, edit `smart-https-server.js`:

```javascript
this.portRange = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010];
```

## 📱 Mobile NFC Setup

### Prerequisites

1. **HTTPS Connection Required** - NFC only works over HTTPS
2. **Modern Browser** - Chrome, Safari, or Firefox on mobile
3. **NFC-enabled Device** - Android or iPhone with NFC support
4. **Network Access** - Device must be on same network as server

### Testing NFC Functionality

1. **Access NFC Test Page**: `https://[YOUR_IP]:3000/mobile-nfc-test`
2. **Check HTTPS Status**: Should show "HTTPS Connected ✅"
3. **Test NFC Support**: Should show "NFC Supported ✅"
4. **Access Main NFC Page**: `https://[YOUR_IP]:3000/mobile-nfc`

### NFC Features

- **Student Check-in**: Tap NFC cards to check in students
- **Real-time Updates**: Attendance updates immediately
- **Error Handling**: Clear error messages for troubleshooting
- **Device Compatibility**: Works with most NFC-enabled devices

## 🔍 Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Problem**: Port 3000 is already occupied

**Solution**: The smart server automatically finds the next available port. Check the console output for the actual port being used.

#### 2. Certificate Generation Failed

**Problem**: SSL certificate generation fails

**Solution**: 
```bash
# Manual certificate generation
powershell -ExecutionPolicy Bypass -File scripts/generate-ssl-cert.ps1
```

#### 3. Mobile Device Can't Access

**Problem**: Phone can't connect to HTTPS server

**Solutions**:
1. **Check Firewall**: Ensure port 3000-3010 is open
2. **Verify IP Address**: Use correct local IP address
3. **Network Connection**: Ensure device is on same network
4. **HTTPS Protocol**: Always use `https://` not `http://`

#### 4. NFC Not Working

**Problem**: NFC functionality not responding

**Solutions**:
1. **HTTPS Required**: Ensure using HTTPS connection
2. **Browser Support**: Use Chrome or Safari on mobile
3. **Device NFC**: Enable NFC in device settings
4. **Card Compatibility**: Ensure NFC cards are compatible

### Firewall Configuration

For Windows, run the firewall configuration script:

```bash
.\fix-firewall.ps1
```

Or manually add firewall rules:

```bash
# Allow Node.js HTTPS Server
netsh advfirewall firewall add rule name="Node.js HTTPS Server" dir=in action=allow protocol=TCP localport=3000-3010
```

### Network Troubleshooting

#### Check Network Connectivity

1. **Ping Test**: `ping [YOUR_IP]`
2. **Port Test**: Use `test-port-detection.js` (if available)
3. **Browser Test**: Try accessing from different browsers

#### Mobile Access Checklist

- [ ] Server is running on HTTPS
- [ ] Device is on same network
- [ ] Firewall allows port 3000-3010
- [ ] Using correct IP address
- [ ] Mobile browser supports HTTPS
- [ ] NFC is enabled on device

## 🛠️ Advanced Configuration

### Custom SSL Certificates

If you prefer custom certificates:

1. **Generate Certificates**:
   ```bash
   # Using mkcert (recommended)
   mkcert -install
   mkcert localhost 127.0.0.1 ::1
   
   # Or using OpenSSL
   openssl req -x509 -newkey rsa:4096 -keyout cert.key -out cert.crt -days 365 -nodes
   ```

2. **Place Certificates**: Put `cert.key` and `cert.crt` in project root

3. **Update Server**: The smart server will automatically detect and use them

### Production Deployment

For production environments:

1. **Use Valid SSL Certificates**: Obtain certificates from a trusted CA
2. **Configure Domain**: Update PocketBase URL to use your domain
3. **Environment Variables**: Set `NODE_ENV=production`
4. **Security Headers**: Configure security headers in `next.config.mjs`

### Ngrok Integration

For external access during development:

```bash
# Start ngrok tunnel
.\start-ngrok.bat

# Access via ngrok URL
https://[ngrok-url]/mobile-nfc
```

## 📊 Monitoring and Logs

### Server Logs

The smart HTTPS server provides detailed logging:

- **Startup**: Port detection and certificate status
- **Requests**: HTTP/HTTPS request logging
- **Errors**: Detailed error messages with solutions
- **NFC Events**: NFC card detection and processing

### Health Checks

Monitor server health:

- **HTTPS Status**: `https://[YOUR_IP]:3000/api/health`
- **NFC Status**: `https://[YOUR_IP]:3000/mobile-nfc-test`
- **PocketBase**: Check PocketBase connection status

## 🔒 Security Considerations

### SSL/TLS Security

- **Certificate Validation**: Automatic certificate validation
- **TLS Version**: Supports TLS 1.2 and higher
- **Cipher Suites**: Modern, secure cipher suites
- **HSTS**: HTTP Strict Transport Security headers

### Network Security

- **Firewall Rules**: Restrict access to necessary ports only
- **Network Isolation**: Use VPN for remote access
- **Access Control**: Implement authentication for sensitive endpoints
- **Logging**: Monitor access logs for suspicious activity

## 📚 Additional Resources

### Documentation

- **PocketBase Setup**: `POCKETBASE_SETUP_GUIDE.md`
- **Network Configuration**: `NETWORK_SETUP.md`
- **DDNS Setup**: `DDNS_SETUP.md`
- **Attendance System**: `ATTENDANCE_SETUP.md`

### API Endpoints

- **NFC API**: `/api/nfc/*`
- **Attendance API**: `/api/attendance/*`
- **Student Cards API**: `/api/student-cards/*`

### Support

- **Troubleshooting**: Check this guide's troubleshooting section
- **Network Issues**: Refer to `MOBILE_ACCESS_TROUBLESHOOTING.md`
- **Development**: Use browser developer tools for debugging

## ✅ Success Checklist

Before using in production, ensure:

- [ ] HTTPS server starts without errors
- [ ] SSL certificates are valid and trusted
- [ ] Mobile devices can access the server
- [ ] NFC functionality works on test devices
- [ ] PocketBase connection is stable
- [ ] Firewall rules are properly configured
- [ ] Network access is secure
- [ ] Error handling is working correctly

## 🎉 Summary

The smart HTTPS server provides:

- ✅ **One-click HTTPS setup** with automatic certificate generation
- ✅ **Mobile NFC support** with full functionality
- ✅ **Automatic port detection** and fallback options
- ✅ **Comprehensive error handling** and troubleshooting
- ✅ **Production-ready security** with modern TLS
- ✅ **Cross-platform compatibility** for all devices

You're now ready to use the complete HTTPS and NFC functionality! 🚀
