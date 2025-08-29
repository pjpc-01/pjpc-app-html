"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Textarea } from '../../../../components/ui/textarea'
import { Badge } from '../../../../components/ui/badge'

import { X, Check } from 'lucide-react'
import { StudentWithFees, SimpleInvoice } from '../../../../hooks/useInvoiceData'

interface InvoiceCreatorProps {
  selectedStudent: StudentWithFees | null
  onCancel: () => void
  onCreateInvoice: (studentId: string, dueDate: string, notes?: string, additionalData?: {
    discounts: number
    tax: number
    totalAmount: number
  }) => Promise<SimpleInvoice>
}

export function InvoiceCreator({ selectedStudent, onCancel, onCreateInvoice }: InvoiceCreatorProps) {
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [discounts, setDiscounts] = useState('0')
  const [tax, setTax] = useState('0')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!selectedStudent) {
    return null
  }

  const handleCreateInvoice = async () => {
    if (!dueDate) {
      setError('Please select a due date')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
             // Calculate total amount with discounts and tax
       const baseAmount = selectedStudent.fee_matrix?.total_amount || 0
      const discountAmount = parseFloat(discounts) || 0
      const taxAmount = parseFloat(tax) || 0
      const totalAmount = baseAmount - discountAmount + taxAmount
      
      await onCreateInvoice(selectedStudent.id, dueDate, notes, {
        discounts: discountAmount,
        tax: taxAmount,
        totalAmount
      })
      
      setSuccess(true)
      setTimeout(() => {
        onCancel()
      }, 2000)
      
    } catch (err: any) {
      setError(err.message || 'Failed to create invoice')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setDueDate('')
    setNotes('')
    setDiscounts('0')
    setTax('0')

    setError(null)
    setSuccess(false)
    onCancel()
  }

     // Calculate totals for display
   const baseAmount = selectedStudent.fee_matrix?.total_amount || 0
  const discountAmount = parseFloat(discounts) || 0
  const taxAmount = parseFloat(tax) || 0
  const finalTotal = baseAmount - discountAmount + taxAmount

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6 text-center">
          <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">Invoice Created Successfully!</h3>
          <p className="text-green-600">Invoice for {selectedStudent.student_name} has been created.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Create Invoice</CardTitle>
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Student Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-2">{selectedStudent.student_name}</h3>
          <p className="text-gray-600 mb-3">Grade: {selectedStudent.standard}</p>
          
          {selectedStudent.fee_matrix && (
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Base Amount: <span className="font-semibold text-blue-600 text-lg">
                  RM {baseAmount.toFixed(2)}
                </span>
              </p>
              
              {selectedStudent.fee_matrix.fee_items && selectedStudent.fee_matrix.fee_items.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Fee Items:</p>
                  <div className="flex flex-wrap gap-2">
                                         {selectedStudent.fee_matrix.fee_items.map((item, index) => (
                       <Badge key={item.id || `fee-${index}`} variant="outline" className="text-xs">
                         {item.name}: RM {item.amount}
                       </Badge>
                     ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Invoice Details */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="dueDate">Due Date *</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discounts">Discounts (RM)</Label>
              <Input
                id="discounts"
                type="number"
                step="0.01"
                min="0"
                value={discounts}
                onChange={(e) => setDiscounts(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="tax">Tax (RM)</Label>
              <Input
                id="tax"
                type="number"
                step="0.01"
                min="0"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>



          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes for this invoice..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Total Calculation Display */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Invoice Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Base Amount:</span>
                <span>RM {baseAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Discounts:</span>
                <span>- RM {discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Tax:</span>
                <span>+ RM {taxAmount.toFixed(2)}</span>
              </div>
              <div className="border-t pt-1 flex justify-between font-semibold text-lg">
                <span>Total Amount:</span>
                <span className="text-green-600">RM {finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleCreateInvoice}
            disabled={loading || !dueDate}
            className="flex-1"
          >
            {loading ? 'Creating...' : 'Create Invoice'}
          </Button>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
