import { useState, useEffect, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import { useFees } from "@/hooks/useFees"
import { useStudents } from "@/hooks/useStudents"
import { useStudentFees } from "@/hooks/useStudentFees"
import { useInvoices } from "@/hooks/useInvoices"
import { StudentFeeMatrixHeader } from "./StudentFeeMatrixHeader"
import { SearchAndFilter } from "./SearchAndFilter"
import { BatchOperationsDialog } from "./BatchOperationsDialog"
import { StudentCard } from "./StudentCard"

export const StudentFeeMatrix = () => {
  const { fees } = useFees()
  const { students } = useStudents()
  const { 
    toggleStudentSubItem,
    isAssigned, 
    calculateStudentTotal, 
    getStudentSubItemState
  } = useStudentFees()
  const { createInvoice: createInvoiceFromHook, invoices } = useInvoices()
  
  const [expandedStudents, setExpandedStudents] = useState<string[]>([])
  const [expandedFees, setExpandedFees] = useState<Map<string, boolean>>(new Map())
  const [studentPayments, setStudentPayments] = useState<Map<string, { status: string; date: string }>>(new Map())
  const [studentInvoices, setStudentInvoices] = useState<Map<string, boolean>>(new Map())
  const [editMode, setEditMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>("all")
  const [batchDialogOpen, setBatchDialogOpen] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedSubItems, setSelectedSubItems] = useState<{feeId: string, subItemId: number}[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [selectedCriteria, setSelectedCriteria] = useState<'grade' | null>(null)
  const [selectedGrades, setSelectedGrades] = useState<string[]>([])
  const [batchMode, setBatchMode] = useState(false)

  const activeFees = fees.filter(fee => fee.status === 'active')

  // Get unique categories from active fees
  const categories = [...new Set(activeFees.map(fee => fee.category).filter(Boolean))]

  // Filter students based on search term, grade filter, and exclude graduated students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Exclude graduated students
      if (student.status === 'graduated') return false
      
      // Apply grade filter
      if (selectedGradeFilter !== "all" && student.grade !== selectedGradeFilter) return false
      
      // Apply search term filter
      if (!searchTerm.trim()) return true
      
      const searchLower = searchTerm.toLowerCase()
      return (
        student.name.toLowerCase().includes(searchLower) ||
        student.studentId.toLowerCase().includes(searchLower) ||
        student.grade.toLowerCase().includes(searchLower) ||
        student.parentName.toLowerCase().includes(searchLower)
      )
    })
  }, [students, searchTerm, selectedGradeFilter])

  // Get available grades from all students (excluding graduated) in ascending order
  const availableGrades = useMemo(() => {
    const grades = [...new Set(students
      .filter(student => student.status !== 'graduated')
      .map(s => s.grade))]
    
    return grades.sort((a, b) => {
      // Handle Chinese grade names (一年级, 二年级, etc.)
      const chineseGradeOrder: Record<string, number> = {
        '一年级': 1, '二年级': 2, '三年级': 3, '四年级': 4, '五年级': 5, '六年级': 6,
        '初一': 7, '初二': 8, '初三': 9,
        '高一': 10, '高二': 11, '高三': 12
      }
      
      // Check if both grades are Chinese grades
      if (chineseGradeOrder[a] !== undefined && chineseGradeOrder[b] !== undefined) {
        return chineseGradeOrder[a] - chineseGradeOrder[b]
      }
      
      // Check if only one is Chinese grade
      if (chineseGradeOrder[a] !== undefined) {
        return -1 // Chinese grades come first
      }
      if (chineseGradeOrder[b] !== undefined) {
        return 1 // Chinese grades come first
      }
      
      // Handle English grade names (Standard 1, Standard 2, etc.)
      const numA = parseInt(a.match(/\d+/)?.[0] || '0')
      const numB = parseInt(b.match(/\d+/)?.[0] || '0')
      
      if (numA !== 0 && numB !== 0) {
        return numA - numB
      }
      
      // If no numbers found, sort alphabetically
      return a.localeCompare(b)
    })
  }, [students])

  const toggleStudentExpansion = (studentId: string) => {
    setExpandedStudents(prev => {
      const isCurrentlyExpanded = prev.includes(studentId)
      
      const newExpanded = isCurrentlyExpanded
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
      
      return newExpanded
    })
  }

  const toggleFeeExpansion = (studentId: string, feeId: string) => {
    const key = `${studentId}-${feeId}`
    setExpandedFees(prev => {
      const newMap = new Map(prev)
      newMap.set(key, !prev.get(key))
      return newMap
    })
  }

  const isFeeExpanded = (studentId: string, feeId: string) => {
    const key = `${studentId}-${feeId}`
    return expandedFees.get(key) || false
  }

  const getPaymentStatus = (studentId: string) => {
    const hasInvoice = studentInvoices.get(studentId) || false
    if (!hasInvoice) {
      return { status: 'not_issued', date: '' }
    }
    return studentPayments.get(studentId) || { status: 'pending', date: '' }
  }

  const updatePaymentStatus = (studentId: string, status: string) => {
    const currentPayment = getPaymentStatus(studentId)
    const newPayment = {
      ...currentPayment,
      status,
      date: status === 'paid' ? new Date().toISOString().split('T')[0] : currentPayment.date
    }
    setStudentPayments(prev => {
      const newMap = new Map(prev)
      newMap.set(studentId, newPayment)
      return newMap
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="default" className="text-xs">已缴费</Badge>
      case "pending":
        return <Badge variant="secondary" className="text-xs">待缴费</Badge>
      case "overdue":
        return <Badge variant="destructive" className="text-xs">逾期</Badge>
      case "not_issued":
        return <Badge variant="outline" className="text-xs">未开具</Badge>
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>
    }
  }

  const createInvoice = (studentId: string) => {
    const student = students.find(s => s.id === studentId)
    if (!student) return

    // Calculate total amount for the student
    const studentTotal = calculateStudentTotal(studentId, activeFees)
    
    // Create invoice items based on assigned fees
    const invoiceItems = activeFees
      .filter(fee => isAssigned(studentId, fee.id))
      .flatMap(fee => 
        fee.subItems
          .filter(subItem => getStudentSubItemState(studentId, fee.id, subItem.id))
          .map(subItem => ({ name: `${fee.name} - ${subItem.name}`, amount: subItem.amount }))
      )

    // Create the actual invoice
    const newInvoice = createInvoiceFromHook({
      studentId: studentId,
      studentName: student.name,
      studentGrade: student.grade,
      totalAmount: studentTotal,
      items: invoiceItems,
      status: 'issued',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days from now
      notes: `${new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}学费`
    })

    // Mark invoice as created for this student
    setStudentInvoices(prev => {
      const newMap = new Map(prev)
      newMap.set(studentId, true)
      return newMap
    })

    // Update payment status
    updatePaymentStatus(studentId, 'pending')
  }

  // Check if student has invoice this month
  const hasInvoiceThisMonth = (studentId: string) => {
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
    const studentInvoicesThisMonth = invoices.filter(invoice => 
      invoice.studentId === studentId && 
      invoice.issueDate.startsWith(currentMonth)
    )
    return studentInvoicesThisMonth.length > 0
  }

  const toggleEditMode = () => {
    setEditMode(!editMode)
    if (!editMode) {
      setBatchMode(false) // Reset batch mode when entering edit mode
    }
  }

  const toggleBatchMode = () => {
    console.log('toggleBatchMode called, current batchMode:', batchMode)
    setBatchMode(!batchMode)
  }

  const clearSearch = () => {
    setSearchTerm("")
  }

  const clearGradeFilter = () => {
    setSelectedGradeFilter("all")
  }

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const handleSubItemToggle = (feeId: string, subItemId: number) => {
    setSelectedSubItems(prev => {
      const existing = prev.find(item => item.feeId === feeId && item.subItemId === subItemId)
      if (existing) {
        return prev.filter(item => !(item.feeId === feeId && item.subItemId === subItemId))
      } else {
        return [...prev, { feeId, subItemId }]
      }
    })
  }

  const isSubItemSelected = (feeId: string, subItemId: number) => {
    return selectedSubItems.some(item => item.feeId === feeId && item.subItemId === subItemId)
  }

  const handleCriteriaToggle = (criteria: 'grade') => {
    if (selectedCriteria === criteria) {
      setSelectedCriteria(null)
      setSelectedStudents([])
      setSelectedGrades([])
    } else {
      setSelectedCriteria(criteria)
      // Initialize with all available grades selected
      setSelectedGrades([...availableGrades])
      setSelectedStudents([])
    }
  }

  const handleGradeToggle = (grade: string) => {
    setSelectedGrades(prev => 
      prev.includes(grade) 
        ? prev.filter(g => g !== grade)
        : [...prev, grade]
    )
  }

  const executeBatchToggle = (action: 'enable' | 'disable') => {
    if (!editMode) {
      alert('请先进入编辑模式')
      return
    }

    let targetStudents: string[]
    
    if (selectedCriteria === 'grade' && selectedGrades.length > 0) {
      // Filter students by selected grades
      targetStudents = filteredStudents
        .filter(student => selectedGrades.includes(student.grade))
        .map(student => student.id)
    } else {
      // Use all filtered students
      targetStudents = filteredStudents.map(s => s.id)
    }

    // If specific sub-items are selected, use those; otherwise use categories
    if (selectedSubItems.length > 0) {
      // Use selected sub-items
      targetStudents.forEach(studentId => {
        selectedSubItems.forEach(({ feeId, subItemId }) => {
          const currentState = getStudentSubItemState(studentId, feeId, subItemId)
          if (action === 'enable' && !currentState) {
            toggleStudentSubItem(studentId, feeId, subItemId)
          } else if (action === 'disable' && currentState) {
            toggleStudentSubItem(studentId, feeId, subItemId)
          }
        })
      })
    } else {
      // Use selected categories (fallback to all if none selected)
      const targetFees = activeFees.filter(fee => 
        selectedCategories.length === 0 || selectedCategories.includes(fee.category)
      )

      targetStudents.forEach(studentId => {
        targetFees.forEach(fee => {
          fee.subItems.forEach(subItem => {
            const currentState = getStudentSubItemState(studentId, fee.id, subItem.id)
            if (action === 'enable' && !currentState) {
              toggleStudentSubItem(studentId, fee.id, subItem.id)
            } else if (action === 'disable' && currentState) {
              toggleStudentSubItem(studentId, fee.id, subItem.id)
            }
          })
        })
      })
    }

    setBatchDialogOpen(false)
    setSelectedCategories([])
    setSelectedSubItems([])
    setSelectedStudents([])
    setSelectedCriteria(null)
    setSelectedGrades([])
  }

  // Handle batch toggle for sub-items
  const handleBatchToggleSubItem = (feeId: string, subItemId: number, targetState: boolean) => {
    console.log('handleBatchToggleSubItem called:', { feeId, subItemId, targetState, editMode, batchMode })
    if (!editMode || !batchMode) {
      console.log('Batch toggle blocked: editMode =', editMode, 'batchMode =', batchMode)
      return
    }
    
    // Toggle the same sub-item for all filtered students
    filteredStudents.forEach(student => {
      const currentState = getStudentSubItemState(student.id, feeId, subItemId)
      if (currentState !== targetState) {
        console.log('Toggling for student:', student.id, 'from', currentState, 'to', targetState)
        toggleStudentSubItem(student.id, feeId, subItemId)
      }
    })
  }

  return (
    <div className="space-y-6">
      <StudentFeeMatrixHeader
        editMode={editMode}
        onToggleEditMode={toggleEditMode}
        batchMode={batchMode}
        onToggleBatchMode={toggleBatchMode}
      />

      <SearchAndFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onClearSearch={clearSearch}
        selectedGradeFilter={selectedGradeFilter}
        onGradeFilterChange={setSelectedGradeFilter}
        availableGrades={availableGrades}
        filteredStudentsCount={filteredStudents.length}
        totalStudentsCount={students.length}
      />

      <BatchOperationsDialog
        isOpen={batchDialogOpen}
        onOpenChange={setBatchDialogOpen}
        categories={categories}
        activeFees={activeFees}
        availableGrades={availableGrades}
        selectedCategories={selectedCategories}
        onCategoryToggle={handleCategoryToggle}
        selectedSubItems={selectedSubItems}
        onSubItemToggle={handleSubItemToggle}
        isSubItemSelected={isSubItemSelected}
        selectedCriteria={selectedCriteria}
        onCriteriaToggle={handleCriteriaToggle}
        selectedGrades={selectedGrades}
        onGradeToggle={handleGradeToggle}
        onExecuteBatchToggle={executeBatchToggle}
      />

      {/* Student Fee Matrix */}
      <div className="grid gap-4">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">未找到匹配的学生</p>
            <p className="text-sm">请尝试不同的搜索关键词</p>
          </div>
        ) : (
          filteredStudents.map(student => {
            const studentId = student.id
            const isExpanded = expandedStudents.includes(studentId)
                         const studentTotal = calculateStudentTotal(studentId, activeFees)
            
            return (
              <StudentCard
                key={student.id}
                student={student}
                isExpanded={isExpanded}
                onToggleExpansion={() => toggleStudentExpansion(studentId)}
                activeFees={activeFees}
                studentTotal={studentTotal}
                onUpdatePaymentStatus={updatePaymentStatus}
                getPaymentStatus={getPaymentStatus}
                getStatusBadge={getStatusBadge}
                onCreateInvoice={createInvoice}
                editMode={editMode}
                expandedFees={expandedFees}
                onToggleFeeExpansion={toggleFeeExpansion}
                isFeeExpanded={isFeeExpanded}
                isAssigned={isAssigned}
                toggleStudentSubItem={toggleStudentSubItem}
                getStudentSubItemState={getStudentSubItemState}
                hasInvoiceThisMonth={hasInvoiceThisMonth}
                batchMode={batchMode}
                onBatchToggleSubItem={handleBatchToggleSubItem}
              />
            )
          })
        )}
      </div>
    </div>
  )
} 