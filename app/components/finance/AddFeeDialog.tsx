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
import { Plus, Tag, CreditCard, FileText, MapPin, GraduationCap, Activity, DollarSign, BookOpen, Package, CalendarDays, Utensils, Bus, FolderOpen, School, ClipboardList, Receipt, Banknote, ScrollText, Library } from "lucide-react"
import { Fee } from "@/types/fees"

const ICON_OPTIONS: { value: string; label: string; icon: React.ReactNode }[] = [
  { value: "GraduationCap", label: "教育/学费", icon: <GraduationCap className="h-4 w-4" /> },
  { value: "BookOpen", label: "教材/书本", icon: <BookOpen className="h-4 w-4" /> },
  { value: "Package", label: "杂费/用品", icon: <Package className="h-4 w-4" /> },
  { value: "CalendarDays", label: "活动/日程", icon: <CalendarDays className="h-4 w-4" /> },
  { value: "Utensils", label: "餐饮", icon: <Utensils className="h-4 w-4" /> },
  { value: "Bus", label: "交通", icon: <Bus className="h-4 w-4" /> },
  { value: "ClipboardList", label: "行政/注册", icon: <ClipboardList className="h-4 w-4" /> },
  { value: "Receipt", label: "账单/收据", icon: <Receipt className="h-4 w-4" /> },
  { value: "Banknote", label: "货币/金额", icon: <Banknote className="h-4 w-4" /> },
  { value: "ScrollText", label: "文档/资料", icon: <ScrollText className="h-4 w-4" /> },
  { value: "School", label: "学校/设施", icon: <School className="h-4 w-4" /> },
  { value: "Library", label: "图书/资源", icon: <Library className="h-4 w-4" /> },
  { value: "FolderOpen", label: "其他/未分类", icon: <FolderOpen className="h-4 w-4" /> },
]

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
  const isFormValid = newFeeItem.name.trim() !== "" && newFeeItem.amount > 0

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
        <Button className="flex items-center gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          新增费用项
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl overflow-hidden">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-xl">新增费用项</DialogTitle>
          </div>
          <DialogDescription>
            设置新的费用项，包括金额、适用范围及收取周期。
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                项目名称
              </Label>
              <Input
                id="name"
                className="focus-visible:ring-primary"
                value={newFeeItem.name}
                onChange={(e) => onFeeItemInputChange("name", e.target.value)}
                placeholder="例如：月度学费"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                费用分类
              </Label>
              <Select value={newFeeItem.category} onValueChange={(v) => onFeeItemInputChange("category", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="education">教育/学费</SelectItem>
                  <SelectItem value="material">教材/材料费</SelectItem>
                  <SelectItem value="admin">行政/注册费</SelectItem>
                  <SelectItem value="misc">其他杂项</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon" className="text-sm font-semibold flex items-center gap-2">
                <Package className="h-3.5 w-3.5 text-muted-foreground" />
                分类图标
              </Label>
              <Select value={newFeeItem.icon || ""} onValueChange={(v) => onFeeItemInputChange("icon", v || undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择分类图标" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">无图标</SelectItem>
                  {ICON_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-2">{opt.icon}{opt.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-semibold flex items-center gap-2">
                <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                收取类型
              </Label>
              <Select value={newFeeItem.type} onValueChange={(v) => onFeeItemInputChange("type", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择收取类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">月费 (Monthly)</SelectItem>
                  <SelectItem value="one-time">一次性费用 (One-time)</SelectItem>
                  <SelectItem value="annual">年费 (Annual)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-semibold flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                费用金额 (RM)
              </Label>
              <Input
                id="amount"
                type="number"
                className="font-mono"
                value={newFeeItem.amount}
                onChange={(e) => onFeeItemInputChange("amount", Number(e.target.value))}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                适用中心
              </Label>
              <div className="grid grid-cols-2 gap-3 p-3 border rounded-md bg-slate-50/50">
                {["WX 01", "WX 02", "WX 03", "WX 04"].map((center) => (
                  <div key={center} className="flex items-center space-x-2">
                    <Checkbox
                      id={`center-${center}`}
                      checked={(newFeeItem.applicableCenters || []).includes(center)}
                      onCheckedChange={() => handleCenterToggle(center)}
                    />
                    <Label htmlFor={`center-${center}`} className="text-xs font-normal cursor-pointer">
                      {center}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                适用年级
              </Label>
              <div className="grid grid-cols-2 gap-3 p-3 border rounded-md bg-slate-50/50">
                {["Primary", "Secondary"].map((level) => (
                  <div key={level} className="flex items-center space-x-2">
                    <Checkbox
                      id={`level-${level}`}
                      checked={(newFeeItem.applicableLevels || []).includes(level)}
                      onCheckedChange={() => handleLevelToggle(level)}
                    />
                    <Label htmlFor={`level-${level}`} className="text-xs font-normal cursor-pointer">
                      {level === "Primary" ? "小学" : "中学"}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                状态
              </Label>
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
        </div>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              备注描述
            </Label>
            <Textarea
              id="description"
              className="resize-none"
              rows={3}
              value={newFeeItem.description}
              onChange={(e) => onFeeItemInputChange("description", e.target.value)}
              placeholder="输入该项费用的详细说明..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button 
              onClick={onAddFeeItem} 
              disabled={!isFormValid}
              className="px-8"
            >
              确认新增
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
