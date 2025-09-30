"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileImage,
  Calendar,
  Building2,
  Users,
  GraduationCap,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Settings,
  Eye
} from 'lucide-react'
import { format, subDays, subWeeks, subMonths, subYears } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface ReportExporterProps {
  onExport?: (reportData: any) => void
  className?: string
}

const REPORT_TYPES = {
  daily: '日报',
  weekly: '周报', 
  monthly: '月报',
  yearly: '年报',
  custom: '自定义'
} as const

const EXPORT_FORMATS = {
  pdf: 'PDF报告',
  excel: 'Excel表格',
  csv: 'CSV数据'
} as const

const CENTERS = [
  { value: 'all', label: '全部中心' },
  { value: 'WX 01', label: 'WX 01' },
  { value: 'WX 02', label: 'WX 02' },
  { value: 'WX 03', label: 'WX 03' }
]

export default function EnterpriseReportExporter({ onExport, className }: ReportExporterProps) {
  const [loading, setLoading] = useState(false)
  const [reportConfig, setReportConfig] = useState({
    reportType: 'daily' as keyof typeof REPORT_TYPES,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    center: 'all',
    includeStudents: true,
    includeTeachers: true,
    format: 'pdf' as keyof typeof EXPORT_FORMATS
  })

  const [previewData, setPreviewData] = useState<any>(null)

  // 处理报告类型变化
  const handleReportTypeChange = (type: keyof typeof REPORT_TYPES) => {
    const today = new Date()
    let startDate = format(today, 'yyyy-MM-dd')
    let endDate = format(today, 'yyyy-MM-dd')

    switch (type) {
      case 'daily':
        startDate = endDate = format(today, 'yyyy-MM-dd')
        break
      case 'weekly':
        startDate = format(subDays(today, 7), 'yyyy-MM-dd')
        endDate = format(today, 'yyyy-MM-dd')
        break
      case 'monthly':
        startDate = format(subMonths(today, 1), 'yyyy-MM-dd')
        endDate = format(today, 'yyyy-MM-dd')
        break
      case 'yearly':
        startDate = format(subYears(today, 1), 'yyyy-MM-dd')
        endDate = format(today, 'yyyy-MM-dd')
        break
    }

    setReportConfig(prev => ({
      ...prev,
      reportType: type,
      startDate,
      endDate
    }))
  }

  // 生成报告预览
  const generatePreview = async () => {
    try {
      setLoading(true)
      console.log('🔍 开始生成预览，配置:', reportConfig)
      
      const response = await fetch('/api/reports/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...reportConfig,
          format: 'csv' // 预览使用CSV格式
        })
      })

      console.log('🔍 API响应状态:', response.status)
      console.log('🔍 API响应头:', Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const csvData = await response.text()
        console.log('🔍 预览数据长度:', csvData.length)
        setPreviewData(csvData)
      } else {
        const errorText = await response.text()
        console.error('预览生成失败，状态:', response.status)
        console.error('错误详情:', errorText)
        alert(`预览生成失败: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('预览生成失败:', error)
      alert(`预览生成失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 导出报告
  const exportReport = async () => {
    try {
      setLoading(true)
      console.log('🔍 开始导出报告，配置:', reportConfig)
      
      const response = await fetch('/api/reports/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportConfig)
      })

      console.log('🔍 导出API响应状态:', response.status)
      console.log('🔍 导出API响应头:', Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const blob = await response.blob()
        console.log('🔍 导出文件大小:', blob.size, 'bytes')
        
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        
        // 从响应头获取文件名
        const contentDisposition = response.headers.get('Content-Disposition')
        const filename = contentDisposition 
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : `考勤报告_${format(new Date(), 'yyyyMMdd_HHmmss')}.${reportConfig.format}`
        
        console.log('🔍 导出文件名:', filename)
        
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        
        if (onExport) {
          onExport(reportConfig)
        }
      } else {
        const errorText = await response.text()
        console.error('报告导出失败，状态:', response.status)
        console.error('错误详情:', errorText)
        alert(`报告导出失败: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('报告导出失败:', error)
      alert(`报告导出失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 报告配置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            企业级报告配置
          </CardTitle>
          <CardDescription>
            生成专业的考勤管理报告，支持多种格式和自定义选项
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 报告类型 */}
            <div className="space-y-2">
              <Label htmlFor="reportType">报告类型</Label>
              <Select 
                value={reportConfig.reportType} 
                onValueChange={handleReportTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择报告类型" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REPORT_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 导出格式 */}
            <div className="space-y-2">
              <Label htmlFor="format">导出格式</Label>
              <Select 
                value={reportConfig.format} 
                onValueChange={(value) => setReportConfig(prev => ({ ...prev, format: value as keyof typeof EXPORT_FORMATS }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择导出格式" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EXPORT_FORMATS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        {key === 'pdf' && <FileText className="h-4 w-4" />}
                        {key === 'excel' && <FileSpreadsheet className="h-4 w-4" />}
                        {key === 'csv' && <FileImage className="h-4 w-4" />}
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 中心选择 */}
            <div className="space-y-2">
              <Label htmlFor="center">中心</Label>
              <Select 
                value={reportConfig.center} 
                onValueChange={(value) => setReportConfig(prev => ({ ...prev, center: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择中心" />
                </SelectTrigger>
                <SelectContent>
                  {CENTERS.map(center => (
                    <SelectItem key={center.value} value={center.value}>
                      {center.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 开始日期 */}
            <div className="space-y-2">
              <Label htmlFor="startDate">开始日期</Label>
              <Input
                id="startDate"
                type="date"
                value={reportConfig.startDate}
                onChange={(e) => setReportConfig(prev => ({ ...prev, startDate: e.target.value }))}
                disabled={reportConfig.reportType !== 'custom'}
              />
            </div>

            {/* 结束日期 */}
            <div className="space-y-2">
              <Label htmlFor="endDate">结束日期</Label>
              <Input
                id="endDate"
                type="date"
                value={reportConfig.endDate}
                onChange={(e) => setReportConfig(prev => ({ ...prev, endDate: e.target.value }))}
                disabled={reportConfig.reportType !== 'custom'}
              />
            </div>

            {/* 包含选项 */}
            <div className="space-y-3">
              <Label>包含数据</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeStudents"
                    checked={reportConfig.includeStudents}
                    onCheckedChange={(checked) => setReportConfig(prev => ({ ...prev, includeStudents: !!checked }))}
                  />
                  <Label htmlFor="includeStudents" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    学生考勤
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeTeachers"
                    checked={reportConfig.includeTeachers}
                    onCheckedChange={(checked) => setReportConfig(prev => ({ ...prev, includeTeachers: !!checked }))}
                  />
                  <Label htmlFor="includeTeachers" className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    教师考勤
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              onClick={generatePreview} 
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              预览报告
            </Button>
            
            <Button 
              onClick={exportReport} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              导出报告
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 报告预览 */}
      {previewData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              报告预览
            </CardTitle>
            <CardDescription>
              以下是报告的前1000个字符预览
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-auto">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {previewData.substring(0, 1000)}
                {previewData.length > 1000 && '\n\n... (报告内容已截断，完整内容请下载查看)'}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 企业级功能说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            企业级功能特色
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">专业PDF报告</h4>
                <p className="text-sm text-gray-600">包含企业标识、统计图表、详细分析的PDF报告</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Excel数据分析</h4>
                <p className="text-sm text-gray-600">支持数据透视表、图表分析的Excel文件</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">智能统计分析</h4>
                <p className="text-sm text-gray-600">自动计算出勤率、趋势分析、异常检测</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">时间分析</h4>
                <p className="text-sm text-gray-600">平均签到时间、迟到早退统计、工作时间分析</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">异常检测</h4>
                <p className="text-sm text-gray-600">自动识别异常考勤模式、风险预警</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">合规性检查</h4>
                <p className="text-sm text-gray-600">确保报告符合企业政策和法规要求</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

