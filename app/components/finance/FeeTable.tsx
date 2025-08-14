import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Trash2, DollarSign, ChevronDown, ChevronRight } from "lucide-react"
import { Fragment } from "react"


interface FeeItem {
  id: string
  name: string
  amount: number
  type: 'monthly' | 'one-time' | 'annual'
  description: string
  applicableGrades: string[]
  status: 'active' | 'inactive'
  category: string
}

interface FeeTableProps {
  // Grouped by category: { [category]: FeeItem[] }
  groupedByCategory: Record<string, FeeItem[]>
  // Expanded categories map
  expandedCategories: Record<string, boolean>
  onToggleCategory: (category: string) => void
  // Item-level actions
  onEditFeeItem: (feeItem: FeeItem) => void
  onDeleteFeeItem: (feeItemId: string) => void
  onToggleItemActive: (feeId: string, active: boolean) => void
  // Toolbar
  isFeeEditMode: boolean
  onFeeEditMode: () => void
}

export const FeeTable = ({
  groupedByCategory,
  expandedCategories,
  onToggleCategory,
  onEditFeeItem,
  onDeleteFeeItem,
  onToggleItemActive,
  isFeeEditMode,
  onFeeEditMode
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
              <TableHead>分类 / 项目</TableHead>
              <TableHead>项目名称</TableHead>
              <TableHead>金额</TableHead>
              <TableHead>收费类型</TableHead>
              <TableHead>状态</TableHead>
              {isFeeEditMode && <TableHead>操作</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(groupedByCategory).map(([category, items]) => (
              <Fragment key={`cat-group-${category}`}>
                <TableRow key={`cat-${category}`} onClick={() => onToggleCategory(category)}>
                  <TableCell colSpan={6} className="font-medium cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {expandedCategories[category] ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                        {category || '未分类'}
                      </span>
                      <span className="text-xs text-gray-500">{items.length} 项</span>
                    </div>
                  </TableCell>
                </TableRow>
                {expandedCategories[category] && items.map((item, idx) => (
                  <TableRow key={`item-${category}-${item.id}-${idx}`}>
                    <TableCell />
                    <TableCell>
                      <div className="font-medium">{item.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">RM {item.amount}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {item.type === 'monthly' ? '按月收费' : item.type === 'one-time' ? '一次性收费' : '年度收费'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={item.status === 'active' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onToggleItemActive(item.id, item.status !== 'active')}
                      >
                        {item.status === 'active' ? '已启用' : '已停用'}
                      </Button>
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
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
