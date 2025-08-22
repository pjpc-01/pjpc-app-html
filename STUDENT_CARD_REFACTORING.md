# Student Card Refactoring Implementation

Refactoring StudentCard component to StudentNameCard to avoid naming conflicts with other student card components in the project.

## Completed Tasks

- [x] Create new StudentNameCard.tsx component with renamed interface and component
- [x] Update types/student-fees.ts to rename StudentCard interface to StudentNameCard
- [x] Update StudentFeeMatrixState interface to use StudentNameCard type
- [x] Update app/components/finance/student-fee-matrix/index.ts export
- [x] Update app/components/finance/index.ts export
- [x] Update StudentFeeMatrix.tsx to import and use StudentNameCard
- [x] Delete old StudentCard.tsx file

## In Progress Tasks

- [ ] Verify all imports and references are updated correctly
- [ ] Test the component functionality after refactoring

## Future Tasks

- [ ] Update any remaining documentation references
- [ ] Consider renaming other conflicting components if needed

## Implementation Plan

The refactoring involved:
1. Creating a new StudentNameCard component with updated naming
2. Updating all type definitions to use StudentNameCard instead of StudentCard
3. Updating all import statements and component usage
4. Removing the old conflicting file

### Relevant Files

- ✅ `app/components/finance/student-fee-matrix/StudentNameCard.tsx` - New renamed component
- ✅ `types/student-fees.ts` - Updated type definitions
- ✅ `app/components/finance/student-fee-matrix/index.ts` - Updated exports
- ✅ `app/components/finance/index.ts` - Updated main finance exports
- ✅ `app/components/finance/student-fee-matrix/StudentFeeMatrix.tsx` - Updated component usage
- ❌ `app/components/finance/student-fee-matrix/StudentCard.tsx` - Deleted old file

## Notes

- The refactoring resolves naming conflicts with the existing StudentCard type from `lib/pocketbase-students-card.ts`
- All functionality remains the same, only the naming has been updated
- The component is specifically for displaying student information in the fee matrix context
