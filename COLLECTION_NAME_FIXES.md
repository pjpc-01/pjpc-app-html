# Collection Name Fixes - StudentFeeMatrix System

## 🎯 **Issue Summary**

The StudentFeeMatrix system is using outdated collection names and field names that don't match the actual PocketBase schema, causing 400 and 404 errors.

## 🔍 **Problems Identified**

### **1. Collection Name Mismatches**
- ❌ Hook used: `fees_items` 
- ✅ Schema shows: `fee_items`
- ❌ Hook used: `student_fees`
- ✅ Schema shows: `student_fee_matrix`

### **2. Field Name Mismatches**
- ❌ Hook expected: `feeName`, `studentName`, `grade`, `parentName`
- ✅ Schema has: `name`, `student_name`, `standard`, `parents_name`

### **3. Missing Filters**
- ❌ No status filters
- ✅ Need: `status = "active"` filters

## ✅ **Fixes Applied**

### **1. Fixed React Query Hook** ✅
- ✅ Updated `hooks/useStudentFeeMatrixQuery.ts`
- ✅ Fixed collection names: `fees_items` → `fee_items`, `student_fees` → `student_fee_matrix`
- ✅ Fixed field names: `feeName` → `name`, `studentName` → `student_name`, etc.
- ✅ Added proper filters: `status = "active"`

## 📋 **Remaining Tasks**

### **Phase 1: Core Hook Fixes** ✅ COMPLETED
- [x] Fix `hooks/useStudentFeeMatrixQuery.ts` collection names
- [x] Fix `hooks/useStudentFeeMatrixQuery.ts` field names
- [x] Add proper filters to React Query hook

### **Phase 2: Other Hook Updates**
- [ ] Update `hooks/useStudentFeeMatrix.ts` collection names
- [ ] Update `hooks/useFees.ts` collection names
- [ ] Update `hooks/useStudentFeeMatrix.ts` field mappings

### **Phase 3: Documentation Updates**
- [ ] Update `STUDENT_FEE_MATRIX_COLLECTIONS.md`
- [ ] Update `POCKETBASE_SCHEMA_FIXES.md`
- [ ] Update `README.md` collection references

### **Phase 4: Script Updates**
- [ ] Update `scripts/debug-pocketbase.js` collection names
- [ ] Update any other scripts using old collection names

### **Phase 5: API Route Updates**
- [ ] Check and update any API routes using old collection names
- [ ] Update any server-side code using old collection names

## 🚀 **Current Status**

### **✅ Fixed Files:**
- `hooks/useStudentFeeMatrixQuery.ts` - Updated collection names and field mappings

### **🔄 In Progress:**
- Testing the React Query hook fixes

### **⏳ Pending:**
- Updating other hooks and documentation files

## 📊 **Expected Results**

After all fixes are applied:
1. **No more 400/404 errors** from collection name mismatches
2. **Proper data loading** from correct collections
3. **Correct field mappings** between PocketBase and TypeScript interfaces
4. **Consistent collection naming** across the entire codebase

## 🔧 **Implementation Details**

### **Collection Name Changes:**
```typescript
// Before
pb.collection('fees_items')     // ❌ Wrong
pb.collection('student_fees')   // ❌ Wrong

// After  
pb.collection('fee_items')      // ✅ Correct
pb.collection('student_fee_matrix') // ✅ Correct
```

### **Field Name Changes:**
```typescript
// Before
fields: 'id,feeName,studentName,grade,parentName'
sort: 'studentName'

// After
fields: 'id,name,student_name,standard,parents_name'
sort: 'student_name'
```

### **Filter Additions:**
```typescript
// Before
const records = await pb.collection('students').getFullList(200)

// After
const records = await pb.collection('students').getFullList(200, {
  filter: 'status = "active"'
})
```
