"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, CheckCircle, AlertCircle, Download, Trash2, Users, GraduationCap, UserCheck, BookOpen, School } from "lucide-react"
import { addStudent } from "@/lib/pocketbase-students"
import { pb } from "@/lib/pocketbase"

interface CSVRow {
  [key: string]: string
}

interface ImportResult {
  success: number
  failed: number
  errors: string[]
}

type ImportType = 'primary_students' | 'secondary_students' | 'teachers' | 'parents'

export default function GoogleCSVImport() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<CSVRow[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [importType, setImportType] = useState<ImportType>('primary_students')

  // 处理文件上传
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      setError('请选择 CSV 文件')
      return
    }

    setFile(file)
    setError(null)
    setResult(null)

    // 读取并预览文件
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string
        const rows = parseCSV(csv)
        setPreview(rows.slice(0, 5)) // 只显示前5行作为预览
      } catch (err) {
        setError('CSV 文件格式错误')
      }
    }
    reader.readAsText(file)
  }, [])

  // 解析 CSV 文件
  const parseCSV = (csv: string): CSVRow[] => {
    const lines = csv.split('\n').filter(line => line.trim())
    if (lines.length === 0) return []

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const rows: CSVRow[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      const row: CSVRow = {}
      
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      
      rows.push(row)
    }

    return rows
  }

  // 映射学生数据
  const mapStudentData = (row: CSVRow) => {
    return {
      student_name: row['姓名'] || row['Name'] || row['name'] || '',
      student_id: row['学号'] || row['Student ID'] || row['student_id'] || `STU${Date.now()}`,
      standard: row['年级'] || row['Grade'] || row['grade'] || row['Standard'] || row['standard'] || '',
      gender: row['性别'] || row['Gender'] || row['gender'] || '',
      dob: row['出生日期'] || row['Birth Date'] || row['birth_date'] || row['DOB'] || '',
      father_phone: row['父亲电话'] || row['Father Phone'] || row['father_phone'] || row['联系电话'] || row['Phone'] || '',
      mother_phone: row['母亲电话'] || row['Mother Phone'] || row['mother_phone'] || '',
      home_address: row['地址'] || row['Address'] || row['address'] || row['家庭地址'] || row['Home Address'] || '',
      register_form_url: ''
    }
  }

  // 映射老师数据
  const mapTeacherData = (row: CSVRow) => {
    return {
      name: row['姓名'] || row['Name'] || row['name'] || '',
      email: row['邮箱'] || row['Email'] || row['email'] || '',
      phone: row['电话'] || row['Phone'] || row['phone'] || '',
      role: 'teacher',
      status: 'approved',
      verified: true,
      emailVisibility: false
    }
  }

  // 映射家长数据
  const mapParentData = (row: CSVRow) => {
    return {
      name: row['姓名'] || row['Name'] || row['name'] || '',
      email: row['邮箱'] || row['Email'] || row['email'] || '',
      phone: row['电话'] || row['Phone'] || row['phone'] || '',
      role: 'parent',
      status: 'approved',
      verified: true,
      emailVisibility: false
    }
  }

  // 验证学生数据
  const validateStudentData = (data: any): string[] => {
    const errors: string[] = []
    if (!data.student_name) errors.push('姓名不能为空')
    if (!data.standard) errors.push('年级不能为空')
    return errors
  }

  // 验证老师数据
  const validateTeacherData = (data: any): string[] => {
    const errors: string[] = []
    if (!data.name) errors.push('姓名不能为空')
    if (!data.email) errors.push('邮箱不能为空')
    return errors
  }

  // 验证家长数据
  const validateParentData = (data: any): string[] => {
    const errors: string[] = []
    if (!data.name) errors.push('姓名不能为空')
    if (!data.email) errors.push('邮箱不能为空')
    return errors
  }

  // 开始导入
  const startImport = async () => {
    if (!file) return

    setIsImporting(true)
    setProgress(0)
    setResult({ success: 0, failed: 0, errors: [] })

    try {
      const csv = await file.text()
      const rows = parseCSV(csv)
      const totalRows = rows.length
      let successCount = 0
      let failedCount = 0
      const errors: string[] = []

      for (let i = 0; i < rows.length; i++) {
        try {
          let data: any
          let validationErrors: string[] = []

          switch (importType) {
            case 'primary_students':
            case 'secondary_students':
              data = mapStudentData(rows[i])
              validationErrors = validateStudentData(data)
              if (validationErrors.length === 0) {
                await addStudent(data)
                successCount++
              } else {
                failedCount++
                errors.push(`第${i + 1}行: ${validationErrors.join(', ')}`)
              }
              break

            case 'teachers':
              data = mapTeacherData(rows[i])
              validationErrors = validateTeacherData(data)
              if (validationErrors.length === 0) {
                await pb.collection('users').create(data)
                successCount++
              } else {
                failedCount++
                errors.push(`第${i + 1}行: ${validationErrors.join(', ')}`)
              }
              break

            case 'parents':
              data = mapParentData(rows[i])
              validationErrors = validateParentData(data)
              if (validationErrors.length === 0) {
                await pb.collection('users').create(data)
                successCount++
              } else {
                failedCount++
                errors.push(`第${i + 1}行: ${validationErrors.join(', ')}`)
              }
              break
          }

          setProgress(((i + 1) / totalRows) * 100)
        } catch (err) {
          failedCount++
          errors.push(`第${i + 1}行: ${err instanceof Error ? err.message : '未知错误'}`)
        }
      }

      setResult({ success: successCount, failed: failedCount, errors })
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败')
    } finally {
      setIsImporting(false)
    }
  }

  // 清空所有数据
  const clearAllData = async () => {
    if (!confirm('确定要清空所有数据吗？此操作不可撤销！')) return

    try {
      if (importType === 'primary_students' || importType === 'secondary_students') {
        const records = await pb.collection('students').getList(1, 1000)
        for (const record of records.items) {
          await pb.collection('students').delete(record.id)
        }
      } else {
        const records = await pb.collection('users').getList(1, 1000, {
          filter: `role = "${importType === 'teachers' ? 'teacher' : 'parent'}"`
        })
        for (const record of records.items) {
          await pb.collection('users').delete(record.id)
        }
      }
      alert('数据已清空')
    } catch (err) {
      alert('清空数据失败: ' + (err instanceof Error ? err.message : '未知错误'))
    }
  }

  // 下载模板
  const downloadTemplate = () => {
    let template = ''
    
    switch (importType) {
      case 'primary_students':
        template = '姓名,学号,年级,性别,出生日期,父亲电话,母亲电话,家庭地址\n张三,STU001,3年级,男,2015-01-01,0912345678,0923456789,台北市信义区'
        break
      case 'secondary_students':
        template = '姓名,学号,年级,性别,出生日期,父亲电话,母亲电话,家庭地址\n李四,STU002,7年级,女,2010-01-01,0934567890,0945678901,台北市大安区'
        break
      case 'teachers':
        template = '姓名,邮箱,电话,科目,部门\n李老师,teacher@example.com,0934567890,数学,数学部'
        break
      case 'parents':
        template = '姓名,邮箱,电话,学生姓名,关系\n王家长,parent@example.com,0945678901,王小明,父亲'
        break
    }

    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${importType}_template.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Google CSV 数据导入</h2>
          <p className="text-gray-600">从 Google Sheets 导入学生、老师和家长数据</p>
        </div>
      </div>

      <Tabs value={importType} onValueChange={(value) => setImportType(value as ImportType)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="primary_students" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            小学生
          </TabsTrigger>
          <TabsTrigger value="secondary_students" className="flex items-center gap-2">
            <School className="h-4 w-4" />
            中学生
          </TabsTrigger>
          <TabsTrigger value="teachers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            老师数据
          </TabsTrigger>
          <TabsTrigger value="parents" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            家长数据
          </TabsTrigger>
        </TabsList>

        <TabsContent value="primary_students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                小学生数据导入
              </CardTitle>
              <CardDescription>
                导入小学生信息，包括姓名、学号、年级、性别等基本信息
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button onClick={downloadTemplate} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  下载小学生模板
                </Button>
                <div className="text-sm text-gray-500">
                  支持字段：姓名, 学号, 年级, 性别, 出生日期, 父亲电话, 母亲电话, 家庭地址
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="secondary_students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="h-5 w-5" />
                中学生数据导入
              </CardTitle>
              <CardDescription>
                导入中学生信息，包括姓名、学号、年级、性别等基本信息
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button onClick={downloadTemplate} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  下载中学生模板
                </Button>
                <div className="text-sm text-gray-500">
                  支持字段：姓名, 学号, 年级, 性别, 出生日期, 父亲电话, 母亲电话, 家庭地址
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                老师数据导入
              </CardTitle>
              <CardDescription>
                导入老师信息，系统将自动创建老师账户
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button onClick={downloadTemplate} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  下载老师模板
                </Button>
                <div className="text-sm text-gray-500">
                  支持字段：姓名, 邮箱, 电话, 科目, 部门
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                家长数据导入
              </CardTitle>
              <CardDescription>
                导入家长信息，系统将自动创建家长账户
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button onClick={downloadTemplate} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  下载家长模板
                </Button>
                <div className="text-sm text-gray-500">
                  支持字段：姓名, 邮箱, 电话, 学生姓名, 关系
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 文件上传区域 */}
        <Card>
          <CardHeader>
            <CardTitle>文件上传</CardTitle>
            <CardDescription>选择要导入的 CSV 文件</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="flex-1"
              />
              {file && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {file.name}
                </Badge>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {preview.length > 0 && (
              <div className="space-y-2">
                <Label>数据预览（前5行）</Label>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <pre className="text-sm overflow-x-auto">
                    {preview.map((row, index) => (
                      <div key={index}>
                        {Object.entries(row).map(([key, value]) => (
                          <span key={key} className="mr-4">
                            <strong>{key}:</strong> {value}
                          </span>
                        ))}
                      </div>
                    ))}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <div className="flex items-center gap-4">
          <Button 
            onClick={startImport} 
            disabled={!file || isImporting}
            className="flex items-center gap-2"
          >
            {isImporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                导入中...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                开始导入
              </>
            )}
          </Button>

          <Button 
            onClick={clearAllData} 
            variant="destructive"
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            清空数据
          </Button>
        </div>

        {/* 进度条 */}
        {isImporting && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>导入进度</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* 导入结果 */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                导入结果
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    成功: {result.success}
                  </Badge>
                  <Badge variant="destructive">
                    失败: {result.failed}
                  </Badge>
                </div>

                {result.errors.length > 0 && (
                  <div className="space-y-2">
                    <Label>错误详情</Label>
                    <div className="max-h-40 overflow-y-auto border rounded-lg p-2 bg-red-50">
                      {result.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-700">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </Tabs>
    </div>
  )
}
