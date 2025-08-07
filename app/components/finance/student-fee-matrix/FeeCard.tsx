import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FeeItem } from "../../hooks/useFees"

interface FeeCardProps {
  fee: FeeItem
  isAssigned?: boolean
  onToggle?: () => void
  showAmount?: boolean
  isExpanded?: boolean
  calculateAmount?: () => number
}

export const FeeCard = ({ 
  fee, 
  isAssigned = false, 
  onToggle, 
  showAmount = true, 
  isExpanded = false,
  calculateAmount
}: FeeCardProps) => {
  // Use provided calculateAmount function or fall back to global active sub-items
  const activeAmount = calculateAmount ? calculateAmount() : fee.subItems
    .filter(subItem => subItem.active)
    .reduce((total, subItem) => total + subItem.amount, 0)

  return (
    <Card className="p-3 hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500">
      <div 
        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
        onClick={onToggle}
      >
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 text-sm">{fee.name}</h4>
          {showAmount && (
            <p className="text-sm text-gray-600 font-medium">RM {activeAmount}</p>
          )}
          <Badge variant="outline" className="text-xs mt-1">
            {fee.type === "monthly" ? "月费" : 
             fee.type === "one-time" ? "一次性" :
             fee.type === "semester" ? "学期" : "年费"}
          </Badge>
        </div>

      </div>
    </Card>
  )
} 