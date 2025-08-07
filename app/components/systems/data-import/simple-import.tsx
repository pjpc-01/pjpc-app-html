'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, FileSpreadsheet } from 'lucide-react'
import { StudentData } from '@/lib/google-sheets'
import { ImportStatus } from './ImportStatus'
import { ImportConfig } from './ImportConfig'
import { DataPreview } from './DataPreview'

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
        message: '获取数据预览...'
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
          message: '预览失败',
          error: result.error
        })
        return
      }

      setPreviewData(result.data || [])
      setStats(result.stats || null)
      setImportStatus({
        isImporting: false,
        progress: 100,
        message: `成功获取 ${result.data?.length || 0} 条记录预览`,
        success: true
      })
    } catch (error) {
      setImportStatus({
        isImporting: false,
        progress: 0,
        message: '预览失败',
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
        message: '开始导入数据...'
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
        return
      }

      setImportStatus({
        isImporting: false,
        progress: 100,
        message: `成功导入 ${result.importedCount || 0} 条记录`,
        success: true
      })

      // Refresh stats after import
      await getCurrentStats()
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
          dataType
        })
      })

      const currentStats = await response.json()
      if (!currentStats.error) {
        setStats(currentStats)
      }
    } catch (error) {
      console.error('Failed to get stats:', error)
    }
  }

  const checkEnvironment = async () => {
    try {
      setImportStatus({
        isImporting: true,
        progress: 10,
        message: '检查环境配置...'
      })

      const response = await fetch('/api/import/google-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check-environment'
        })
      })

      const result = await response.json()

      if (result.error) {
        setImportStatus({
          isImporting: false,
          progress: 0,
          message: '环境检查失败',
          error: result.error
        })
      } else {
        setImportStatus({
          isImporting: false,
          progress: 100,
          message: '环境配置正常',
          success: true
        })
      }
    } catch (error) {
      setImportStatus({
        isImporting: false,
        progress: 0,
        message: '环境检查失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  const detailedPermissionCheck = async () => {
    try {
      setImportStatus({
        isImporting: true,
        progress: 10,
        message: '检查详细权限...'
      })

      const response = await fetch('/api/import/google-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check-permissions',
          spreadsheetId: spreadsheetId || 'test'
        })
      })

      const result = await response.json()

      if (result.error) {
        setImportStatus({
          isImporting: false,
          progress: 0,
          message: '权限检查失败',
          error: result.error
        })
      } else {
        setImportStatus({
          isImporting: false,
          progress: 100,
          message: '权限检查完成',
          success: true
        })
      }
    } catch (error) {
      setImportStatus({
        isImporting: false,
        progress: 0,
        message: '权限检查失败',
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

      const response = await fetch('/api/import/google-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test-firebase',
          dataType
        })
      })

      const result = await response.json()

      if (result.error) {
        setImportStatus({
          isImporting: false,
          progress: 0,
          message: 'Firebase测试失败',
          error: result.error
        })
      } else {
        setImportStatus({
          isImporting: false,
          progress: 100,
          message: 'Firebase连接正常',
          success: true
        })
      }
    } catch (error) {
      setImportStatus({
        isImporting: false,
        progress: 0,
        message: 'Firebase测试失败',
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
        message: '检查表格列结构...'
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
          action: 'check-columns'
        })
      })

      const result = await response.json()

      if (result.error) {
        setImportStatus({
          isImporting: false,
          progress: 0,
          message: '列检查失败',
          error: result.error
        })
      } else {
        setImportStatus({
          isImporting: false,
          progress: 100,
          message: `找到列: ${result.columns?.join(', ') || '无'}`,
          success: true
        })
      }
    } catch (error) {
      setImportStatus({
        isImporting: false,
        progress: 0,
        message: '列检查失败',
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
          <ImportConfig
            spreadsheetId={spreadsheetId}
            setSpreadsheetId={setSpreadsheetId}
            dataType={dataType}
            setDataType={setDataType}
            sheetName={sheetName}
            setSheetName={setSheetName}
            useEnvironmentCredentials={useEnvironmentCredentials}
            setUseEnvironmentCredentials={setUseEnvironmentCredentials}
            customCredentials={customCredentials}
            setCustomCredentials={setCustomCredentials}
            onValidate={validateSpreadsheet}
            onPreview={previewDataFromSheet}
            onImport={importToFirestore}
          />

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
              <Settings className="h-4 w-4 mr-2" />
              检查表格列
            </Button>
          </div>

          <ImportStatus status={importStatus} />
        </CardContent>
      </Card>

      <DataPreview previewData={previewData} stats={stats} />
    </div>
  )
}
