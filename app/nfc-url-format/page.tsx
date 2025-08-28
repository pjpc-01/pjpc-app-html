"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Smartphone, 
  User, 
  GraduationCap,
  Copy,
  CheckCircle,
  AlertCircle,
  Info,
  Link as LinkIcon
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function NFCUrlFormatPage() {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedUrl(label)
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  const studentUrlExample = "https://yourdomain.com/nfc-checkin?url=https://yourdomain.com/attendance?center=wx01&student_id=ST001&student_name=张三&type=check-in&method=nfc"
  const teacherUrlExample = "https://yourdomain.com/nfc-checkin?url=https://yourdomain.com/teacher-checkin?center=wx01&teacher_id=T001&teacher_name=李老师&type=check-in&method=nfc"

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <Smartphone className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">NFC URL格式说明</h1>
          <p className="text-gray-600">了解如何配置NFC卡片以实现自动打卡功能</p>
        </div>

        {/* 返回链接 */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <LinkIcon className="h-4 w-4 mr-2" />
            返回首页
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 学生NFC配置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                学生NFC配置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">URL格式说明</h4>
                <p className="text-sm text-gray-600 mb-3">
                  学生NFC卡片应包含以下URL格式，系统会自动识别并跳转到学生打卡页面
                </p>
                
                <div className="bg-gray-100 p-3 rounded-md">
                  <div className="text-xs font-mono text-gray-700 break-all">
                    {studentUrlExample}
                  </div>
                </div>
                
                <Button 
                  onClick={() => copyToClipboard(studentUrlExample, 'student')}
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                >
                  {copiedUrl === 'student' ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      复制URL
                    </>
                  )}
                </Button>
              </div>

              <div>
                <h4 className="font-medium mb-2">必需参数</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">center</Badge>
                    <span className="text-sm text-gray-600">中心代码 (如: wx01, wx02)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">student_id</Badge>
                    <span className="text-sm text-gray-600">学生ID</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">student_name</Badge>
                    <span className="text-sm text-gray-600">学生姓名</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">可选参数</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">type</Badge>
                    <span className="text-sm text-gray-600">打卡类型 (check-in/check-out)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">method</Badge>
                    <span className="text-sm text-gray-600">打卡方式 (nfc)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 教师NFC配置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-green-600" />
                教师NFC配置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">URL格式说明</h4>
                <p className="text-sm text-gray-600 mb-3">
                  教师NFC卡片应包含以下URL格式，系统会自动识别并跳转到教师打卡页面
                </p>
                
                <div className="bg-gray-100 p-3 rounded-md">
                  <div className="text-xs font-mono text-gray-700 break-all">
                    {teacherUrlExample}
                  </div>
                </div>
                
                <Button 
                  onClick={() => copyToClipboard(teacherUrlExample, 'teacher')}
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                >
                  {copiedUrl === 'teacher' ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      复制URL
                    </>
                  )}
                </Button>
              </div>

              <div>
                <h4 className="font-medium mb-2">必需参数</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">center</Badge>
                    <span className="text-sm text-gray-600">中心代码 (如: wx01, wx02)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">teacher_id</Badge>
                    <span className="text-sm text-gray-600">教师ID</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">teacher_name</Badge>
                    <span className="text-sm text-gray-600">教师姓名</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">可选参数</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">type</Badge>
                    <span className="text-sm text-gray-600">打卡类型 (check-in/check-out)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">method</Badge>
                    <span className="text-sm text-gray-600">打卡方式 (nfc)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 配置步骤 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              NFC卡片配置步骤
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">
                    1
                  </div>
                  <h4 className="font-medium text-blue-900">准备NFC卡片</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    使用支持NFC的手机或NFC卡片
                  </p>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">
                    2
                  </div>
                  <h4 className="font-medium text-green-900">写入URL</h4>
                  <p className="text-sm text-green-700 mt-1">
                    将上述URL格式写入NFC卡片
                  </p>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">
                    3
                  </div>
                  <h4 className="font-medium text-purple-900">测试打卡</h4>
                  <p className="text-sm text-purple-700 mt-1">
                    靠近读卡器测试自动识别
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 注意事项 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              注意事项
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>URL必须使用HTTPS协议，确保安全性</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>参数值需要进行URL编码，避免特殊字符问题</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>确保NFC卡片有足够的存储空间存储完整URL</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>建议使用NDEF格式存储URL，确保兼容性</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>定期检查URL有效性，避免链接失效</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 测试链接 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-blue-600" />
              测试NFC打卡
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-gray-600">点击下方链接测试NFC打卡功能</p>
              <div className="space-x-4">
                <Link href="/nfc-checkin?url=https://example.com/attendance?center=wx01&student_id=TEST001&student_name=测试学生&type=check-in&method=nfc">
                  <Button variant="default">
                    <User className="h-4 w-4 mr-2" />
                    测试学生打卡
                  </Button>
                </Link>
                <Link href="/nfc-checkin?url=https://example.com/teacher-checkin?center=wx01&teacher_id=TEST001&teacher_name=测试教师&type=check-in&method=nfc">
                  <Button variant="outline">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    测试教师打卡
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
