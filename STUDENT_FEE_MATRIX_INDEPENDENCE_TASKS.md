# Student Fee Matrix Independence Implementation

Brief description: Fix the Student Fee Matrix to work independently from the Fee Items tab. Currently, when fee items are deactivated in the Fee Items tab, they become hidden/disabled in the Student Fee Matrix. The Student Fee Matrix should show all fee items regardless of their status and only track student-specific assignments.

## Completed Tasks

- [x] Identify the root cause of the dependency issue
- [x] Analyze how fee items are fetched in Student Fee Matrix
- [x] Modify Student Fee Matrix to fetch all fee items (not just active ones)
- [x] Update fee item filtering logic in Student Fee Matrix
- [x] Ensure Student Fee Matrix shows all fee items regardless of status
- [x] Add visual indicators for inactive fee items in Student Fee Matrix
- [x] Update FeeItem type to include status field

## In Progress Tasks

- [ ] Test Student Fee Matrix with deactivated fee items
- [ ] Verify toggle switches work for all fee items (active and inactive)

## Future Tasks

- [ ] Update documentation to clarify the independence of the two systems
- [ ] Add user guidance about the difference between Fee Items and Student Fee Matrix
- [ ] Remove debug logging after testing is complete

## Implementation Plan

### Problem Analysis

The Student Fee Matrix and Fee Items tab are currently sharing the same data source and filtering logic, causing unwanted dependencies:

1. **Current Behavior**: Student Fee Matrix only shows active fee items
2. **Desired Behavior**: Student Fee Matrix should show ALL fee items regardless of status
3. **Root Cause**: Both systems use the same `fetchFeeItems` function with `status = "active"` filter

### Root Cause Analysis

**Issue: Shared Data Source with Status Filtering** 🔧 FIXING
- **Problem**: `useStudentFeeMatrix.ts` uses `fetchFeeItems` with `filter: 'status = "active"'`
- **Root Cause**: Same filtering logic as Fee Items tab
- **Impact**: Deactivated fee items disappear from Student Fee Matrix
- **Expected**: Student Fee Matrix should show all fee items for assignment purposes

### Technical Components Needed

1. **Independent Data Fetching**: 🔧 Separate fee item fetching for Student Fee Matrix
2. **Status-Independent Display**: 🔧 Show all fee items regardless of status
3. **Visual Distinction**: 🔧 Indicate inactive fee items visually
4. **Assignment Logic**: ✅ Maintain existing assignment functionality
5. **User Interface**: 🔧 Clear separation between the two systems

### Environment Configuration

- PocketBase connection must be stable
- Fee items collection must be accessible
- Student fee matrix data must be properly loaded
- Both active and inactive fee items must be available

## Relevant Files

- `hooks/useStudentFeeMatrix.ts` - 🔧 Student fee matrix hook (needs independent fee fetching)
- `app/components/finance/student-fee-matrix/StudentFeeMatrix.tsx` - 🔧 Student fee matrix UI (needs status-independent display)
- `hooks/useFees.ts` - Fee management hook (reference for fee item structure)
- `types/fees.ts` - Fee type definitions

## Debugging Steps

1. **Step 1**: 🔧 Identify current fee item filtering in useStudentFeeMatrix
2. **Step 2**: 🔧 Modify fetchFeeItems to remove status filter for Student Fee Matrix
3. **Step 3**: 🔧 Update Student Fee Matrix UI to handle inactive fee items
4. **Step 4**: 🔧 Test with both active and inactive fee items
5. **Step 5**: ✅ Verify toggle switches work for all fee items

## Recent Analysis

### 1. Current Fee Item Fetching
```typescript
// In useStudentFeeMatrix.ts - CURRENT (problematic)
const fetchFeeItems = async (): Promise<ApiResponse<FeeItem[]>> => {
  const response = await pbRef.current.collection('fee_items').getFullList({
    filter: 'status = "active"',  // ❌ This causes the dependency issue
    sort: 'name',
    requestKey: requestKey
  })
}
```

### 2. Desired Fee Item Fetching
```typescript
// In useStudentFeeMatrix.ts - DESIRED (independent)
const fetchFeeItems = async (): Promise<ApiResponse<FeeItem[]>> => {
  const response = await pbRef.current.collection('fee_items').getFullList({
    // No status filter - show all fee items ✅
    sort: 'name',
    requestKey: requestKey
  })
}
```

### 3. Visual Indicators for Inactive Items
```typescript
// In StudentFeeMatrix.tsx - Add visual distinction
<div className={`fee-item ${fee.status === 'inactive' ? 'opacity-50 bg-gray-100' : ''}`}>
  <span className={fee.status === 'inactive' ? 'text-gray-500' : ''}>
    {fee.name}
  </span>
  {fee.status === 'inactive' && (
    <Badge variant="secondary" className="text-xs">已停用</Badge>
  )}
  <ToggleSwitch
    checked={isAssigned}
    onChange={() => handleToggle(fee.id)}
    disabled={!isEditMode}
  />
</div>
```

## Next Steps

1. **Modify useStudentFeeMatrix** to fetch all fee items without status filter
2. **Update Student Fee Matrix UI** to handle inactive fee items gracefully
3. **Test the independence** by deactivating fee items in Fee Items tab
4. **Verify toggle switches** work for both active and inactive fee items
5. **Add user guidance** about the difference between the two systems
