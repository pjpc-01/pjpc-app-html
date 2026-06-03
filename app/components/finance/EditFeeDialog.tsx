import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Fee } from "@/types/fees"

interface EditFeeDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  newFeeItem: Omit<Fee, "id">
  onFeeItemInputChange: (field: keyof Omit<Fee, "id">, value: any) => void
  onUpdateFeeItem: () => void
}

export const EditFeeDialog = ({
  isOpen,
  onOpenChange,
  newFeeItem,
  onFeeItemInputChange,
  onUpdateFeeItem,
}: EditFeeDialogProps) => {
  const handleCenterToggle = (center: string) => {
    const currentCenters = newFeeItem.applicableCenters || []
    const newCenters = currentCenters.includes(center)
      ? currentCenters.filter(c => c !== center)
      : [...currentCenters, center]
    onFeeItemInputChange("applicableCenters", newCenters)
  }

  const handleLevelToggle = (level: string) => {
    const currentLevels = newFeeItem.applicableLevels || []
    const newLevels = currentLevels.includes(level)
      ? currentLevels.filter(l => l !== level)
      : [...currentLevels, level]
    onFeeItemInputChange("applicableLevels", newLevels)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑费用项</DialogTitle>
          <DialogDescription>更新费用项信息</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-name">项目名称</Label>
            <Input
              id="edit-name"
              value={newFeeItem.name}
              onChange={(e) => onFeeItemInputChange("name", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="edit-category">分类</Label>
            <Select value={newFeeItem.category} onValueChange={(v) => onFeeItemInputChange("category", v)}>
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="education">教育</SelectItem>
                <SelectItem value="material">教材/材料</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-type">费用类型</Label>
              <Select value={newFeeItem.type} onValueChange={(v) => onFeeItemInputChange("type", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">月费</SelectItem>
                  <SelectItem value="one-time">一次性费用</SelectItem>
                  <SelectItem value="annual">年费</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-status">状态</Label>
              <Select value={newFeeItem.status} onValueChange={(v) => onFeeItemInputChange("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">启用</SelectItem>
                  <SelectItem value="inactive">禁用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="edit-amount">金额</Label>
            <Input
              id="edit-amount"
              type="number"
              value={newFeeItem.amount}
              onChange={(e) => onFeeItemInputChange("amount", Number(e.target.value))}
            />
          </div>

          <div>
            <Label htmlFor="edit-description">描述</Label>
            <Textarea
              id="edit-description"
              value={newFeeItem.description}
              onChange={(e) => onFeeItemInputChange("description", e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label>适用中心</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {["WX 01", "WX 02", "WX 03", "WX 04"].map((center) => (
                <div key={center} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-center-${center}`}
                    checked={(newFeeItem.applicableCenters || []).includes(center)}
                    onCheckedChange={() => handleCenterToggle(center)}
                  />
                  <Label htmlFor={`edit-center-${center}`} className="text-sm font-normal">
                    {center}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>适用年级</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {["Primary", "Secondary"].map((level) => (
                <div key={level} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-level-${level}`}
                    checked={(newFeeItem.applicableLevels || []).includes(level)}
                    onCheckedChange={() => handleLevelToggle(level)}
                  />
                  <Label htmlFor={`edit-level-${level}`} className="text-sm font-normal">
                    {level === "Primary" ? "小学" : "中学"}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={onUpdateFeeItem}>更新</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
