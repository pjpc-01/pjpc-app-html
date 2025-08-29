import { Button } from "@/components/ui/button"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface ProcessPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedInvoice: any
  invoices: any[]
  payments: any[]
  formData: {
    amount: string
    method: string
    notes: string
  }
  onInvoiceSelect: (invoice: any) => void
  onFormChange: (field: string, value: string) => void
  onSubmit: () => void
  onCancel: () => void
}

export function ProcessPaymentDialog({
  open,
  onOpenChange,
  selectedInvoice,
  invoices,
  payments,
  formData,
  onInvoiceSelect,
  onFormChange,
  onSubmit,
  onCancel
}: ProcessPaymentDialogProps) {
  const getPaymentsByInvoice = (invoiceId: string) => {
    return payments.filter(p => p.invoice_id === invoiceId)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>处理缴费</DialogTitle>
          <DialogDescription>为学生处理缴费记录</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>选择发票</Label>
            <Select onValueChange={(value) => {
              const invoice = invoices.find(inv => inv.id === value)
              onInvoiceSelect(invoice)
              if (invoice) {
                onFormChange('amount', invoice.total_amount.toString())
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="选择要缴费的发票" />
              </SelectTrigger>
              <SelectContent>
                {invoices.filter(inv => inv.status !== 'paid').map(invoice => (
                  <SelectItem key={invoice.id} value={invoice.id}>
                    {invoice.invoice_id} - {invoice.student_name} (RM {invoice.total_amount})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedInvoice && (
            <>
              <div>
                <Label>缴费金额</Label>
                <Input 
                  type="number" 
                  placeholder="输入缴费金额"
                  value={formData.amount}
                  onChange={(e) => onFormChange('amount', e.target.value)}
                />
                <p className="text-sm text-gray-500 mt-1">
                  发票总金额: RM {selectedInvoice.total_amount}
                  {(() => {
                    const invoicePayments = getPaymentsByInvoice(selectedInvoice.id)
                    const totalPaid = invoicePayments.reduce((sum, p) => sum + p.amount_paid, 0)
                    const outstandingBalance = selectedInvoice.total_amount - totalPaid
                    return outstandingBalance > 0 ? (
                      <span className="text-orange-600 ml-2">
                        (待缴余额: RM {outstandingBalance})
                      </span>
                    ) : (
                      <span className="text-green-600 ml-2">(已全额缴费)</span>
                    )
                  })()}
                </p>
              </div>
              
              <div>
                <Label>支付方式</Label>
                <Select 
                  value={formData.method}
                  onValueChange={(value) => onFormChange('method', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择支付方式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">现金</SelectItem>
                    <SelectItem value="bank_transfer">银行转账</SelectItem>
                    <SelectItem value="card">银行卡</SelectItem>
                    <SelectItem value="e_v">电子支付</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>备注</Label>
                <Input 
                  placeholder="缴费备注..." 
                  value={formData.notes}
                  onChange={(e) => onFormChange('notes', e.target.value)}
                />
              </div>

              {/* Payment History */}
              <div>
                <Label>缴费历史</Label>
                <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                  {getPaymentsByInvoice(selectedInvoice.id).map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                      <span>{payment.payment_date}</span>
                      <span className="font-medium">RM {payment.amount_paid}</span>
                      <Badge variant={payment.status === 'confirmed' ? 'default' : 'secondary'}>
                        {payment.status === 'confirmed' ? '已缴费' : '待处理'}
                      </Badge>
                    </div>
                  ))}
                  {getPaymentsByInvoice(selectedInvoice.id).length === 0 && (
                    <p className="text-gray-500 text-sm">暂无缴费记录</p>
                  )}
                </div>
              </div>
            </>
          )}
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              取消
            </Button>
            <Button 
              disabled={!selectedInvoice || !formData.amount || !formData.method}
              onClick={onSubmit}
            >
              确认缴费
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

