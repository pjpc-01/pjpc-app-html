"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Shield, 
  Radio, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  Key,
  Smartphone
} from "lucide-react"
import { scanNfcTag, findTeacherByNfcData } from '@/lib/nfc-scanner'

interface Teacher {
  id: string
  teacher_name: string
  name: string
  email: string
  teacherUrl?: string
  nfc_card_number?: string
  center?: string
}

interface TeacherAuthModalProps {
  isOpen: boolean
  onClose: () => void
  onTeacherAuthenticated: (teacher: Teacher) => void
  centerId?: string
}

export default function TeacherAuthModal({ 
  isOpen, 
  onClose, 
  onTeacherAuthenticated,
  centerId 
}: TeacherAuthModalProps) {
  const [authMethod, setAuthMethod] = useState<'nfc' | 'manual'>('nfc')
  const [teacherId, setTeacherId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [nfcSupported, setNfcSupported] = useState(false)
  const [nfcActive, setNfcActive] = useState(false)
  const [isHttps, setIsHttps] = useState(false)
  const nfcControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsHttps(window.location.protocol === "https:")
      setNfcSupported("NDEFReader" in window)
    }
  }, [])

  const validateTeacher = async (teacherData: string): Promise<Teacher | null> => {
    try {
      setLoading(true)
      setError("")

      // 尝试通过不同的方式查找教师
      const response = await fetch('/api/teachers')
      if (!response.ok) {
        throw new Error('获取教师数据失败')
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || '获取教师数据失败')
      }

      const teachers: Teacher[] = data.data.items || []
      
      console.log('🔍 开始处理教师身份验证数据:', teacherData)
      
      // 生成NFC数据格式变体（参考移动应用的_findTeacher方法）
      const nfcVariants = [
        teacherData,                    // 原始格式
        teacherData.toUpperCase(),      // 大写
        teacherData.toLowerCase(),      // 小写
        teacherData.replaceAll(':', ''), // 去除冒号
        teacherData.replaceAll('-', ''), // 去除连字符
        teacherData.replaceAll(' ', ''), // 去除空格
        teacherData.replace(/[^a-zA-Z0-9]/g, ''), // 只保留字母数字
      ]

      console.log('🔍 NFC数据格式变体:', nfcVariants)
      
      // 方法1: 优先通过nfc_card_number匹配（教师的主要身份识别方式）
      let foundTeacher = null
      for (const variant of nfcVariants) {
        foundTeacher = teachers.find(t => t.nfc_card_number === variant)
        if (foundTeacher) {
          console.log('✅ 通过nfc_card_number找到教师:', foundTeacher.name, '(格式:', variant, ')')
          break
        }
      }
      
      // 方法2: 通过nfc_tag_id匹配（备用方式）
      if (!foundTeacher) {
        for (const variant of nfcVariants) {
          foundTeacher = teachers.find(t => (t as any).nfc_tag_id === variant)
          if (foundTeacher) {
            console.log('✅ 通过nfc_tag_id找到教师:', foundTeacher.name, '(格式:', variant, ')')
            break
          }
        }
      }
      
      // 方法3: 通过教师ID匹配（备用方式）
      if (!foundTeacher) {
        for (const variant of nfcVariants) {
          foundTeacher = teachers.find(t => t.id === variant)
          if (foundTeacher) {
            console.log('✅ 通过教师ID找到教师:', foundTeacher.name, '(格式:', variant, ')')
            break
          }
        }
      }
      
      // 方法4: 通过teacherUrl匹配（兼容旧系统）
      if (!foundTeacher) {
        for (const variant of nfcVariants) {
          foundTeacher = teachers.find(t => t.teacherUrl === variant)
          if (foundTeacher) {
            console.log('✅ 通过teacherUrl找到教师:', foundTeacher.name, '(格式:', variant, ')')
            break
          }
        }
      }
      
      // 方法5: 通过URL包含关系匹配
      if (!foundTeacher) {
        for (const variant of nfcVariants) {
          foundTeacher = teachers.find(t => 
            t.teacherUrl && variant.includes(t.teacherUrl.split('/').pop() || '')
          )
          if (foundTeacher) {
            console.log('✅ 通过URL包含关系找到教师:', foundTeacher.name, '(格式:', variant, ')')
            break
          }
        }
      }
      
      // 方法6: 通过教师姓名匹配（手动输入时）
      if (!foundTeacher && authMethod === 'manual') {
        foundTeacher = teachers.find(t => 
          t.teacher_name?.toLowerCase().includes(teacherData.toLowerCase()) ||
          t.name?.toLowerCase().includes(teacherData.toLowerCase())
        )
        if (foundTeacher) {
          console.log('✅ 通过教师姓名找到教师:', foundTeacher.name)
        }
      }

      if (!foundTeacher) {
        console.log('❌ 未找到匹配的教师信息')
        console.log('🔍 调试信息:')
        console.log('  输入数据:', teacherData)
        console.log('  教师总数:', teachers.length)
        console.log('  有nfc_card_number的教师数:', teachers.filter(t => t.nfc_card_number).length)
        console.log('  有nfc_tag_id的教师数:', teachers.filter(t => (t as any).nfc_tag_id).length)
        console.log('  可用教师NFC数据:', teachers.map(t => ({ 
          id: t.id, 
          name: t.name, 
          nfc_card_number: t.nfc_card_number,
          nfc_tag_id: (t as any).nfc_tag_id
        })).filter(t => t.nfc_card_number || t.nfc_tag_id))
        throw new Error('未找到匹配的教师信息')
      }

      // 如果指定了中心，检查教师是否属于该中心
      if (centerId && foundTeacher.center && foundTeacher.center !== centerId) {
        console.log(`教师 ${foundTeacher.teacher_name || foundTeacher.name} 不属于中心 ${centerId}`)
        // 可以选择是否允许跨中心操作，这里暂时允许
      }

      return foundTeacher
    } catch (err: any) {
      console.error('教师验证失败:', err)
      setError(err.message || '教师验证失败')
      return null
    } finally {
      setLoading(false)
    }
  }

  const handleNfcScan = async () => {
    if (!isHttps) {
      setError("NFC 需要 HTTPS 环境")
      return
    }
    if (!nfcSupported) {
      setError("此设备或浏览器不支持 NFC")
      return
    }

    try {
      // 终止上一次扫描
      if (nfcControllerRef.current) {
        nfcControllerRef.current.abort()
      }
      const controller = new AbortController()
      nfcControllerRef.current = controller

      // @ts-ignore
      const reader = new NDEFReader()
      setNfcActive(true)
      await reader.scan({ signal: controller.signal })

      reader.onreadingerror = () => {
        setError("NFC 读取失败，请重试")
        setNfcActive(false)
      }

      reader.onreading = async (event: any) => {
        try {
          const { message } = event
          let nfcData = ""
          
          console.log('🔍 NFC读取事件:', event)
          console.log('📋 NFC记录数量:', message.records.length)
          
          // 解析 NDEF 记录
          for (const record of message.records) {
            console.log('📋 处理记录:', {
              recordType: record.recordType,
              dataLength: record.data.length,
              data: record.data
            })
            
            if (record.recordType === "url") {
              nfcData = decodeNfcText(record.data)
              console.log('✅ 从URL记录读取数据:', nfcData)
              break
            }
            if (record.recordType === "text") {
              const txt = decodeNfcText(record.data)
              console.log('✅ 从文本记录读取数据:', txt)
              if (txt?.startsWith("http")) {
                nfcData = txt
              } else {
                // 如果不是URL，直接使用文本内容作为NFC数据
                nfcData = txt
              }
            }
            // 处理其他类型的记录
            if (record.recordType === "empty" || record.recordType === "unknown") {
              // 对于空记录或未知类型，尝试直接使用数据
              const txt = decodeNfcText(record.data)
              if (txt && txt.trim()) {
                nfcData = txt
                console.log('✅ 从其他记录读取数据:', nfcData)
              }
            }
          }

          if (!nfcData) {
            console.log('❌ 未读取到有效数据')
            setError("未读取到有效数据，请确认卡片已正确写入")
            return
          }

          console.log('🔍 NFC读取的数据:', nfcData)
          const teacher = await validateTeacher(nfcData)
          if (teacher) {
            onTeacherAuthenticated(teacher)
            onClose()
          }
        } catch (e) {
          console.error('NFC数据处理失败:', e)
          setError("解析NFC数据出错: " + (e as Error).message)
        } finally {
          setNfcActive(false)
        }
      }
    } catch (err: any) {
      console.error(err)
      setError(err?.message || "启动NFC失败")
      setNfcActive(false)
    }
  }

  const stopNfcScan = () => {
    if (nfcControllerRef.current) {
      nfcControllerRef.current.abort()
      nfcControllerRef.current = null
    }
    setNfcActive(false)
  }

  const decodeNfcText = (data: any) => {
    try {
      const dec = new TextDecoder("utf-8")
      // @ts-ignore
      const buf = data?.buffer ? data.buffer : data
      return dec.decode(buf)
    } catch {
      return ""
    }
  }

  const handleManualAuth = async () => {
    if (!teacherId.trim()) {
      setError("请输入教师ID或姓名")
      return
    }

    const teacher = await validateTeacher(teacherId.trim())
    if (teacher) {
      onTeacherAuthenticated(teacher)
      onClose()
    }
  }

  const resetModal = () => {
    setTeacherId("")
    setError("")
    setNfcActive(false)
    if (nfcControllerRef.current) {
      nfcControllerRef.current.abort()
      nfcControllerRef.current = null
    }
  }

  useEffect(() => {
    if (!isOpen) {
      resetModal()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            教师身份验证
          </CardTitle>
          <CardDescription>
            请验证教师身份后才能进行学生考勤操作
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 认证方式选择 */}
          <div className="flex gap-2">
            <Button
              variant={authMethod === 'nfc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAuthMethod('nfc')}
              className="flex-1"
            >
              <Radio className="h-4 w-4 mr-2" />
              NFC卡片
            </Button>
            <Button
              variant={authMethod === 'manual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAuthMethod('manual')}
              className="flex-1"
            >
              <Key className="h-4 w-4 mr-2" />
              手动输入
            </Button>
          </div>

          {/* NFC认证 */}
          {authMethod === 'nfc' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Smartphone className="h-4 w-4" />
                <span>设备支持: {nfcSupported ? '✅' : '❌'}</span>
                <span>HTTPS: {isHttps ? '✅' : '❌'}</span>
              </div>
              
              {!isHttps && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">需要HTTPS环境才能使用NFC功能</span>
                  </div>
                </div>
              )}

              <Button 
                onClick={nfcActive ? stopNfcScan : handleNfcScan}
                disabled={!isHttps || !nfcSupported || loading}
                className="w-full"
                variant={nfcActive ? "destructive" : "default"}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    验证中...
                  </>
                ) : nfcActive ? (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    取消扫描
                  </>
                ) : (
                  <>
                    <Radio className="h-4 w-4 mr-2" />
                    扫描教师NFC卡片
                  </>
                )}
              </Button>

              {nfcActive && (
                <div className="text-center text-sm text-blue-600">
                  请将教师NFC卡片贴近设备...
                </div>
              )}
            </div>
          )}

          {/* 手动认证 */}
          {authMethod === 'manual' && (
            <div className="space-y-3">
              <div>
                <Input
                  placeholder="输入教师ID、姓名或NFC卡号"
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleManualAuth()
                    }
                  }}
                />
              </div>
              <Button 
                onClick={handleManualAuth}
                disabled={!teacherId.trim() || loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    验证中...
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4 mr-2" />
                    验证教师身份
                  </>
                )}
              </Button>
            </div>
          )}

          {/* 错误信息 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <XCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              取消
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
