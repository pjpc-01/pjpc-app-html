"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Badge } from '../../../../components/ui/badge'
import { Search } from 'lucide-react'
import { Input } from '../../../../components/ui/input'
import { StudentWithFees } from '../../../../hooks/useInvoiceData'

interface StudentSelectorProps {
  students: StudentWithFees[]
  onSelectStudent: (student: StudentWithFees) => void
  loading?: boolean
}

export function StudentSelector({ students, onSelectStudent, loading }: StudentSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')

  console.log('🔄 StudentSelector: Received students:', {
    totalStudents: students.length,
    studentsWithFeeMatrix: students.filter(s => s.fee_matrix).length,
    studentsWithoutFeeMatrix: students.filter(s => !s.fee_matrix).length,
    sampleStudent: students[0] ? {
      id: students[0].id,
      name: students[0].student_name,
      hasFeeMatrix: !!students[0].fee_matrix,
      feeMatrixData: students[0].fee_matrix
    } : 'no students'
  })

  // Filter students by search term
  const filteredStudents = students.filter(student =>
    student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.standard.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Filter students who have fee matrices
  const studentsWithFees = filteredStudents.filter(student => student.fee_matrix)

  console.log('📊 StudentSelector: Filtered students:', {
    afterSearchFilter: filteredStudents.length,
    afterFeeMatrixFilter: studentsWithFees.length
  })

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select Student</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading students...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Student to Create Invoice</CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search students by name or grade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {studentsWithFees.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">
              {searchTerm ? 'No students found matching your search.' : 'No students with fee matrices found.'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Total students: {students.length} | Students with fee matrices: {students.filter(s => s.fee_matrix).length}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {studentsWithFees.map((student) => (
              <Card key={student.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{student.student_name}</h3>
                      <p className="text-gray-600">Grade: {student.standard}</p>
                      {student.fee_matrix && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">
                            Total Amount: <span className="font-semibold text-green-600">
                              RM {student.fee_matrix.subtotal_amount.toFixed(2)}
                            </span>
                          </p>
                          {student.fee_matrix.fee_items && student.fee_matrix.fee_items.length > 0 && (
                            <div className="mt-1">
                              <p className="text-xs text-gray-500">Fee Items:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {student.fee_matrix.fee_items.map((item) => (
                                  <Badge key={item.id} variant="outline" className="text-xs">
                                    {item.name}: RM {item.amount}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => onSelectStudent(student)}
                      className="ml-4"
                    >
                      Create Invoice
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
