# PocketBase 400 Bad Request Troubleshooting Guide

## Problem Summary
Your payments collection is experiencing persistent 400 Bad Request errors when trying to use the `expand` feature. The error occurs regardless of which expand field name is used (`invoice_id`, `invoice`, `invoices`, `invoiceId`).

## Root Cause Analysis

### 1. **Collection Schema Mismatch** (Most Likely)
The `payments` collection might not have the relation fields that the code is trying to expand, or the relation fields have different names than expected.

**Symptoms:**
- All expand attempts fail with 400 errors
- Basic collection access works (can fetch records without expand)
- Other collections (invoices) work fine with expand

**Investigation Steps:**
1. Check the exact field names in your `payments` collection
2. Verify that relation fields exist and are properly configured
3. Confirm the relation field names match what the code is trying to expand

### 2. **API Rules Configuration**
While basic collection access works, there might be specific rules preventing the `expand` operation on the `payments` collection.

**Symptoms:**
- Basic fetch works
- Expand operations fail with 400
- Other collections work with expand

**Investigation Steps:**
1. Check API rules for the `payments` collection
2. Verify that expand operations are allowed
3. Check if there are field-level restrictions

### 3. **Relation Field Configuration**
The relation between `payments` and `invoices` might not be properly configured in PocketBase.

**Symptoms:**
- Expand fails with generic error messages
- No specific field validation errors

**Investigation Steps:**
1. Verify relation field setup in PocketBase admin
2. Check if the relation is bidirectional
3. Confirm the target collection exists and is accessible

## Diagnostic Tools

### 1. **Enhanced Debug Logging**
The updated `usePaymentData.ts` now includes comprehensive diagnostics:
- Tests basic collection access first
- Tests different expand parameter variations
- Examines record structure
- Provides detailed error analysis

### 2. **PocketBase Debugger Component**
A new UI component that provides:
- Collection field analysis
- Expand functionality testing
- Comprehensive diagnostics
- Real-time results display

### 3. **Debug Utility Functions**
Enhanced debugging utilities in `lib/debug.ts`:
- Collection structure analysis
- Relation field identification
- Expand operation testing
- Error cause analysis

## Step-by-Step Troubleshooting

### Step 1: Run Basic Diagnostics
1. Open the Debug tab in your payment management interface
2. Click "Run Full Diagnostic"
3. Review the results for any obvious issues

### Step 2: Analyze Collection Structure
1. Click "Analyze Payments Collection"
2. This will:
   - Test basic collection access
   - Identify potential relation fields
   - Test expand with each potential field
   - Provide detailed results

### Step 3: Check Field Names
1. Click "Test Collection Fields"
2. Compare the actual field names with what your code expects
3. Look for fields that might contain invoice IDs

### Step 4: Test Expand Functionality
1. Click "Test Expand Issues"
2. This tests the specific expand fields your code is trying to use
3. Note which fields fail and why

## Common Solutions

### Solution 1: Fix Field Name Mismatch
If the actual field name is different from what your code expects:

```typescript
// Update your expand parameter to match the actual field name
const params = {
  sort: '-created',
  expand: 'actual_field_name', // Use the name from diagnostics
  perPage: 200
}
```

### Solution 2: Check PocketBase Admin Panel
1. Go to your PocketBase admin interface
2. Navigate to Collections → payments
3. Check the schema for relation fields
4. Verify the relation is properly configured

### Solution 3: Update API Rules
If expand operations are blocked:
1. Check the API rules for the `payments` collection
2. Ensure expand operations are allowed
3. Verify user permissions

### Solution 4: Verify Relation Setup
1. Check if the relation field points to the correct collection
2. Verify the relation is bidirectional if needed
3. Ensure the target collection exists and is accessible

## Expected Results After Fix

Once the issue is resolved, you should see:
- ✅ Basic collection access works
- ✅ Expand operations succeed
- ✅ Related invoice data is properly fetched
- ✅ No more 400 Bad Request errors

## Next Steps

1. **Run the diagnostics** using the updated tools
2. **Identify the specific issue** from the diagnostic results
3. **Apply the appropriate solution** based on the root cause
4. **Test the fix** by refreshing the payments tab
5. **Verify expand functionality** works as expected

## Additional Resources

- [PocketBase Documentation - Relations](https://pocketbase.io/docs/collections/#relations)
- [PocketBase Documentation - API Rules](https://pocketbase.io/docs/api-rules/)
- [PocketBase Documentation - Expand](https://pocketbase.io/docs/api-records/#expand)

## Support

If the issue persists after following this guide:
1. Check the diagnostic results for specific error messages
2. Verify your PocketBase version and configuration
3. Check the PocketBase server logs for additional details
4. Consider checking the PocketBase GitHub issues for similar problems
