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
import type { Fee } from "@/types/fees"

interface AddFeeDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  newFeeItem: Omit<Fee, "id">
  onFeeItemInputChange: (field: keyof Omit<Fee, "id">, value: any) => void
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>添加收费项目</DialogTitle>
          <DialogDescription>创建新的收费项目</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">分类 *</Label>
              <Select value={newFeeItem.category || "学费"} onValueChange={(value) => onFeeItemInputChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="学费">学费</SelectItem>
                  <SelectItem value="住宿">住宿</SelectItem>
                  <SelectItem value="餐饮">餐饮</SelectItem>
                  <SelectItem value="材料费">材料费</SelectItem>
                  <SelectItem value="其他">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="name">项目名称 *</Label>
              <Input
                id="name"
                value={newFeeItem.name || ""}
                onChange={(e) => onFeeItemInputChange("name", e.target.value)}
                placeholder="例如：学费、餐费"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">金额 *</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={newFeeItem.amount || ""}
                onChange={(e) => onFeeItemInputChange("amount", parseFloat(e.target.value) || 0)}
                placeholder="输入金额"
              />
            </div>
            <div>
              <Label htmlFor="frequency">收费频率 *</Label>
              <Select value={newFeeItem.frequency || "recurring"} onValueChange={(value) => onFeeItemInputChange("frequency", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择收费频率" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-time">一次性收费</SelectItem>
                  <SelectItem value="recurring">定期收费</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="status">状态 *</Label>
            <Select value={newFeeItem.status || "active"} onValueChange={(value) => onFeeItemInputChange("status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">启用</SelectItem>
                <SelectItem value="inactive">禁用</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">项目描述</Label>
            <Textarea
              id="description"
              value={newFeeItem.description || ""}
              onChange={(e) => onFeeItemInputChange("description", e.target.value)}
              placeholder="详细描述收费项目"
              rows={3}
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
