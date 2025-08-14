import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"

interface NewFeeItem {
  name: string
  amount: string
  type: 'monthly' | 'one-time' | 'annual'
  description: string
  applicableGrades: string[]
  status: 'active' | 'inactive'
  category: string
}

interface AddFeeDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  newFeeItem: NewFeeItem
  onFeeItemInputChange: (field: string, value: string) => void
  onAddFeeItem: () => void
}

export const AddFeeDialog = ({
  isOpen,
  onOpenChange,
  newFeeItem,
  onFeeItemInputChange,
  onAddFeeItem
}: AddFeeDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          添加收费项目
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>添加收费项目</DialogTitle>
          <DialogDescription>创建新的收费项目</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">项目名称</Label>
            <Input
              id="name"
              value={newFeeItem.name}
              onChange={(e) => onFeeItemInputChange("name", e.target.value)}
              placeholder="例如：学费、注册费"
            />
          </div>

          <div>
            <Label htmlFor="category">分类</Label>
            <Input
              id="category"
              value={newFeeItem.category}
              onChange={(e) => onFeeItemInputChange("category", e.target.value)}
              placeholder="例如：教育费用、生活费用"
            />
          </div>
          
          <div>
            <Label htmlFor="type">收费类型</Label>
            <Select value={newFeeItem.type} onValueChange={(value) => onFeeItemInputChange("type", value)}>
              <SelectTrigger>
                <SelectValue placeholder="选择收费类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">按月收费</SelectItem>
                <SelectItem value="one-time">一次性收费</SelectItem>
                <SelectItem value="annual">年度收费</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="amount">金额</Label>
            <Input
              id="amount"
              type="number"
              value={newFeeItem.amount}
              onChange={(e) => onFeeItemInputChange("amount", e.target.value)}
              placeholder="0"
            />
          </div>

          <div>
            <Label htmlFor="description">项目描述</Label>
            <Textarea
              id="description"
              value={newFeeItem.description}
              onChange={(e) => onFeeItemInputChange("description", e.target.value)}
              placeholder="详细描述收费项目"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={onAddFeeItem}>
            添加项目
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
