"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Eye, GraduationCap, MapPin, Phone, Mail, Users } from "lucide-react"
import { convertGradeToChinese } from "@/app/components/student/utils"
import { getStudentCenterName } from "@/lib/studentUtils"

interface Student {
  id: string
  student_name?: string
  name?: string
  student_id?: string
  standard?: string
  grade?: string
  center?: string
  centerId?: string
  status?: string
  father_name?: string
  mother_name?: string
  father_phone?: string
  mother_phone?: string
  email?: string
}

interface StudentGridViewProps {
  students: Student[]
  onView: (student: Student) => void
  onEdit: (student: Student) => void
}

export default function StudentGridView({ students, onView, onEdit }: StudentGridViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {students.map((student) => (
        <Card key={student.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{student.student_name || student.name}</h3>
                <p className="text-sm text-gray-500">{student.student_id}</p>
              </div>
              <Badge variant={student.status === "active" ? "default" : "secondary"}>
                {student.status === "active" ? "在读" : "离校"}
              </Badge>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <GraduationCap className="h-4 w-4 text-gray-400" />
                <span>{convertGradeToChinese(student.standard || student.grade || "")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{getStudentCenterName(student)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-gray-400" />
                <span>{student.father_name || student.mother_name || "-"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{student.father_phone || student.mother_phone || "-"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{student.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onView(student)}
              >
                <Eye className="h-4 w-4 mr-2" />
                查看
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(student)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
