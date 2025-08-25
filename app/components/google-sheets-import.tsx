"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  FileSpreadsheet,
  Upload,
  CheckCircle,
  AlertTriangle,
  Download,
  ExternalLink,
  Copy,
  Trash2,
} from "lucide-react"
import { Student } from "@/lib/pocketbase-students"

interface GoogleSheetsImportProps {
  onImport: (students: any[]) => Promise<void>
  loading?: boolean
}

interface ImportPreview {
  studentId: string
  center: string
  grade: string
  studentName: string
  studentUrl: string
  status: 'active' | 'inactive' | 'lost' | 'graduated'
  cardType: 'NFC' | 'RFID'
  balance: number
  valid: boolean
  error?: string
}

export function GoogleSheetsImport({ onImport, loading = false }: GoogleSheetsImportProps) {
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState("")
  const [csvData, setCsvData] = useState("")
  const [previewData, setPreviewData] = useState<ImportPreview[]>([])
  const [importMethod, setImportMethod] = useState<'url' | 'csv'>('url')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // center selection
  const [centerOptions, setCenterOptions] = useState<string[]>(["WX 01", "WX 02", "WX 03", "WX 04"])
  const [selectedCenter, setSelectedCenter] = useState<string>("WX 01")

  useEffect(() => {
    const loadCenters = async () => {
      try {
        // try from dedicated centers API
        const res = await fetch('/api/pocketbase/centers')
        const data = await res.json().catch(() => ({}))
        if (data?.success && Array.isArray(data.centers) && data.centers.length > 0) {
          const names = data.centers.map((c: any) => c.name || c.code).filter(Boolean)
          if (names.length > 0) {
            setCenterOptions(names)
            setSelectedCenter(names[0])
            return
          }
        }
        // fallback: try extract from students collection
        const res2 = await fetch('/api/pocketbase/students-centers')
        const data2 = await res2.json().catch(() => ({}))
        if (data2?.success && Array.isArray(data2.centers) && data2.centers.length > 0) {
          const names2 = data2.centers.map((c: any) => c.name || c.code).filter(Boolean)
          if (names2.length > 0) {
            setCenterOptions(names2)
            setSelectedCenter(names2[0])
            return
          }
        }
        // keep defaults if nothing fetched
      } catch {
        // ignore; keep defaults
      }
    }
    loadCenters()
  }, [])

  // 解析 CSV 数据
  const parseCSV = (csv: string): ImportPreview[] => {
    const lines = csv.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    
    const students: ImportPreview[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const row: any = {}
      
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      
      // 验证必填字段
      const studentId = row.studentid || row['学号'] || row['student id'] || ''
      const studentName = row.studentname || row['学生姓名'] || row['name'] || ''
      const studentUrl = row.studenturl || row['学生网址'] || row['url'] || ''
      
      const center = row.center || row['中心'] || selectedCenter || 'WX 01'
      const grade = row.grade || row['年级'] || ''
      const status = (row.status || row['状态'] || 'active').toLowerCase()
      const cardType = (row.cardtype || row['卡片类型'] || 'NFC').toUpperCase() === 'RFID' ? 'RFID' : 'NFC'
      
      const valid = studentId && studentName && studentUrl
      
      students.push({
        studentId,
        center,
        grade,
        studentName,
        studentUrl,
        status: status === 'active' || status === 'inactive' || status === 'lost' || status === 'graduated' 
          ? status as any : 'active',
        cardType,
        balance: 0,
        valid,
        error: valid ? undefined : '缺少必填字段（学号、学生姓名、学生网址）'
      })
    }
    
    return students
  }

  // 从 Google Sheets URL 获取数据
  const fetchFromGoogleSheets = async (url: string) => {
    try {
      setError(null)
      
      const response = await fetch('/api/google-sheets/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || '获取数据失败')
      }
      
      const csv = result.data
      const students = parseCSV(csv)
      setPreviewData(students)
      setCsvData(csv)
      
    } catch (err) {
      console.error('获取 Google Sheets 数据失败:', err)
      setError(err instanceof Error ? err.message : '获取数据失败')
    }
  }

  // 处理 CSV 数据
  const handleCSVData = (csv: string) => {
    try {
      setError(null)
      const students = parseCSV(csv)
      setPreviewData(students)
      setCsvData(csv)
    } catch (err) {
      console.error('解析 CSV 数据失败:', err)
      setError('CSV 格式错误')
    }
  }

  // 执行导入
  const handleImport = async () => {
    try {
      setError(null)
      setSuccess(null)
      
      const validStudents = previewData.filter(s => s.valid)
      
      if (validStudents.length === 0) {
        setError('没有有效的数据可以导入')
        return
      }

      if (!selectedCenter) {
        setError('请先选择中心（Center）')
        return
      }
      
      // 转换为 StudentCard 格式 - 只包含必要字段
      const studentsToImport: any[] = validStudents.map(s => ({
        studentId: s.studentId.trim(),
        studentName: s.studentName.trim(),
        studentUrl: s.studentUrl.trim(),
        center: (s.center || selectedCenter).trim(),
        grade: s.grade.trim(),
        cardType: s.cardType,
        status: s.status,
        cardNumber: '',
        issuedDate: '',
        expiryDate: '',
        lastUsed: '',
        usageCount: 0,
        enrollmentDate: '',
        phone: '',
        email: '',
        parentName: '',
        parentPhone: '',
        address: '',
        emergencyContact: '',
        medicalInfo: '',
        notes: ''
      }))
      
      await onImport(studentsToImport)
      setSuccess(`成功导入 ${validStudents.length} 个学生记录（中心：${selectedCenter}）`)
      setPreviewData([])
      setCsvData("")
      setGoogleSheetsUrl("")
      
    } catch (err) {
      console.error('导入失败:', err)
      const errorMessage = err instanceof Error ? err.message : '导入失败'
      setError(`导入失败: ${errorMessage}`)
    }
  }

  // 生成示例 CSV
  const generateSampleCSV = () => {
    const sample = `studentId,center,grade,studentName,studentUrl,status,cardType
B1,${selectedCenter},一年级,Jayden Ng Junn Kyle 黄俊凯,https://docs.google.com/forms/d/e/1FAIpQLSc05w6sa742nS8mLMLFfBmQSpnQij_djz8USeR15LOQk_LTzw/viewform,active,NFC
B2,${selectedCenter},二年级,Wong Zhi Xuan 黄智轩,https://docs.google.com/forms/d/e/1FAIpQLSdA6i6NpoCx7yOz0sLexLquKBYmZ0gA1eu829kctXC9RNejog/viewform,active,NFC
B3,${selectedCenter},中一,Ivan Lee Kai Wen 李凯文,https://docs.google.com/forms/d/e/1FAIpQLSenTMWPdZu_IMksVMz-2BXJeFHL5ENCEg6FHJ_d9qfHYXpQng/viewform,active,NFC`
    
    setCsvData(sample)
    handleCSVData(sample)
  }

  // 复制 CSV 到剪贴板
  const copyCSV = async () => {
    try {
      await navigator.clipboard.writeText(csvData)
      setSuccess('CSV 数据已复制到剪贴板')
    } catch (err) {
      setError('复制失败')
    }
  }

  return (
    <div className="space-y-6">
      {/* 中心选择 */}
      <Card>
        <CardHeader>
          <CardTitle>选择中心（Center）</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="w-64">
            <Label className="mb-1 block">导入到哪个中心</Label>
            <Select value={selectedCenter} onValueChange={setSelectedCenter}>
              <SelectTrigger>
                <SelectValue placeholder="请选择中心" />
              </SelectTrigger>
              <SelectContent>
                {centerOptions.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-gray-600">若 CSV 中未提供 center，将使用上面选择的中心。</div>
        </CardContent>
      </Card>

      {/* 导入方法选择 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Google Sheets 导入
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              variant={importMethod === 'url' ? 'default' : 'outline'}
              onClick={() => setImportMethod('url')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Google Sheets URL
            </Button>
            <Button
              variant={importMethod === 'csv' ? 'default' : 'outline'}
              onClick={() => setImportMethod('csv')}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              CSV 数据
            </Button>
          </div>

          {importMethod === 'url' ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="sheetsUrl">Google Sheets URL</Label>
                <Input
                  id="sheetsUrl"
                  type="url"
                  value={googleSheetsUrl}
                  onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => fetchFromGoogleSheets(googleSheetsUrl)}
                  disabled={!googleSheetsUrl}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  获取数据
                </Button>
                <Button 
                  variant="outline"
                  onClick={generateSampleCSV}
                  className="flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  生成示例
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="csvData">CSV 数据</Label>
                <Textarea
                  id="csvData"
                  value={csvData}
                  onChange={(e) => handleCSVData(e.target.value)}
                  placeholder="粘贴 CSV 数据..."
                  rows={10}
                  className="mt-1 font-mono text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={generateSampleCSV}
                  className="flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  生成示例
                </Button>
                <Button 
                  variant="outline"
                  onClick={copyCSV}
                  disabled={!csvData}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  复制 CSV
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 数据预览 */}
      {previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              数据预览
              <Badge variant="outline">
                {previewData.filter(s => s.valid).length} / {previewData.length} 有效
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>状态</TableHead>
                    <TableHead>学号</TableHead>
                    <TableHead>中心</TableHead>
                    <TableHead>学生姓名</TableHead>
                    <TableHead>网址</TableHead>
                    <TableHead>余额</TableHead>
                    <TableHead>错误</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((student, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {student.valid ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                      </TableCell>
                      <TableCell className="font-mono">{student.studentId}</TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-800">
                          {student.center}
                        </Badge>
                      </TableCell>
                      <TableCell>{student.studentName}</TableCell>
                      <TableCell>
                        <a 
                          href={student.studentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline text-sm truncate max-w-32 block"
                        >
                          {student.studentUrl}
                        </a>
                      </TableCell>
                      <TableCell className="font-mono">${student.balance}</TableCell>
                      <TableCell>
                        {student.error && (
                          <span className="text-red-600 text-xs">{student.error}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                有效数据: {previewData.filter(s => s.valid).length} 条
              </div>
              <Button 
                onClick={handleImport}
                disabled={loading || previewData.filter(s => s.valid).length === 0}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    导入中...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    导入有效数据
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 成功提示 */}
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* 使用说明 */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Google Sheets 导入说明</h3>
          <div className="text-blue-700 text-sm space-y-2">
            <p><strong>方法一：Google Sheets URL</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>确保 Google Sheets 已设置为"任何人都可以查看"</li>
              <li>复制 Google Sheets 的分享链接</li>
              <li>系统会自动获取并解析数据</li>
            </ul>
            
            <p className="mt-4"><strong>Google Sheets 权限设置步骤：</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>打开您的 Google Sheets</li>
              <li>点击右上角的"分享"按钮</li>
              <li>点击"更改"链接</li>
              <li>选择"任何人都可以查看"</li>
              <li>点击"完成"</li>
              <li>复制分享链接</li>
            </ol>
            
            <p className="mt-4"><strong>方法二：CSV 数据</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>从 Google Sheets 导出为 CSV 格式</li>
              <li>复制 CSV 内容并粘贴到文本框中</li>
              <li>系统会验证数据格式</li>
            </ul>
            
            <p className="mt-4"><strong>必填字段：</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>studentId（学号）</li>
              <li>studentName（学生姓名）</li>
              <li>studentUrl（学生专属网址）</li>
              <li>center（中心）- 若未在 CSV 中提供，将使用顶部选择的中心</li>
            </ul>
            
            <p className="mt-4"><strong>如果遇到 CORS 错误：</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>请使用"CSV 数据"方式导入</li>
              <li>或确保 Google Sheets 权限设置正确</li>
              <li>或联系管理员检查网络设置</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
