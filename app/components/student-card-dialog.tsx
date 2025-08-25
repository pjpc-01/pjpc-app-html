"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Globe,
  Zap,
  ExternalLink,
  AlertTriangle,
} from "lucide-react"
import { Student } from "@/lib/pocketbase-students"

interface StudentCardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student?: Student | null
  onSave: (data: any) => Promise<void>
  loading?: boolean
}

export function StudentCardDialog({ 
  open, 
  onOpenChange, 
  student, 
  onSave, 
  loading = false 
}: StudentCardDialogProps) {
  const [formData, setFormData] = useState({
    studentId: '',
    center: 'WX 01',
    grade: '',
    studentName: '',
    cardNumber: '',
    cardType: 'NFC' as 'NFC' | 'RFID',
    studentUrl: '',
    balance: 0,
    status: 'active' as 'active' | 'inactive' | 'lost' | 'graduated',
    issuedDate: '',
    expiryDate: '',
    enrollmentDate: '',
    phone: '',
    email: '',
    parentName: '',
    parentPhone: '',
    address: '',
    emergencyContact: '',
    medicalInfo: '',
    notes: ''
  })

  // 当学生数据变化时更新表单
  useEffect(() => {
    if (student) {
      setFormData({
        studentId: student.studentId || '',
        center: student.center || 'WX 01',
        grade: student.grade || '',
        studentName: student.studentName || '',
        cardNumber: student.cardNumber || '',
        cardType: student.cardType || 'NFC',
        studentUrl: student.studentUrl || '',
        balance: student.balance || 0,
        status: student.status || 'active',
        issuedDate: student.issuedDate || '',
        expiryDate: student.expiryDate || '',
        enrollmentDate: student.enrollmentDate || '',
        phone: student.phone || '',
        email: student.email || '',
        parentName: student.parentName || '',
        parentPhone: student.parentPhone || '',
        address: student.address || '',
        emergencyContact: student.emergencyContact || '',
        medicalInfo: student.medicalInfo || '',
        notes: student.notes || ''
      })
    } else {
      // 重置表单
      setFormData({
        studentId: '',
        center: 'WX 01',
        grade: '',
        studentName: '',
        cardNumber: '',
        cardType: 'NFC',
        studentUrl: '',
        balance: 0,
        status: 'active',
        issuedDate: '',
        expiryDate: '',
        enrollmentDate: '',
        phone: '',
        email: '',
        parentName: '',
        parentPhone: '',
        address: '',
        emergencyContact: '',
        medicalInfo: '',
        notes: ''
      })
    }
  }, [student])

  // 自动生成网址
  const generateUrl = () => {
    if (formData.studentId) {
      const autoUrl = `https://school.com/student/${formData.studentId}`
      setFormData(prev => ({ ...prev, studentUrl: autoUrl }))
    }
  }

  // 测试链接
  const testUrl = () => {
    if (formData.studentUrl) {
      window.open(formData.studentUrl, '_blank')
    }
  }

  // 处理保存
  const handleSave = async () => {
    try {
      await onSave(formData)
      onOpenChange(false)
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {student ? '编辑学生卡片' : '添加学生卡片'}
          </DialogTitle>
          <DialogDescription>
            {student ? '修改学生卡片信息' : '创建新的学生卡片'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="studentId">学号 *</Label>
              <Input
                id="studentId"
                value={formData.studentId}
                onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value }))}
                placeholder="例如: B1, B2, B3..."
                disabled={!!student}
              />
            </div>
            
            <div>
              <Label htmlFor="center">中心 *</Label>
              <Select 
                value={formData.center} 
                onValueChange={(value: string) => 
                  setFormData(prev => ({ ...prev, center: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WX 01">WX 01</SelectItem>
                  <SelectItem value="WX 02">WX 02</SelectItem>
                  <SelectItem value="WX 03">WX 03</SelectItem>
                  <SelectItem value="WX 04">WX 04</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="grade">年级</Label>
              <Input
                id="grade"
                value={formData.grade}
                onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                placeholder="例如: 一年级, 二年级..."
              />
            </div>
            
            <div>
              <Label htmlFor="studentName">学生姓名 *</Label>
              <Input
                id="studentName"
                value={formData.studentName}
                onChange={(e) => setFormData(prev => ({ ...prev, studentName: e.target.value }))}
                placeholder="输入学生姓名"
              />
            </div>
          </div>

          {/* 卡片信息 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="cardNumber">卡号</Label>
              <Input
                id="cardNumber"
                value={formData.cardNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, cardNumber: e.target.value }))}
                placeholder="NFC/RFID卡号"
              />
            </div>
            
            <div>
              <Label htmlFor="cardType">卡片类型</Label>
              <Select 
                value={formData.cardType} 
                onValueChange={(value: 'NFC' | 'RFID') => 
                  setFormData(prev => ({ ...prev, cardType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NFC">NFC</SelectItem>
                  <SelectItem value="RFID">RFID</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status">状态</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: 'active' | 'inactive' | 'lost' | 'graduated') => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">活跃</SelectItem>
                  <SelectItem value="inactive">停用</SelectItem>
                  <SelectItem value="lost">丢失</SelectItem>
                  <SelectItem value="graduated">毕业</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 学生专属网址 - 突出显示 */}
          <div className="border-2 border-blue-200 bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-5 w-5 text-blue-600" />
              <Label htmlFor="studentUrl" className="text-blue-800 font-semibold">
                学生专属网址 *
              </Label>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                重要
              </span>
            </div>
            <div className="space-y-2">
              <Input
                id="studentUrl"
                type="url"
                value={formData.studentUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, studentUrl: e.target.value }))}
                placeholder="https://docs.google.com/forms/d/e/..."
                className="border-blue-300 focus:border-blue-500"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateUrl}
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  自动生成
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={testUrl}
                  disabled={!formData.studentUrl}
                  className="text-green-600 border-green-300 hover:bg-green-50"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  测试链接
                </Button>
              </div>
              <p className="text-xs text-blue-600">
                每个学生都有专属的网址，用于访问个人信息和相关资源
              </p>
            </div>
          </div>

          {/* 财务信息 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="balance">余额</Label>
              <Input
                id="balance"
                type="number"
                value={formData.balance}
                onChange={(e) => setFormData(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Label htmlFor="issuedDate">发卡日期</Label>
              <Input
                id="issuedDate"
                type="date"
                value={formData.issuedDate}
                onChange={(e) => setFormData(prev => ({ ...prev, issuedDate: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="expiryDate">到期日期</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
              />
            </div>
          </div>

          {/* 联系信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">学生电话</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="学生联系电话"
              />
            </div>
            
            <div>
              <Label htmlFor="email">学生邮箱</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="学生邮箱地址"
              />
            </div>
            
            <div>
              <Label htmlFor="parentName">家长姓名</Label>
              <Input
                id="parentName"
                value={formData.parentName}
                onChange={(e) => setFormData(prev => ({ ...prev, parentName: e.target.value }))}
                placeholder="家长姓名"
              />
            </div>
            
            <div>
              <Label htmlFor="parentPhone">家长电话</Label>
              <Input
                id="parentPhone"
                value={formData.parentPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, parentPhone: e.target.value }))}
                placeholder="家长联系电话"
              />
            </div>
          </div>

          {/* 其他信息 */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="address">地址</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="家庭地址"
              />
            </div>
            
            <div>
              <Label htmlFor="emergencyContact">紧急联系人</Label>
              <Input
                id="emergencyContact"
                value={formData.emergencyContact}
                onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                placeholder="紧急联系人信息"
              />
            </div>
            
            <div>
              <Label htmlFor="medicalInfo">医疗信息</Label>
              <Textarea
                id="medicalInfo"
                value={formData.medicalInfo}
                onChange={(e) => setFormData(prev => ({ ...prev, medicalInfo: e.target.value }))}
                placeholder="过敏史、特殊医疗需求等"
                rows={2}
              />
            </div>
            
            <div>
              <Label htmlFor="notes">备注</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="其他重要信息"
                rows={2}
              />
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button 
              onClick={handleSave}
              disabled={loading || !formData.studentId || !formData.studentName || !formData.studentUrl}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  保存中...
                </>
              ) : (
                <>
                  {student ? "更新" : "添加"}
                </>
              )}
            </Button>
          </div>

          {/* 必填字段提示 */}
          {(!formData.studentId || !formData.studentName || !formData.studentUrl) && (
            <div className="flex items-center gap-2 text-orange-600 text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>请填写所有必填字段（学号、学生姓名、专属网址）</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
