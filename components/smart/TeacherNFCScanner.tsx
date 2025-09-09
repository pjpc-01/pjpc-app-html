"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  User,
  Shield
} from "lucide-react"

interface Teacher {
  id: string
  name: string
  email: string
  nfc_card_number: string
  position: string
  department: string
  status: string
}

interface TeacherNFCScannerProps {
  onTeacherFound: (teacher: Teacher) => void
  onError: (error: string) => void
  centerId?: string
}

export default function TeacherNFCScanner({ 
  onTeacherFound, 
  onError, 
  centerId 
}: TeacherNFCScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [isHttps, setIsHttps] = useState(false)
  const [nfcSupported, setNfcSupported] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [lastScannedCard, setLastScannedCard] = useState<string | null>(null)
  
  const nfcControllerRef = useRef<AbortController | null>(null)

  // 检查NFC支持
  useEffect(() => {
    const checkNFCSupport = () => {
      // 检查HTTPS
      const https = location.protocol === 'https:' || location.hostname === 'localhost'
      setIsHttps(https)
      
      // 检查NFC支持
      const supported = 'NDEFReader' in window
      setNfcSupported(supported)
      
      if (!https) {
        setError('NFC功能需要HTTPS环境才能使用')
      } else if (!supported) {
        setError('当前设备不支持NFC功能')
      }
    }

    checkNFCSupport()
  }, [])

  // 开始NFC扫描
  const startNFCScan = async () => {
    if (!nfcSupported || !isHttps) {
      onError('NFC功能不可用')
      return
    }

    setIsScanning(true)
    setError(null)
    setSuccess(null)

    try {
      // 创建新的AbortController
      nfcControllerRef.current = new AbortController()
      
      // 创建NDEFReader
      const reader = new (window as any).NDEFReader()
      
      // 开始扫描
      await reader.scan({ signal: nfcControllerRef.current.signal })
      
      console.log('✅ NFC扫描已开始')
      
      // 监听NFC消息
      reader.addEventListener('reading', async (event: any) => {
        try {
          const message = event.message
          const records = message.records
          
          if (records.length > 0) {
            const record = records[0]
            let cardData = ''
            
            if (record.recordType === 'text') {
              const decoder = new TextDecoder(record.encoding)
              cardData = decoder.decode(record.data)
            } else if (record.recordType === 'url') {
              const decoder = new TextDecoder()
              cardData = decoder.decode(record.data)
            } else {
              // 处理其他类型的记录
              const decoder = new TextDecoder()
              cardData = decoder.decode(record.data)
            }
            
            console.log('📱 NFC卡片数据:', cardData)
            
            // 避免重复扫描同一张卡
            if (cardData === lastScannedCard) {
              console.log('⚠️ 重复扫描同一张卡，忽略')
              return
            }
            
            setLastScannedCard(cardData)
            
            // 查找教师信息
            await findTeacherByNFC(cardData)
            
          }
        } catch (error: any) {
          console.error('❌ 处理NFC数据失败:', error)
          setError('处理NFC数据失败: ' + error.message)
        }
      })
      
      // 监听扫描错误
      reader.addEventListener('readingerror', (event: any) => {
        console.error('❌ NFC扫描错误:', event)
        setError('NFC扫描失败: ' + event.message)
        setIsScanning(false)
      })
      
    } catch (error: any) {
      console.error('❌ 启动NFC扫描失败:', error)
      setError('启动NFC扫描失败: ' + error.message)
      setIsScanning(false)
    }
  }

  // 停止NFC扫描
  const stopNFCScan = () => {
    if (nfcControllerRef.current) {
      nfcControllerRef.current.abort()
      nfcControllerRef.current = null
    }
    setIsScanning(false)
    console.log('🛑 NFC扫描已停止')
  }

  // 根据NFC卡号查找教师
  const findTeacherByNFC = async (cardNumber: string) => {
    try {
      setError(null)
      
      // 调用教师API查找
      const response = await fetch(`/api/teachers?nfcCard=${encodeURIComponent(cardNumber)}`)
      const data = await response.json()
      
      if (data.success && data.data && data.data.length > 0) {
        const teacher = data.data[0]
        
        // 检查教师状态
        if (teacher.status !== 'active') {
          setError(`教师 ${teacher.name} 状态异常，无法进行考勤`)
          onError(`教师状态异常: ${teacher.status}`)
          return
        }
        
        // 检查是否属于当前中心
        if (centerId && teacher.center_id && teacher.center_id !== centerId) {
          setError(`教师 ${teacher.name} 不属于当前中心`)
          onError(`教师不属于当前中心`)
          return
        }
        
        console.log('✅ 找到教师:', teacher)
        setSuccess(`找到教师: ${teacher.name}`)
        
        // 停止扫描
        stopNFCScan()
        
        // 回调成功
        onTeacherFound(teacher)
        
      } else {
        setError('未找到对应的教师信息')
        onError('未找到对应的教师信息')
      }
      
    } catch (error: any) {
      console.error('❌ 查找教师失败:', error)
      setError('查找教师失败: ' + error.message)
      onError('查找教师失败: ' + error.message)
    }
  }

  // 重置组件
  const resetScanner = () => {
    stopNFCScan()
    setError(null)
    setSuccess(null)
    setLastScannedCard(null)
  }

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (nfcControllerRef.current) {
        nfcControllerRef.current.abort()
      }
    }
  }, [])

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          教师NFC扫描
        </CardTitle>
        <CardDescription>
          请将教师NFC卡靠近设备进行扫描
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* NFC支持状态 */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">NFC状态</span>
          </div>
          <Badge variant={nfcSupported && isHttps ? "default" : "secondary"}>
            {nfcSupported && isHttps ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                支持
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                不支持
              </>
            )}
          </Badge>
        </div>

        {/* 错误提示 */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 成功提示 */}
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* 扫描按钮 */}
        <div className="flex gap-2">
          {!isScanning ? (
            <Button
              onClick={startNFCScan}
              disabled={!nfcSupported || !isHttps}
              className="flex-1"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              开始扫描
            </Button>
          ) : (
            <Button
              onClick={stopNFCScan}
              variant="secondary"
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              停止扫描
            </Button>
          )}
          
          <Button
            onClick={resetScanner}
            variant="outline"
            size="sm"
          >
            重置
          </Button>
        </div>

        {/* 扫描状态 */}
        {isScanning && (
          <div className="text-center py-4">
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>正在扫描NFC卡片...</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              请将教师NFC卡靠近设备
            </p>
          </div>
        )}

        {/* 使用说明 */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• 确保设备支持NFC功能</p>
          <p>• 在HTTPS环境下使用</p>
          <p>• 将NFC卡靠近设备背面</p>
          <p>• 扫描成功后会自动停止</p>
        </div>
      </CardContent>
    </Card>
  )
}
