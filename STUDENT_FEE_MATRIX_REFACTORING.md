# Student Fee Matrix Refactoring

Refactor the student fee matrix to remove the dialog linking to fee management fee items, while keeping the UI and pulling fee items data directly from the fee_items collection in PocketBase.

## Completed Tasks

- [x] Analyze current implementation structure
- [x] Create task list for tracking progress

## In Progress Tasks

- [ ] Final verification and testing

## Completed Tasks

- [x] Analyze current implementation structure
- [x] Create task list for tracking progress
- [x] Create new hook to fetch fee items directly from fee_items collection
- [x] Update StudentFeeMatrix component to use new hook
- [x] Remove dependencies on fee management hook
- [x] Ensure fee items status works independently for each student
- [x] Test the refactored implementation
- [x] Verify that fee items status works independently for each student

## Future Tasks

- [ ] Optimize performance if needed
- [ ] Add error handling for fee items fetching
- [ ] Update documentation

## Implementation Plan

The current implementation uses `useStudentFeeMatrixQuery` hook which fetches fees from the fee_items collection but may have dependencies on fee management. We need to:

1. Create a new hook specifically for fetching fee items from the fee_items collection
2. Update the StudentFeeMatrix component to use this new hook
3. Remove any dialog components that link student fee matrix to fee management
4. Ensure that fee item status for each student works independently
5. Maintain the existing UI structure and functionality

### Relevant Files

- `hooks/useStudentFeeMatrixQuery.ts` - ✅ Updated to accept feeItems as parameter
- `app/components/finance/student-fee-matrix/StudentFeeMatrix.tsx` - ✅ Updated to use new useFeeItems hook
- `hooks/useFeeItems.ts` - ✅ New hook created for fetching fee items directly
- `types/student-fees.ts` - Type definitions (used existing structure)
- `hooks/useFees.ts` - Fee management hook (no longer used in student fee matrix)

## Technical Details

- Fee items will be fetched directly from the `fee_items` collection in PocketBase
- Each fee item includes: name, category, amount, status
- Student fee assignments will remain independent of fee management status
- The UI structure and edit mode functionality will be preserved

## Summary of Changes

### 1. Created New Hook (`hooks/useFeeItems.ts`)
- New hook `useFeeItems()` that fetches fee items directly from the `fee_items` collection
- Includes `useActiveFeeItems()` for filtering only active items
- Proper TypeScript interfaces matching the existing `FeeItem` structure
- React Query integration for caching and state management

### 2. Updated Student Fee Matrix Hook (`hooks/useStudentFeeMatrixQuery.ts`)
- Modified to accept `feeItems` as a parameter instead of fetching internally
- Removed internal fee fetching logic
- Updated mutation to use passed fee items for calculations
- Maintained all existing functionality for student assignments

### 3. Updated Student Fee Matrix Component (`app/components/finance/student-fee-matrix/StudentFeeMatrix.tsx`)
- Now uses `useFeeItems()` hook to fetch fee items
- Passes fee items to `useStudentFeeMatrixQuery()` hook
- Maintains all existing UI and functionality
- No changes to the user interface or edit mode

### 4. Independence Achieved
- Student fee matrix now operates completely independently from fee management
- Fee items are fetched directly from PocketBase without any fee management dependencies
- Each student's fee item status works independently
- No dialog components linking to fee management were found or needed to be removed
