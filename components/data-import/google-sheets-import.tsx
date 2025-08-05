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
  Calendar
} from 'lucide-react'
import { StudentData } from '@/lib/google-sheets'

interface ImportStatus {
  isImporting: boolean
  progress: number
  message: string
  error?: string
  success?: boolean
}

export default function GoogleSheetsImport() {
  const [spreadsheetId, setSpreadsheetId] = useState('')
  const [spreadsheetRange, setSpreadsheetRange] = useState('A:Z')
  const [credentials, setCredentials] = useState('')
  const [previewData, setPreviewData] = useState<StudentData[]>([])
  const [importStatus, setImportStatus] = useState<ImportStatus>({
    isImporting: false,
    progress: 0,
    message: ''
  })
  const [stats, setStats] = useState<{ total: number; byGrade: Record<string, number> } | null>(null)

  const validateSpreadsheet = async () => {
    if (!spreadsheetId || !credentials) {
      setImportStatus({
        isImporting: false,
        progress: 0,
        message: 'Please provide both Spreadsheet ID and credentials',
        error: 'Missing required fields'
      })
      return false
    }

    try {
      setImportStatus({
        isImporting: true,
        progress: 10,
        message: 'Validating spreadsheet structure...'
      })

      const response = await fetch('/api/import/google-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId,
          spreadsheetRange,
          credentials,
          action: 'validate'
        })
      })

      const validation = await response.json()

      if (validation.error) {
        setImportStatus({
          isImporting: false,
          progress: 0,
          message: 'Validation failed',
          error: validation.error
        })
        return false
      }

      if (!validation.isValid) {
        setImportStatus({
          isImporting: false,
          progress: 0,
          message: 'Invalid spreadsheet structure',
          error: `Required fields not found. Found headers: ${validation.headers.join(', ')}`
        })
        return false
      }

      setImportStatus({
        isImporting: false,
        progress: 100,
        message: 'Spreadsheet validation successful',
        success: true
      })
      return true
    } catch (error) {
      setImportStatus({
        isImporting: false,
        progress: 0,
        message: 'Validation failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return false
    }
  }

  const previewDataFromSheet = async () => {
    if (!spreadsheetId || !credentials) {
      setImportStatus({
        isImporting: false,
        progress: 0,
        message: 'Please provide both Spreadsheet ID and credentials',
        error: 'Missing required fields'
      })
      return
    }

    try {
      setImportStatus({
        isImporting: true,
        progress: 20,
        message: 'Fetching data from Google Sheets...'
      })

      const response = await fetch('/api/import/google-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId,
          spreadsheetRange,
          credentials,
          action: 'preview'
        })
      })

      const result = await response.json()
      
      if (result.error) {
        setImportStatus({
          isImporting: false,
          progress: 0,
          message: 'Failed to fetch data',
          error: result.error
        })
      } else {
        setPreviewData(result.data || [])
        setImportStatus({
          isImporting: false,
          progress: 100,
          message: `Successfully fetched data. Showing preview of first 5 records.`,
          success: true
        })
      }
    } catch (error) {
      setImportStatus({
        isImporting: false,
        progress: 0,
        message: 'Failed to fetch data',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const importToFirestore = async () => {
    if (!spreadsheetId || !credentials) {
      setImportStatus({
        isImporting: false,
        progress: 0,
        message: 'Please provide both Spreadsheet ID and credentials',
        error: 'Missing required fields'
      })
      return
    }

    try {
      setImportStatus({
        isImporting: true,
        progress: 10,
        message: 'Starting import process...'
      })

      setImportStatus({
        isImporting: true,
        progress: 30,
        message: 'Fetching data from Google Sheets...'
      })

      setImportStatus({
        isImporting: true,
        progress: 60,
        message: 'Importing to Firestore...'
      })

      const response = await fetch('/api/import/google-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId,
          spreadsheetRange,
          credentials,
          action: 'import'
        })
      })

      const result = await response.json()

      if (result.error) {
        setImportStatus({
          isImporting: false,
          progress: 0,
          message: 'Import failed',
          error: result.error
        })
      } else {
        setImportStatus({
          isImporting: false,
          progress: 100,
          message: `Import completed! Successfully imported ${result.success} students.`,
          success: true
        })

        // Get updated stats
        await getCurrentStats()
      }

    } catch (error) {
      setImportStatus({
        isImporting: false,
        progress: 0,
        message: 'Import failed',
        error: error instanceof Error ? error.message : 'Unknown error'
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
          spreadsheetId: '', // Empty for stats action
          credentials: '{}'  // Empty for stats action
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
            Google Sheets Import
          </CardTitle>
          <CardDescription>
            从Google Sheets一次性导入学生数据到Firebase Firestore。支持您的数据格式，包括：Student Name、Standard、Parents Phone Number等字段。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Configuration */}
          <div className="space-y-4">
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

            <div>
              <Label htmlFor="spreadsheetRange">Data Range</Label>
              <Input
                id="spreadsheetRange"
                placeholder="A:Z"
                value={spreadsheetRange}
                onChange={(e) => setSpreadsheetRange(e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                导入范围（例如：A:Z 表示所有列）
              </p>
            </div>

            <div>
              <Label htmlFor="credentials">Service Account Credentials (JSON)</Label>
              <textarea
                id="credentials"
                className="w-full min-h-[120px] p-3 border rounded-md"
                placeholder="Paste your Google Service Account JSON credentials here"
                value={credentials}
                onChange={(e) => setCredentials(e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                从Google Cloud Console获取 → APIs & Services → Credentials
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={validateSpreadsheet}
              disabled={importStatus.isImporting}
              variant="outline"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Validate
            </Button>
            <Button
              onClick={previewDataFromSheet}
              disabled={importStatus.isImporting}
              variant="outline"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Preview Data
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
              Import to Firestore
            </Button>
            <Button
              onClick={getCurrentStats}
              variant="outline"
            >
              <Users className="h-4 w-4 mr-2" />
              Get Stats
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