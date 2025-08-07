import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Trash2, DollarSign } from "lucide-react"
import { ToggleSwitch } from "./ToggleSwitch"

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

interface FeeTableProps {
  feeItems: FeeItem[]
  isFeeEditMode: boolean
  expandedItems: number[]
  onToggleExpanded: (itemId: number) => void
  onToggleSubItemActive: (itemId: number, subItemId: number) => void
  onEditFeeItem: (feeItem: FeeItem) => void
  onDeleteFeeItem: (feeItemId: number) => void
  onFeeEditMode: () => void
  calculateTotalAmount: (subItems: SubItem[]) => number
}

export const FeeTable = ({
  feeItems,
  isFeeEditMode,
  expandedItems,
  onToggleExpanded,
  onToggleSubItemActive,
  onEditFeeItem,
  onDeleteFeeItem,
  onFeeEditMode,
  calculateTotalAmount
}: FeeTableProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              收费项目管理
            </CardTitle>
            <CardDescription>管理所有收费项目</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onFeeEditMode}>
              <Edit className="h-4 w-4 mr-2" />
              {isFeeEditMode ? "完成编辑" : "编辑"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>分类</TableHead>
              <TableHead>总金额</TableHead>
              <TableHead>收费类型</TableHead>
              {isFeeEditMode && <TableHead>操作</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {feeItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  <div className="space-y-2">
                    <div 
                      className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                      onClick={() => onToggleExpanded(item.id)}
                    >
                      <span>{item.category}</span>
                    </div>
                    {expandedItems.includes(item.id) && (
                      <div className="pl-8 space-y-2">
                        {item.subItems.map((subItem) => (
                          <div key={subItem.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border-l-2 border-blue-200">
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-medium min-w-[120px]">{subItem.name}</span>
                              <ToggleSwitch
                                checked={subItem.active}
                                onChange={() => onToggleSubItemActive(item.id, subItem.id)}
                              />
                            </div>
                            <span className="text-sm font-medium text-blue-600">¥{subItem.amount}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">¥{calculateTotalAmount(item.subItems)}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {item.type === "monthly" ? "按月收费" : 
                     item.type === "one-time" ? "一次性收费" :
                     item.type === "semester" ? "学期收费" : "年度收费"}
                  </Badge>
                </TableCell>
                {isFeeEditMode && (
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditFeeItem(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteFeeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
