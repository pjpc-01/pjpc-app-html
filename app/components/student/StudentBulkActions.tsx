"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Trash2, Download, X, Users } from "lucide-react"
import { generateCSV, downloadCSV } from "./utils"
import { Student } from "@/types/student"

interface StudentBulkActionsProps {
  selectedCount: number
  onDelete: () => void
  onClearSelection: () => void
  selectedStudents?: Student[]
}

export default function StudentBulkActions({
  selectedCount,
  onDelete,
  onClearSelection,
  selectedStudents = []
}: StudentBulkActionsProps) {
  const handleExportSelected = () => {
    if (selectedStudents.length === 0) return
    
    const csvContent = generateCSV(selectedStudents)
    const filename = `selected_students_${new Date().toISOString().split('T')[0]}.csv`
    downloadCSV(csvContent, filename)
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">
                已选择 {selectedCount} 名学生
              </span>
            </div>
            
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {selectedCount} 项
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportSelected}
              disabled={selectedStudents.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              导出选中
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  批量删除
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认批量删除</AlertDialogTitle>
                  <AlertDialogDescription>
                    您确定要删除选中的 {selectedCount} 名学生吗？此操作无法撤销。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">
                    确认删除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
            >
              <X className="h-4 w-4 mr-2" />
              清除选择
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 