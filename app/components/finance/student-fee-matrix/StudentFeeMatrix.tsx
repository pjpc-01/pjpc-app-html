import { useState, useEffect, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import { useFees } from "@/hooks/useFees"
import { useStudents } from "@/hooks/useStudents"
import { useStudentFees } from "@/hooks/useStudentFees"
import { StudentFeeMatrixHeader } from "./StudentFeeMatrixHeader"
import { SearchAndFilter } from "./SearchAndFilter"
import { BatchOperationsDialog } from "./BatchOperationsDialog"
import { StudentCard } from "./StudentCard"

export const StudentFeeMatrix = () => {
  const { feeItems } = useFees()
  const { students } = useStudents()
  const { 
    toggleStudentFee, 
    isAssigned, 
    calculateStudentTotal, 
    assignFeeToAllStudents,
    toggleStudentSubItem,
    getStudentSubItemState,
    setStudentSubItemState
  } = useStudentFees()
  
  const [expandedStudents, setExpandedStudents] = useState<string[]>([])
  const [expandedFees, setExpandedFees] = useState<Map<string, boolean>>(new Map())
  const [studentPayments, setStudentPayments] = useState<Map<string, { status: string; date: string }>>(new Map())
  const [studentInvoices, setStudentInvoices] = useState<Map<string, boolean>>(new Map())
  const [editMode, setEditMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>("all")
  const [batchDialogOpen, setBatchDialogOpen] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedSubItems, setSelectedSubItems] = useState<{feeId: number, subItemId: number}[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [selectedCriteria, setSelectedCriteria] = useState<'grade' | null>(null)
  const [selectedGrades, setSelectedGrades] = useState<string[]>([])

  const activeFees = feeItems.filter(fee => fee.status === 'active')

  // Get unique categories from active fees
  const categories = [...new Set(activeFees.map(fee => fee.category).filter(Boolean))]

  // Filter students based on search term, grade filter, and exclude graduated students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Exclude graduated students
      if (student.grade === '已毕业') return false
      
      // Apply grade filter
      if (selectedGradeFilter !== "all" && student.grade !== selectedGradeFilter) return false
      
      // Apply search term filter
      if (!searchTerm.trim()) return true
      
      const searchLower = searchTerm.toLowerCase()
      return (
        student.name.toLowerCase().includes(searchLower) ||
        student.id.toLowerCase().includes(searchLower) ||
        student.grade.toLowerCase().includes(searchLower) ||
        student.parentName.toLowerCase().includes(searchLower)
      )
    })
  }, [students, searchTerm, selectedGradeFilter])

  // Get available grades from all students (excluding graduated) in ascending order
  const availableGrades = useMemo(() => {
    const grades = [...new Set(students
      .filter(student => student.grade !== '已毕业')
      .map(s => s.grade))]
    return grades.sort((a, b) => {
      // Extract numbers from grade strings (e.g., "Standard 3" -> 3)
      const numA = parseInt(a.match(/\d+/)?.[0] || '0')
      const numB = parseInt(b.match(/\d+/)?.[0] || '0')
      return numA - numB
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

  const toggleFeeExpansion = (studentId: string, feeId: number) => {
    const key = `${studentId}-${feeId}`
    setExpandedFees(prev => {
      const newMap = new Map(prev)
      newMap.set(key, !prev.get(key))
      return newMap
    })
  }

  const isFeeExpanded = (studentId: string, feeId: number) => {
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
    // Mark invoice as created for this student
    setStudentInvoices(prev => {
      const newMap = new Map(prev)
      newMap.set(studentId, true)
      return newMap
    })
    // TODO: Implement actual invoice creation functionality
  }

  const toggleEditMode = () => {
    setEditMode(!editMode)
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

  const handleSubItemToggle = (feeId: number, subItemId: number) => {
    setSelectedSubItems(prev => {
      const existing = prev.find(item => item.feeId === feeId && item.subItemId === subItemId)
      if (existing) {
        return prev.filter(item => !(item.feeId === feeId && item.subItemId === subItemId))
      } else {
        return [...prev, { feeId, subItemId }]
      }
    })
  }

  const isSubItemSelected = (feeId: number, subItemId: number) => {
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
          const currentState = getStudentSubItemState(Number(studentId), feeId, subItemId)
          if (action === 'enable' && !currentState) {
            toggleStudentSubItem(Number(studentId), feeId, subItemId)
          } else if (action === 'disable' && currentState) {
            toggleStudentSubItem(Number(studentId), feeId, subItemId)
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
            const currentState = getStudentSubItemState(Number(studentId), fee.id, subItem.id)
            if (action === 'enable' && !currentState) {
              toggleStudentSubItem(Number(studentId), fee.id, subItem.id)
            } else if (action === 'disable' && currentState) {
              toggleStudentSubItem(Number(studentId), fee.id, subItem.id)
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

  return (
    <div className="space-y-6">
      <StudentFeeMatrixHeader
        editMode={editMode}
        onToggleEditMode={toggleEditMode}
        batchDialogOpen={batchDialogOpen}
        onBatchDialogOpenChange={setBatchDialogOpen}
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
            const studentTotal = calculateStudentTotal(Number(studentId), activeFees)
            
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
              />
            )
          })
        )}
      </div>
    </div>
  )
} 