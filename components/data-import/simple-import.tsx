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
                      <p className="text-sm text-muted-foreground">Standard: {student.grade}</p>
                      <p className="text-sm text-muted-foreground">Phone: {student.parentPhone || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">Address: {student.address || 'N/A'}</p>
                      {student.dateOfBirth && (
                        <p className="text-sm text-muted-foreground">DOB: {student.dateOfBirth}</p>
                      )}
                      {student.gender && (
                        <p className="text-sm text-muted-foreground">Gender: {student.gender}</p>
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