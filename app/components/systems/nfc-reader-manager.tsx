"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Keyboard,
  Zap,
  Settings,
  Play,
  Square,
  Eye,
  EyeOff
} from "lucide-react"

interface NFCReaderManagerProps {
  center: string
  onCardDetected?: (data: string) => void
  onError?: (error: string) => void
}

export default function NFCReaderManager({ 
  center, 
  onCardDetected, 
  onError 
}: NFCReaderManagerProps) {
  const [isEnabled, setIsEnabled] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [lastCardData, setLastCardData] = useState<string | null>(null)
  const [lastProcessTime, setLastProcessTime] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [inputBuffer, setInputBuffer] = useState<string>('')
  const [lastInputTime, setLastInputTime] = useState<number>(0)
  const [showDebug, setShowDebug] = useState(false)

  // 监听键盘输入
  useEffect(() => {
    if (!isEnabled) return

    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isListening) return

      const currentTime = Date.now()
      
      // 如果输入间隔超过1秒，清空缓冲区
      if (currentTime - lastInputTime > 1000) {
        setInputBuffer('')
      }
      
      setLastInputTime(currentTime)
      
      // 处理回车键
      if (event.key === 'Enter') {
        event.preventDefault()
        
        if (inputBuffer.trim().length > 0) {
          console.log("[NFC管理器] 检测到卡片数据:", inputBuffer.trim())
          processNFCCard(inputBuffer.trim())
          setInputBuffer('')
        }
      } else if (event.key.length === 1) {
        // 只处理单个字符
        setInputBuffer(prev => prev + event.key)
      }
    }

    if (isEnabled) {
      document.addEventListener('keydown', handleKeyPress)
      setIsListening(true)
      console.log("[NFC管理器] 开始监听键盘输入")
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress)
      setIsListening(false)
      console.log("[NFC管理器] 停止监听键盘输入")
    }
  }, [isEnabled, inputBuffer, lastInputTime])

  // 处理NFC卡片数据
  const processNFCCard = async (cardData: string) => {
    try {
      setError(null)
      setSuccess(null)
      
      console.log("[NFC管理器] 处理卡片数据:", cardData)

      // 使用增强的分析API
      const res = await fetch("/api/nfc/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nfcData: cardData,
          deviceInfo: {
            deviceId: 'keyboard-nfc-reader',
            deviceName: '键盘模拟NFC读卡器'
          },
          centerId: center,
          timestamp: new Date().toISOString(),
        }),
      })

      if (res.ok) {
        const result = await res.json()
        console.log("[NFC管理器] 考勤处理成功:", result)
        
        if (result.success) {
          setLastCardData(cardData)
          setLastProcessTime(new Date())
          setSuccess(`✅ ${result.user.type === 'student' ? '学生' : '教师'} ${result.user.name} 考勤成功`)
          
          // 调用外部回调
          if (onCardDetected) {
            onCardDetected(cardData)
          }
        } else {
          setError(`❌ ${result.message}`)
          if (onError) {
            onError(result.message)
          }
        }
      } else {
        const errorResult = await res.json()
        console.warn("[NFC管理器] 考勤处理失败:", errorResult.message)
        setError(`❌ ${errorResult.message}`)
        if (onError) {
          onError(errorResult.message)
        }
      }
    } catch (err: any) {
      console.error("[NFC管理器] 处理卡片失败:", err)
      setError(`❌ 处理失败: ${err.message}`)
      if (onError) {
        onError(err.message)
      }
    }
  }

  // 手动测试
  const testWithMockData = () => {
    const mockData = '279331994012644548'
    processNFCCard(mockData)
  }

  // 清空结果
  const clearResults = () => {
    setLastCardData(null)
    setLastProcessTime(null)
    setError(null)
    setSuccess(null)
    setInputBuffer('')
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            NFC读卡器管理
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDebug(!showDebug)}
            >
              {showDebug ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Switch
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 状态显示 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="flex items-center gap-2">
              <Keyboard className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">监听状态</span>
            </div>
            <div className="mt-1">
              <Badge variant={isListening ? 'default' : 'secondary'}>
                {isListening ? '监听中' : '已停止'}
              </Badge>
            </div>
          </div>

          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">输入缓冲区</span>
            </div>
            <div className="mt-1">
              <Badge variant="default" className="bg-green-100 text-green-800">
                {inputBuffer.length} 字符
              </Badge>
            </div>
          </div>

          <div className="p-3 bg-purple-50 border border-purple-200 rounded">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">中心</span>
            </div>
            <div className="mt-1">
              <Badge variant="default" className="bg-purple-100 text-purple-800">
                {center}
              </Badge>
            </div>
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex gap-2 justify-center">
          <Button 
            onClick={testWithMockData}
            variant="outline"
            className="h-10"
          >
            <Play className="h-4 w-4 mr-1" />
            测试
          </Button>
          
          <Button 
            onClick={clearResults}
            variant="outline"
            className="h-10"
          >
            <Square className="h-4 w-4 mr-1" />
            清空
          </Button>
        </div>

        {/* 调试信息 */}
        {showDebug && (
          <div className="p-3 bg-gray-50 border rounded">
            <h4 className="font-medium text-gray-800 mb-2">调试信息</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>监听状态: {isListening ? '是' : '否'}</div>
              <div>输入缓冲区: {inputBuffer}</div>
              <div>最后输入时间: {lastInputTime ? new Date(lastInputTime).toLocaleTimeString() : '无'}</div>
              <div>中心ID: {center}</div>
            </div>
          </div>
        )}

        {/* 结果显示 */}
        {(lastCardData || error || success) && (
          <div className="space-y-2">
            {lastCardData && (
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">最后检测到的卡片:</span>
                </div>
                <div className="mt-1 font-mono text-sm bg-white p-2 rounded border">
                  {lastCardData}
                </div>
                {lastProcessTime && (
                  <div className="mt-1 text-xs text-green-600">
                    处理时间: {lastProcessTime.toLocaleString()}
                  </div>
                )}
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* 使用说明 */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>💡 开启后自动监听键盘输入，读卡器扫描卡片后自动输入数据</div>
          <div>📱 支持所有浏览器，无需特殊API</div>
          <div>🎯 将卡片贴近读卡器，读卡器会自动输入数据并按回车</div>
        </div>
      </CardContent>
    </Card>
  )
}
