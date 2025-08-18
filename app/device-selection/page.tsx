"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Usb, 
  Smartphone, 
  CheckCircle, 
  ArrowRight,
  Monitor,
  Zap,
  Wifi,
  Settings
} from "lucide-react"
import USBReaderInterface from "../components/systems/usb-reader-interface"
import MobileNFCInterface from "../components/systems/mobile-nfc-interface"

type DeviceType = 'usb' | 'mobile' | null

export default function DeviceSelectionPage() {
  const [selectedDevice, setSelectedDevice] = useState<DeviceType>(null)

  const deviceOptions = [
    {
      id: 'usb',
      name: 'USB读卡器',
      icon: Usb,
      description: '使用USB连接的NFC/RFID读卡器',
      features: [
        '支持PC/SC标准',
        '稳定可靠',
        '适合固定位置使用',
        '支持多种卡片类型'
      ],
      requirements: [
        'USB读卡器设备',
        'Chrome浏览器',
        'HTTPS环境'
      ],
      color: 'blue'
    },
    {
      id: 'mobile',
      name: '手机NFC',
      icon: Smartphone,
      description: '使用手机内置的NFC功能',
      features: [
        '无需额外设备',
        '便携性强',
        '支持移动打卡',
        '实时同步数据'
      ],
      requirements: [
        '支持NFC的手机',
        'HTTPS环境',
        '现代浏览器'
      ],
      color: 'green'
    }
  ]

  if (selectedDevice) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setSelectedDevice(null)}
            className="mb-4"
          >
            ← 返回设备选择
          </Button>
          
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {selectedDevice === 'usb' ? (
              <>
                <Usb className="h-6 w-6 text-blue-600" />
                USB读卡器打卡
              </>
            ) : (
              <>
                <Smartphone className="h-6 w-6 text-green-600" />
                手机NFC打卡
              </>
            )}
          </h1>
        </div>

        {selectedDevice === 'usb' && <USBReaderInterface />}
        {selectedDevice === 'mobile' && <MobileNFCInterface />}
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">选择打卡设备</h1>
        <p className="text-gray-600">请选择您要使用的打卡设备类型</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {deviceOptions.map((device) => {
          const Icon = device.icon
          return (
            <Card 
              key={device.id}
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-300"
              onClick={() => setSelectedDevice(device.id as DeviceType)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg bg-${device.color}-100`}>
                      <Icon className={`h-6 w-6 text-${device.color}-600`} />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{device.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {device.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* 功能特点 */}
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-1">
                      <Zap className="h-4 w-4" />
                      功能特点
                    </h4>
                    <ul className="space-y-1">
                      {device.features.map((feature, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 使用要求 */}
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-1">
                      <Settings className="h-4 w-4" />
                      使用要求
                    </h4>
                    <ul className="space-y-1">
                      {device.requirements.map((requirement, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          {requirement}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 推荐场景 */}
                  <div className="pt-2">
                    <Badge 
                      variant="outline" 
                      className={`text-${device.color}-600 border-${device.color}-200`}
                    >
                      {device.id === 'usb' ? '适合办公室使用' : '适合移动打卡'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 设备对比 */}
      <Card className="mt-8 max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            设备对比
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">对比项目</th>
                  <th className="text-center py-2">USB读卡器</th>
                  <th className="text-center py-2">手机NFC</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 font-medium">设备成本</td>
                  <td className="text-center py-2">需要购买读卡器</td>
                  <td className="text-center py-2">无需额外设备</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-medium">便携性</td>
                  <td className="text-center py-2">固定位置使用</td>
                  <td className="text-center py-2">高度便携</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-medium">稳定性</td>
                  <td className="text-center py-2">非常稳定</td>
                  <td className="text-center py-2">依赖手机状态</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-medium">适用场景</td>
                  <td className="text-center py-2">办公室、固定打卡点</td>
                  <td className="text-center py-2">移动打卡、临时使用</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">技术要求</td>
                  <td className="text-center py-2">需要USB驱动</td>
                  <td className="text-center py-2">需要HTTPS环境</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 使用建议 */}
      <Card className="mt-6 max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            使用建议
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-blue-600">选择USB读卡器，如果您：</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>需要在固定位置进行打卡</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>希望获得最稳定的打卡体验</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>有预算购买专业的读卡设备</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>需要支持多种卡片类型</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-green-600">选择手机NFC，如果您：</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>希望随时随地都能打卡</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>不想购买额外的硬件设备</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>需要临时或移动打卡功能</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>手机支持NFC功能</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

