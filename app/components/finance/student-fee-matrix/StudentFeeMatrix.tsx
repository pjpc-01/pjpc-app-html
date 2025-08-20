import { useState, useEffect, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Search, ChevronDown, ChevronRight } from "lucide-react"
import { useFees } from "@/hooks/useFees"
import { useStudents } from "@/hooks/useStudents"
import { useStudentFees } from "@/hooks/useStudentFees"
import { useInvoices } from "@/hooks/useInvoices"
import { StudentFeeMatrixHeader } from "./StudentFeeMatrixHeader"
import { SearchAndFilter } from "./SearchAndFilter"
import { StudentCard } from "./StudentCard"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const StudentFeeMatrix = () => {
  const { fees } = useFees()
  const { students } = useStudents()
  const { 
    studentFees,
    loading: studentFeesLoading,
    error: studentFeesError,
    isAssigned, 
    getStudentAmount,
    assignFeeToStudent,
    removeFeeFromStudent,
    isEditMode: hookEditMode,
    enterEditMode,
    exitEditMode
  } = useStudentFees()
  const { createInvoice: createInvoiceFromHook, invoices } = useInvoices()
  
  const [expandedStudents, setExpandedStudents] = useState<string[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [studentPayments, setStudentPayments] = useState<Map<string, { status: string; date: string }>>(new Map())
  const [studentInvoices, setStudentInvoices] = useState<Map<string, boolean>>(new Map())
  const [editMode, setEditMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>("all")
  const [batchMode, setBatchMode] = useState(false)

  // Show all fees regardless of status - status is just for display in fee management
  const allFees = fees

  // Group fees by category
  const groupedFees = useMemo(() => {
    return allFees.reduce((groups, fee) => {
      const category = fee.category || "未分类"
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(fee)
      return groups
    }, {} as Record<string, typeof allFees>)
  }, [allFees])

  // Get unique categories from all fees
  const categories = [...new Set(allFees.map(fee => fee.category).filter(Boolean))]

  // Filter students based on search term, grade filter, and exclude graduated students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Exclude graduated students
      if (student.status === 'graduated') return false
      
      // Apply grade filter
      if (selectedGradeFilter !== "all" && student.standard !== selectedGradeFilter) return false
      
      // Apply search term filter
      if (!searchTerm.trim()) return true
      
      const searchLower = searchTerm.toLowerCase()
      return (
        student.student_name?.toLowerCase().includes(searchLower) ||
        student.student_id?.toLowerCase().includes(searchLower) ||
        student.standard?.toLowerCase().includes(searchLower) ||
        student.parentName?.toLowerCase().includes(searchLower)
      )
    })
  }, [students, searchTerm, selectedGradeFilter])

  // Get available grades from all students (excluding graduated) in ascending order
  const availableGrades = useMemo(() => {
    const grades = [...new Set(students
      .filter(student => student.status !== 'graduated' && student.standard)
      .map(s => s.standard!))]
    
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

  // Show loading state if student fees are loading
  if (studentFeesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载学生费用分配数据...</p>
        </div>
      </div>
    )
  }

  // Show error state if there's an error
  if (studentFeesError) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-800 font-medium mb-2">加载失败</p>
          <p className="text-gray-600 text-sm">{studentFeesError}</p>
        </div>
      </div>
    )
  }

  const toggleStudentExpansion = (studentId: string) => {
    setExpandedStudents(prev => {
      const isCurrentlyExpanded = prev.includes(studentId)
      
      const newExpanded = isCurrentlyExpanded
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
      
      return newExpanded
    })
  }

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }

  // Expand/collapse all categories
  const toggleAllCategories = () => {
    const allCategories = Object.keys(groupedFees)
    const allExpanded = allCategories.every(cat => expandedCategories.has(cat))
    
    if (allExpanded) {
      setExpandedCategories(new Set())
    } else {
      setExpandedCategories(new Set(allCategories))
    }
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

    // Get the actual amount from PocketBase
    const studentTotal = getStudentAmount(studentId, allFees)
    
    // Create invoice items based on assigned fees
    const invoiceItems = allFees
      .filter(fee => isAssigned(studentId, fee.id))
      .map(fee => ({ name: fee.name, amount: fee.amount }))

    // Create the actual invoice
    const newInvoice = createInvoiceFromHook({
      studentId: studentId,
      studentName: student.student_name || '',
      studentGrade: student.standard || '',
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

  const toggleEditMode = async () => {
    if (!editMode) {
      // Entering edit mode
      console.log('🔄 [StudentFeeMatrix] Entering edit mode')
      setEditMode(true)
      enterEditMode()
      setBatchMode(false) // Reset batch mode when entering edit mode
    } else {
      // Exiting edit mode
      console.log('🔄 [StudentFeeMatrix] Exiting edit mode')
      setEditMode(false)
      await exitEditMode()
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

      {/* Category Controls */}
      <div className="flex justify-end">
        <button
          onClick={toggleAllCategories}
          className="flex items-center gap-2 px-3 py-2 text-sm border rounded hover:bg-gray-50"
        >
          {Object.keys(groupedFees).every(cat => expandedCategories.has(cat)) ? (
            <>
              <ChevronDown className="h-4 w-4" />
              收起全部
            </>
          ) : (
            <>
              <ChevronRight className="h-4 w-4" />
              展开全部
            </>
          )}
        </button>
      </div>

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
            const studentTotal = getStudentAmount(studentId, allFees)
            
            return (
              <StudentCard
                key={student.id}
                student={student}
                isExpanded={isExpanded}
                onToggleExpansion={() => toggleStudentExpansion(studentId)}
                activeFees={allFees}
                groupedFees={groupedFees}
                expandedCategories={expandedCategories}
                onToggleCategory={toggleCategory}
                studentTotal={studentTotal}
                onUpdatePaymentStatus={updatePaymentStatus}
                getPaymentStatus={getPaymentStatus}
                getStatusBadge={getStatusBadge}
                onCreateInvoice={createInvoice}
                editMode={editMode}
                isAssigned={isAssigned}
                assignFeeToStudent={assignFeeToStudent}
                removeFeeFromStudent={removeFeeFromStudent}
                hasInvoiceThisMonth={hasInvoiceThisMonth}
                batchMode={batchMode}
              />
            )
          })
        )}
      </div>
    </div>
  )
} 