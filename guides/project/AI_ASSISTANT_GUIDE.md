# 🤖 AI ASSISTANT QUICK GUIDE

## 🚀 **QUICK START FOR AI ASSISTANTS**

**When helping with this project, follow this sequence:**

### **1. First, Read This File**
- This gives you the essential context
- No need to re-analyze everything

### **2. Run Quick Health Check**
```bash
npm run startup
```
This will tell you if everything is working.

### **3. If Issues Found, Run Full Verification**
```bash
npm run verify:auth
```
This provides detailed analysis.

### **4. Check PROJECT_INTELLIGENCE.md**
For comprehensive project understanding.

## 🔐 **AUTHENTICATION SYSTEM**

**Key Files:**
- `contexts/pocketbase-auth-context.tsx` - Main auth logic
- `lib/pocketbase.ts` - PocketBase configuration  
- `lib/auth-config.ts` - Auth settings & permissions

**User Roles:**
- `admin` - Full access
- `teacher` - Students, attendance, grades
- `parent` - Own children, payments, schedule
- `accountant` - Fees, payments, reports, invoices

**PocketBase URL:** `http://pjpc.tplinkdns.com:8090`

## 🛠️ **COMMON COMMANDS**

```bash
npm run dev           # Start development
npm run startup       # Quick health check
npm run verify:auth   # Full auth verification
npm run test:network  # Test connectivity
```

## 🚨 **COMMON ISSUES**

**1. Connection Failed:**
- Check if PocketBase server is running
- Verify URL in `.env.local`

**2. Authentication Problems:**
- Run `npm run verify:auth`
- Check user status in PocketBase admin

**3. Missing Files:**
- Run `npm run startup` to identify missing components

## 📁 **CRITICAL FILES**

```
contexts/pocketbase-auth-context.tsx  # Auth context
lib/pocketbase.ts                     # PocketBase config
lib/auth-config.ts                    # Auth configuration
app/components/systems/auth/          # Login forms
app/api/pocketbase/[...path]/route.ts # API proxy
.env.local                            # Environment variables
```

## 🎯 **SUCCESS INDICATORS**

✅ Users can register and login  
✅ Role-based access works  
✅ No authentication errors  
✅ Response times < 2 seconds  

## 💡 **QUICK TIPS**

1. **Always check PROJECT_INTELLIGENCE.md first**
2. **Use existing patterns** in components
3. **Test authentication** after changes
4. **Check environment variables** before debugging
5. **Follow role permissions** when adding features

---

**That's it! You now have everything you need to help with this project efficiently.**
