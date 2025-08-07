import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Users, Edit3, Filter, Settings } from "lucide-react"

interface StudentFeeMatrixHeaderProps {
  editMode: boolean
  onToggleEditMode: () => void
  batchDialogOpen: boolean
  onBatchDialogOpenChange: (open: boolean) => void
}

export const StudentFeeMatrixHeader = ({
  editMode,
  onToggleEditMode,
  batchDialogOpen,
  onBatchDialogOpenChange
}: StudentFeeMatrixHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          学生费用分配
        </h2>
        <p className="text-gray-600 text-sm">为每位学生选择适用的收费项目</p>
      </div>
      <div className="flex gap-2">
        <Button 
          variant={editMode ? "default" : "outline"}
          size="sm" 
          onClick={onToggleEditMode}
          className="flex items-center gap-2"
        >
          <Edit3 className="h-4 w-4" />
          {editMode ? "退出编辑" : "编辑"}
        </Button>
        
        <Dialog open={batchDialogOpen} onOpenChange={onBatchDialogOpenChange}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              disabled={!editMode}
            >
              <Filter className="h-4 w-4" />
              批量操作
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                批量操作设置
              </DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
