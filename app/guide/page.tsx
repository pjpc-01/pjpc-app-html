"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Usb, 
  Smartphone, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Zap,
  Wifi,
  Settings,
  ArrowRight,
  Download,
  Globe
} from "lucide-react"
import Link from "next/link"

export default function GuidePage() {
  return (
    <div className="container mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">打卡系统使用指南</h1>
        <p className="text-gray-600">详细说明如何使用USB读卡器和手机NFC进行打卡</p>
      </div>

      {/* 快速开始 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            快速开始
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-2">1</div>
              <h3 className="font-medium mb-2">选择设备</h3>
              <p className="text-sm text-gray-600">根据您的需求选择USB读卡器或手机NFC</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-2">2</div>
              <h3 className="font-medium mb-2">连接设备</h3>
              <p className="text-sm text-gray-600">按照说明连接并配置您的打卡设备</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-2">3</div>
              <h3 className="font-medium mb-2">开始打卡</h3>
              <p className="text-sm text-gray-600">将卡片靠近设备，系统自动记录打卡信息</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* USB读卡器指南 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Usb className="h-5 w-5 text-blue-600" />
            USB读卡器使用指南
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* 设备要求 */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                设备要求
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">USB读卡器（ACR122U、Omnikey等）</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">支持PC/SC标准的设备</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Chrome浏览器（推荐）</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">HTTPS环境</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">稳定的网络连接</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Windows/Mac/Linux系统</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 安装步骤 */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Download className="h-4 w-4" />
                安装步骤
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge className="bg-blue-100 text-blue-800">1</Badge>
                  <div>
                    <p className="font-medium">连接USB读卡器</p>
                    <p className="text-sm text-gray-600">将USB读卡器连接到电脑的USB端口</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="bg-blue-100 text-blue-800">2</Badge>
                  <div>
                    <p className="font-medium">安装驱动程序</p>
                    <p className="text-sm text-gray-600">根据设备型号安装相应的驱动程序</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="bg-blue-100 text-blue-800">3</Badge>
                  <div>
                    <p className="font-medium">打开打卡系统</p>
                    <p className="text-sm text-gray-600">在Chrome浏览器中访问打卡系统</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="bg-blue-100 text-blue-800">4</Badge>
                  <div>
                    <p className="font-medium">授权设备访问</p>
                    <p className="text-sm text-gray-600">允许浏览器访问USB设备</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 使用方法 */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                使用方法
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge className="bg-green-100 text-green-800">1</Badge>
                  <div>
                    <p className="font-medium">点击"连接设备"</p>
                    <p className="text-sm text-gray-600">在USB读卡器界面点击连接按钮</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="bg-green-100 text-green-800">2</Badge>
                  <div>
                    <p className="font-medium">选择USB读卡器</p>
                    <p className="text-sm text-gray-600">在弹出的设备列表中选择您的读卡器</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="bg-green-100 text-green-800">3</Badge>
                  <div>
                    <p className="font-medium">点击"读取卡片"</p>
                    <p className="text-sm text-gray-600">将NFC/RFID卡片靠近读卡器</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="bg-green-100 text-green-800">4</Badge>
                  <div>
                    <p className="font-medium">自动打卡</p>
                    <p className="text-sm text-gray-600">系统自动识别学生身份并记录打卡</p>
                  </div>
                </div>
              </div>
            </div>

            <Link href="/device-selection">
              <Button className="w-full">
                <Usb className="h-4 w-4 mr-2" />
                开始使用USB读卡器
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 手机NFC指南 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-green-600" />
            手机NFC使用指南
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* 设备要求 */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                设备要求
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">支持NFC的Android手机</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">iPhone 7及以上型号</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">现代浏览器（Chrome/Safari）</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">HTTPS环境</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">稳定的网络连接</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">已启用NFC功能</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 设置步骤 */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                设置步骤
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge className="bg-green-100 text-green-800">1</Badge>
                  <div>
                    <p className="font-medium">启用NFC功能</p>
                    <p className="text-sm text-gray-600">在手机设置中启用NFC功能</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="bg-green-100 text-green-800">2</Badge>
                  <div>
                    <p className="font-medium">打开浏览器</p>
                    <p className="text-sm text-gray-600">使用Chrome或Safari浏览器</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="bg-green-100 text-green-800">3</Badge>
                  <div>
                    <p className="font-medium">访问打卡系统</p>
                    <p className="text-sm text-gray-600">确保使用HTTPS协议访问</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="bg-green-100 text-green-800">4</Badge>
                  <div>
                    <p className="font-medium">授权NFC访问</p>
                    <p className="text-sm text-gray-600">允许网页访问NFC功能</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 使用方法 */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                使用方法
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge className="bg-blue-100 text-blue-800">1</Badge>
                  <div>
                    <p className="font-medium">点击"开始扫描"</p>
                    <p className="text-sm text-gray-600">在手机NFC界面点击扫描按钮</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="bg-blue-100 text-blue-800">2</Badge>
                  <div>
                    <p className="font-medium">靠近NFC卡片</p>
                    <p className="text-sm text-gray-600">将NFC卡片靠近手机背面</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="bg-blue-100 text-blue-800">3</Badge>
                  <div>
                    <p className="font-medium">等待读取完成</p>
                    <p className="text-sm text-gray-600">系统会自动读取卡片信息</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="bg-blue-100 text-blue-800">4</Badge>
                  <div>
                    <p className="font-medium">自动打卡</p>
                    <p className="text-sm text-gray-600">系统自动识别学生身份并记录打卡</p>
                  </div>
                </div>
              </div>
            </div>

            <Link href="/device-selection">
              <Button className="w-full">
                <Smartphone className="h-4 w-4 mr-2" />
                开始使用手机NFC
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 常见问题 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            常见问题
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-medium">Q: 为什么我的USB读卡器无法连接？</h4>
              <p className="text-sm text-gray-600 mt-1">
                A: 请检查以下几点：1) 确保设备已正确连接 2) 安装正确的驱动程序 3) 使用Chrome浏览器 4) 确保在HTTPS环境下访问
              </p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-medium">Q: 手机NFC功能无法使用怎么办？</h4>
              <p className="text-sm text-gray-600 mt-1">
                A: 请检查：1) 手机是否支持NFC功能 2) NFC功能是否已启用 3) 是否使用HTTPS协议 4) 浏览器是否支持Web NFC API
              </p>
            </div>
            <div className="border-l-4 border-yellow-500 pl-4">
              <h4 className="font-medium">Q: 打卡记录没有显示怎么办？</h4>
              <p className="text-sm text-gray-600 mt-1">
                A: 请检查：1) 网络连接是否正常 2) 卡片是否已正确注册 3) 设备是否在线 4) 是否有重复打卡限制
              </p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-medium">Q: 支持哪些类型的卡片？</h4>
              <p className="text-sm text-gray-600 mt-1">
                A: 系统支持ISO14443标准的NFC卡片，包括学生卡、公交卡、门禁卡等。RFID卡片支持125KHz频率的卡片。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 技术支持 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-purple-600" />
            技术支持
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">在线文档</h4>
              <p className="text-sm text-gray-600 mb-3">查看详细的技术文档和API说明</p>
              <Button variant="outline" size="sm">
                <Globe className="h-4 w-4 mr-2" />
                查看文档
              </Button>
            </div>
            <div>
              <h4 className="font-medium mb-2">联系支持</h4>
              <p className="text-sm text-gray-600 mb-3">遇到问题？联系我们的技术支持团队</p>
              <Button variant="outline" size="sm">
                <AlertTriangle className="h-4 w-4 mr-2" />
                联系支持
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

