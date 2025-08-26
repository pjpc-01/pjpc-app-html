"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Badge } from '../../../../components/ui/badge'
import { Plus, FileText, DollarSign, AlertCircle } from 'lucide-react'
import { useInvoiceData } from '../../../../hooks/useInvoiceData'
import { InvoiceCreator } from './InvoiceCreator'
import { InvoiceList } from './InvoiceList'
import { StudentWithFees, SimpleInvoice } from '../../../../hooks/useInvoiceData'

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

  // Calculate statistics
  const stats = {
    total: invoices.length,
    unpaid: invoices.filter(inv => inv.status === 'unpaid').length,
    paid: invoices.filter(inv => inv.status === 'paid').length,
    cancelled: invoices.filter(inv => inv.status === 'cancelled').length,
    totalAmount: invoices.reduce((sum, inv) => sum + inv.total_amount, 0),
    unpaidAmount: invoices
      .filter(inv => inv.status === 'unpaid')
      .reduce((sum, inv) => sum + inv.total_amount, 0)
  }

  console.log('📈 InvoiceTab: Stats calculated:', stats)

  const handleCreateInvoice = async (studentId: string, dueDate: string, notes?: string, additionalData?: {
    discounts: number
    tax: number
    totalAmount: number
    paymentMethod: string
  }) => {
    const newInvoice = await createInvoice(studentId, dueDate, notes, additionalData)
    setSelectedStudent(null)
    return newInvoice
  }

  const handleUpdateStatus = async (invoiceId: string, status: 'unpaid' | 'paid' | 'cancelled') => {
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
                <p className="text-sm font-medium text-gray-600">Unpaid</p>
                <p className="text-2xl font-bold text-red-600">{stats.unpaid}</p>
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
                  RM {stats.totalAmount.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Selection */}
      {!selectedStudent && (
        <Card>
          <CardHeader>
            <CardTitle>Select Student to Create Invoice</CardTitle>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <p className="text-gray-600">No students available</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-4">
                  Found {students.length} students. Click on a student to create an invoice:
                </p>
                {students.slice(0, 10).map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{student.student_name}</h3>
                      <p className="text-sm text-gray-600">Grade: {student.standard}</p>
                      {student.fee_matrix ? (
                        <p className="text-sm text-green-600">
                          Fee Matrix: RM {student.fee_matrix.total_amount.toFixed(2)}
                        </p>
                      ) : (
                        <p className="text-sm text-red-600">No fee matrix assigned</p>
                      )}
                    </div>
                    <Button 
                      onClick={() => setSelectedStudent(student)}
                      disabled={!student.fee_matrix || isCreatingInvoice}
                    >
                      {isCreatingInvoice ? 'Creating...' : 'Create Invoice'}
                    </Button>
                  </div>
                ))}
                {students.length > 10 && (
                  <p className="text-sm text-gray-500 text-center">
                    ... and {students.length - 10} more students
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Selected Student Invoice Creator */}
      {selectedStudent && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle>Create Invoice for {selectedStudent.student_name}</CardTitle>
          </CardHeader>
          <CardContent>
            <InvoiceCreator
              selectedStudent={selectedStudent}
              onCancel={() => setSelectedStudent(null)}
              onCreateInvoice={handleCreateInvoice}
            />
          </CardContent>
        </Card>
      )}

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
