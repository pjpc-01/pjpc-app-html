import { Badge } from "@/components/ui/badge"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface PaymentDetailDialogProps {
  payment: any
  invoices: any[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PaymentDetailDialog({ payment, invoices, open, onOpenChange }: PaymentDetailDialogProps) {
  if (!payment) return null

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge variant="default">已缴费</Badge>
      case "pending":
        return <Badge variant="secondary">待缴费</Badge>
      case "failed":
        return <Badge variant="destructive">缴费失败</Badge>
      case "ca":
        return <Badge variant="outline">已取消</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const invoice = payment.expand?.invoice_id || invoices.find(inv => inv.id === payment.invoice_id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>缴费详情 - {payment.payment_id}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">缴费信息</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">付款编号:</span> {payment.payment_id}</div>
                <div><span className="font-medium">缴费金额:</span> RM {payment.amount_paid}</div>
                <div><span className="font-medium">缴费状态:</span> {getStatusBadge(payment.status)}</div>
                <div><span className="font-medium">缴费日期:</span> {payment.payment_date}</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">支付信息</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">支付方式:</span> {payment.payment_method}</div>
                <div><span className="font-medium">交易编号:</span> {payment.transaction_id || "无"}</div>
                <div><span className="font-medium">处理时间:</span> {payment.payment_date || "无"}</div>
                <div><span className="font-medium">备注:</span> {payment.notes || "无"}</div>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">关联发票</h3>
            {invoice ? (
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">发票号码:</span> {invoice.invoice_id}</div>
                <div><span className="font-medium">学生姓名:</span> {invoice.student_name}</div>
                <div><span className="font-medium">发票金额:</span> RM {invoice.total_amount}</div>
                <div><span className="font-medium">发票状态:</span> {invoice.status}</div>
              </div>
            ) : (
              <p className="text-gray-500">未找到关联发票</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

