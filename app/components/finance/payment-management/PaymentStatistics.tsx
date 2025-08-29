import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, DollarSign, CheckCircle, AlertCircle } from "lucide-react"

interface PaymentStatisticsProps {
  payments: any[]
  loading: boolean
}

export function PaymentStatistics({ payments, loading }: PaymentStatisticsProps) {
  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount_paid, 0)
  const confirmedCount = payments.filter(p => p.status === 'confirmed').length
  const pendingCount = payments.filter(p => p.status === 'pending').length

  const StatCard = ({ title, value, icon: Icon, description }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? (
            <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
          ) : (
            value
          )}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard
        title="本月缴费"
        value={payments.length}
        icon={CreditCard}
        description="缴费记录数量"
      />
      <StatCard
        title="缴费总额"
        value={`RM ${totalAmount.toLocaleString()}`}
        icon={DollarSign}
        description="累计缴费金额"
      />
      <StatCard
        title="已缴费"
        value={confirmedCount}
        icon={CheckCircle}
        description="已缴费记录"
      />
      <StatCard
        title="待缴费"
        value={pendingCount}
        icon={AlertCircle}
        description="待缴费记录"
      />
    </div>
  )
}

