import { useState, useMemo } from "react"
import { useFees } from "@/hooks/useFees"
import { useStudents } from "@/hooks/useStudents"
import { useStudentFees } from "@/hooks/useStudentFees"
import { useInvoices } from "@/hooks/useInvoices"
import { StudentFeeMatrixHeader } from "./StudentFeeMatrixHeader"
import { SearchAndFilter } from "./SearchAndFilter"
import { StudentCard } from "./StudentCard"

export const StudentFeeMatrix = () => {
  const { fees } = useFees()
  const { students } = useStudents()
  const { isAssigned, getStudentAmount, assignFeeToStudent, removeFeeFromStudent, enterEditMode, exitEditMode, loading: studentFeesLoading, error: studentFeesError } = useStudentFees()
  const { createInvoice: createInvoiceFromHook, invoices } = useInvoices()

  const [studentInvoices, setStudentInvoices] = useState<Map<string, boolean>>(new Map())
  const [editMode, setEditMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>("all")
  const [batchMode, setBatchMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [expandedStudents, setExpandedStudents] = useState<string[]>([])

  const allFees = fees

  const groupedFees = useMemo(() => {
    return allFees.reduce((groups, fee) => {
      const cat = fee.category || "未分类"
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(fee)
      return groups
    }, {} as Record<string, typeof allFees>)
  }, [allFees])

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (s.status === 'graduated') return false
      if (selectedGradeFilter !== "all" && s.standard !== selectedGradeFilter) return false
      if (!searchTerm.trim()) return true
      const q = searchTerm.toLowerCase()
      return (s.student_name?.toLowerCase().includes(q) || s.student_id?.toLowerCase().includes(q) || s.standard?.toLowerCase().includes(q))
    })
  }, [students, searchTerm, selectedGradeFilter])

  const availableGrades = useMemo(() => {
    const grades = [...new Set(students.filter(s => s.status !== 'graduated' && s.standard).map(s => s.standard!))]
    const order: Record<string, number> = { '一年级': 1, '二年级': 2, '三年级': 3, '四年级': 4, '五年级': 5, '六年级': 6 }
    return grades.sort((a, b) => (order[a] ?? 99) - (order[b] ?? 99))
  }, [students])

  if (studentFeesLoading) return <div className="py-12 text-center text-muted-foreground">加载中...</div>
  if (studentFeesError) return <div className="py-12 text-center text-red-600">加载失败: {studentFeesError}</div>

  const createInvoice = (studentId: string) => {
    const student = students.find(s => s.id === studentId)
    if (!student) return
    const total = getStudentAmount(studentId, allFees)
    const items = allFees.filter(f => isAssigned(studentId, f.id)).map(f => ({ name: f.name, amount: f.amount }))
    createInvoiceFromHook({
      studentId, studentName: student.student_name || '', studentGrade: student.standard || '',
      totalAmount: total, items, status: 'issued',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      notes: `${new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}学费`
    })
    setStudentInvoices(prev => { const m = new Map(prev); m.set(studentId, true); return m })
  }

  const hasInvoiceThisMonth = (studentId: string) => {
    const m = new Date().toISOString().slice(0, 7)
    return invoices.some(i => i.studentId === studentId && i.issueDate.startsWith(m))
  }

  const toggleEditMode = async () => {
    if (!editMode) { enterEditMode(); setEditMode(true) }
    else {
      setIsSaving(true)
      try {
        const result = await exitEditMode()
        if (result?.failures?.length === 0) setEditMode(false)
        else alert(`保存失败：${result?.failures?.length || 0} 条未保存`)
      } catch { alert('保存失败') }
      finally { setIsSaving(false) }
    }
  }

  const toggleStudent = (id: string) => {
    setExpandedStudents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <div className="space-y-6">
      <StudentFeeMatrixHeader editMode={editMode} onToggleEditMode={toggleEditMode} batchMode={batchMode} onToggleBatchMode={() => setBatchMode(!batchMode)} isSaving={isSaving} />
      <SearchAndFilter
        searchTerm={searchTerm} onSearchChange={setSearchTerm} onClearSearch={() => setSearchTerm("")}
        selectedGradeFilter={selectedGradeFilter} onGradeFilterChange={setSelectedGradeFilter}
        availableGrades={availableGrades} filteredStudentsCount={filteredStudents.length} totalStudentsCount={students.length}
      />
      <div className="space-y-3">
        {filteredStudents.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">没有匹配的学生</div>
        ) : (
          filteredStudents.map(student => (
            <StudentCard
              key={student.id}
              student={student}
              isExpanded={expandedStudents.includes(student.id)}
              onToggleExpansion={() => toggleStudent(student.id)}
              activeFees={allFees}
              groupedFees={groupedFees}
              studentTotal={getStudentAmount(student.id, allFees)}
              onCreateInvoice={createInvoice}
              editMode={editMode}
              isAssigned={isAssigned}
              assignFeeToStudent={assignFeeToStudent}
              removeFeeFromStudent={removeFeeFromStudent}
              hasInvoiceThisMonth={hasInvoiceThisMonth}
            />
          ))
        )}
      </div>
    </div>
  )
}
