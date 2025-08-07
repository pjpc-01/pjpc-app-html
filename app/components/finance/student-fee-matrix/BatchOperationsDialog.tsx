import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface SubItem {
  id: number
  name: string
  amount: number
  description: string
  active: boolean
}

interface FeeItem {
  id: number
  name: string
  amount: number
  type: string
  description: string
  applicableGrades: string[]
  status: string
  category: string
  subItems: SubItem[]
}

interface BatchOperationsDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  categories: string[]
  activeFees: FeeItem[]
  availableGrades: string[]
  selectedCategories: string[]
  onCategoryToggle: (category: string) => void
  selectedSubItems: {feeId: number, subItemId: number}[]
  onSubItemToggle: (feeId: number, subItemId: number) => void
  isSubItemSelected: (feeId: number, subItemId: number) => boolean
  selectedCriteria: 'grade' | null
  onCriteriaToggle: (criteria: 'grade') => void
  selectedGrades: string[]
  onGradeToggle: (grade: string) => void
  onExecuteBatchToggle: (action: 'enable' | 'disable') => void
}

export const BatchOperationsDialog = ({
  isOpen,
  onOpenChange,
  categories,
  activeFees,
  availableGrades,
  selectedCategories,
  onCategoryToggle,
  selectedSubItems,
  onSubItemToggle,
  isSubItemSelected,
  selectedCriteria,
  onCriteriaToggle,
  selectedGrades,
  onGradeToggle,
  onExecuteBatchToggle
}: BatchOperationsDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            批量操作设置
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Category Selection */}
          <div>
            <Label className="text-sm font-medium">选择费用类别</Label>
            <div className="mt-2 space-y-2">
              {categories.map(category => (
                <div key={category}>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category}`}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={() => onCategoryToggle(category)}
                    />
                    <Label htmlFor={`category-${category}`} className="text-sm">
                      {category}
                    </Label>
                  </div>
                  
                  {/* Show sub-items when category is selected */}
                  {selectedCategories.includes(category) && (
                    <div className="ml-6 mt-2 space-y-1">
                      {activeFees
                        .filter(fee => fee.category === category)
                        .map(fee => 
                          fee.subItems.map(subItem => (
                            <div key={subItem.id} className="flex items-center justify-between text-xs">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`subitem-${fee.id}-${subItem.id}`}
                                  checked={isSubItemSelected(fee.id, subItem.id)}
                                  onCheckedChange={() => onSubItemToggle(fee.id, subItem.id)}
                                  className="h-3 w-3"
                                />
                                <span className="text-gray-600">{subItem.name}</span>
                              </div>
                              <span className="text-gray-600">RM {subItem.amount}</span>
                            </div>
                          ))
                        )
                      }
                    </div>
                  )}
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-sm text-gray-500">暂无可用的费用类别</p>
              )}
            </div>
          </div>

          {/* Criteria Selection */}
          <div>
            <Label className="text-sm font-medium">选择标准 (可选)</Label>
            <p className="text-xs text-gray-500 mb-2">留空则操作所有显示的学生</p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="criteria-grade"
                  checked={selectedCriteria === 'grade'}
                  onCheckedChange={() => onCriteriaToggle('grade')}
                />
                <Label htmlFor="criteria-grade" className="text-sm">
                  按年级分组
                </Label>
              </div>
             
              {/* Grade Selection - Only show when grade criteria is selected */}
              {selectedCriteria === 'grade' && (
                <div>
                  <Label className="text-sm font-medium">选择年级</Label>
                  <div className="mt-2 space-y-2">
                    {availableGrades.map(grade => (
                      <div key={grade} className="flex items-center space-x-2">
                        <Checkbox
                          id={`grade-${grade}`}
                          checked={selectedGrades.includes(grade)}
                          onCheckedChange={() => onGradeToggle(grade)}
                        />
                        <Label htmlFor={`grade-${grade}`} className="text-sm">
                          {grade}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExecuteBatchToggle('enable')}
              className="flex-1"
            >
              启用
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExecuteBatchToggle('disable')}
              className="flex-1"
            >
              关闭
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
