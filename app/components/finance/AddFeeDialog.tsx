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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { Fee } from "@/types/fees"

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
  onAddFeeItem,
}: AddFeeDialogProps) => {
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
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          新增费用项
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新增费用项</DialogTitle>
          <DialogDescription>创建一个新的费用项</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">项目名称</Label>
            <Input
              id="name"
              value={newFeeItem.name}
              onChange={(e) => onFeeItemInputChange("name", e.target.value)}
              placeholder="例如：学费, 教材费"
            />
          </div>

          <div>
            <Label htmlFor="category">分类</Label>
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

          <div>
            <Label htmlFor="type">费用类型</Label>
            <Select value={newFeeItem.type} onValueChange={(v) => onFeeItemInputChange("type", v)}>
              <SelectTrigger>
                <SelectValue placeholder="选择费用类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">月费</SelectItem>
                <SelectItem value="one-time">一次性费用</SelectItem>
                <SelectItem value="annual">年费</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="amount">金额</Label>
            <Input
              id="amount"
              type="number"
              value={newFeeItem.amount}
              onChange={(e) => onFeeItemInputChange("amount", Number(e.target.value))}
              placeholder="0"
            />
          </div>

          <div>
            <Label htmlFor="description">项目描述</Label>
            <Textarea
              id="description"
              value={newFeeItem.description}
              onChange={(e) => onFeeItemInputChange("description", e.target.value)}
              placeholder="简要描述该费用项"
            />
          </div>

          <div>
            <Label>适用中心</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {["WX 01", "WX 02", "WX 03", "WX 04"].map((center) => (
                <div key={center} className="flex items-center space-x-2">
                  <Checkbox
                    id={`center-${center}`}
                    checked={(newFeeItem.applicableCenters || []).includes(center)}
                    onCheckedChange={() => handleCenterToggle(center)}
                  />
                  <Label htmlFor={`center-${center}`} className="text-sm font-normal">
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
                    id={`level-${level}`}
                    checked={(newFeeItem.applicableLevels || []).includes(level)}
                    onCheckedChange={() => handleLevelToggle(level)}
                  />
                  <Label htmlFor={`level-${level}`} className="text-sm font-normal">
                    {level === "Primary" ? "小学" : "中学"}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="status">状态</Label>
            <Select value={newFeeItem.status} onValueChange={(v) => onFeeItemInputChange("status", v)}>
              <SelectTrigger>
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">启用</SelectItem>
                <SelectItem value="inactive">禁用</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={onAddFeeItem}>新增项目</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
