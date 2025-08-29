import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pb } from '@/lib/pocketbase-instance'

// Simple interfaces for invoice data
export interface StudentWithFees {
  id: string
  student_name: string
  standard: string
  fee_matrix?: {
    id: string
    total_amount: number
    fee_items: Array<{
      id: string
      name: string
      amount: number
    }>
  }
}

export interface SimpleInvoice {
  id: string
  invoice_id: string
  student_id: string
  student_name: string
  total_amount: number
  status: 'paid' | 'overpaid' | 'underpaid' | 'pending' | 'cancelled'
  issue_date: string
  due_date: string
  notes?: string
}

// API functions
const fetchStudentsWithFees = async (): Promise<StudentWithFees[]> => {
  console.log('🔄 useInvoiceData: Fetching student_fee_matrix records...')
  
  const feeMatrixData = await pb.collection('student_fee_matrix').getFullList(200, {
    sort: 'created',
    expand: 'students'
  })
  
  console.log(`✅ useInvoiceData: Fetched ${feeMatrixData.length} fee matrix records`)
  
  const studentsWithFees: StudentWithFees[] = feeMatrixData
    .filter(record => record.expand?.students)
    .map(record => {
      const student = record.expand!.students
      
      // Parse fee_items to handle both old format (array of IDs) and new format (array of objects)
      let feeItems: Array<{ id: string; name: string; amount: number }> = []
      
      try {
        if (record.fee_items) {
          if (typeof record.fee_items === 'string') {
            const parsed = JSON.parse(record.fee_items)
            if (Array.isArray(parsed)) {
              if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0].id) {
                // New format: array of objects with full details
                feeItems = parsed.map(item => ({
                  id: item.id,
                  name: item.name || 'Unknown Fee',
                  amount: item.amount || 0
                }))
              } else {
                // Old format: array of IDs - convert to placeholder objects
                feeItems = parsed.map(id => ({
                  id,
                  name: 'Loading...',
                  amount: 0
                }))
              }
            }
          } else if (Array.isArray(record.fee_items)) {
            if (record.fee_items.length > 0 && typeof record.fee_items[0] === 'object' && record.fee_items[0].id) {
              // New format: array of objects with full details
              feeItems = record.fee_items.map(item => ({
                id: item.id,
                name: item.name || 'Unknown Fee',
                amount: item.amount || 0
              }))
            } else {
              // Old format: array of IDs - convert to placeholder objects
              feeItems = record.fee_items.map(id => ({
                id,
                name: 'Loading...',
                amount: 0
              }))
            }
          }
        }
      } catch (error) {
        console.error('useInvoiceData: Error parsing fee_items:', error)
        feeItems = []
      }
      
      return {
        id: student.id,
        student_name: student.student_name || student.english_name || 'Unknown Student',
        standard: student.standard || student.grade || 'Unknown Grade',
        fee_matrix: {
          id: record.id,
          total_amount: record.total_amount || 0,
          fee_items: feeItems
        }
      }
    })
  
  console.log(`✅ useInvoiceData: Transformed ${studentsWithFees.length} students with fee matrices`)
  return studentsWithFees
}

const fetchInvoices = async (): Promise<SimpleInvoice[]> => {
  console.log('🔄 useInvoiceData: Fetching invoices...')
  
  const invoicesResult = await pb.collection('invoices').getList(1, 200, {
    expand: 'student_fee_matrix.students'
  })
  
  const invoicesData = invoicesResult.items
  console.log(`✅ useInvoiceData: Fetched ${invoicesData.length} invoices`)
  
  const transformedInvoices: SimpleInvoice[] = invoicesData.map((invoice: any) => {
    const student = invoice.expand?.student_fee_matrix?.expand?.students
    const studentName = student?.student_name || student?.english_name || student?.name || 'Unknown Student'
    const studentId = student?.id || ''
    
    return {
      id: invoice.id,
      invoice_id: invoice.invoice_id,
      student_id: studentId,
      student_name: studentName,
      total_amount: invoice.total_amount,
      status: invoice.status,
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      notes: invoice.notes
    }
  })
  
  return transformedInvoices
}

const createInvoiceAPI = async (invoiceData: any) => {
  console.log('🔄 useInvoiceData: Creating invoice...')
  console.log('📊 useInvoiceData: Invoice data being sent:', JSON.stringify(invoiceData, null, 2))
  
  try {
    const newInvoice = await pb.collection('invoices').create(invoiceData)
    console.log('✅ useInvoiceData: Invoice created successfully')
    return newInvoice
  } catch (error: any) {
    console.error('❌ useInvoiceData: Detailed error creating invoice:', {
      message: error.message,
      data: error.data,
      status: error.status,
      response: error.response
    })
    throw error
  }
}

const updateInvoiceStatusAPI = async ({ invoiceId, status }: { invoiceId: string; status: string }) => {
  console.log(`🔄 useInvoiceData: Updating invoice ${invoiceId} status to ${status}`)
  const updatedInvoice = await pb.collection('invoices').update(invoiceId, { status })
  console.log('✅ useInvoiceData: Invoice status updated successfully')
  return updatedInvoice
}

const deleteInvoiceAPI = async (invoiceId: string) => {
  console.log(`🔄 useInvoiceData: Deleting invoice ${invoiceId}`)
  await pb.collection('invoices').delete(invoiceId)
  console.log('✅ useInvoiceData: Invoice deleted successfully')
}

// Main hook
export const useInvoiceData = () => {
  console.log('🔄 useInvoiceData: Hook initialized')
  
  const queryClient = useQueryClient()
  
  // Query for students
  const {
    data: students = [],
    isLoading: studentsLoading,
    error: studentsError,
    refetch: refetchStudents
  } = useQuery({
    queryKey: ['students-with-fees'],
    queryFn: fetchStudentsWithFees,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
  
  // Query for invoices
  const {
    data: invoices = [],
    isLoading: invoicesLoading,
    error: invoicesError,
    refetch: refetchInvoices
  } = useQuery({
    queryKey: ['invoices'],
    queryFn: fetchInvoices,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
  
  // Mutation for creating invoices
  const createInvoiceMutation = useMutation({
    mutationFn: createInvoiceAPI,
    onSuccess: () => {
      // Invalidate and refetch invoices
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
    onError: (error: any) => {
      console.error('❌ useInvoiceData: Error creating invoice:', error)
    }
  })
  
  // Mutation for updating invoice status
  const updateInvoiceStatusMutation = useMutation({
    mutationFn: updateInvoiceStatusAPI,
    onSuccess: () => {
      // Invalidate and refetch invoices
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
    onError: (error: any) => {
      console.error('❌ useInvoiceData: Error updating invoice status:', error)
    }
  })
  
  // Mutation for deleting invoices
  const deleteInvoiceMutation = useMutation({
    mutationFn: deleteInvoiceAPI,
    onSuccess: () => {
      // Invalidate and refetch invoices
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
    onError: (error: any) => {
      console.error('❌ useInvoiceData: Error deleting invoice:', error)
    }
  })
  
  // Create invoice function
  const createInvoice = async (
    studentId: string, 
    dueDate: string, 
    notes?: string,
    additionalData?: {
      discounts: number
      tax: number
      totalAmount: number
    }
  ): Promise<SimpleInvoice> => {
    console.log('🔄 useInvoiceData: createInvoice called for student:', studentId)
    
    // Find the student and their fee matrix
    const student = students.find(s => s.id === studentId)
    if (!student || !student.fee_matrix) {
      throw new Error('Student or fee matrix not found')
    }

    // Generate unique invoice number with month included
    const now = new Date()
    const year = now.getFullYear()
    const month = (now.getMonth() + 1).toString().padStart(2, '0') // Get current month (01-12)
    let nextNumber = 1
    let invoiceNumber = `INV-${year}-${month}-${nextNumber.toString().padStart(5, '0')}`
    
    // Check existing invoice numbers for the current month
    const currentMonthInvoices = invoices.filter(inv => {
      // Extract month from existing invoice IDs to check for conflicts
      const match = inv.invoice_id.match(/^INV-\d{4}-(\d{2})-\d{5}$/)
      return match && match[1] === month
    })
    
    // Find the highest number for current month
    const existingNumbers = currentMonthInvoices.map(inv => {
      const match = inv.invoice_id.match(/^INV-\d{4}-\d{2}-(\d{5})$/)
      return match ? parseInt(match[1]) : 0
    })
    
    if (existingNumbers.length > 0) {
      nextNumber = Math.max(...existingNumbers) + 1
      invoiceNumber = `INV-${year}-${month}-${nextNumber.toString().padStart(5, '0')}`
    }
    
    console.log(`🔄 useInvoiceData: Creating invoice ${invoiceNumber} for student ${student.student_name}`)

    // Use provided data or defaults
    const discounts = additionalData?.discounts || 0
    const tax = additionalData?.tax || 0
    const totalAmount = additionalData?.totalAmount || student.fee_matrix.total_amount

    // Validate amounts
    if (student.fee_matrix.total_amount <= 0) {
      throw new Error('Subtotal must be greater than 0')
    }
    if (totalAmount <= 0) {
      throw new Error('Total amount must be greater than 0')
    }

    // Format dates - ensure they're in the correct format for PocketBase
    const formattedDueDate = new Date(dueDate).toISOString()
    const formattedIssueDate = new Date().toISOString()
    
    console.log('📅 useInvoiceData: Date formatting:', {
      originalDueDate: dueDate,
      formattedDueDate,
      formattedIssueDate
    })

    // Create invoice data with proper type conversion
    const invoiceData = {
      invoice_id: invoiceNumber,
      student_fee_matrix: student.fee_matrix.id,
      discounts: parseFloat(discounts.toString()) || 0,
      tax: parseFloat(tax.toString()) || 0,
      total_amount: parseFloat(totalAmount.toString()) || 0,
      issue_date: formattedIssueDate,
      due_date: formattedDueDate,
      status: 'pending', // Using the correct PocketBase schema value
      notes: notes || ''
    }

    // Validate the student_fee_matrix ID exists
    if (!student.fee_matrix.id) {
      throw new Error('Student fee matrix ID is missing')
    }

    // Test if the student_fee_matrix record actually exists in PocketBase
    try {
      const feeMatrixRecord = await pb.collection('student_fee_matrix').getOne(student.fee_matrix.id)
      console.log('✅ useInvoiceData: Student fee matrix record found:', feeMatrixRecord.id)
    } catch (error) {
      console.error('❌ useInvoiceData: Student fee matrix record not found:', error)
      throw new Error(`Student fee matrix record with ID ${student.fee_matrix.id} does not exist in PocketBase`)
    }

    console.log('🔍 useInvoiceData: Validating data before creation:', {
      student_fee_matrix_id: student.fee_matrix.id,
      student_fee_matrix_exists: !!student.fee_matrix.id,
      total_amount: totalAmount,
      due_date: formattedDueDate
    })

    console.log('📊 useInvoiceData: Invoice data to create:', JSON.stringify(invoiceData, null, 2))
    
    // Execute mutation and transform the result
    const newInvoice = await createInvoiceMutation.mutateAsync(invoiceData)
    
    // Transform the created invoice to match our interface
    const transformedInvoice: SimpleInvoice = {
      id: newInvoice.id,
      invoice_id: newInvoice.invoice_id,
      student_id: studentId,
      student_name: student.student_name,
      total_amount: newInvoice.total_amount,
      status: newInvoice.status,
      issue_date: newInvoice.issue_date,
      due_date: newInvoice.due_date,
      notes: newInvoice.notes
    }
    
    return transformedInvoice
  }
  
  // Update invoice status function
  const updateInvoiceStatus = async (invoiceId: string, status: 'paid' | 'overpaid' | 'underpaid' | 'pending' | 'cancelled') => {
    return updateInvoiceStatusMutation.mutateAsync({ invoiceId, status })
  }
  
  // Delete invoice function
  const deleteInvoice = async (invoiceId: string) => {
    return deleteInvoiceMutation.mutateAsync(invoiceId)
  }
  
  // Computed values
  const loading = studentsLoading || invoicesLoading
  const error = studentsError || invoicesError
  
  console.log('📊 useInvoiceData: Returning hook data:', {
    studentsCount: students.length,
    invoicesCount: invoices.length,
    loading,
    error: error ? 'error' : 'none'
  })

  return {
    students,
    invoices,
    loading,
    error: error?.message || null,
    createInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    refetchStudents,
    refetchInvoices,
    // Mutation states for UI feedback
    isCreatingInvoice: createInvoiceMutation.isPending,
    isUpdatingStatus: updateInvoiceStatusMutation.isPending,
    isDeletingInvoice: deleteInvoiceMutation.isPending,
  }
}
