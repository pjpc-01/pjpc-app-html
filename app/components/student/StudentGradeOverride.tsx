'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Edit, Save, X, Calendar, GraduationCap } from 'lucide-react'
import { toast } from 'sonner'

interface StudentGradeOverrideProps {
  student: {
    id: string
    student_name: string
    standard: string
    dob: string
    manual_grade_override?: string
    grade_override_reason?: string
  }
  onUpdate: (studentId: string, updates: any) => Promise<void>
}

const GRADE_OPTIONS = [
  { value: '一年级', label: '一年级' },
  { value: '二年级', label: '二年级' },
  { value: '三年级', label: '三年级' },
  { value: '四年级', label: '四年级' },
  { value: '五年级', label: '五年级' },
  { value: '六年级', label: '六年级' },
  { value: '初一', label: '初一' },
  { value: '初二', label: '初二' },
  { value: '初三', label: '初三' },
  { value: '高一', label: '高一' },
  { value: '高二', label: '高二' },
  { value: '高三', label: '高三' }
]

export default function StudentGradeOverride({ student, onUpdate }: StudentGradeOverrideProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [manualGrade, setManualGrade] = useState(student.manual_grade_override || '')
  const [overrideReason, setOverrideReason] = useState(student.grade_override_reason || '')
  const [isLoading, setIsLoading] = useState(false)

  // 计算基于出生日期的年级
  const calculateGradeFromDOB = (dob: string) => {
    if (!dob) return '未知年级'
    
    const birthYear = parseInt(dob.match(/(\d{4})/)?.[1] || '')
    if (!birthYear) return '未知年级'
    
    const currentYear = new Date().getFullYear()
    const age = currentYear - birthYear
    
    if (age === 6) return '一年级'
    if (age === 7) return '二年级'
    if (age === 8) return '三年级'
    if (age === 9) return '四年级'
    if (age === 10) return '五年级'
    if (age === 11) return '六年级'
    if (age === 12) return '初一'
    if (age === 13) return '初二'
    if (age === 14) return '初三'
    if (age === 15) return '高一'
    if (age === 16) return '高二'
    if (age === 17) return '高三'
    
    return '未知年级'
  }

  const calculatedGrade = calculateGradeFromDOB(student.dob)
  const hasOverride = !!student.manual_grade_override

  const handleSave = async () => {
    if (!manualGrade.trim()) {
      toast.error('请选择年级')
      return
    }

    setIsLoading(true)
    try {
      await onUpdate(student.id, {
        standard: manualGrade,
        manual_grade_override: manualGrade,
        grade_override_reason: overrideReason
      })
      
      toast.success('年级调整已保存')
      setIsEditing(false)
    } catch (error) {
      toast.error('保存失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setManualGrade(student.manual_grade_override || '')
    setOverrideReason(student.grade_override_reason || '')
    setIsEditing(false)
  }

  const handleRemoveOverride = async () => {
    setIsLoading(true)
    try {
      await onUpdate(student.id, {
        standard: calculatedGrade,
        manual_grade_override: '',
        grade_override_reason: ''
      })
      
      toast.success('已恢复自动计算的年级')
      setManualGrade('')
      setOverrideReason('')
    } catch (error) {
      toast.error('操作失败')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          年级管理
        </CardTitle>
        <CardDescription>
          查看和调整学生年级分配
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 当前年级显示 */}
        <div className="space-y-2">
          <Label>当前年级</Label>
          <div className="flex items-center gap-2">
            <Badge variant={hasOverride ? "destructive" : "default"}>
              {student.standard}
            </Badge>
            {hasOverride && (
              <Badge variant="outline" className="text-xs">
                手动调整
              </Badge>
            )}
          </div>
        </div>

        {/* 自动计算的年级 */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            基于出生日期计算的年级
          </Label>
          <div className="text-sm text-muted-foreground">
            {student.dob ? (
              <span>出生日期: {student.dob} → {calculatedGrade}</span>
            ) : (
              <span>无出生日期信息</span>
            )}
          </div>
        </div>

        {/* 手动调整区域 */}
        {isEditing ? (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <Label>手动设置年级</Label>
              <Select value={manualGrade} onValueChange={setManualGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="选择年级" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_OPTIONS.map((grade) => (
                    <SelectItem key={grade.value} value={grade.value}>
                      {grade.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>调整原因（可选）</Label>
              <Textarea
                placeholder="例如：越级、降级、特殊情况等"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleSave} 
                disabled={isLoading}
                size="sm"
              >
                <Save className="h-4 w-4 mr-1" />
                保存
              </Button>
              <Button 
                onClick={handleCancel} 
                variant="outline" 
                size="sm"
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-1" />
                取消
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsEditing(true)} 
              variant="outline" 
              size="sm"
            >
              <Edit className="h-4 w-4 mr-1" />
              调整年级
            </Button>
            {hasOverride && (
              <Button 
                onClick={handleRemoveOverride} 
                variant="outline" 
                size="sm"
                disabled={isLoading}
              >
                恢复自动计算
              </Button>
            )}
          </div>
        )}

        {/* 显示调整原因 */}
        {student.grade_override_reason && (
          <div className="space-y-2">
            <Label>调整原因</Label>
            <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
              {student.grade_override_reason}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
