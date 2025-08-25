import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ToggleSwitch } from "@/components/ui/ToggleSwitch"
import { Edit, Trash2, DollarSign, Plus } from "lucide-react"
import { Fee } from "@/types/fees"

interface FeeTableProps {
  feeItems: Fee[]
  onEditFeeItem: (feeItem: Fee) => void
  onDeleteFeeItem: (feeItemId: string) => void
  onToggleItemActive: (feeId: string, active: boolean) => void
  isFeeEditMode: boolean
  onFeeEditMode: () => void
  onAddFeeItem?: () => void
}

export const FeeTable = ({
  feeItems,
  onEditFeeItem,
  onDeleteFeeItem,
  onToggleItemActive,
  isFeeEditMode,
  onFeeEditMode,
  onAddFeeItem
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
            {onAddFeeItem && (
              <Button onClick={onAddFeeItem}>
                <Plus className="h-4 w-4 mr-2" />
                添加收费项目
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>项目名称</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>金额</TableHead>
              <TableHead>收费频率</TableHead>
              <TableHead>状态</TableHead>
              {isFeeEditMode && <TableHead>操作</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {feeItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isFeeEditMode ? 6 : 5} className="text-center text-gray-500 py-8">
                  暂无收费项目
                </TableCell>
              </TableRow>
            ) : (
              feeItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.name}</div>
                    {item.description && (
                      <div className="text-sm text-gray-500">{item.description}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">RM {item.amount}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {item.frequency === 'recurring' ? '定期收费' : item.frequency === 'one-time' ? '一次性收费' : '未设置'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ToggleSwitch
                        checked={item.status === 'active'}
                        onChange={() => onToggleItemActive(item.id, item.status !== 'active')}
                        size="sm"
                      />
                      <span className="text-sm text-gray-600">
                        {item.status === 'active' ? '已启用' : '已停用'}
                      </span>
                    </div>
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
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}