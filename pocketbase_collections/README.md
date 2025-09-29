# School Fee Management System - PocketBase Collections

This directory contains the PocketBase collection schemas for a clean, well-designed school fee management system that avoids spaghetti links and maintains historical data integrity.

## 🎯 Key Design Principles

### **1. Historical Data Integrity**
- **Invoices, payments, and receipts** store snapshot data, NOT live references
- If a student changes name/grade, old invoices still show the original information
- Financial records remain accurate and traceable

### **2. Clean Relationships**
- **No spaghetti links** - each collection has a clear, single responsibility
- **Live data** (students, fees) can change without affecting historical records
- **Historical records** (invoices, payments, receipts) are immutable snapshots

### **3. Separation of Concerns**
- **Templates** (fees) vs **Assignments** (student_fees) vs **Historical Records** (invoices)
- Each stage serves a specific purpose in the fee lifecycle

## 📊 Data Model Overview

```
students (live) → student_fees (assignment) → invoices (snapshot) → payments → receipts
     ↓                    ↓                        ↓
   templates            assignments            historical records
```

## 🗂️ Collections

### **1. students** - Live Student Data
**Purpose:** Current student information that can change over time
- `id` - Unique identifier
- `name` - Student's full name
- `studentId` - School-assigned student number (unique)
- `grade` - Current grade level
- `parentName` - Parent/guardian name
- `parentEmail` - Parent contact email
- `status` - active, graduated, transferred, inactive

### **2. fees** - Fee Templates
**Purpose:** Reusable fee templates that can be assigned to students
- `id` - Unique identifier
- `name` - Fee name (e.g., "Tuition Fee", "Library Fee")
- `category` - Fee category (e.g., "Academic", "Extracurricular")
- `amount` - Base amount
- `type` - recurring, one-time, optional
- `applicableGrades` - JSON array of applicable grades
- `status` - active, inactive
- `subItems` - JSON array of sub-items with amounts
- `description` - Optional description

### **3. student_fees** - Fee Assignments
**Purpose:** Links students to fee templates with specific configurations
- `id` - Unique identifier
- `studentId` - Reference to students collection
- `feeId` - Reference to fees collection
- `subItemStates` - JSON object tracking which sub-items are active
- `assignedDate` - When the fee was assigned
- `status` - active, inactive, removed

### **4. invoices** - Frozen Invoice Snapshots
**Purpose:** Historical invoice records with snapshot data
- `id` - Unique identifier
- `studentId` - Reference to students collection (for linking only)
- `studentName` - **SNAPSHOT** of student name at invoice time
- `studentGrade` - **SNAPSHOT** of student grade at invoice time
- `issueDate` - When invoice was issued
- `dueDate` - Payment due date
- `status` - issued, paid, overdue, cancelled
- `items` - **SNAPSHOT** JSON array of billed items
- `totalAmount` - Total invoice amount
- `notes` - Optional notes
- `invoiceNumber` - Unique invoice number

### **5. payments** - Payment Records
**Purpose:** Records of money received against invoices
- `id` - Unique identifier
- `invoiceId` - Reference to invoices collection
- `amountPaid` - Amount paid
- `datePaid` - Date payment was received
- `method` - cash, bank_transfer, credit_card, etc.
- `referenceNo` - Payment reference number
- `status` - pending, completed, failed, refunded
- `notes` - Optional notes

### **6. receipts** - Formal Receipts
**Purpose:** Formal proof of payment for parents
- `id` - Unique identifier
- `paymentId` - Reference to payments collection
- `receiptNumber` - Unique receipt number
- `dateIssued` - Date receipt was issued
- `recipientName` - Name of person who paid
- `items` - **SNAPSHOT** JSON array of items paid for
- `totalPaid` - Total amount paid
- `status` - draft, issued, sent, acknowledged
- `notes` - Optional notes

## 🔗 Relationship Flow

1. **students** → **student_fees** (many-to-many via junction table)
2. **student_fees** → **invoices** (generated from assignments, no direct link)
3. **invoices** → **payments** (1-to-many: one invoice can have multiple payments)
4. **payments** → **receipts** (1-to-1: one payment produces one receipt)

## 🚫 What's NOT Linked

- **fees** → **payments** (NO direct link - payments go through invoices)
- **student_fees** → **invoices** (NO direct link - invoices are generated snapshots)
- **students** → **invoices** (only linked by ID, invoice stores snapshot data)

## 📈 Benefits of This Design

### **1. Data Integrity**
- Historical invoices remain accurate even if student data changes
- Financial records are immutable and traceable
- No orphaned records when templates are deleted

### **2. Flexibility**
- Fee templates can be modified without affecting existing invoices
- Students can be reassigned fees without breaking history
- Multiple payment methods and partial payments supported

### **3. Audit Trail**
- Complete traceability from student assignment to receipt
- All financial transactions are properly linked
- Historical data is preserved for reporting

### **4. Scalability**
- Clean separation allows for easy reporting and analytics
- No complex joins needed for common queries
- Easy to extend with additional features

## 🛠️ Import Instructions

1. **Start PocketBase** on your server
2. **Access Admin UI** at `http://your-server:8090/_/`
3. **Create Collections** using the JSON files in this directory:
   - Import `students.json`
   - Import `fees.json`
   - Import `student_fees.json`
   - Import `invoices.json`
   - Import `payments.json`
   - Import `receipts.json`

4. **Set up Indexes** - The JSON files include optimized database indexes
5. **Configure Rules** - Set appropriate access rules for your use case

## 📝 Usage Examples

### **Creating a Fee Assignment**
```javascript
// 1. Create fee template
const fee = await pb.collection('fees').create({
  name: "Tuition Fee",
  category: "Academic",
  amount: 1000,
  type: "recurring",
  applicableGrades: ["一年级", "二年级", "三年级"],
  status: "active",
  subItems: [
    { id: 1, name: "Basic Tuition", amount: 800 },
    { id: 2, name: "Materials", amount: 200 }
  ]
});

// 2. Assign fee to student
const assignment = await pb.collection('student_fees').create({
  studentId: "student123",
  feeId: fee.id,
  subItemStates: { "1": true, "2": true },
  assignedDate: "2024-01-15",
  status: "active"
});
```

### **Generating an Invoice**
```javascript
// 3. Generate invoice (snapshot)
const invoice = await pb.collection('invoices').create({
  studentId: "student123",
  studentName: "张三", // SNAPSHOT
  studentGrade: "二年级", // SNAPSHOT
  issueDate: "2024-01-15",
  dueDate: "2024-01-30",
  status: "issued",
  items: [
    { name: "Basic Tuition", amount: 800 },
    { name: "Materials", amount: 200 }
  ], // SNAPSHOT
  totalAmount: 1000,
  invoiceNumber: "INV-2024-001"
});
```

### **Recording a Payment**
```javascript
// 4. Record payment
const payment = await pb.collection('payments').create({
  invoiceId: invoice.id,
  amountPaid: 1000,
  datePaid: "2024-01-20",
  method: "bank_transfer",
  referenceNo: "TXN123456",
  status: "completed"
});
```

### **Generating a Receipt**
```javascript
// 5. Generate receipt
const receipt = await pb.collection('receipts').create({
  paymentId: payment.id,
  receiptNumber: "RCP-2024-001",
  dateIssued: "2024-01-20",
  recipientName: "李四", // Parent name
  items: [
    { name: "Basic Tuition", amount: 800 },
    { name: "Materials", amount: 200 }
  ], // SNAPSHOT
  totalPaid: 1000,
  status: "issued"
});
```

## 🔍 Query Examples

### **Get Student's Current Fee Assignments**
```javascript
const assignments = await pb.collection('student_fees').getList(1, 50, {
  filter: `studentId = "${studentId}" && status = "active"`,
  expand: 'feeId'
});
```

### **Get Student's Invoice History**
```javascript
const invoices = await pb.collection('invoices').getList(1, 50, {
  filter: `studentId = "${studentId}"`,
  sort: '-issueDate'
});
```

### **Get Payment History for Invoice**
```javascript
const payments = await pb.collection('payments').getList(1, 50, {
  filter: `invoiceId = "${invoiceId}"`,
  sort: 'datePaid'
});
```

This design ensures your school fee management system is robust, scalable, and maintains data integrity throughout the entire fee lifecycle.

## 🔄 实际数据库结构更新 (2025-09-29)

### 重要发现和修复

#### 1. 集合ID映射
- **Teachers**: `pbc_2907260911`
- **Students**: `pbc_3827815851` 
- **Classes**: `pbc_2478702895`
- **Centers**: `pbc_2011403882`

#### 2. 关键字段修复
- **Classes 查询**: 使用 `center.name = "WX 01"` 而不是 `center = "WX 01"`
- **Teachers 权限**: 支持 `"normal_teacher"`, `"senior_teacher"`, `"admin"`
- **字段验证**: 基于实际数据库结构进行字段验证

#### 3. 新增文件
- `collections_list.json` - 完整的集合列表和ID映射
- `field_mappings.md` - 详细的字段映射和查询语法说明

#### 4. API 修复状态
- ✅ **Classes API** - 查询语法已修复
- ✅ **Points API** - 字段验证已优化
- ✅ **Students API** - 字段过滤已实现
- ⚠️ **Teachers API** - 部分字段仍需调整

### 使用建议

1. **查询关系字段**: 始终使用 `relation_field.name` 语法
2. **字段验证**: 参考 `field_mappings.md` 中的有效字段列表
3. **API 开发**: 基于实际数据库结构进行字段映射
4. **错误处理**: 实现适当的字段验证和错误处理

### 相关文件
- `collections_list.json` - 所有集合的完整列表
- `field_mappings.md` - 字段映射和查询语法指南
- `teachers.json` - 更新后的教师集合结构
- `students.json` - 更新后的学生集合结构
- `classes.json` - 更新后的班级集合结构