"use client"

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Badge } from '../../../../components/ui/badge'
import { Input } from '../../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { Plus, FileText, DollarSign, AlertCircle, Search } from 'lucide-react'
import { useInvoiceData } from '../../../../hooks/useInvoiceData'
import { InvoiceCreator } from './InvoiceCreator'
import { InvoiceList } from './InvoiceList'
import { StudentWithFees, SimpleInvoice } from '../../../../hooks/useInvoiceData'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../../components/ui/dialog'

export function InvoiceTab() {
  console.log('🔄 InvoiceTab: Component rendering...')
  
  const {
    students,
    invoices,
    loading,
    error,
    createInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    // New React Query mutation states
    isCreatingInvoice,
    isUpdatingStatus,
    isDeletingInvoice
  } = useInvoiceData()

  console.log('📊 InvoiceTab: Data received:', {
    studentsCount: students?.length || 0,
    invoicesCount: invoices?.length || 0,
    loading,
    error: error || 'none',
    isCreatingInvoice,
    isUpdatingStatus,
    isDeletingInvoice
  })

  const [selectedStudent, setSelectedStudent] = useState<StudentWithFees | null>(null)
  const [isStudentSelectionOpen, setIsStudentSelectionOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGrade, setSelectedGrade] = useState<string>('all')

  // Reset search and filter when opening student selection modal
  const handleOpenStudentSelection = () => {
    setSearchQuery('')
    setSelectedGrade('all')
    setIsStudentSelectionOpen(true)
  }

  // Get unique grades for filter dropdown
  const availableGrades = useMemo(() => {
    const grades = students.map(student => student.standard).filter(Boolean)
    return ['all', ...Array.from(new Set(grades))]
  }, [students])

  // Filter students based on search and grade
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Filter by search query (student name)
      const matchesSearch = searchQuery === '' || 
        student.student_name.toLowerCase().includes(searchQuery.toLowerCase())
      
      // Filter by grade
      const matchesGrade = selectedGrade === 'all' || student.standard === selectedGrade
      
      return matchesSearch && matchesGrade
    })
  }, [students, searchQuery, selectedGrade])

  // Calculate statistics
  const stats = {
    total: invoices.length,
    pending: invoices.filter(inv => inv.status === 'pending').length,
    paid: invoices.filter(inv => inv.status === 'paid').length,
    overpaid: invoices.filter(inv => inv.status === 'overpaid').length,
    underpaid: invoices.filter(inv => inv.status === 'underpaid').length,
    cancelled: invoices.filter(inv => inv.status === 'cancelled').length,
    totalAmount: invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
    pendingAmount: invoices
      .filter(inv => inv.status === 'pending')
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
  }

  console.log('📈 InvoiceTab: Stats calculated:', stats)

  const handleCreateInvoice = async (studentId: string, dueDate: string, notes?: string, additionalData?: {
    discounts: number
    tax: number
    totalAmount: number
  }) => {
    const newInvoice = await createInvoice(studentId, dueDate, notes, additionalData)
    // On successful creation, close both modals and return to main invoice page
    setSelectedStudent(null)
    setIsStudentSelectionOpen(false)
    return newInvoice
  }

  const handleUpdateStatus = async (invoiceId: string, status: 'paid' | 'overpaid' | 'underpaid' | 'pending' | 'cancelled') => {
    await updateInvoiceStatus(invoiceId, status)
  }

  const handleDeleteInvoice = async (invoiceId: string) => {
    await deleteInvoice(invoiceId)
  }

  if (error) {
    console.log('❌ InvoiceTab: Error state, rendering error UI')
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Invoice Data</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    console.log('⏳ InvoiceTab: Loading state, rendering loading UI')
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Loading Invoice Data</h3>
          <p className="text-blue-600">Please wait while we fetch your invoice data...</p>
        </CardContent>
      </Card>
    )
  }

  console.log('✅ InvoiceTab: Rendering main UI')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Invoice Management</h2>
          <p className="text-gray-600">Create and manage student invoices</p>
        </div>
        {/* Show loading indicator for any ongoing operations */}
        {(isCreatingInvoice || isUpdatingStatus || isDeletingInvoice) && (
          <div className="flex items-center gap-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">
              {isCreatingInvoice && 'Creating invoice...'}
              {isUpdatingStatus && 'Updating status...'}
              {isDeletingInvoice && 'Deleting invoice...'}
            </span>
          </div>
        )}
      </div>

      {/* Create Invoice Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleOpenStudentSelection} 
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-red-600">{stats.pending}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paid</p>
                <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Paid</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-green-600">
                  RM {(stats.totalAmount || 0).toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Selection Modal */}
      <Dialog open={isStudentSelectionOpen} onOpenChange={setIsStudentSelectionOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Student to Create Invoice</DialogTitle>
            <DialogDescription>
              Choose a student from the list below to create an invoice
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Search and Filter Controls */}
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search students by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Grade Filter */}
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by grade" />
                </SelectTrigger>
                <SelectContent>
                  {availableGrades.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade === 'all' ? 'All Grades' : `Grade ${grade}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Reset Button */}
              {(searchQuery || selectedGrade !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedGrade('all')
                  }}
                >
                  Reset
                </Button>
              )}
            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-600">
              Showing {filteredStudents.length} of {students.length} students
            </div>

            {filteredStudents.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                {searchQuery || selectedGrade !== 'all' 
                  ? 'No students match your search criteria' 
                  : 'No students available'}
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Click on a student to create an invoice:
                </p>
                {filteredStudents
                  .filter(student => !invoices.some(inv => 
                    inv.student_id === student.id && 
                    new Date(inv.issue_date).getMonth() === new Date().getMonth() && 
                    new Date(inv.issue_date).getFullYear() === new Date().getFullYear()
                  ))
                  .map((student) => (
                  <div 
                    key={student.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedStudent(student)
                      setIsStudentSelectionOpen(false)
                    }}
                  >
                    <div>
                      <h3 className="font-semibold text-lg">{student.student_name}</h3>
                      <p className="text-sm text-gray-600">Grade: {student.standard}</p>
                      {student.fee_matrix ? (
                        <p className="text-sm text-green-600 font-medium">
                          Fee Matrix: RM {(student.fee_matrix.total_amount || 0).toFixed(2)}
                        </p>
                      ) : (
                        <p className="text-sm text-red-600">No fee matrix assigned</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Selected Student Invoice Creator Modal */}
      <Dialog open={!!selectedStudent} onOpenChange={(open) => {
        if (!open) {
          setSelectedStudent(null)
          // Only return to student selection modal when cancelled/closed
          // Successful creation will close both modals via handleCreateInvoice
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Invoice for {selectedStudent?.student_name}</DialogTitle>
            <DialogDescription>
              Fill in the invoice details below
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <InvoiceCreator
              selectedStudent={selectedStudent!}
              onCancel={() => {
                setSelectedStudent(null)
                setIsStudentSelectionOpen(true) // Return to student selection modal
              }}
              onSuccess={() => {
                // On successful creation, close both modals and return to main invoice page
                setSelectedStudent(null)
                setIsStudentSelectionOpen(false)
              }}
              onCreateInvoice={handleCreateInvoice}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice List */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceList
            invoices={invoices}
            onUpdateStatus={handleUpdateStatus}
            onDeleteInvoice={handleDeleteInvoice}
            isUpdatingStatus={isUpdatingStatus}
            isDeletingInvoice={isDeletingInvoice}
          />
        </CardContent>
      </Card>
    </div>
  )
}
