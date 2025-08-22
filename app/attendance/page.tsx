"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  CreditCard, 
  User, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Monitor,
  Smartphone,
  Settings,
  ArrowLeft,
  Search
} from "lucide-react"
import Link from "next/link"

export default function AttendancePage() {
  const searchParams = useSearchParams()
  const centerId = searchParams.get('center')
  
  const [isNFCSupported, setIsNFCSupported] = useState(false)
  const [isReading, setIsReading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // 手动打卡相关状态
  const [showManualInput, setShowManualInput] = useState(false)
  const [studentId, setStudentId] = useState("")
  const [isManualProcessing, setIsManualProcessing] = useState(false)

  // 检查NFC支持
  useEffect(() => {
    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      setIsNFCSupported(true)
    }
  }, [])

  const startNFCReading = async () => {
    setIsReading(true)
    setError(null)
    setSuccess(null)

    try {
      // 模拟NFC读取过程
      await new Promise(resolve => setTimeout(resolve, 2000))
      setSuccess("NFC打卡成功！学生信息已记录")
    } catch (err) {
      setError("NFC打卡失败，请重试")
    } finally {
      setIsReading(false)
    }
  }

  const handleManualCheckIn = async () => {
    if (!studentId.trim()) {
      setError("请输入学生ID")
      return
    }

    setIsManualProcessing(true)
    setError(null)
    setSuccess(null)

    try {
      // 模拟手动打卡过程
      await new Promise(resolve => setTimeout(resolve, 1500))
      setSuccess(`手动打卡成功！学生ID: ${studentId}`)
      setStudentId("") // 清空输入
      setShowManualInput(false) // 隐藏输入框
    } catch (err) {
      setError("手动打卡失败，请重试")
    } finally {
      setIsManualProcessing(false)
    }
  }

  const toggleManualInput = () => {
    setShowManualInput(!showManualInput)
    setError(null)
    setSuccess(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 返回按钮 */}
        <div className="flex items-center gap-4">
          <Link href="/checkin">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              返回选择
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">统一打卡系统</h1>
            <p className="text-gray-600">多设备支持 - 实时数据同步</p>
            {centerId && (
              <p className="text-sm text-gray-500">中心ID: {centerId}</p>
            )}
          </div>
        </div>

        {/* 系统状态 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">网络连接</span>
              </div>
              <div className="mt-2">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  已连接
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">NFC支持</span>
              </div>
              <div className="mt-2">
                {isNFCSupported ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    已支持
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    不支持
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium">读取状态</span>
              </div>
              <div className="mt-2">
                {isReading || isManualProcessing ? (
                  <Badge variant="default" className="bg-blue-100 text-blue-800">
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    处理中
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    待机中
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 打卡控制 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              打卡控制
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Button 
                  onClick={startNFCReading}
                  disabled={isReading || isManualProcessing || !isNFCSupported}
                  className="flex items-center gap-2"
                >
                  <Smartphone className="h-4 w-4" />
                  {isReading ? "读取中..." : "开始NFC打卡"}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={toggleManualInput}
                  disabled={isReading || isManualProcessing}
                  className="flex items-center gap-2"
                >
                  <Monitor className="h-4 w-4" />
                  {showManualInput ? "取消手动打卡" : "手动打卡"}
                </Button>
              </div>

              {/* 手动打卡输入框 */}
              {showManualInput && (
                <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                  <div className="space-y-2">
                    <Label htmlFor="studentId" className="text-sm font-medium">
                      学生ID
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="studentId"
                        type="text"
                        placeholder="请输入学生ID"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleManualCheckIn()
                          }
                        }}
                        disabled={isManualProcessing}
                      />
                      <Button 
                        onClick={handleManualCheckIn}
                        disabled={isManualProcessing || !studentId.trim()}
                        className="flex items-center gap-2"
                      >
                        <Search className="h-4 w-4" />
                        {isManualProcessing ? "处理中..." : "打卡"}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    输入学生ID后按回车键或点击打卡按钮
                  </p>
                </div>
              )}
              
              <div className="text-sm text-gray-600">
                <p>• 将NFC卡片或手机靠近读卡器</p>
                <p>• 系统会自动识别学生信息并记录考勤</p>
                <p>• 支持多设备同时工作</p>
                <p>• 也可以手动输入学生ID进行打卡</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 错误和成功提示 */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* 系统信息 */}
        <Card>
          <CardHeader>
            <CardTitle>系统信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">中心ID:</span>
                <span className="ml-2 font-medium">{centerId || '未指定'}</span>
              </div>
              <div>
                <span className="text-gray-600">系统状态:</span>
                <span className="ml-2 font-medium text-green-600">正常运行</span>
              </div>
              <div>
                <span className="text-gray-600">数据库:</span>
                <span className="ml-2 font-medium">PocketBase</span>
              </div>
              <div>
                <span className="text-gray-600">同步状态:</span>
                <span className="ml-2 font-medium text-green-600">实时同步</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 功能说明 */}
        <Card>
          <CardHeader>
            <CardTitle>功能说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>支持NFC卡片和智能手机打卡</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>多设备同时工作，数据实时同步</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>自动识别学生信息，无需手动输入</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>考勤记录自动保存到云端数据库</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>支持手动输入学生ID进行打卡</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
