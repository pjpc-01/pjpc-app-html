import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PaymentFiltersProps {
  filters: {
    status: string
    method: string
    search: string
  }
  setFilters: (filters: any) => void
}

export function PaymentFilters({ filters, setFilters }: PaymentFiltersProps) {
  return (
    <div className="flex gap-4 mb-4">
      <div>
        <Label className="sr-only">缴费状态</Label>
        <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="缴费状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="confirmed">已缴费</SelectItem>
            <SelectItem value="pending">待缴费</SelectItem>
            <SelectItem value="failed">缴费失败</SelectItem>
            <SelectItem value="ca">已取消</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label className="sr-only">支付方式</Label>
        <Select value={filters.method} onValueChange={(value) => setFilters(prev => ({ ...prev, method: value }))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="支付方式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部方式</SelectItem>
            <SelectItem value="cash">现金</SelectItem>
            <SelectItem value="bank_transfer">银行转账</SelectItem>
            <SelectItem value="card">银行卡</SelectItem>
            <SelectItem value="e_v">电子支付</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label className="sr-only">搜索</Label>
        <Input 
          placeholder="搜索学生姓名..." 
          value={filters.search}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          className="w-[200px]"
        />
      </div>
    </div>
  )
}

