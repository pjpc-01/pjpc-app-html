'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { FileSpreadsheet, Upload } from 'lucide-react'

interface ImportConfigProps {
  spreadsheetId: string
  setSpreadsheetId: (id: string) => void
  dataType: 'students'
  setDataType: (type: 'students') => void
  sheetName: string
  setSheetName: (name: string) => void
  useEnvironmentCredentials: boolean
  setUseEnvironmentCredentials: (use: boolean) => void
  customCredentials: string
  setCustomCredentials: (credentials: string) => void
  onValidate: () => void
  onPreview: () => void
  onImport: () => void
}

export function ImportConfig({
  spreadsheetId,
  setSpreadsheetId,
  dataType,
  setDataType,
  sheetName,
  setSheetName,
  useEnvironmentCredentials,
  setUseEnvironmentCredentials,
  customCredentials,
  setCustomCredentials,
  onValidate,
  onPreview,
  onImport
}: ImportConfigProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          导入配置
        </CardTitle>
        <CardDescription>配置Google Sheets导入参数</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Spreadsheet ID */}
        <div>
          <Label htmlFor="spreadsheetId">Spreadsheet ID</Label>
          <Input
            id="spreadsheetId"
            placeholder="输入Google Sheets的ID"
            value={spreadsheetId}
            onChange={(e) => setSpreadsheetId(e.target.value)}
          />
        </div>

        {/* Data Type */}
        <div>
          <Label>数据类型</Label>
          <Select value={dataType} onValueChange={(value: 'students') => setDataType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="students">学生数据</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sheet Name */}
        <div>
          <Label htmlFor="sheetName">工作表名称</Label>
          <Input
            id="sheetName"
            placeholder="工作表名称 (可选)"
            value={sheetName}
            onChange={(e) => setSheetName(e.target.value)}
          />
        </div>

        {/* Credentials */}
        <div className="space-y-2">
          <Label>认证方式</Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="useEnvCredentials"
              checked={useEnvironmentCredentials}
              onCheckedChange={(checked) => setUseEnvironmentCredentials(checked as boolean)}
            />
            <Label htmlFor="useEnvCredentials">使用环境变量认证</Label>
          </div>
          
          {!useEnvironmentCredentials && (
            <div>
              <Label htmlFor="customCredentials">自定义认证信息</Label>
              <Textarea
                id="customCredentials"
                placeholder="输入Google Service Account JSON"
                value={customCredentials}
                onChange={(e) => setCustomCredentials(e.target.value)}
                rows={4}
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button onClick={onValidate} variant="outline">
            验证表格
          </Button>
          <Button onClick={onPreview} variant="outline">
            预览数据
          </Button>
          <Button onClick={onImport}>
            <Upload className="h-4 w-4 mr-2" />
            开始导入
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
