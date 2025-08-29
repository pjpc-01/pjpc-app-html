import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye } from "lucide-react"

interface PaymentTableProps {
  payments: any[]
  invoices: any[]
  loading: boolean
  onViewPayment: (payment: any) => void
  onRefundPayment: (paymentId: string) => void
}

export function PaymentTable({ payments, invoices, loading, onViewPayment, onRefundPayment }: PaymentTableProps) {
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

  if (loading) {
    return (
      <TableRow>
        <TableCell colSpan={7} className="text-center py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
            加载中...
          </div>
        </TableCell>
      </TableRow>
    )
  }

  if (payments.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
          暂无缴费记录
        </TableCell>
      </TableRow>
    )
  }

  return (
    <>
      {payments.map((payment) => {
        const invoice = payment.expand?.invoice_id || invoices.find(inv => inv.id === payment.invoice_id)
        return (
          <TableRow key={payment.id}>
            <TableCell className="font-medium">{invoice?.student_name || '未知学生'}</TableCell>
            <TableCell>{payment.payment_id}</TableCell>
            <TableCell>RM {payment.amount_paid}</TableCell>
            <TableCell>{getStatusBadge(payment.status)}</TableCell>
            <TableCell>{payment.payment_date}</TableCell>
            <TableCell>
              <Badge variant="outline">{payment.payment_method}</Badge>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onViewPayment(payment)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {payment.status === "confirmed" && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onRefundPayment(payment.id)}
                  >
                    退款
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        )
      })}
    </>
  )
}

