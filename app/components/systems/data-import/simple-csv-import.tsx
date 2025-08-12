'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function SimpleCSVImport() {
  const [csvData, setCsvData] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setCsvData(text)
    }
    reader.readAsText(file)
  }

  const parseCSV = (csvText: string) => {
    const lines = csvText.trim().split('\n')
    if (lines.length < 2) return []

    // 更智能的 CSV 解析，处理带空格的列名和引号
    const parseCSVLine = (line: string) => {
      const result = []
      let current = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      
      result.push(current.trim())
      return result.map(item => item.replace(/^"|"$/g, '')) // 移除首尾引号
    }

    const headers = parseCSVLine(lines[0])
    const data = []

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      const row: any = {}
      
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      
      data.push(row)
    }

    return data
  }

  const handleImport = async () => {
    if (!csvData.trim()) {
      toast.error('请先输入或上传 CSV 数据')
      return
    }

    setIsImporting(true)
    try {
      const parsedData = parseCSV(csvData)
      
      if (parsedData.length === 0) {
        toast.error('CSV 数据格式错误或为空')
        return
      }

      const response = await fetch('/api/import/google-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'import-csv',
          data: parsedData
        }),
      })

      const result = await response.json()

      if (result.success) {
        setImportResult(result)
        toast.success(`成功导入 ${result.details.success} 个学生`)
      } else {
        toast.error(result.error || '导入失败')
      }
    } catch (error) {
      console.error('Import error:', error)
      toast.error('导入过程中发生错误')
    } finally {
      setIsImporting(false)
    }
  }

  const handleGetStats = async () => {
    try {
      const response = await fetch('/api/import/google-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'stats'
        }),
      })

      const result = await response.json()
      toast.info(result.message || `当前数据库中有 ${result.total} 个学生`)
    } catch (error) {
      toast.error('获取统计数据失败')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            简单 CSV 导入
          </CardTitle>
          <CardDescription>
            直接粘贴 CSV 数据或上传 CSV 文件来导入学生信息
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 文件上传 */}
          <div className="space-y-2">
            <Label htmlFor="csv-file">上传 CSV 文件</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="cursor-pointer"
            />
          </div>

          {/* CSV 数据输入 */}
          <div className="space-y-2">
            <Label htmlFor="csv-data">或直接粘贴 CSV 数据</Label>
            <Textarea
              id="csv-data"
              placeholder="姓名,年级,父亲电话,母亲电话,地址,父亲姓名,母亲姓名,生日,性别,中心&#10;张三,Standard 1,0123456789,0987654321,吉隆坡市中心,张先生,李女士,2015-01-15,男,WX 01"
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <Button 
              onClick={handleImport} 
              disabled={isImporting || !csvData.trim()}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {isImporting ? '导入中...' : '开始导入'}
            </Button>
            <Button 
              onClick={handleGetStats} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              查看统计
            </Button>
          </div>

          {/* 导入结果 */}
          {importResult && (
            <div className="mt-4 p-4 border rounded-lg bg-muted">
              <h4 className="font-medium mb-2">导入结果</h4>
              <div className="space-y-1 text-sm">
                <p>✅ 成功: {importResult.details.success} 个</p>
                <p>❌ 失败: {importResult.details.failed} 个</p>
                {importResult.details.skipped > 0 && (
                  <p>⏭️ 跳过: {importResult.details.skipped} 个（空姓名或无效数据）</p>
                )}
                {importResult.details.errors.length > 0 && (
                  <div>
                    <p className="font-medium text-red-600">错误详情:</p>
                    <ul className="list-disc list-inside text-red-600">
                      {importResult.details.errors.slice(0, 3).map((error: string, index: number) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            使用说明
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
                     <div className="space-y-2">
             <h4 className="font-medium">CSV 格式要求：</h4>
                           <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• 第一行必须是列标题</li>
                <li>• 支持中英文列名</li>
                <li>• 用逗号分隔各列</li>
                <li>• 必填字段：姓名</li>
                <li>• 年级会根据出生日期自动计算</li>
                <li>• 自动跳过空姓名或只包含空格的数据</li>
              </ul>
           </div>

                     <div className="space-y-2">
             <h4 className="font-medium">支持的列名：</h4>
             <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                               <div>
                  <p><strong>学号</strong>: id, ID, student_id</p>
                  <p><strong>姓名</strong>: name, 姓名, Student Name</p>
                  <p><strong>年级</strong>: grade, 年级, standard, Standard</p>
                  <p><strong>父亲电话</strong>: father_phone, 父亲电话, Parents Phone Number (Father)</p>
                  <p><strong>母亲电话</strong>: mother_phone, 母亲电话, Parents Phone Number (Mother)</p>
                  <p><strong>地址</strong>: address, 地址, Home Address</p>
                </div>
                <div>
                  <p><strong>父亲姓名</strong>: father_name, 父亲姓名</p>
                  <p><strong>母亲姓名</strong>: mother_name, 母亲姓名</p>
                  <p><strong>生日</strong>: dob, 生日, birthday, D.O.B</p>
                  <p><strong>性别</strong>: gender, 性别, Gender</p>
                  <p><strong>中心</strong>: center, 中心, Center</p>
                </div>
             </div>
           </div>

                     <div className="space-y-2">
             <h4 className="font-medium">示例数据：</h4>
             <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
{`ID,姓名,年级,父亲电话,母亲电话,地址,父亲姓名,母亲姓名,生日,性别,中心
STU001,张三,Standard 1,0123456789,0987654321,吉隆坡市中心,张先生,李女士,2015-01-15,男,WX 01
STU002,李四,Standard 2,0123456790,0987654322,雪兰莪州,李先生,王女士,2014-03-20,女,WX 01`}
             </pre>
           </div>
        </CardContent>
      </Card>
    </div>
  )
}
