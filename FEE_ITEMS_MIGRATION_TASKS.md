# Fee Items Migration Implementation

This document tracks the progress of migrating the student fee matrix collection to store full fee item details instead of just IDs.

## Overview

The current system stores only fee item IDs in the `fee_items` field of the `student_fee_matrix` collection. This migration will update the system to store complete fee item information including name, amount, category, description, status, and frequency.

## Completed Tasks

- [x] Updated `useStudentFeeMatrixQuery.ts` to store full fee item details when saving assignments
- [x] Updated `useInvoiceData.ts` to properly parse and handle the new fee_items format
- [x] Created migration script `migrate-fee-items-to-full-details.js` to update existing records
- [x] Created PowerShell script `migrate-fee-items.ps1` to run the migration

## In Progress Tasks

- [ ] Test the migration script with sample data
- [ ] Run the migration on the development database
- [ ] Verify that the UI components properly display the full fee item details

## Future Tasks

- [ ] Update any remaining components that might be affected by the format change
- [ ] Add validation to ensure new records always use the full details format
- [ ] Consider adding a version field to track the data format
- [ ] Document the new data structure for future developers

## Implementation Details

### New Data Structure

The `fee_items` field will now store an array of objects with the following structure:

```json
[
  {
    "id": "fee_item_id",
    "name": "Fee Item Name",
    "amount": 100.00,
    "category": "Tuition",
    "description": "Monthly tuition fee",
    "status": "active",
    "frequency": "monthly"
  }
]
```

### Backward Compatibility

The system maintains backward compatibility by:
- Detecting the old format (array of IDs) and converting to placeholder objects
- Gracefully handling both formats during parsing
- Providing fallback values for missing fee item details

### Migration Process

1. **Preparation**: Ensure PocketBase is running and accessible
2. **Execution**: Run the migration script using PowerShell or Node.js
3. **Verification**: Check that all records have been updated with full details
4. **Testing**: Verify that the UI components display the information correctly

## Relevant Files

- `hooks/useStudentFeeMatrixQuery.ts` - Main hook for managing student fee assignments ✅
- `hooks/useInvoiceData.ts` - Hook for invoice data with fee matrix support ✅
- `scripts/migrate-fee-items-to-full-details.js` - Migration script ✅
- `scripts/migrate-fee-items.ps1` - PowerShell wrapper for migration ✅
- `app/components/finance/invoice-management/InvoiceCreator.tsx` - Displays fee items in invoice creation ✅
- `types/student-fees.ts` - Type definitions for fee items ✅

## Benefits of the Migration

1. **Better Performance**: No need to fetch fee item details separately
2. **Improved Data Integrity**: Fee item information is stored with the assignment
3. **Enhanced UI**: Direct access to fee item names and amounts for display
4. **Reduced API Calls**: Fewer database queries needed to display fee information
5. **Data Consistency**: Fee item details are preserved even if the original fee item is modified

## Risks and Considerations

1. **Data Duplication**: Fee item details are now duplicated across multiple student records
2. **Storage Increase**: The database will use more storage space
3. **Update Complexity**: Changes to fee items won't automatically propagate to existing assignments
4. **Migration Time**: Large datasets may take time to migrate

## Next Steps

1. Test the migration script with a small dataset
2. Run the migration on the development environment
3. Verify that all UI components work correctly with the new format
4. Monitor for any issues or unexpected behavior
5. Plan production migration if everything works as expected
