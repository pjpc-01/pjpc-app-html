import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { ToggleSwitch } from "./ToggleSwitch"

interface SubItem {
  id: number
  name: string
  amount: number
  description: string
  active: boolean
}

interface SubItemFormProps {
  subItems: SubItem[]
  onAddSubItem: () => void
  onUpdateSubItem: (index: number, field: string, value: string | number | boolean) => void
  onRemoveSubItem: (index: number) => void
}

export const SubItemForm = ({
  subItems,
  onAddSubItem,
  onUpdateSubItem,
  onRemoveSubItem
}: SubItemFormProps) => {
  return (
    <div>
      <Label>子项目</Label>
      <div className="space-y-3 mt-2">
        {subItems.map((subItem, index) => (
          <div key={subItem.id} className="border rounded-lg p-3 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">子项目 {index + 1}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveSubItem(index)}
                className="h-6 w-6 p-0 text-red-500"
              >
                ×
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">名称</Label>
                <Input
                  value={subItem.name}
                  onChange={(e) => onUpdateSubItem(index, "name", e.target.value)}
                  placeholder="子项目名称"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">金额</Label>
                <Input
                  type="number"
                  value={subItem.amount}
                  onChange={(e) => onUpdateSubItem(index, "amount", parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">描述</Label>
                <Input
                  value={subItem.description}
                  onChange={(e) => onUpdateSubItem(index, "description", e.target.value)}
                  placeholder="子项目描述"
                  className="h-8"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ToggleSwitch
                checked={subItem.active}
                onChange={() => onUpdateSubItem(index, "active", !subItem.active)}
              />
              <span className="text-xs text-gray-600">
                {subItem.active ? "启用" : "停用"}
              </span>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddSubItem}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          添加子项目
        </Button>
      </div>
    </div>
  )
}
