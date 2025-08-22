# Student Fee Matrix System Guide

## 📋 Overview

The Student Fee Matrix is a comprehensive fee allocation system that allows administrators to assign fee items to students in an organized, category-based interface. This system replaces the previous sub-item complexity with a streamlined approach using individual fee items grouped by categories.

## 🎯 Key Features

### ✅ Category-based Organization
- Fees are organized by categories (e.g., "学费", "杂费", "活动费")
- Each category can be expanded/collapsed for better organization
- Category headers show summary information (total items, assigned count, total amount)

### ✅ Individual Fee Item Controls
- Toggle switches for each individual fee item
- Real-time assignment/unassignment of fees to students
- Visual feedback for assigned vs unassigned fees

### ✅ Edit Mode System
- Toggle switches are only active when "Edit Mode" is enabled
- Prevents accidental changes during viewing
- Clear visual indication when edit mode is active

### ✅ Batch Operations
- Support for batch operations across multiple students
- Efficient management of fee assignments for groups of students

### ✅ Real-time Synchronization
- All changes sync immediately with PocketBase
- No manual refresh required
- Optimistic UI updates for better user experience

## 🚀 Getting Started

### Accessing the Student Fee Matrix

1. **Navigate to Finance Management**
   - Go to the main dashboard
   - Click on "Finance Management" or navigate to the finance section

2. **Open Student Fee Allocation**
   - Click on the "Student Fee Allocation" tab
   - The matrix will load with all students and their current fee assignments

3. **Understanding the Interface**
   - **Student Cards**: Each student is displayed as a collapsible card
   - **Fee Categories**: Fees are grouped by categories within each student card
   - **Toggle Switches**: Individual fee items have toggle switches for assignment

## 📊 Interface Components

### Student Card Header
```
┌─────────────────────────────────────────────────────────────┐
│ ▼ 张三 (Standard 1 • 学号: ST001)                   应缴费 RM 500  [📄] 已缴费 2024-01-15 │
└─────────────────────────────────────────────────────────────┘
```

**Elements:**
- **Expand/Collapse Arrow**: Click to expand student's fee details
- **Student Info**: Name, grade, and student ID
- **Total Amount**: Current total fees assigned to the student
- **Invoice Button**: Generate invoice for the student
- **Payment Status**: Current payment status and date

### Fee Category Section
```
┌─────────────────────────────────────────────────────────────┐
│ ▼ 学费 (3 个项目 • 2 个已分配)                           RM 400  [3 项] │
├─────────────────────────────────────────────────────────────┤
│ 学费项目 1                    [✓] RM 200                    │
│ 学费项目 2                    [✓] RM 200                    │
│ 学费项目 3                    [✗] RM 100                    │
└─────────────────────────────────────────────────────────────┘
```

**Elements:**
- **Category Name**: Name of the fee category
- **Summary**: Number of items and assigned count
- **Total Amount**: Total amount for assigned fees in this category
- **Item Count Badge**: Total number of items in the category
- **Individual Items**: Each fee item with toggle switch and amount

## 🎮 Usage Instructions

### Enabling Edit Mode

1. **Click "编辑" (Edit) Button**
   - Located in the top-right corner of the matrix
   - This enables all toggle switches for fee assignment

2. **Visual Feedback**
   - Toggle switches become active (no longer grayed out)
   - Edit mode indicator appears in the header

### Assigning Fees to Students

1. **Expand Student Card**
   - Click the arrow next to the student name
   - This reveals all fee categories for that student

2. **Expand Fee Categories**
   - Click on category headers to see individual fee items
   - Categories show summary information when collapsed

3. **Toggle Fee Assignment**
   - Click the toggle switch next to any fee item
   - The switch will change state (checked/unchecked)
   - The total amount updates immediately

### Batch Operations

1. **Enable Batch Mode**
   - Click the "批量操作" (Batch Operations) button
   - This enables batch mode for multiple students

2. **Select Target Students**
   - Use search and filter to narrow down students
   - Batch operations apply to all visible students

3. **Perform Batch Assignment**
   - Toggle fees in batch mode
   - Changes apply to all selected students simultaneously

### Creating Invoices

1. **Assign Required Fees**
   - Ensure all necessary fees are assigned to the student
   - Verify the total amount is correct

2. **Generate Invoice**
   - Click the invoice button (📄) next to the student's total
   - Confirm the invoice creation in the dialog

3. **Invoice Details**
   - Invoice includes all assigned fees
   - Due date is set to 15 days from creation
   - Payment status is updated to "pending"

## 🔍 Search and Filtering

### Student Search
- **Search by Name**: Type student name to filter results
- **Search by Student ID**: Use student ID for quick lookup
- **Search by Grade**: Filter by specific grade levels
- **Search by Parent Name**: Find students by parent information

### Grade Filtering
- **All Grades**: View all students (default)
- **Specific Grade**: Select a specific grade level
- **Primary/Secondary**: Filter by education level

### Category Controls
- **Expand All**: Expand all fee categories at once
- **Collapse All**: Collapse all fee categories
- **Individual Control**: Click category headers for individual control

## 📊 Data Management

### Fee Items
- **Source**: Fee items are managed in the Fee Management section
- **Categories**: Each fee item belongs to a category
- **Amounts**: Individual amounts for each fee item
- **Status**: Active/inactive status for fee items

### Student Fee Assignments
- **Storage**: Assignments stored in PocketBase `student_fees` collection
- **Real-time Sync**: Changes sync immediately with the database
- **Optimistic Updates**: UI updates immediately for better UX
- **Error Handling**: Failed assignments are reverted automatically

### Payment Status
- **Not Issued**: No invoice created yet
- **Pending**: Invoice created, payment pending
- **Paid**: Payment received
- **Overdue**: Payment past due date

## ⚙️ Technical Implementation

### Component Structure
```
StudentFeeMatrix/
├── StudentFeeMatrix.tsx          # Main matrix component
├── StudentCard.tsx               # Individual student card
├── StudentFeeMatrixHeader.tsx    # Header with controls
└── SearchAndFilter.tsx           # Search and filtering
```

### Data Flow
1. **Fee Items**: Loaded from `useFees` hook (PocketBase)
2. **Student Data**: Loaded from `useStudents` hook (PocketBase)
3. **Fee Assignments**: Managed by `useStudentFeeMatrix` hook (Enterprise-grade with unified API service)
4. **Real-time Updates**: Changes sync immediately via PocketBase

### State Management
- **Expanded Students**: Track which student cards are expanded
- **Expanded Categories**: Track which categories are expanded per student
- **Edit Mode**: Track whether edit mode is enabled
- **Batch Mode**: Track whether batch operations are active

## 🐛 Troubleshooting

### Common Issues

**Toggle Switches Not Working**
- Ensure "Edit Mode" is enabled
- Check that you have proper permissions
- Verify PocketBase connection is active

**Changes Not Saving**
- Check network connection
- Verify PocketBase server is running
- Look for error messages in browser console

**Slow Performance**
- Reduce the number of expanded categories
- Use search/filter to limit visible students
- Check PocketBase server performance

### Error Messages

**"Failed to fetch student fees"**
- PocketBase connection issue
- Check server status and network connectivity

**"Request was autocancelled"**
- Normal behavior when making rapid changes
- Changes are automatically retried

**"Component unmounted"**
- Normal cleanup when navigating away
- No action required

## 🔄 Recent Updates

### v1.1.0 - Major Refactoring
- ✅ **Removed Sub-item Complexity**: Simplified to individual fee items
- ✅ **Category-based Display**: Better organization of fees
- ✅ **Clean Interface**: Streamlined UI without sub-item complexity
- ✅ **Real-time Sync**: Immediate synchronization with PocketBase
- ✅ **Improved Performance**: Better handling of large datasets

### Removed Components
- ❌ `BatchOperationsDialog.tsx` - Replaced with inline controls
- ❌ `FeeCard.tsx` - Integrated into StudentCard
- ❌ `SubItemForm.tsx` - No longer needed

## 📞 Support

For technical support or questions about the Student Fee Matrix:

1. **Check Documentation**: Review this guide and project documentation
2. **Browser Console**: Check for error messages in browser developer tools
3. **PocketBase Logs**: Review server logs for backend issues
4. **Create Issue**: Submit a GitHub issue with detailed information

---

**Student Fee Matrix System** - Streamlined fee allocation for modern education management
