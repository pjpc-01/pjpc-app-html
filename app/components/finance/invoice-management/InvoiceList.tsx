"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Badge } from '../../../../components/ui/badge'
import { Input } from '../../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { Search, Trash2, Edit, Eye, X } from 'lucide-react'
import { SimpleInvoice } from '../../../../hooks/useInvoiceData'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../../components/ui/dialog'

interface InvoiceListProps {
  invoices: SimpleInvoice[]
  onUpdateStatus: (invoiceId: string, status: 'paid' | 'overpaid' | 'underpaid' | 'pending' | 'cancelled') => Promise<void>
  onDeleteInvoice: (invoiceId: string) => Promise<void>
  isUpdatingStatus?: boolean
  isDeletingInvoice?: boolean
}

export function InvoiceList({ 
  invoices, 
  onUpdateStatus, 
  onDeleteInvoice, 
  isUpdatingStatus = false,
  isDeletingInvoice = false 
}: InvoiceListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loadingInvoice, setLoadingInvoice] = useState<string | null>(null)
  const [selectedInvoiceForDetails, setSelectedInvoiceForDetails] = useState<SimpleInvoice | null>(null)

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.student_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>
      case 'overpaid':
        return <Badge className="bg-blue-100 text-blue-800">Overpaid</Badge>
      case 'underpaid':
        return <Badge className="bg-yellow-100 text-yellow-800">Underpaid</Badge>
      case 'pending':
        return <Badge className="bg-red-100 text-red-800">Pending</Badge>
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleStatusUpdate = async (invoiceId: string, newStatus: 'paid' | 'overpaid' | 'underpaid' | 'pending' | 'cancelled') => {
    try {
      setLoadingInvoice(invoiceId)
      await onUpdateStatus(invoiceId, newStatus)
    } catch (error) {
      console.error('Error updating invoice status:', error)
    } finally {
      setLoadingInvoice(null)
    }
  }

  const handleDelete = async (invoiceId: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      try {
        setLoadingInvoice(invoiceId)
        await onDeleteInvoice(invoiceId)
      } catch (error) {
        console.error('Error deleting invoice:', error)
      } finally {
        setLoadingInvoice(null)
      }
    }
  }

  const handleViewDetails = (invoice: SimpleInvoice) => {
    setSelectedInvoiceForDetails(invoice)
  }

  const handleCancelInvoice = async (invoiceId: string) => {
    if (confirm('Are you sure you want to cancel this invoice?')) {
      try {
        setLoadingInvoice(invoiceId)
        await onUpdateStatus(invoiceId, 'cancelled')
      } catch (error) {
        console.error('Error cancelling invoice:', error)
      } finally {
        setLoadingInvoice(null)
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Management</CardTitle>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search invoices by ID or student name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overpaid">Overpaid</SelectItem>
              <SelectItem value="underpaid">Underpaid</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'No invoices found matching your filters.' 
                : 'No invoices found.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInvoices.map((invoice) => (
              <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{invoice.invoice_id}</h3>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <p className="text-gray-600 mb-1">{invoice.student_name}</p>
                      <p className="text-sm text-gray-500">
                        Issue Date: {formatDate(invoice.issue_date)} | 
                        Due Date: {formatDate(invoice.due_date)}
                      </p>
                      {invoice.notes && (
                        <p className="text-sm text-gray-600 mt-1">Notes: {invoice.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right mr-4">
                        <p className="text-lg font-semibold text-green-600">
                          RM {invoice.total_amount.toFixed(2)}
                        </p>
                      </div>
                      
                                             <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => handleViewDetails(invoice)}
                         disabled={loadingInvoice === invoice.id}
                         className="text-blue-600 hover:text-blue-700"
                         title="View Details"
                       >
                         <Eye className="h-4 w-4" />
                       </Button>
                       
                       {invoice.status !== 'cancelled' && (
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => handleCancelInvoice(invoice.id)}
                           disabled={loadingInvoice === invoice.id || isUpdatingStatus}
                           className="text-orange-600 hover:text-orange-700"
                           title="Cancel Invoice"
                         >
                           <X className="h-4 w-4" />
                         </Button>
                       )}
                       
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => handleDelete(invoice.id)}
                         disabled={loadingInvoice === invoice.id || isDeletingInvoice}
                         className="text-red-600 hover:text-red-700"
                         title="Delete Invoice"
                       >
                         <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      {/* Invoice Details Modal */}
      <Dialog open={!!selectedInvoiceForDetails} onOpenChange={(open) => !open && setSelectedInvoiceForDetails(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details - {selectedInvoiceForDetails?.invoice_id}</DialogTitle>
            <DialogDescription>
              Complete information for this invoice
            </DialogDescription>
          </DialogHeader>
          
          {selectedInvoiceForDetails && (
            <div className="space-y-6 py-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Invoice ID:</span>
                      <span className="font-medium">{selectedInvoiceForDetails.invoice_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Student Name:</span>
                      <span className="font-medium">{selectedInvoiceForDetails.student_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span>{getStatusBadge(selectedInvoiceForDetails.status)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-semibold text-green-600 text-lg">
                        RM {selectedInvoiceForDetails.total_amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Dates</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Issue Date:</span>
                      <span className="font-medium">{formatDate(selectedInvoiceForDetails.issue_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Due Date:</span>
                      <span className="font-medium">{formatDate(selectedInvoiceForDetails.due_date)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              {selectedInvoiceForDetails.notes && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">{selectedInvoiceForDetails.notes}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setSelectedInvoiceForDetails(null)}
                >
                  Close
                </Button>
                {selectedInvoiceForDetails.status !== 'cancelled' && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleCancelInvoice(selectedInvoiceForDetails.id)
                      setSelectedInvoiceForDetails(null)
                    }}
                    className="text-orange-600 border-orange-200 hover:bg-orange-50"
                  >
                    Cancel Invoice
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDelete(selectedInvoiceForDetails.id)
                    setSelectedInvoiceForDetails(null)
                  }}
                >
                  Delete Invoice
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
