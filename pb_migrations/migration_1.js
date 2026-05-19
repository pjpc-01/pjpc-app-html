migrate((db) => {
  const dao = new Dao(db);

  // 1. Teachers
  const teachers = new Collection({
    name: 'teachers',
    type: 'base',
    schema: [
      { name: 'name', type: 'text' },
      { name: 'user_id', type: 'text' },
      { name: 'email', type: 'email' },
      { name: 'phone', type: 'text' },
      { name: 'status', type: 'select', options: { values: ['active', 'inactive'] } },
      { name: 'permissions', type: 'select', options: { values: ['normal_teacher', 'senior_teacher', 'admin'] } },
    ],
    rules: {
      list: '@request.auth.role = "admin" || @request.auth.role = "teacher"',
      view: '@request.auth.role = "admin" || @request.auth.role = "teacher"',
      create: '@request.auth.role = "admin"',
      update: '@request.auth.role = "admin"',
      delete: '@request.auth.role = "admin"',
    },
  });
  dao.saveCollection(teachers);

  // 2. Courses
  const courses = new Collection({
    name: 'courses',
    type: 'base',
    schema: [
      { name: 'title', type: 'text', required: true },
      { name: 'description', type: 'text' },
      { name: 'subject', type: 'text', required: true },
      { name: 'grade_level', type: 'text' },
      { name: 'duration', type: 'number' },
      { name: 'max_students', type: 'number' },
      { name: 'status', type: 'select', options: { values: ['active', 'inactive'] } },
      { name: 'teacher_id', type: 'relation', options: { collectionId: teachers.id, maxSelect: 1 } },
    ],
  });
  dao.saveCollection(courses);

  // 3. Classes
  const classes = new Collection({
    name: 'classes',
    type: 'base',
    schema: [
      { name: 'name', type: 'text' },
      { name: 'level', type: 'text' },
      { name: 'section', type: 'text' },
      { name: 'description', type: 'text' },
      { name: 'room', type: 'text' },
      { name: 'max_capacity', type: 'number' },
      { name: 'current_students', type: 'number' },
      { name: 'status', type: 'select', options: { values: ['active', 'inactive'] } },
      { name: 'course_id', type: 'relation', options: { collectionId: courses.id, maxSelect: 1 } },
      { name: 'teacher_id', type: 'relation', options: { collectionId: teachers.id, maxSelect: 1 } },
    ],
  });
  dao.saveCollection(classes);

  // 4. Students
  const students = new Collection({
    name: 'students',
    type: 'base',
    schema: [
      { name: 'student_id', type: 'text' },
      { name: 'student_name', type: 'text', required: true },
      { name: 'standard', type: 'text', required: true },
      { name: 'parentName', type: 'text', required: true },
      { name: 'status', type: 'select', options: { values: ['active', 'inactive', 'graduated'] }, required: true },
      { name: 'security_status', type: 'select', options: { values: ['normal', 'suspicious', 'locked'] } },
      { name: 'cardStatus', type: 'select', options: { values: ['active', 'inactive', 'lost'] } },
    ],
  });
  dao.saveCollection(students);

  // 5. Invoices
  const invoices = new Collection({
    name: 'invoices',
    type: 'base',
    schema: [
      { name: 'studentId', type: 'relation', options: { collectionId: students.id, maxSelect: 1 } },
      { name: 'studentName', type: 'text' },
      { name: 'studentGrade', type: 'text' },
      { name: 'issueDate', type: 'date' },
      { name: 'dueDate', type: 'date' },
      { name: 'status', type: 'select', options: { values: ['issued', 'paid', 'overdue', 'cancelled'] }, required: true },
      { name: 'totalAmount', type: 'number', required: true },
      { name: 'notes', type: 'text' },
      { name: 'invoiceNumber', type: 'text', required: true },
    ],
  });
  dao.saveCollection(invoices);

  // 6. Payments
  const payments = new Collection({
    name: 'payments',
    type: 'base',
    schema: [
      { name: 'invoiceId', type: 'relation', options: { collectionId: invoices.id, maxSelect: 1 } },
      { name: 'amountPaid', type: 'number', required: true },
      { name: 'datePaid', type: 'date' },
      { name: 'method', type: 'select', options: { values: ['cash', 'bank_transfer', 'credit_card', 'online_payment', 'other'] } },
      { name: 'referenceNo', type: 'text' },
      { name: 'status', type: 'select', options: { values: ['pending', 'completed', 'failed', 'refunded'] }, required: true },
      { name: 'notes', type: 'text' },
    ],
  });
  dao.saveCollection(payments);
})
