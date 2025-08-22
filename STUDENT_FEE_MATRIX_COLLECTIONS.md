# Student Fee Matrix Collections & Fields Documentation

This document outlines all the PocketBase collections and their fields that the StudentFeeMatrix hook uses for data fetching and management.

## 📊 Collections Overview

The StudentFeeMatrix hook interacts with **3 main collections**:

1. **`students`** - Student information
2. **`fees_items`** - Fee/charge items
3. **`student_fees`** - Student fee assignments (junction table)

---

## 🎓 Collection: `students`

**Purpose**: Stores student information and personal details

### Fields Used by StudentFeeMatrix:

| Field Name | Type | Description | Usage |
|------------|------|-------------|-------|
| `id` | string | Unique identifier | Primary key, used for relationships |
| `student_name` | string | Student's full name | Displayed in student cards |
| `standard` | string | Student's grade/class | Used for filtering and display |
| `parents_name` | string | Parent/guardian name | Displayed in student info |
| `studentId` | string | Student ID number | Used for identification |
| `status` | string | Student status | Filtered for "active" students only |

### Query Filters:
```javascript
// Active students only
filter: 'status = "active"'
sort: 'student_name'
```

### Data Mapping:
```typescript
const studentCards: StudentNameCard[] = response.map((card: any) => ({
  id: card.id,
  studentName: card.student_name,
  grade: card.standard,
  parentName: card.parents_name,
  studentId: card.studentId
}))
```

---

## 💰 Collection: `fees_items`

**Purpose**: Stores fee/charge items that can be assigned to students

### Fields Used by StudentFeeMatrix:

| Field Name | Type | Description | Usage |
|------------|------|-------------|-------|
| `id` | string | Unique identifier | Primary key, used for assignments |
| `name` | string | Fee item name | Displayed in fee lists |
| `amount` | number | Fee amount | Used for calculations |
| `category` | string | Fee category | Used for grouping fees |
| `description` | string | Fee description | Displayed in fee details |
| `status` | string | Fee status | Filtered for "active" fees only |

### Query Filters:
```javascript
// Active fees only
filter: 'status = "active"'
sort: 'name'
```

### Data Mapping:
```typescript
const feeItems: FeeItem[] = response.map((item: any) => ({
  id: item.id,
  name: item.name,
  amount: item.amount,
  active: true,
  category: item.category,
  description: item.description
}))
```

---

## 📋 Collection: `student_fees`

**Purpose**: Junction table that links students to their assigned fees

### Fields Used by StudentFeeMatrix:

| Field Name | Type | Description | Usage |
|------------|------|-------------|-------|
| `id` | string | Unique identifier | Primary key |
| `students` | string | Student ID (relation) | Links to students collection |
| `fee_items` | json | Array of fee items | Stores assigned fee data |
| `totalAmount` | number | Total amount for student | Calculated sum of fees |
| `created` | date | Creation timestamp | Used for sorting |

### Query Filters:
```javascript
// All assignments (no status filter)
sort: 'created'
// Fallback: sort: '-created'
```

### Data Structure:
```typescript
const assignmentData = {
  students: studentId,
  fee_items: JSON.stringify(feeItems), // Stored as JSON string
  totalAmount: totalAmount
}
```

### Expanded Student Data:
When expanding student relationships, the hook fetches:
```typescript
expandedStudent = await pbRef.current.collection('students').getOne(record.students)
// Returns: { id, student_name, standard, parents_name, studentId }
```

---

## 🔄 Data Flow & Relationships

### 1. **Student Fee Assignment Process**
```
students (id) ←→ student_fees (students) ←→ fee_items (stored in fee_items JSON)
```

### 2. **Data Fetching Sequence**
1. **Fetch Students**: `students` collection with `status = "active"`
2. **Fetch Fees**: `fees_items` collection with `status = "active"`
3. **Fetch Assignments**: `student_fees` collection with student expansion

### 3. **Assignment Operations**
- **Create**: Insert new record in `student_fees`
- **Update**: Modify existing record in `student_fees`
- **Delete**: Remove record from `student_fees`

---

## 🛠️ Hook Methods & Collection Usage

### **Data Fetching Methods:**

#### `fetchStudentCards()`
- **Collection**: `students`
- **Fields**: `id`, `student_name`, `standard`, `parents_name`, `studentId`
- **Filter**: `status = "active"`

#### `fetchFeeItems()`
- **Collection**: `fees_items`
- **Fields**: `id`, `name`, `amount`, `category`, `description`
- **Filter**: `status = "active"`

#### `fetchStudentFeeAssignments()`
- **Collection**: `student_fees`
- **Fields**: `id`, `students`, `fee_items`, `totalAmount`
- **Expansion**: `students` collection for student details

### **Data Modification Methods:**

#### `upsertStudentFeeAssignment()`
- **Collection**: `student_fees`
- **Operations**: Create/Update records
- **Fields**: `students`, `fee_items`, `totalAmount`

---

## 📝 TypeScript Interfaces

### **StudentNameCard**
```typescript
interface StudentNameCard {
  id: string
  studentName: string      // maps to: student_name
  grade?: string          // maps to: standard
  parentName?: string     // maps to: parents_name
  studentId?: string      // maps to: studentId
}
```

### **FeeItem**
```typescript
interface FeeItem {
  id: string
  name: string           // maps to: name
  amount: number         // maps to: amount
  active: boolean        // derived from status
  category?: string      // maps to: category
  description?: string   // maps to: description
}
```

### **StudentFeeAssignment**
```typescript
interface StudentFeeAssignment {
  id: string
  students: string       // maps to: students (relation)
  fee_items: FeeItem[]   // maps to: fee_items (JSON)
  totalAmount: number    // maps to: totalAmount
  expand?: {
    students?: {
      id: string
      student_name: string
      standard: string
      parents_name: string
      studentId: string
    }
  }
}
```

---

## 🔍 Query Examples

### **Get All Active Students**
```javascript
await pb.collection('students').getFullList({
  filter: 'status = "active"',
  sort: 'student_name'
})
```

### **Get All Active Fees**
```javascript
await pb.collection('fees_items').getFullList({
  filter: 'status = "active"',
  sort: 'name'
})
```

### **Get Student Fee Assignments**
```javascript
await pb.collection('student_fees').getFullList({
  sort: 'created'
})
```

### **Find Assignment for Specific Student**
```javascript
await pb.collection('student_fees').getFirstListItem(
  `students = "${studentId}"`
)
```

### **Expand Student Data**
```javascript
await pb.collection('students').getOne(studentId)
```

---

## ⚠️ Important Notes

1. **JSON Storage**: Fee items are stored as JSON strings in the `fee_items` field
2. **Relationships**: Student relationships are handled via ID references
3. **Status Filtering**: Only active students and fees are fetched
4. **Error Handling**: Multiple fallback strategies for query failures
5. **Request Keys**: Unique request keys prevent auto-cancellation issues
