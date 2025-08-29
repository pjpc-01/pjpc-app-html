import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DollarSign, CheckCircle, AlertCircle, XCircle } from "lucide-react"

interface InvoicePaymentStatusProps {
  invoice: {
    id: string
    invoice_id: string
    total_amount: number
    status: string
  }
  payments: Array<{
    id: string
    amount_paid: number
    payment_date: string
    status: string
  }>
  className?: string
}

export const InvoicePaymentStatus: React.FC<InvoicePaymentStatusProps> = ({
  invoice,
  payments,
  className = ""
}) => {
  // Calculate payment totals
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount_paid, 0)
  const remainingAmount = invoice.total_amount - totalPaid
  const paymentProgress = (totalPaid / invoice.total_amount) * 100
  
  // Determine status and styling
  const getStatusInfo = () => {
    if (totalPaid >= invoice.total_amount) {
      return {
        status: totalPaid > invoice.total_amount ? 'overpaid' : 'paid',
        label: totalPaid > invoice.total_amount ? '多缴' : '已缴费',
        variant: 'default' as const,
        icon: CheckCircle,
        color: totalPaid > invoice.total_amount ? 'text-green-600' : 'text-blue-600'
      }
    } else if (totalPaid > 0) {
      return {
        status: 'underpaid',
        label: '部分缴费',
        variant: 'secondary' as const,
        icon: AlertCircle,
        color: 'text-orange-600'
      }
    } else {
      return {
        status: 'pending',
        label: '待缴费',
        variant: 'outline' as const,
        icon: XCircle,
        color: 'text-gray-600'
      }
    }
  }
  
  const statusInfo = getStatusInfo()
  const Icon = statusInfo.icon
  
  return (
    <Card className={`${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-sm text-gray-700">缴费状态</h4>
          <Badge variant={statusInfo.variant} className="flex items-center gap-1">
            <Icon className="w-3 h-3" />
            {statusInfo.label}
          </Badge>
        </div>
        
        {/* Payment Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>已缴费: RM {totalPaid.toFixed(2)}</span>
            <span>{paymentProgress.toFixed(1)}%</span>
          </div>
          <Progress value={Math.min(paymentProgress, 100)} className="h-2" />
        </div>
        
        {/* Amount Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">发票总额:</span>
            <span className="font-medium">RM {invoice.total_amount.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">已缴费:</span>
            <span className="font-medium text-green-600">RM {totalPaid.toFixed(2)}</span>
          </div>
          
          {remainingAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">剩余金额:</span>
              <span className="font-medium text-orange-600">RM {remainingAmount.toFixed(2)}</span>
            </div>
          )}
          
          {totalPaid > invoice.total_amount && (
            <div className="flex justify-between">
              <span className="text-gray-600">超额金额:</span>
              <span className="font-medium text-green-600">RM {(totalPaid - invoice.total_amount).toFixed(2)}</span>
            </div>
          )}
        </div>
        
        {/* Payment Count */}
        {payments.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>缴费次数: {payments.length}</span>
              <span>最新缴费: {new Date(payments[0]?.payment_date).toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
