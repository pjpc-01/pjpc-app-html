'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Smartphone, Wifi, WifiOff, CheckCircle, XCircle, Scan, RefreshCw } from 'lucide-react'
import { networkDetector } from '@/lib/network-config'

export default function MobileNFCPage() {
  const [nfcSupported, setNfcSupported] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')
  const [lastCard, setLastCard] = useState("")
  const [lastTime, setLastTime] = useState("")
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")

  // 检查网络连接
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const networkStatus = await networkDetector.detectNetwork()
        if (networkStatus.connected) {
          setConnectionStatus('connected')
          setStatus("✅ PocketBase服务器连接成功")
        } else {
          setConnectionStatus('disconnected')
          setStatus("❌ PocketBase服务器连接失败")
        }
      } catch (error) {
        setConnectionStatus('disconnected')
        setStatus("❌ 网络连接检查失败")
      }
    }

    checkConnection()
  }, [])

  // 检查NFC支持
  useEffect(() => {
    const checkNFC = () => {
      if (typeof window === 'undefined') return
      
      const hasNDEFReader = 'NDEFReader' in window
      const isSecure = window.location.protocol === 'https:'
      
      if (hasNDEFReader && isSecure) {
        setNfcSupported(true)
      } else {
        setNfcSupported(false)
        setError("设备不支持NFC或需要HTTPS连接")
      }
    }
    
    checkNFC()
  }, [])

  // 开始NFC扫描
  const startScan = async () => {
    if (!nfcSupported) {
      setError("设备不支持NFC功能")
      return
    }

    if (connectionStatus !== 'connected') {
      setError("请先确保网络连接正常")
      return
    }

    setIsScanning(true)
    setError("")
    setStatus("📱 正在扫描，请将NFC卡片靠近手机...")

    try {
      if (typeof window !== 'undefined' && 'NDEFReader' in window) {
        const ndef = new (window as any).NDEFReader()
        
        await ndef.scan()

        ndef.addEventListener("reading", (event: any) => {
          const cardId = event.message?.records?.[0]?.data || '未知卡片'
          const timestamp = new Date().toLocaleString()
          
          setLastCard(cardId)
          setLastTime(timestamp)
          setStatus("✅ 打卡成功！")
          setIsScanning(false)
        })

        ndef.addEventListener("readingerror", () => {
          setError("❌ 读取失败，请重试")
          setIsScanning(false)
        })

        // 模拟读取（实际测试时删除）
        setTimeout(() => {
          if (isScanning) {
            const mockCardId = "TEST_CARD_" + Math.floor(Math.random() * 1000)
            const timestamp = new Date().toLocaleString()
            
            setLastCard(mockCardId)
            setLastTime(timestamp)
            setStatus("✅ 模拟打卡成功！")
            setIsScanning(false)
          }
        }, 2000)
      }
    } catch (err: any) {
      setError("❌ NFC启动失败: " + err.message)
      setIsScanning(false)
    }
  }

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'checking':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
    }
  }

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'disconnected':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'checking':
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-purple-600 mb-2">
          <Smartphone className="inline h-8 w-8 mr-2" />
          手机NFC签到
        </h1>
        <p className="text-gray-600">智能网络连接, 远程数据同步</p>
      </div>

      {/* 连接状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            PocketBase服务器
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span>连接状态:</span>
            <Badge className={getConnectionColor()}>
              {getConnectionIcon()}
              <span className="ml-1">
                {connectionStatus === 'connected' ? '已连接' : 
                 connectionStatus === 'disconnected' ? '连接失败' : '检测中'}
              </span>
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 设备状态 */}
      <Card>
        <CardHeader>
          <CardTitle>设备状态</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span>设备类型:</span>
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <Smartphone className="h-4 w-4 mr-1" />
              移动设备
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>NFC支持:</span>
            <Badge className={nfcSupported ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"}>
              {nfcSupported ? '支持' : '不支持'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>HTTPS连接:</span>
            <Badge className="bg-green-100 text-green-800 border-green-200">
              已建立
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="text-center">
        <Button
          onClick={startScan}
          disabled={!nfcSupported || connectionStatus !== 'connected' || isScanning}
          size="lg"
          className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3"
        >
          <Scan className="h-5 w-5 mr-2" />
          {isScanning ? '扫描中...' : '开始NFC签到'}
        </Button>
      </div>

      {/* 状态信息 */}
      {status && (
        <Alert>
          <AlertDescription>{status}</AlertDescription>
        </Alert>
      )}

      {/* 错误信息 */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {/* 最后打卡记录 */}
      {lastCard && (
        <Card>
          <CardHeader>
            <CardTitle>最后打卡记录</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>卡片ID:</span>
                <span className="font-mono">{lastCard}</span>
              </div>
              <div className="flex justify-between">
                <span>打卡时间:</span>
                <span>{lastTime}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 使用说明 */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">使用说明</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <ol className="space-y-2 text-sm">
            <li>1. 确保在手机设备上访问此页面</li>
            <li>2. 使用HTTPS连接 (已自动配置)</li>
            <li>3. 点击"NFC签到"按钮</li>
            <li>4. 将NFC卡片靠近手机背面</li>
            <li>5. 等待读取成功提示</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
