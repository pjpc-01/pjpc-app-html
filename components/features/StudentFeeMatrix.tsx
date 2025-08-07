import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FeeCard } from "./FeeCard"
import { useFees } from "../../hooks/useFees"
import { useStudents } from "../../hooks/useStudents"
import { useStudentFees } from "../../hooks/useStudentFees"
import { Users, DollarSign, ChevronDown, ChevronRight, FileText, Edit3, Search, X, Settings, Filter } from "lucide-react"
import { ToggleSwitch } from "../ui/ToggleSwitch"

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

  const toggleSubItemActive = (studentId: string, feeId: number, subItemId: number) => {
    if (editMode) {
      toggleStudentSubItem(Number(studentId), feeId, subItemId)
    }
  }

  const getPaymentStatus = (studentId: string) => {
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
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>
    }
  }

  const createInvoice = () => {
    // TODO: Implement invoice creation functionality
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            学生费用分配
          </h2>
          <p className="text-gray-600 text-sm">为每位学生选择适用的收费项目</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={editMode ? "default" : "outline"}
            size="sm" 
            onClick={toggleEditMode}
            className="flex items-center gap-2"
          >
            <Edit3 className="h-4 w-4" />
            {editMode ? "退出编辑" : "编辑"}
          </Button>
          
          <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
                disabled={!editMode}
              >
                <Filter className="h-4 w-4" />
                批量操作
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  批量操作设置
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                                 {/* Category Selection */}
                 <div>
                   <Label className="text-sm font-medium">选择费用类别</Label>
                   <div className="mt-2 space-y-2">
                     {categories.map(category => (
                       <div key={category}>
                         <div className="flex items-center space-x-2">
                           <Checkbox
                             id={`category-${category}`}
                             checked={selectedCategories.includes(category)}
                             onCheckedChange={() => handleCategoryToggle(category)}
                           />
                           <Label htmlFor={`category-${category}`} className="text-sm">
                             {category}
                           </Label>
                         </div>
                         
                                                   {/* Show sub-items when category is selected */}
                          {selectedCategories.includes(category) && (
                            <div className="ml-6 mt-2 space-y-1">
                              {activeFees
                                .filter(fee => fee.category === category)
                                .map(fee => 
                                  fee.subItems.map(subItem => (
                                    <div key={subItem.id} className="flex items-center justify-between text-xs">
                                      <div className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`subitem-${fee.id}-${subItem.id}`}
                                          checked={isSubItemSelected(fee.id, subItem.id)}
                                          onCheckedChange={() => handleSubItemToggle(fee.id, subItem.id)}
                                          className="h-3 w-3"
                                        />
                                        <span className="text-gray-600">{subItem.name}</span>
                                      </div>
                                      <span className="text-gray-600">¥{subItem.amount}</span>
                                    </div>
                                  ))
                                )
                              }
                            </div>
                          )}
                       </div>
                     ))}
                     {categories.length === 0 && (
                       <p className="text-sm text-gray-500">暂无可用的费用类别</p>
                     )}
                   </div>
                 </div>

                                 {/* Criteria Selection */}
                 <div>
                   <Label className="text-sm font-medium">选择标准 (可选)</Label>
                   <p className="text-xs text-gray-500 mb-2">留空则操作所有显示的学生</p>
                                       <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="criteria-grade"
                          checked={selectedCriteria === 'grade'}
                          onCheckedChange={() => handleCriteriaToggle('grade')}
                        />
                        <Label htmlFor="criteria-grade" className="text-sm">
                          按年级分组
                        </Label>
                      </div>
                     
                                           {/* Grade Selection - Only show when grade criteria is selected */}
                      {selectedCriteria === 'grade' && (
                        <div>
                          <Label className="text-sm font-medium">选择年级</Label>
                          <div className="mt-2 space-y-2">
                            {availableGrades.map(grade => (
                              <div key={grade} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`grade-${grade}`}
                                  checked={selectedGrades.includes(grade)}
                                  onCheckedChange={() => handleGradeToggle(grade)}
                                />
                                <Label htmlFor={`grade-${grade}`} className="text-sm">
                                  {grade}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                   </div>
                 </div>

                                 {/* Action Buttons */}
                 <div className="flex gap-2 pt-4">
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => executeBatchToggle('enable')}
                     className="flex-1"
                   >
                     启用
                   </Button>
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => executeBatchToggle('disable')}
                     className="flex-1"
                   >
                     关闭
                   </Button>
                 </div>
              </div>
            </DialogContent>
          </Dialog>

        </div>
      </div>

      {/* Search Bar and Grade Filter */}
      <div className="flex gap-4 items-end">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="搜索学生姓名、ID、年级或家长姓名..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Grade Filter */}
        <div className="w-48">
          <Select value={selectedGradeFilter} onValueChange={setSelectedGradeFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="选择年级" />
            </SelectTrigger>
                         <SelectContent>
               <SelectItem value="all">所有年级</SelectItem>
               {availableGrades.map(grade => (
                 <SelectItem key={grade} value={grade}>
                   {grade}
                 </SelectItem>
               ))}
             </SelectContent>
          </Select>
        </div>
      </div>

             {/* Search Results Info */}
       {(searchTerm || selectedGradeFilter !== "all") && (
         <div className="text-sm text-gray-600">
           找到 {filteredStudents.length} 个学生 (共 {students.length} 个)
         </div>
       )}

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
                         const studentId = student.id // Use string ID directly
             const isExpanded = expandedStudents.includes(studentId)
             const studentTotal = calculateStudentTotal(Number(studentId), activeFees)
            
            return (
              <Card key={student.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  {/* Student Header - Clickable */}
                  <div 
                    className="bg-gray-50 px-4 py-3 border-b cursor-pointer hover:bg-gray-100 transition-colors"
                                         onClick={() => {
                       toggleStudentExpansion(studentId)
                     }}
                  >
                                         <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         {isExpanded ? (
                           <ChevronDown className="h-4 w-4 text-gray-500" />
                         ) : (
                           <ChevronRight className="h-4 w-4 text-gray-500" />
                         )}
                         <div>
                           <h3 className="font-medium text-gray-900">{student.name}</h3>
                           <p className="text-sm text-gray-600">
                             {student.grade} • {student.parentName} • ID: {student.id}
                           </p>
                         </div>
                       </div>
                                                <div className="text-right">
                           <div className="flex items-center justify-end gap-12">
                             <div className="flex items-center gap-1">
                               <DollarSign className="h-4 w-4 text-green-600" />
                               <span className="font-semibold text-green-600">
                                 ¥{studentTotal}
                               </span>
                             </div>
                                                           <Button
                                variant="outline"
                                size="sm"
                                className="h-6 w-6 p-0 bg-black hover:bg-gray-800 border-gray-300 shadow-sm hover:shadow-md transition-all duration-200"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  createInvoice()
                                }}
                              >
                                <FileText className="h-3 w-3 text-white" />
                              </Button>
                           </div>
                         <div className="flex justify-between items-center mt-1">
                           <div className="flex gap-1">
                             <Button
                               variant="ghost"
                               size="sm"
                               className="h-6 px-2 text-xs"
                               onClick={(e) => {
                                 e.stopPropagation()
                                 updatePaymentStatus(studentId, 'paid')
                               }}
                             >
                               已缴费
                             </Button>
                             <Button
                               variant="ghost"
                               size="sm"
                               className="h-6 px-2 text-xs"
                               onClick={(e) => {
                                 e.stopPropagation()
                                 updatePaymentStatus(studentId, 'overdue')
                               }}
                             >
                               逾期
                             </Button>
                             <Button
                               variant="ghost"
                               size="sm"
                               className="h-6 px-2 text-xs"
                               onClick={(e) => {
                                 e.stopPropagation()
                                 updatePaymentStatus(studentId, 'pending')
                               }}
                             >
                               待缴费
                             </Button>
                           </div>
                           <div className="flex items-center gap-2">
                             {getStatusBadge(getPaymentStatus(studentId).status)}
                             {getPaymentStatus(studentId).date && (
                               <span className="text-xs text-gray-500">
                                 {getPaymentStatus(studentId).date}
                               </span>
                             )}
                           </div>
                         </div>
                       </div>
                     </div>
                  </div>

                  {/* Fee Assignment Grid - Only show when expanded */}
                  {isExpanded && (
                    <div className="p-4">
                      <div className="space-y-3">
                        {activeFees.map(fee => {
                          const feeExpanded = isFeeExpanded(studentId, fee.id)
                          const feeTotal = fee.subItems
                            .filter(subItem => getStudentSubItemState(Number(studentId), fee.id, subItem.id))
                            .reduce((total, subItem) => total + subItem.amount, 0)
                          
                          return (
                            <div key={fee.id} className="space-y-2">
                              <FeeCard
                                fee={fee}
                                isAssigned={isAssigned(Number(studentId), fee.id)}
                                onToggle={() => toggleFeeExpansion(studentId, fee.id)}
                                isExpanded={feeExpanded}
                                calculateAmount={() => feeTotal}
                              />
                              
                              {/* Sub-items - Only show when fee is expanded */}
                              {feeExpanded && fee.subItems && (
                                <div className="pl-8 space-y-2">
                                  {fee.subItems.map((subItem) => (
                                    <div key={subItem.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border-l-2 border-blue-200">
                                      <div className="flex items-center gap-4">
                                        <span className="text-sm font-medium min-w-[120px]">{subItem.name}</span>
                                        <ToggleSwitch
                                          checked={getStudentSubItemState(Number(studentId), fee.id, subItem.id)}
                                          onChange={() => toggleSubItemActive(studentId, fee.id, subItem.id)}
                                          disabled={!editMode}
                                          size="sm"
                                        />
                                      </div>
                                      <span className="text-sm font-medium text-blue-600">¥{subItem.amount}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {activeFees.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <p>暂无可分配的费用项目</p>
                          <p className="text-sm">请先在收费项目管理中添加费用项目</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
} 