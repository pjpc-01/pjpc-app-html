'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface ImportStatus {
  isImporting: boolean
  progress: number
  message: string
  error?: string
  success?: boolean
}

interface ImportStatusProps {
  status: ImportStatus
}

export function ImportStatus({ status }: ImportStatusProps) {
  if (!status.isImporting && !status.message && !status.error) {
    return null
  }

  return (
    <div className="space-y-4">
      {status.isImporting && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">正在导入...</span>
          </div>
          <Progress value={status.progress} className="w-full" />
          <p className="text-sm text-muted-foreground">{status.message}</p>
        </div>
      )}

      {status.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium">导入失败</div>
            <div className="text-sm mt-1">{status.error}</div>
          </AlertDescription>
        </Alert>
      )}

      {status.success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium">导入成功</div>
            <div className="text-sm mt-1">{status.message}</div>
          </AlertDescription>
        </Alert>
      )}

      {status.message && !status.isImporting && !status.error && !status.success && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
