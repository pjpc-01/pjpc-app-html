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
} from "@/components/ui/dialog"
import { SubItemForm } from "./SubItemForm"

interface SubItem {
  id: number
  name: string
  amount: number
  description: string
  active: boolean
}

interface NewFeeItem {
  name: string
  amount: string
  type: string
  description: string
  applicableGrades: string[]
  status: string
  category: string
  subItems: SubItem[]
}

interface EditFeeDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  newFeeItem: NewFeeItem
  onFeeItemInputChange: (field: string, value: string) => void
  onAddSubItem: () => void
  onUpdateSubItem: (index: number, field: string, value: string | number | boolean) => void
  onRemoveSubItem: (index: number) => void
  onUpdateFeeItem: () => void
}

export const EditFeeDialog = ({
  isOpen,
  onOpenChange,
  newFeeItem,
  onFeeItemInputChange,
  onAddSubItem,
  onUpdateSubItem,
  onRemoveSubItem,
  onUpdateFeeItem
}: EditFeeDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑收费项目</DialogTitle>
          <DialogDescription>修改收费项目信息</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-category">分类</Label>
              <Input
                id="edit-category"
                value={newFeeItem.category}
                onChange={(e) => onFeeItemInputChange("category", e.target.value)}
                placeholder="例如：教育费用、生活费用"
              />
            </div>
            <div>
              <Label htmlFor="edit-name">项目名称</Label>
              <Input
                id="edit-name"
                value={newFeeItem.name}
                onChange={(e) => onFeeItemInputChange("name", e.target.value)}
                placeholder="例如：学费、餐费"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-type">收费类型</Label>
              <Select value={newFeeItem.type} onValueChange={(value) => onFeeItemInputChange("type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择收费类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">按月收费</SelectItem>
                  <SelectItem value="one-time">一次性收费</SelectItem>
                  <SelectItem value="semester">学期收费</SelectItem>
                  <SelectItem value="annual">年度收费</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-status">状态</Label>
              <Select value={newFeeItem.status} onValueChange={(value) => onFeeItemInputChange("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">启用</SelectItem>
                  <SelectItem value="inactive">停用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="edit-description">项目描述</Label>
            <Textarea
              id="edit-description"
              value={newFeeItem.description}
              onChange={(e) => onFeeItemInputChange("description", e.target.value)}
              placeholder="详细描述收费项目"
            />
          </div>

          <SubItemForm
            subItems={newFeeItem.subItems}
            onAddSubItem={onAddSubItem}
            onUpdateSubItem={onUpdateSubItem}
            onRemoveSubItem={onRemoveSubItem}
          />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={onUpdateFeeItem}>
            更新项目
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
