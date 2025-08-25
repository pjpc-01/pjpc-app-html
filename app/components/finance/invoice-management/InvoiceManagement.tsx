"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useInvoices } from "@/hooks/useInvoices"
import { useStudents } from "@/hooks/useStudents"
import { useFeeItems } from "@/hooks/useFeeItems"
import { useStudentFeeMatrixQuery } from "@/hooks/useStudentFeeMatrixQuery"
import { InvoiceCreateDialog } from "./InvoiceCreateDialog"
import { InvoiceList } from "./InvoiceList"
import InvoiceTemplateManager from "./InvoiceTemplateManager"
import { Invoice, Student, FeeItem } from "@/types/student-fees"
import { Plus, FileText, Settings, Search, Filter } from "lucide-react"

export function InvoiceManagement() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedStudent, setSelectedStudent] = useState<string>("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showTemplateManager, setShowTemplateManager] = useState(false)

  // Hooks
  const { invoices, loading: invoicesLoading, error: invoicesError, refetch: refetchInvoices } = useInvoices()
  const { students, loading: studentsLoading } = useStudents()
  const { feeItems, loading: feeItemsLoading } = useFeeItems()
  
  // Use the new hook
  const { getStudentAmount } = useStudentFeeMatrixQuery()

  // Filtered invoices
  const filteredInvoices = invoices.filter((invoice: Invoice) => {
    const matchesSearch = !searchTerm || 
      invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.studentName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter
    const matchesStudent = selectedStudent === "all" || !selectedStudent || invoice.studentId === selectedStudent
    
    return matchesSearch && matchesStatus && matchesStudent
  })

  // Get student's total fee amount
  const getStudentTotalAmount = (studentId: string): number => {
    return getStudentAmount(studentId)
  }

  // Handle invoice creation
  const handleCreateInvoice = async (invoiceData: Partial<Invoice>) => {
    try {
      // Calculate total amount if not provided
      if (!invoiceData.totalAmount && invoiceData.studentId) {
        invoiceData.totalAmount = getStudentTotalAmount(invoiceData.studentId)
      }
      
      // Add creation timestamp
      invoiceData.createdAt = new Date().toISOString()
      invoiceData.status = "pending"
      
      // Here you would typically call your API to create the invoice
      console.log("Creating invoice:", invoiceData)
      
      toast({
        title: "Invoice Created",
        description: "The invoice has been created successfully.",
      })
      
      setShowCreateDialog(false)
      refetchInvoices()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create invoice. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle invoice status update
  const handleStatusUpdate = async (invoiceId: string, newStatus: string) => {
    try {
      // Here you would typically call your API to update the invoice status
      console.log("Updating invoice status:", { invoiceId, newStatus })
      
      toast({
        title: "Status Updated",
        description: "Invoice status has been updated successfully.",
      })
      
      refetchInvoices()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update invoice status. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle invoice deletion
  const handleDeleteInvoice = async (invoiceId: string) => {
    try {
      // Here you would typically call your API to delete the invoice
      console.log("Deleting invoice:", invoiceId)
      
      toast({
        title: "Invoice Deleted",
        description: "The invoice has been deleted successfully.",
      })
      
      refetchInvoices()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete invoice. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Invoice Management</h2>
          <p className="text-muted-foreground">
            Create, manage, and track student invoices
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowTemplateManager(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
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
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by student" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Students</SelectItem>
            {students.map((student: Student) => (
              <SelectItem key={student.id} value={student.id}>
                {student.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
            <p className="text-xs text-muted-foreground">
              All time invoices
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Badge variant="secondary">Pending</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoices.filter((i: Invoice) => i.status === "pending").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting payment
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <Badge variant="default">Paid</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoices.filter((i: Invoice) => i.status === "paid").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully paid
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <Badge variant="destructive">Overdue</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoices.filter((i: Invoice) => i.status === "overdue").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Past due date
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Invoice List</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-4">
          <InvoiceList
            invoices={filteredInvoices}
            loading={invoicesLoading}
            error={invoicesError}
            onStatusUpdate={handleStatusUpdate}
            onDelete={handleDeleteInvoice}
            getStudentTotalAmount={getStudentTotalAmount}
          />
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-4">
          <InvoiceTemplateManager />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {showCreateDialog && (
        <InvoiceCreateDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          students={students}
          feeItems={feeItems}
          onCreateInvoice={handleCreateInvoice}
          getStudentTotalAmount={getStudentTotalAmount}
        />
      )}

      {showTemplateManager && (
        <InvoiceTemplateManager
          open={showTemplateManager}
          onOpenChange={setShowTemplateManager}
        />
      )}
    </div>
  )
}

// Add default export
export default InvoiceManagement 