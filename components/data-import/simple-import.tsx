'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  FileSpreadsheet, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Users,
  Calendar,
  Settings
} from 'lucide-react'
import { StudentData } from '@/lib/google-sheets'

interface ImportStatus {
  isImporting: boolean
  progress: number
  message: string
  error?: string
  success?: boolean
}

export default function SimpleImport() {
  const [spreadsheetId, setSpreadsheetId] = useState('')
  const [dataType, setDataType] = useState<'primary' | 'secondary'>('primary')
  const [sheetName, setSheetName] = useState('')
  const [useEnvironmentCredentials, setUseEnvironmentCredentials] = useState(true)
  const [customCredentials, setCustomCredentials] = useState('')
  const [previewData, setPreviewData] = useState<StudentData[]>([])
  const [importStatus, setImportStatus] = useState<ImportStatus>({
    isImporting: false,
    progress: 0,
    message: ''
  })
  const [stats, setStats] = useState<{ total: number; byGrade: Record<string, number> } | null>(null)

  const validateSpreadsheet = async () => {
    if (!spreadsheetId) {
      setImportStatus({
        isImporting: false,
        progress: 0,
        message: '请输入Spreadsheet ID',
        error: '缺少Spreadsheet ID'
      })
      return false
    }

    try {
      setImportStatus({
        isImporting: true,
        progress: 10,
        message: '验证表格结构...'
      })

      const response = await fetch('/api/import/google-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId,
          spreadsheetRange: 'A:Z',
          credentials: useEnvironmentCredentials ? 'env' : customCredentials,
          dataType,
          sheetName,
          action: 'validate'
        })
      })

      const validation = await response.json()

      if (validation.error) {
        setImportStatus({
          isImporting: false,
          progress: 0,
          message: '验证失败',
          error: validation.error
        })
        return false
      }

      if (!validation.isValid) {
        setImportStatus({
          isImporting: false,
          progress: 0,
          message: '表格结构无效',
          error: `缺少必需字段。找到的列：${validation.headers.join(', ')}`
        })
        return false
      }

      setImportStatus({
        isImporting: false,
        progress: 100,
        message: '表格验证成功',
        success: true
      })
      return true
    } catch (error) {
      setImportStatus({
        isImporting: false,
        progress: 0,
        message: '验证失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
      return false
    }
  }

  const previewDataFromSheet = async () => {
    if (!spreadsheetId) {
      setImportStatus({
        isImporting: false,
        progress: 0,
        message: '请输入Spreadsheet ID',
        error: '缺少Spreadsheet ID'
      })
      return
    }

    try {
      setImportStatus({
        isImporting: true,
        progress: 20,
        message: '从Google Sheets获取数据...'
      })

      const response = await fetch('/api/import/google-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId,
          spreadsheetRange: 'A:Z',
          credentials: useEnvironmentCredentials ? 'env' : customCredentials,
          dataType,
          sheetName,
          action: 'preview'
        })
      })

      const result = await response.json()
      
      if (result.error) {
        setImportStatus({
          isImporting: false,
          progress: 0,
          message: '获取数据失败',
          error: result.error
        })
      } else {
        setPreviewData(result.data || [])
        setImportStatus({
          isImporting: false,
          progress: 100,
          message: `成功获取数据。显示前5条记录预览。`,
          success: true
        })
      }
    } catch (error) {
      setImportStatus({
        isImporting: false,
        progress: 0,
        message: '获取数据失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  const importToFirestore = async () => {
    if (!spreadsheetId) {
      setImportStatus({
        isImporting: false,
        progress: 0,
        message: '请输入Spreadsheet ID',
        error: '缺少Spreadsheet ID'
      })
      return
    }

    try {
      setImportStatus({
        isImporting: true,
        progress: 10,
        message: '开始导入过程...'
      })

      setImportStatus({
        isImporting: true,
        progress: 30,
        message: '从Google Sheets获取数据...'
      })

      setImportStatus({
        isImporting: true,
        progress: 60,
        message: '导入到Firestore...'
      })

      const response = await fetch('/api/import/google-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId,
          spreadsheetRange: 'A:Z',
          credentials: useEnvironmentCredentials ? 'env' : customCredentials,
          dataType,
          sheetName,
          action: 'import'
        })
      })

      const result = await response.json()

      if (result.error) {
        setImportStatus({
          isImporting: false,
          progress: 0,
          message: '导入失败',
          error: result.error
        })
      } else {
        setImportStatus({
          isImporting: false,
          progress: 100,
          message: `导入完成！成功导入 ${result.success} 名学生。`,
          success: true
        })

        // 获取更新后的统计信息
        await getCurrentStats()
      }

    } catch (error) {
      setImportStatus({
        isImporting: false,
        progress: 0,
        message: '导入失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  const getCurrentStats = async () => {
    try {
      const response = await fetch('/api/import/google-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'stats',
          spreadsheetId: '',
          credentials: '{}'
        })
      })

      const currentStats = await response.json()
      if (currentStats.error) {
        console.error('Stats error:', currentStats.error)
        setStats({ total: 0, byGrade: {} })
      } else {
        setStats(currentStats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      setStats({ total: 0, byGrade: {} })
    }
  }

  const testPermission = async () => {
    if (!spreadsheetId) {
      setImportStatus({
        isImporting: false,
        progress: 0,
        message: '请输入Spreadsheet ID',
        error: '缺少Spreadsheet ID'
      })
      return
    }

    try {
      setImportStatus({
        isImporting: true,
        progress: 10,
        message: '测试权限...'
      })

      const response = await fetch('/api/debug/sheets-permission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId,
          sheetName
        })
      })

      const result = await response.json()

      if (result.error) {
        setImportStatus({
          isImporting: false,
          progress: 0,
          message: '权限测试失败',
          error: `${result.error}\n\n服务账户邮箱: ${result.serviceAccountEmail}\n\n建议: ${result.suggestion}`
        })
      } else {
        setImportStatus({
          isImporting: false,
          progress: 100,
          message: `权限测试成功！\n服务账户邮箱: ${result.serviceAccountEmail}\n找到的列: ${result.headers.join(', ')}`,
          success: true
        })
      }
    } catch (error) {
      setImportStatus({
        isImporting: false,
        progress: 0,
        message: '权限测试失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  const checkEnvironment = async () => {
    try {
      setImportStatus({
        isImporting: true,
        progress: 10,
        message: '检查环境配置...'
      })

      const response = await fetch('/api/debug/check-env')
      const result = await response.json()

      if (result.error) {
        setImportStatus({
          isImporting: false,
          progress: 0,
          message: '环境配置检查失败',
          error: `${result.error}\n\n建议: ${result.suggestion}`
        })
      } else {
        setImportStatus({
          isImporting: false,
          progress: 100,
          message: `环境配置正确！\n服务账户邮箱: ${result.serviceAccountEmail}\n项目ID: ${result.projectId}`,
          success: true
        })
      }
    } catch (error) {
      setImportStatus({
        isImporting: false,
        progress: 0,
        message: '环境配置检查失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  const detailedPermissionCheck = async () => {
    if (!spreadsheetId) {
      setImportStatus({
        isImporting: false,
        progress: 0,
        message: '请输入Spreadsheet ID',
        error: '缺少Spreadsheet ID'
      })
      return
    }

    try {
      setImportStatus({
        isImporting: true,
        progress: 10,
        message: '详细权限检查...'
      })

      const response = await fetch('/api/debug/detailed-permission-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId,
          sheetName
        })
      })

      const result = await response.json()

      if (result.error) {
        let errorMessage = `步骤: ${result.step}\n错误: ${result.error}`
        if (result.details) {
          errorMessage += `\n详细信息: ${result.details}`
        }
        if (result.serviceAccountEmail) {
          errorMessage += `\n服务账户邮箱: ${result.serviceAccountEmail}`
        }
        errorMessage += `\n\n建议: ${result.suggestion}`

        setImportStatus({
          isImporting: false,
          progress: 0,
          message: '详细权限检查失败',
          error: errorMessage
        })
      } else {
        let successMessage = `步骤: ${result.step}\n${result.message}`
        if (result.serviceAccountEmail) {
          successMessage += `\n服务账户邮箱: ${result.serviceAccountEmail}`
        }
        if (result.spreadsheetTitle) {
          successMessage += `\n表格标题: ${result.spreadsheetTitle}`
        }
        if (result.availableSheets && result.availableSheets.length > 0) {
          successMessage += `\n可用Sheet: ${result.availableSheets.join(', ')}`
        }
        successMessage += `\n\n建议: ${result.suggestion}`

        setImportStatus({
          isImporting: false,
          progress: 100,
          message: '详细权限检查成功',
          success: true
        })
      }
    } catch (error) {
      setImportStatus({
        isImporting: false,
        progress: 0,
        message: '详细权限检查失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  const testFirebaseImport = async () => {
    try {
      setImportStatus({
        isImporting: true,
        progress: 10,
        message: '测试Firebase导入...'
      })

      const response = await fetch('/api/debug/firebase-import-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataType
        })
      })

      const result = await response.json()

      if (result.error) {
        let errorMessage = `步骤: ${result.step}\n错误: ${result.error}`
        if (result.details) {
          errorMessage += `\n详细信息: ${result.details}`
        }
        if (result.collectionName) {
          errorMessage += `\n集合名称: ${result.collectionName}`
        }
        errorMessage += `\n\n建议: ${result.suggestion}`

        setImportStatus({
          isImporting: false,
          progress: 0,
          message: 'Firebase导入测试失败',
          error: errorMessage
        })
      } else {
        let successMessage = `步骤: ${result.step}\n${result.message}`
        if (result.collectionName) {
          successMessage += `\n集合名称: ${result.collectionName}`
        }
        if (result.importResult) {
          successMessage += `\n导入结果: 成功 ${result.importResult.success} 条记录`
          if (result.importResult.errors && result.importResult.errors.length > 0) {
            successMessage += `\n错误: ${result.importResult.errors.join(', ')}`
          }
        }
        successMessage += `\n\n建议: ${result.suggestion}`

        setImportStatus({
          isImporting: false,
          progress: 100,
          message: 'Firebase导入测试成功',
          success: true
        })
      }
    } catch (error) {
      setImportStatus({
        isImporting: false,
        progress: 0,
        message: 'Firebase导入测试失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  const checkSheetsColumns = async () => {
    if (!spreadsheetId) {
      setImportStatus({
        isImporting: false,
        progress: 0,
        message: '请输入Spreadsheet ID',
        error: '缺少Spreadsheet ID'
      })
      return
    }

    try {
      setImportStatus({
        isImporting: true,
        progress: 10,
        message: '检查Google Sheets列...'
      })

      const response = await fetch('/api/debug/check-sheets-columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId,
          credentials: useEnvironmentCredentials ? 'env' : customCredentials,
          sheetName
        })
      })

      const result = await response.json()

      if (result.success) {
        const birthDateFields = result.potentialBirthDateFields
        const allFields = result.allFields
        
        let message = `找到 ${result.headers.length} 列\n`
        message += `潜在出生日期字段: ${birthDateFields.length > 0 ? birthDateFields.map((f: any) => f.originalHeader).join(', ') : '无'}\n`
        message += `所有字段: ${allFields.map((f: any) => f.originalHeader).join(', ')}`
        
        setImportStatus({
          isImporting: false,
          progress: 100,
          message: message,
          success: true
        })
        
        console.log('Sheets columns check result:', result)
      } else {
        setImportStatus({
          isImporting: false,
          progress: 0,
          message: '检查失败',
          error: result.error
        })
      }
    } catch (error) {
      setImportStatus({
        isImporting: false,
        progress: 0,
        message: '检查失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            简化数据导入
          </CardTitle>
          <CardDescription>
            使用预设的服务账户凭据，只需输入Spreadsheet ID即可导入数据。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Data Type Selection */}
          <div>
            <Label>数据类型</Label>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="primary-data"
                  checked={dataType === 'primary'}
                  onChange={() => setDataType('primary')}
                />
                <Label htmlFor="primary-data" className="text-sm">
                  小学数据 (Primary)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="secondary-data"
                  checked={dataType === 'secondary'}
                  onChange={() => setDataType('secondary')}
                />
                <Label htmlFor="secondary-data" className="text-sm">
                  中学数据 (Secondary)
                </Label>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              选择要导入的数据类型，这将影响数据在Firebase中的存储位置
            </p>
          </div>

                     {/* Spreadsheet ID */}
           <div>
             <Label htmlFor="spreadsheetId">Google Spreadsheet ID</Label>
             <Input
               id="spreadsheetId"
               placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
               value={spreadsheetId}
               onChange={(e) => setSpreadsheetId(e.target.value)}
             />
             <p className="text-sm text-muted-foreground mt-1">
               在URL中找到：https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
             </p>
           </div>

           {/* Sheet Name */}
           <div>
             <Label htmlFor="sheetName">Sheet名称（可选）</Label>
             <Input
               id="sheetName"
               placeholder="Sheet1, 小学数据, 中学数据"
               value={sheetName}
               onChange={(e) => setSheetName(e.target.value)}
             />
             <p className="text-sm text-muted-foreground mt-1">
               如果数据在特定的Sheet中，请输入Sheet名称。留空则使用默认Sheet。
             </p>
           </div>

          {/* Credentials Options */}
          <div className="space-y-2">
            <Label>凭据选项</Label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="env-credentials"
                  checked={useEnvironmentCredentials}
                  onChange={() => setUseEnvironmentCredentials(true)}
                />
                <Label htmlFor="env-credentials" className="text-sm">
                  使用预设凭据（推荐）
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="custom-credentials"
                  checked={!useEnvironmentCredentials}
                  onChange={() => setUseEnvironmentCredentials(false)}
                />
                <Label htmlFor="custom-credentials" className="text-sm">
                  使用自定义凭据
                </Label>
              </div>
            </div>
          </div>

          {/* Custom Credentials */}
          {!useEnvironmentCredentials && (
            <div>
              <Label htmlFor="customCredentials">自定义服务账户凭据 (JSON)</Label>
              <textarea
                id="customCredentials"
                className="w-full min-h-[120px] p-3 border rounded-md"
                placeholder="粘贴您的Google Service Account JSON凭据"
                value={customCredentials}
                onChange={(e) => setCustomCredentials(e.target.value)}
              />
            </div>
          )}

                     {/* Action Buttons */}
           <div className="flex gap-2">
             <Button
               onClick={checkEnvironment}
               disabled={importStatus.isImporting}
               variant="outline"
             >
               <Settings className="h-4 w-4 mr-2" />
               检查环境
             </Button>
                           <Button
                onClick={detailedPermissionCheck}
                disabled={importStatus.isImporting}
                variant="outline"
              >
                <Settings className="h-4 w-4 mr-2" />
                详细权限检查
              </Button>
              <Button
                onClick={testFirebaseImport}
                disabled={importStatus.isImporting}
                variant="outline"
              >
                <Settings className="h-4 w-4 mr-2" />
                测试Firebase导入
              </Button>
              <Button
                onClick={checkSheetsColumns}
                disabled={importStatus.isImporting}
                variant="outline"
              >
                <Calendar className="h-4 w-4 mr-2" />
                检查出生日期字段
              </Button>
              <Button
                onClick={testPermission}
                disabled={importStatus.isImporting}
                variant="outline"
              >
                <Settings className="h-4 w-4 mr-2" />
                测试权限
              </Button>
             <Button
               onClick={validateSpreadsheet}
               disabled={importStatus.isImporting}
               variant="outline"
             >
               <CheckCircle className="h-4 w-4 mr-2" />
               验证
             </Button>
             <Button
               onClick={previewDataFromSheet}
               disabled={importStatus.isImporting}
               variant="outline"
             >
               <FileSpreadsheet className="h-4 w-4 mr-2" />
               预览数据
             </Button>
             <Button
               onClick={importToFirestore}
               disabled={importStatus.isImporting}
             >
               {importStatus.isImporting ? (
                 <Loader2 className="h-4 w-4 mr-2 animate-spin" />
               ) : (
                 <Upload className="h-4 w-4 mr-2" />
               )}
               导入到Firestore
             </Button>
             <Button
               onClick={getCurrentStats}
               variant="outline"
             >
               <Users className="h-4 w-4 mr-2" />
               获取统计
             </Button>
           </div>

          {/* Progress */}
          {importStatus.isImporting && (
            <div className="space-y-2">
              <Progress value={importStatus.progress} />
              <p className="text-sm">{importStatus.message}</p>
            </div>
          )}

          {/* Status Messages */}
          {importStatus.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{importStatus.error}</AlertDescription>
            </Alert>
          )}

          {importStatus.success && !importStatus.isImporting && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{importStatus.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Preview Data */}
      {previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>数据预览</CardTitle>
            <CardDescription>来自您的电子表格的前5条记录</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {previewData.map((student, index) => (
                <div key={index} className="p-3 border rounded-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">年级: {student.grade}</p>
                      <p className="text-sm text-muted-foreground">电话: {student.parentPhone || '无'}</p>
                      <p className="text-sm text-muted-foreground">地址: {student.address || '无'}</p>
                      {student.dateOfBirth && (
                        <p className="text-sm text-muted-foreground">出生日期: {student.dateOfBirth}</p>
                      )}
                      {student.gender && (
                        <p className="text-sm text-muted-foreground">性别: {student.gender}</p>
                      )}
                    </div>
                    <Badge variant="secondary">{student.id}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              导入统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">总学生数</span>
                </div>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">按年级分布</span>
                </div>
                <div className="space-y-1 mt-2">
                  {stats.byGrade && Object.entries(stats.byGrade).map(([grade, count]) => (
                    <div key={grade} className="flex justify-between">
                      <span className="text-sm">{grade}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 