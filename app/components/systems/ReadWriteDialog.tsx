"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Scan,
  Download,
  Upload,
  Loader2,
  CheckCircle,
  XCircle
} from "lucide-react"

interface ReadWriteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ReadWriteDialog({ open, onOpenChange }: ReadWriteDialogProps) {
  const [mode, setMode] = useState<"read" | "write">("read")
  const [data, setData] = useState("")
  const [status, setStatus] = useState<"idle" | "reading" | "writing" | "success" | "error">("idle")

  const handleReadWrite = async () => {
    setStatus(mode === "read" ? "reading" : "writing")
    
    // 模拟读写操作
    setTimeout(() => {
      if (mode === "read") {
        setData("模拟读取的数据: {studentId: 'STU001', name: '张三', cardType: 'NFC'}")
        setStatus("success")
      } else {
        setStatus("success")
      }
      
      setTimeout(() => {
        setStatus("idle")
        setData("")
      }, 2000)
    }, 1500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            NFC/RFID 读写操作
          </DialogTitle>
          <DialogDescription>
            读取或写入NFC/RFID卡片数据
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={mode === "read" ? "default" : "outline"}
              onClick={() => setMode("read")}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              读取
            </Button>
            <Button
              variant={mode === "write" ? "default" : "outline"}
              onClick={() => setMode("write")}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              写入
            </Button>
          </div>

          {mode === "write" && (
            <div>
              <Label htmlFor="writeData">写入数据</Label>
              <Textarea
                id="writeData"
                placeholder="输入要写入的数据 (JSON格式)"
                value={data}
                onChange={(e) => setData(e.target.value)}
                rows={4}
              />
            </div>
          )}

          {mode === "read" && data && (
            <div>
              <Label>读取的数据</Label>
              <div className="p-3 bg-gray-50 rounded-md font-mono text-sm">
                {data}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button 
              onClick={handleReadWrite} 
              disabled={status !== "idle"}
              className="flex items-center gap-2"
            >
              {status === "idle" && (
                <>
                  {mode === "read" ? <Download className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                  {mode === "read" ? "读取" : "写入"}
                </>
              )}
              {status === "reading" && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  读取中...
                </>
              )}
              {status === "writing" && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  写入中...
                </>
              )}
              {status === "success" && (
                <>
                  <CheckCircle className="h-4 w-4" />
                  成功
                </>
              )}
              {status === "error" && (
                <>
                  <XCircle className="h-4 w-4" />
                  失败
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

