# PocketBase Troubleshooting Guide

## 📋 **Overview**

This guide consolidates all PocketBase-related issues, fixes, and best practices for the PJPC School Management System. It covers common errors, authentication issues, performance problems, and their solutions.

## 🔍 **Common Issues & Solutions**

### **1. 400 Bad Request Errors**

#### **Problem**: `ClientResponseError 400: Something went wrong while processing your request`

**Root Causes**:
- Invalid parameters in PocketBase API calls
- Field name mismatches
- Authentication issues
- Invalid query syntax

**Solutions**:

**A. Remove Invalid Parameters**
```typescript
// ❌ WRONG - Causes 400 error
const response = await pb.collection('student_fees').getFullList({
  sort: 'created',
  $autoCancel: false  // This parameter doesn't exist
})

// ✅ CORRECT - Uses valid parameters only
const response = await pb.collection('student_fees').getFullList({
  sort: 'created'  // Only valid parameters
})
```

**B. Fix Field Name Mismatches**
```typescript
// ❌ WRONG - Field names don't match schema
const response = await pb.collection('students').getFullList({
  sort: 'studentName'  // Field doesn't exist
})

// ✅ CORRECT - Use actual field names
const response = await pb.collection('students').getFullList({
  sort: 'student_name'  // Actual field name
})
```

**C. Implement Fallback Strategies**
```typescript
// Multiple query attempts with graceful degradation
try {
  response = await pb.collection('student_fees').getFullList({
    sort: 'created'
  })
} catch (primaryError) {
  try {
    response = await pb.collection('student_fees').getFullList({
      sort: '-created'
    })
  } catch (fallback1Error) {
    response = await pb.collection('student_fees').getFullList()
  }
}
```

### **2. Request Autocancellation Issues**

#### **Problem**: `ClientResponseError 0: The request was autocancelled`

**Root Causes**:
- Multiple parallel requests cancelling each other
- Missing request keys
- Race conditions in data fetching

**Solutions**:

**A. Add Unique Request Keys**
```typescript
// Generate unique request key
const requestKey = `student_fees_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// Use request key in API call
const response = await pb.collection('student_fees').getFullList({
  sort: 'created',
  requestKey: requestKey
})
```

**B. Prevent Race Conditions**
```typescript
// Track current fetch operation
const fetchId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
const currentFetchId = useRef(fetchId)

// Check if this is still the current fetch before updating state
if (currentFetchId.current !== fetchId) {
  console.log('Fetch operation superseded by newer request, skipping state update')
  return
}
```

**C. Sequential Request Processing**
```typescript
// Process requests sequentially instead of in parallel
const fetchData = async () => {
  const students = await fetchStudents()
  const fees = await fetchFees()
  const assignments = await fetchAssignments()
  
  return { students, fees, assignments }
}
```

### **3. Authentication Issues**

#### **Problem**: Authentication validation failures

**Root Causes**:
- Missing authentication checks
- Insufficient role validation
- Timing issues with auth state

**Solutions**:

**A. Enhanced Authentication Validation**
```typescript
private validateAuth(): void {
  if (!this.pb) {
    throw new Error('PocketBase not initialized')
  }
  
  if (!this.pb.authStore) {
    throw new Error('Authentication store not available')
  }
  
  if (!this.pb.authStore.isValid) {
    throw new Error('Authentication required')
  }
  
  if (!this.pb.authStore.model) {
    throw new Error('No authenticated user found')
  }
  
  // Check user role
  const userRole = this.pb.authStore.model.role
  if (!userRole || (userRole !== 'admin' && userRole !== 'accountant')) {
    throw new Error('Insufficient permissions')
  }
}
```

**B. Role-Based Access Control**
```typescript
// Check permissions before operations
const hasPermission = (resource: string, action: string) => {
  const userRole = pb.authStore.model?.role
  const permissions = {
    admin: ['*'],
    accountant: ['read', 'write'],
    teacher: ['read']
  }
  
  return permissions[userRole]?.includes('*') || 
         permissions[userRole]?.includes(action)
}
```

### **4. Relation Expansion Issues**

#### **Problem**: Relation expansion failing with 400 errors

**Root Causes**:
- Invalid expand syntax
- Authentication rules blocking expansion
- Missing relation fields

**Solutions**:

**A. Manual Relation Expansion**
```typescript
// Instead of using expand parameter, manually fetch related data
const records = await pb.collection('student_fees').getFullList({
  sort: 'created'
})

const assignments = []
for (const record of records) {
  let expandedStudent = null
  if (record.students) {
    try {
      expandedStudent = await pb.collection('students').getOne(record.students)
    } catch (error) {
      console.warn(`Failed to expand student ${record.students}`)
    }
  }
  
  assignments.push({
    ...record,
    expand: expandedStudent ? { students: expandedStudent } : undefined
  })
}
```

**B. Fallback Without Expansion**
```typescript
// Try with expand first, fallback without
try {
  response = await pb.collection('student_fees').getFullList({
    expand: 'students',
    sort: 'created'
  })
} catch (expandError) {
  // Fallback without expand
  response = await pb.collection('student_fees').getFullList({
    sort: 'created'
  })
}
```

## 🗄️ **Database Schema Best Practices**

### **Collection Structure**

**Students Collection**:
```typescript
{
  id: string,
  student_name: string,    // Use snake_case for field names
  standard: string,        // Grade/class level
  parents_name: string,    // Parent/guardian name
  studentId: string,       // Student ID number
  status: string,          // "active" | "inactive"
  created: string,
  updated: string
}
```

**Fee Items Collection**:
```typescript
{
  id: string,
  name: string,           // Fee item name
  amount: number,         // Fee amount
  category: string,       // Fee category
  description: string,    // Fee description
  status: string,         // "active" | "inactive"
  created: string,
  updated: string
}
```

**Student Fee Matrix Collection**:
```typescript
{
  id: string,
  students: string,       // Relation to students collection
  fee_items: string[],    // JSON array of fee item IDs
  totalAmount: number,    // Calculated total
  created: string,
  updated: string
}
```

### **Query Optimization**

**A. Use Database-Level Filtering**
```typescript
// ✅ GOOD - Filter at database level
const response = await pb.collection('students').getFullList({
  filter: 'status = "active"',
  sort: 'student_name'
})

// ❌ BAD - Filter in application
const response = await pb.collection('students').getFullList()
const activeStudents = response.filter(s => s.status === 'active')
```

**B. Proper Indexing**
```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_name ON students(student_name);
CREATE INDEX idx_fee_items_status ON fee_items(status);
```

**C. Pagination for Large Datasets**
```typescript
// Use pagination for large collections
const response = await pb.collection('students').getList(1, 50, {
  filter: 'status = "active"',
  sort: 'student_name'
})
```

## 🔧 **Performance Optimization**

### **1. Request Optimization**

**A. Batch Operations**
```typescript
// Batch multiple operations
const batchUpdate = async (updates: Array<{id: string, data: any}>) => {
  const promises = updates.map(update => 
    pb.collection('students').update(update.id, update.data)
  )
  return Promise.all(promises)
}
```

**B. Caching Strategy**
```typescript
// Implement caching for frequently accessed data
const cache = new Map()

const getCachedData = async (key: string, fetcher: () => Promise<any>) => {
  if (cache.has(key)) {
    return cache.get(key)
  }
  
  const data = await fetcher()
  cache.set(key, data)
  return data
}
```

### **2. Error Handling**

**A. Graceful Degradation**
```typescript
// Return empty arrays instead of throwing errors
const fetchData = async () => {
  try {
    const response = await pb.collection('students').getFullList()
    return { success: true, data: response }
  } catch (error) {
    return { success: false, data: [], error: error.message }
  }
}
```

**B. Retry Logic**
```typescript
const retryOperation = async (operation: () => Promise<any>, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}
```

## 🛠️ **Debugging Tools**

### **1. Connection Diagnostics**
```typescript
const diagnoseConnection = async () => {
  const diagnostics = {
    pocketBaseUrl: pb.baseUrl,
    isAuthenticated: pb.authStore.isValid,
    userRole: pb.authStore.model?.role,
    collections: []
  }
  
  try {
    const collections = await pb.collections.getFullList()
    diagnostics.collections = collections.map(c => c.name)
  } catch (error) {
    diagnostics.collections = ['Error fetching collections']
  }
  
  return diagnostics
}
```

### **2. Query Testing**
```typescript
const testQuery = async (collection: string, options: any = {}) => {
  try {
    const response = await pb.collection(collection).getFullList(options)
    return {
      success: true,
      count: response.length,
      sample: response[0] || null
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      details: error
    }
  }
}
```

### **3. Performance Monitoring**
```typescript
const measureQueryPerformance = async (queryFn: () => Promise<any>) => {
  const start = performance.now()
  try {
    const result = await queryFn()
    const duration = performance.now() - start
    return { success: true, duration, result }
  } catch (error) {
    const duration = performance.now() - start
    return { success: false, duration, error: error.message }
  }
}
```

## 📚 **Best Practices Checklist**

### **Before Making API Calls**
- [ ] Validate authentication state
- [ ] Check user permissions
- [ ] Use correct field names
- [ ] Add unique request keys
- [ ] Implement error handling

### **For Production**
- [ ] Add comprehensive logging
- [ ] Implement retry logic
- [ ] Use proper indexing
- [ ] Monitor performance
- [ ] Set up error tracking

### **For Development**
- [ ] Use debug tools
- [ ] Test with different data sizes
- [ ] Validate all error scenarios
- [ ] Document API changes
- [ ] Update this guide

## 📚 **Related Documentation**

- [Student Fee Matrix Guide](./STUDENT_FEE_MATRIX_COMPREHENSIVE_GUIDE.md)
- [Finance Module Implementation](./FINANCE_MODULE_IMPLEMENTATION.md)
- [Project Structure](./PROJECT_STRUCTURE.md)
- [API Documentation](./API_DOCUMENTATION.md)

---

*This guide consolidates all PocketBase troubleshooting information into a single comprehensive reference.*
