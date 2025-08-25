import { Badge } from "@/components/ui/badge"

export interface PaymentStatusBadgeProps {
  status: string
  className?: string
}

export const getPaymentStatusBadge = (status: string, className?: string) => {
  switch (status) {
    case "completed":
      return <Badge variant="default" className={className}>已缴费</Badge>
    case "pending":
      return <Badge variant="secondary" className={className}>待缴费</Badge>
    case "failed":
      return <Badge variant="destructive" className={className}>缴费失败</Badge>
    case "refunded":
      return <Badge variant="outline" className={className}>已退款</Badge>
    case "overpaid":
      return <Badge variant="outline" className={`bg-green-200 text-green-900 ${className || ''}`}>多缴</Badge>
    case "underpaid":
      return <Badge variant="outline" className={`bg-red-200 text-red-900 ${className || ''}`}>少缴</Badge>
    case "unpaid":
      return <Badge variant="outline" className={className}>未缴费</Badge>
    case "paid":
      return <Badge variant="default" className={className}>已缴费</Badge>
    default:
      return <Badge variant="outline" className={className}>{status}</Badge>
  }
}

export const PaymentStatusBadge = ({ status, className }: PaymentStatusBadgeProps) => {
  return getPaymentStatusBadge(status, className)
}

// Helper function to calculate payment status based on invoice and payments
export const calculateInvoicePaymentStatus = (
  invoice: any, 
  payments: any[]
) => {
  const invoicePayments = payments.filter(payment => payment.invoiceId === invoice.id)
  
  if (invoicePayments.length === 0) {
    return "unpaid"
  }
  
  const totalPaid = invoicePayments.reduce((sum, p) => sum + p.amountPaid, 0)
  if (totalPaid > invoice.totalAmount) return "overpaid"
  if (totalPaid === invoice.totalAmount) return "paid"
  if (totalPaid > 0 && totalPaid < invoice.totalAmount) return "underpaid"
  return "unpaid"
}

// Get payment status options for filters
export const getPaymentStatusOptions = () => [
  { value: "all", label: "所有缴费状态" },
  { value: "unpaid", label: "未缴费" },
  { value: "paid", label: "已缴费" },
  { value: "overpaid", label: "多缴" },
  { value: "underpaid", label: "少缴" },
  { value: "pending", label: "待缴费" },
  { value: "failed", label: "缴费失败" },
  { value: "refunded", label: "已退款" }
]
