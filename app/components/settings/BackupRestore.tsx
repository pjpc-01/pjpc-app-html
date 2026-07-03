"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  HardDrive,
  Download,
  RefreshCw,
  Shield,
  CheckCircle2,
  Clock,
  FolderOpen,
} from "lucide-react"
import { toast } from "sonner"

interface BackupInfo {
  name: string
  size: number
  sizeFormatted: string
  created: string
  localPath?: string
}

export default function BackupRestore() {
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [lastBackup, setLastBackup] = useState<BackupInfo | null>(null)

  const fetchBackups = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/backup")
      const data = await res.json()
      if (data.backups) {
        setBackups(data.backups)
        if (data.backups.length > 0) {
          setLastBackup(data.backups[0])
        }
      }
    } catch (err) {
      console.error("Failed to fetch backups:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBackups()
  }, [fetchBackups])

  const handleCreateBackup = async () => {
    try {
      setCreating(true)
      const res = await fetch("/api/backup", { method: "POST" })
      const data = await res.json()
      if (data.success) {
        toast.success(`备份成功！${data.backup.sizeFormatted}`)
        fetchBackups()
      } else {
        toast.error(`备份失败: ${data.error}`)
      }
    } catch (err: any) {
      toast.error(`备份失败: ${err.message}`)
    } finally {
      setCreating(false)
    }
  }

  const handleDownload = async (name: string) => {
    try {
      const res = await fetch(`/api/backup?download=${encodeURIComponent(name)}`)
      if (!res.ok) throw new Error("Download failed")
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = name
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success("下载开始")
    } catch (err: any) {
      toast.error(`下载失败: ${err.message}`)
    }
  }

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString("zh-CN")
  }

  const daysSince = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">备份恢复</h3>
          <p className="text-sm text-gray-500">一键备份数据到本地 + OneDrive 云盘</p>
        </div>
        <Button
          onClick={handleCreateBackup}
          disabled={creating}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
        >
          {creating ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              备份中...
            </>
          ) : (
            <>
              <HardDrive className="h-4 w-4" />
              一键备份
            </>
          )}
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${lastBackup ? "bg-green-100" : "bg-gray-100"}`}>
                {lastBackup ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Clock className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">最近备份</p>
                <p className="font-medium text-gray-900">
                  {lastBackup ? `${daysSince(lastBackup.created)}天前` : "暂无备份"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <FolderOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">本地备份</p>
                <p className="font-medium text-gray-900">{backups.length} 个文件</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Download className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">恢复方式</p>
                <p className="font-medium text-gray-900 text-sm">下载后解压覆盖</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Info */}
      <Card className="border-indigo-200 bg-indigo-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-indigo-600 mt-0.5" />
            <div className="text-sm text-indigo-800">
              <p className="font-medium mb-1">备份包含：</p>
              <p>• 所有业务数据（学生、教师、费用、发票等）</p>
              <p>• 迁移记录和数据库结构</p>
              <p className="mt-2 text-indigo-600">
                本地保留最近 7 个备份，可从下方列表下载
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            备份历史
          </CardTitle>
          <CardDescription>点击下载按钮恢复数据</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <HardDrive className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>暂无备份记录</p>
              <p className="text-sm">点击"一键备份"创建第一个备份</p>
            </div>
          ) : (
            <div className="space-y-2">
              {backups.map((backup) => (
                <div
                  key={backup.name}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <HardDrive className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{backup.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(backup.created)} · {backup.sizeFormatted}
                      </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(backup.name)}
                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800"
                  >
                    <Download className="h-4 w-4" />
                    下载
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
