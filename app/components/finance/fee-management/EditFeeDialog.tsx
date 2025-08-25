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
import { Plus, Edit } from "lucide-react"
import { Fee } from "@/types/fees"
import { useState } from "react"

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
  const [isCategoryEditing, setIsCategoryEditing] = useState(false)
  const [customCategory, setCustomCategory] = useState("")
  const [isEditingExisting, setIsEditingExisting] = useState(false)
  
  // Default categories
  const defaultCategories = ["education", "material"]
  
  const handleCategoryChange = (category: string) => {
    onFeeItemInputChange("category", category)
    setIsCategoryEditing(false)
    setCustomCategory("")
  }

  const handleCustomCategorySubmit = () => {
    if (customCategory.trim()) {
      onFeeItemInputChange("category", customCategory.trim())
      setIsCategoryEditing(false)
      setIsEditingExisting(false)
      setCustomCategory("")
    }
  }

  const handleEditExistingCategory = () => {
    setIsEditingExisting(true)
    setCustomCategory(newFeeItem.category || "")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑收费项目</DialogTitle>
          <DialogDescription>修改收费项目信息</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 项目名称 */}
          <div>
            <Label htmlFor="edit-name">项目名称</Label>
            <Input
              id="edit-name"
              value={newFeeItem.name || ""}
              onChange={(e) => onFeeItemInputChange("name", e.target.value)}
            />
          </div>

          {/* 分类 */}
          <div>
            <Label htmlFor="edit-category">分类</Label>
            {(isCategoryEditing || isEditingExisting) ? (
              <div className="flex gap-2">
                <Input
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder={isEditingExisting ? "编辑分类名称" : "输入新分类名称"}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCustomCategorySubmit()
                    } else if (e.key === 'Escape') {
                      setIsCategoryEditing(false)
                      setIsEditingExisting(false)
                      setCustomCategory("")
                    }
                  }}
                />
                <Button 
                  size="sm" 
                  onClick={handleCustomCategorySubmit}
                  disabled={!customCategory.trim()}
                >
                  {isEditingExisting ? "更新" : "添加"}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setIsCategoryEditing(false)
                    setIsEditingExisting(false)
                    setCustomCategory("")
                  }}
                >
                  取消
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Select 
                  value={newFeeItem.category || ""} 
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category === "education" ? "教育" : "材料"}
                      </SelectItem>
                    ))}
                    {newFeeItem.category && 
                     !defaultCategories.includes(newFeeItem.category) && (
                      <SelectItem value={newFeeItem.category}>
                        {newFeeItem.category}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setIsCategoryEditing(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                {newFeeItem.category && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleEditExistingCategory}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* 收费频率 + 状态 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-frequency">收费频率</Label>
              <Select value={newFeeItem.frequency || "recurring"} onValueChange={(v) => onFeeItemInputChange("frequency", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recurring">定期收费</SelectItem>
                  <SelectItem value="one-time">一次性收费</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-status">状态</Label>
              <Select value={newFeeItem.status || "active"} onValueChange={(v) => onFeeItemInputChange("status", v)}>
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

          {/* 金额 */}
          <div>
            <Label htmlFor="edit-amount">金额</Label>
            <Input
              id="edit-amount"
              type="number"
              value={newFeeItem.amount || 0}
              onChange={(e) => onFeeItemInputChange("amount", Number(e.target.value))}
            />
          </div>

          {/* 描述 */}
          <div>
            <Label htmlFor="edit-description">描述</Label>
            <Textarea
              id="edit-description"
              value={newFeeItem.description || ""}
              onChange={(e) => onFeeItemInputChange("description", e.target.value)}
              rows={3}
            />
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
