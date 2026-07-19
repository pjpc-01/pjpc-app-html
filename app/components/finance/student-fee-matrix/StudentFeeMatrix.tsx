import { useState, useMemo } from "react"
import { useFees } from "@/hooks/useFees"
import { useStudents } from "@/hooks/useStudents"
import { useStudentFees } from "@/hooks/useStudentFees"
import { useInvoices } from "@/hooks/useInvoices"
import { StudentFeeMatrixHeader } from "./StudentFeeMatrixHeader"
import { SearchAndFilter } from "./SearchAndFilter"
import { FeeCard } from "./FeeCard"

export const StudentFeeMatrix = () => {
  const { fees } = useFees()
  const { students } = useStudents()
  const { isAssigned, getStudentAmount, assignFeeToStudent, removeFeeFromStudent, enterEditMode, exitEditMode,
    loading: studentFeesLoading, error: studentFeesError,
    setLocalDiscount, toggleLocalSixMonthFeeId, setLocalSixMonthPayRate, setLocalSixMonthPayRateType, getLocalAdjustment, isEditMode: hookEditMode } = useStudentFees()
  const { createInvoice: createInvoiceFromHook, invoices } = useInvoices()

  const [studentInvoices, setStudentInvoices] = useState<Map<string, boolean>>(new Map())
  const [editMode, setEditMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>("all")
  const [batchMode, setBatchMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

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

  const createInvoice = async (studentId: string) => {
    const student = students.find(s => s.id === studentId)
    if (!student) return
    const adj = getLocalAdjustment(studentId)
    const assignedFees = allFees.filter(f => isAssigned(studentId, f.id))

    let items = assignedFees.map(f => ({ name: f.name, amount: f.amount }))

    // Apply per-item six-month prepay logic
    const sixMonthFeeIds = adj.six_month_fee_ids || []
    let sixMonthPayRate = adj.six_month_pay_rate || 0
    const sixMonthPayRateType = adj.six_month_pay_rate_type || 'percent'
    if (sixMonthFeeIds.length > 0) {
      // Rebuild items: only fees in sixMonthFeeIds get ×6
      const sixMonthItems: { name: string; amount: number }[] = []
      let sixMonthTotal = 0

      for (const fee of assignedFees) {
        if (sixMonthFeeIds.includes(fee.id)) {
          const amount = (fee.amount || 0) * 6
          sixMonthItems.push({ name: `${fee.name} (×6个月)`, amount })
          sixMonthTotal += amount
        } else {
          sixMonthItems.push({ name: fee.name, amount: fee.amount || 0 })
          sixMonthTotal += fee.amount || 0
        }
      }

      // Apply six_month_pay discount if rate is set
      if (sixMonthPayRate > 0) {
        const prepayDiscount = sixMonthPayRateType === 'amount'
          ? Math.round(sixMonthPayRate * 100) / 100
          : Math.round(sixMonthTotal * sixMonthPayRate * 100) / 100

        if (prepayDiscount > 0) {
          const prepayLabel = sixMonthPayRateType === 'amount'
            ? `预付折扣 (RM${prepayDiscount.toFixed(2)})`
            : `预付折扣 (${(sixMonthPayRate * 100).toFixed(0)}%)`
          sixMonthItems.push({ name: prepayLabel, amount: -prepayDiscount })
          sixMonthTotal -= prepayDiscount
        }
      }

      items = sixMonthItems
    }

    // Include discount as a line item — calculate the actual RM amount
    const discount = adj.discount || 0
    const discountType = adj.discount_type || 'amount'
    if (discount > 0) {
      const baseAmount = items.reduce((sum, it) => sum + it.amount, 0)
      const actualDiscount = discountType === 'percent'
        ? Math.round(baseAmount * (discount / 100) * 100) / 100
        : discount
      const discountLabel = discountType === 'percent'
        ? `学生折扣 (${discount}%)`
        : '学生折扣'
      items.push({ name: discountLabel, amount: -actualDiscount })
    }

    // Compute total from items (guarantees subtotal = total even with discount line)
    const total = Math.round(items.reduce((sum, it) => sum + it.amount, 0) * 100) / 100

    // Get late payment rule from invoice_settings
    let latePaymentRule = ''
    try {
      const res = await fetch('/api/pocketbase-proxy/api/collections/invoice_settings/records?filter=(isDefault=true)&perPage=1')
      if (res.ok) {
        const data = await res.json()
        if (data.items?.length > 0) {
          latePaymentRule = data.items[0].latePaymentRule || ''
        }
      }
    } catch {}

    createInvoiceFromHook({
      studentId, studentName: student.student_name || '', studentGrade: student.standard || '',
      studentNumber: student.student_id || '',
      totalAmount: total, items, status: 'issued',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      notes: `${new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}学费`,
      discount: discount || undefined,
      discountType: discount > 0 ? discountType : undefined,
      latePaymentRule: latePaymentRule || undefined,
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

  return (
    <div className="space-y-6">
      <StudentFeeMatrixHeader
        editMode={editMode} onToggleEditMode={toggleEditMode}
        batchMode={batchMode} onToggleBatchMode={() => setBatchMode(!batchMode)}
        isSaving={isSaving}
      />
      <SearchAndFilter
        searchTerm={searchTerm} onSearchChange={setSearchTerm} onClearSearch={() => setSearchTerm("")}
        selectedGradeFilter={selectedGradeFilter} onGradeFilterChange={setSelectedGradeFilter}
        availableGrades={availableGrades} filteredStudentsCount={filteredStudents.length} totalStudentsCount={students.length}
      />

      {filteredStudents.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">没有匹配的学生</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          {filteredStudents.map(student => (
            <FeeCard
              key={student.id}
              student={student}
              activeFees={allFees}
              groupedFees={groupedFees}
              studentTotal={getStudentAmount(student.id, allFees)}
              onCreateInvoice={createInvoice}
              editMode={editMode}
              isAssigned={isAssigned}
              assignFeeToStudent={assignFeeToStudent}
              removeFeeFromStudent={removeFeeFromStudent}
              hasInvoiceThisMonth={hasInvoiceThisMonth}
              getLocalAdjustment={getLocalAdjustment}
              setLocalDiscount={setLocalDiscount}
              toggleLocalSixMonthFeeId={toggleLocalSixMonthFeeId}
              setLocalSixMonthPayRate={setLocalSixMonthPayRate}
              setLocalSixMonthPayRateType={setLocalSixMonthPayRateType}
            />
          ))}
        </div>
      )}
    </div>
  )
}
