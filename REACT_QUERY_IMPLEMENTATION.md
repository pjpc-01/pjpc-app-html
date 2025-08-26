# React Query Implementation Guide

## 🎯 **Overview**

This guide provides comprehensive patterns for implementing React Query (TanStack Query) in the PJPC School Management System. React Query is the **recommended approach** for all data fetching operations in this project.

## 🚀 **Why React Query?**

### **Problems Solved:**
- ✅ **Autocancellation Issues** - No more "request was autocancelled" errors
- ✅ **Component Unmount Errors** - Data persists across component lifecycle
- ✅ **Manual State Management** - Automatic loading, error, and success states
- ✅ **Cache Management** - Intelligent caching with background updates
- ✅ **Request Deduplication** - Multiple components requesting same data? No problem!

### **Benefits:**
- 🚀 **Better Performance** - Caching and background refetching
- 🎯 **Better UX** - Loading states, optimistic updates, error handling
- 🛠️ **Developer Experience** - Less boilerplate, more predictable code
- 🔄 **Automatic Synchronization** - Data stays fresh automatically

## 📋 **Project Structure Analysis**

### **Current Hooks to Migrate:**
1. ✅ `useInvoiceData.ts` - **MIGRATED** (React Query implementation)
2. 🔄 `useStudents.ts` - Needs migration
3. 🔄 `useTeachers.ts` - Needs migration
4. 🔄 `useFees.ts` - Needs migration
5. 🔄 `usePayments.ts` - Needs migration
6. 🔄 `useReceipts.ts` - Needs migration
7. 🔄 `useStudentCards.ts` - Needs migration
8. 🔄 `useUserApproval.ts` - Needs migration
9. 🔄 `useAttendance.ts` - Needs migration
10. 🔄 `useNFC.ts` - Needs migration

### **Already Using React Query:**
- ✅ `useStudentFeeMatrixQuery.ts` - Full React Query implementation
- ✅ `useInvoiceData.ts` - Full React Query implementation

## 🏗️ **Setup & Configuration**

### **1. Provider Setup (Already Done)**
```tsx
// components/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            retry: 3,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

### **2. Query Keys Pattern**
```tsx
// hooks/queryKeys.ts
export const queryKeys = {
  // Students
  students: ['students'] as const,
  student: (id: string) => ['students', id] as const,
  
  // Teachers
  teachers: ['teachers'] as const,
  teacher: (id: string) => ['teachers', id] as const,
  
  // Finance
  invoices: ['invoices'] as const,
  invoice: (id: string) => ['invoices', id] as const,
  fees: ['fees'] as const,
  payments: ['payments'] as const,
  receipts: ['receipts'] as const,
  
  // Student Management
  studentFees: ['student-fees'] as const,
  studentFeeMatrix: ['student-fee-matrix'] as const,
  studentCards: ['student-cards'] as const,
  
  // User Management
  userApprovals: ['user-approvals'] as const,
  
  // Attendance
  attendance: ['attendance'] as const,
  nfc: ['nfc'] as const,
}
```

## 📝 **Migration Patterns**

### **Pattern 1: Simple Data Fetching Hook**

#### **Before (useState + useEffect):**
```tsx
// hooks/useStudents.ts (OLD)
export const useStudents = () => {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAllStudents()
      setStudents(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch students')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  return { students, loading, error, refetch: fetchStudents }
}
```

#### **After (React Query):**
```tsx
// hooks/useStudents.ts (NEW)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from './queryKeys'
import { getAllStudents, addStudent, updateStudent, deleteStudent } from '@/lib/pocketbase-students'

export const useStudents = () => {
  const queryClient = useQueryClient()

  // Query for fetching students
  const {
    data: students = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: queryKeys.students,
    queryFn: getAllStudents,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Mutations
  const addStudentMutation = useMutation({
    mutationFn: addStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students })
    },
  })

  const updateStudentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Student> }) => 
      updateStudent({ id, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students })
    },
  })

  const deleteStudentMutation = useMutation({
    mutationFn: deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students })
    },
  })

  return {
    students,
    loading: isLoading,
    error: error?.message || null,
    refetch,
    addStudent: addStudentMutation.mutateAsync,
    updateStudent: updateStudentMutation.mutateAsync,
    deleteStudent: deleteStudentMutation.mutateAsync,
    // Mutation states for UI feedback
    isAddingStudent: addStudentMutation.isPending,
    isUpdatingStudent: updateStudentMutation.isPending,
    isDeletingStudent: deleteStudentMutation.isPending,
  }
}
```

### **Pattern 2: Complex Data with Relations**

#### **Example: Invoice Data with Student Relations**
```tsx
// hooks/useInvoiceData.ts (Current Implementation)
export const useInvoiceData = () => {
  const queryClient = useQueryClient()
  
  // Separate queries for different data types
  const studentsQuery = useQuery({
    queryKey: queryKeys.students,
    queryFn: fetchStudentsWithFees,
    staleTime: 5 * 60 * 1000,
  })
  
  const invoicesQuery = useQuery({
    queryKey: queryKeys.invoices,
    queryFn: fetchInvoices,
    staleTime: 2 * 60 * 1000,
  })
  
  // Mutations with automatic cache invalidation
  const createInvoiceMutation = useMutation({
    mutationFn: createInvoiceAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices })
    },
  })
  
  return {
    students: studentsQuery.data || [],
    invoices: invoicesQuery.data || [],
    loading: studentsQuery.isLoading || invoicesQuery.isLoading,
    error: studentsQuery.error || invoicesQuery.error,
    createInvoice: createInvoiceMutation.mutateAsync,
    isCreatingInvoice: createInvoiceMutation.isPending,
  }
}
```

### **Pattern 3: Optimistic Updates**
```tsx
// Example: Optimistic status update
const updateStatusMutation = useMutation({
  mutationFn: updateInvoiceStatus,
  onMutate: async ({ invoiceId, status }) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: queryKeys.invoices })
    
    // Snapshot previous value
    const previousInvoices = queryClient.getQueryData(queryKeys.invoices)
    
    // Optimistically update
    queryClient.setQueryData(queryKeys.invoices, (old: Invoice[]) =>
      old.map(inv => inv.id === invoiceId ? { ...inv, status } : inv)
    )
    
    return { previousInvoices }
  },
  onError: (err, variables, context) => {
    // Rollback on error
    if (context?.previousInvoices) {
      queryClient.setQueryData(queryKeys.invoices, context.previousInvoices)
    }
  },
  onSettled: () => {
    // Always refetch after error or success
    queryClient.invalidateQueries({ queryKey: queryKeys.invoices })
  },
})
```

## 🔧 **Best Practices**

### **1. Query Key Structure**
```tsx
// ✅ Good - Hierarchical and specific
queryKeys.students
queryKeys.student(studentId)
queryKeys.studentFees(studentId)
queryKeys.invoices({ status: 'unpaid' })

// ❌ Bad - Too generic
['data']
['students', 'all']
```

### **2. Stale Time Configuration**
```tsx
// Static data (rarely changes)
staleTime: 30 * 60 * 1000, // 30 minutes

// Semi-static data (changes occasionally)
staleTime: 5 * 60 * 1000, // 5 minutes

// Dynamic data (changes frequently)
staleTime: 1 * 60 * 1000, // 1 minute

// Real-time data
staleTime: 0, // Always stale
```

### **3. Error Handling**
```tsx
const query = useQuery({
  queryKey: queryKeys.students,
  queryFn: fetchStudents,
  retry: (failureCount, error) => {
    // Don't retry on 404
    if (error.status === 404) return false
    // Retry up to 3 times
    return failureCount < 3
  },
  onError: (error) => {
    console.error('Failed to fetch students:', error)
    // Show toast notification
    toast.error('Failed to load students')
  },
})
```

### **4. Loading States**
```tsx
// Component usage
const { students, loading, error, isCreatingStudent } = useStudents()

if (loading) return <LoadingSpinner />
if (error) return <ErrorMessage message={error} />

return (
  <div>
    {students.map(student => (
      <StudentCard key={student.id} student={student} />
    ))}
    <Button 
      onClick={handleAddStudent} 
      disabled={isCreatingStudent}
    >
      {isCreatingStudent ? 'Adding...' : 'Add Student'}
    </Button>
  </div>
)
```

## 📊 **Migration Checklist**

### **For Each Hook Migration:**

- [ ] **Create API functions** (separate from hook logic)
- [ ] **Define query keys** in centralized location
- [ ] **Replace useState/useEffect** with useQuery
- [ ] **Replace manual mutations** with useMutation
- [ ] **Add cache invalidation** in mutation onSuccess
- [ ] **Add loading states** for mutations
- [ ] **Update components** to use new hook interface
- [ ] **Test all scenarios** (loading, error, success)
- [ ] **Remove old hook file** after migration

### **Priority Order:**
1. **High Priority** - `useStudents.ts`, `useTeachers.ts`
2. **Medium Priority** - `useFees.ts`, `usePayments.ts`, `useReceipts.ts`
3. **Low Priority** - `useAttendance.ts`, `useNFC.ts`

## 🧪 **Testing Patterns**

### **1. Query Testing**
```tsx
// Test successful query
const { result } = renderHook(() => useStudents())
await waitFor(() => {
  expect(result.current.students).toHaveLength(5)
  expect(result.current.loading).toBe(false)
  expect(result.current.error).toBeNull()
})
```

### **2. Mutation Testing**
```tsx
// Test successful mutation
const { result } = renderHook(() => useStudents())
await act(async () => {
  await result.current.addStudent(newStudent)
})
expect(result.current.students).toHaveLength(6)
```

### **3. Error Testing**
```tsx
// Test error handling
server.use(
  rest.get('/api/students', (req, res, ctx) => {
    return res(ctx.status(500))
  })
)
const { result } = renderHook(() => useStudents())
await waitFor(() => {
  expect(result.current.error).toBeTruthy()
})
```

## 🎉 **Benefits Achieved**

### **Before Migration:**
- ❌ Manual loading/error state management
- ❌ Autocancellation issues
- ❌ Component unmount errors
- ❌ No caching
- ❌ Manual retry logic
- ❌ Race conditions

### **After Migration:**
- ✅ Automatic loading/error states
- ✅ No autocancellation issues
- ✅ Data persists across unmounts
- ✅ Intelligent caching
- ✅ Built-in retry logic
- ✅ Request deduplication
- ✅ Background refetching
- ✅ Optimistic updates
- ✅ Type safety

## 🚀 **Next Steps**

1. **Migrate `useStudents.ts`** - Follow Pattern 1
2. **Migrate `useTeachers.ts`** - Follow Pattern 1
3. **Migrate finance hooks** - Follow Pattern 2
4. **Add React Query DevTools** for debugging
5. **Implement optimistic updates** for better UX
6. **Add infinite queries** for pagination

## 📚 **Resources**

- [React Query Documentation](https://tanstack.com/query/latest)
- [React Query DevTools](https://tanstack.com/query/latest/docs/react/devtools)
- [Migration Guide](https://tanstack.com/query/latest/docs/react/guides/migrating-to-react-query-4)

---

*This guide ensures consistent, professional data fetching patterns across the entire PJPC School Management System.*
