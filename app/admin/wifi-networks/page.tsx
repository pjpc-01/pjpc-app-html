"use client"

import WiFiNetworkManager from "@/components/admin/WiFiNetworkManager"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function WiFiNetworksPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 页面标题 */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                返回主页
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">WiFi网络管理</h1>
              <p className="text-gray-600">管理学生WiFi网络配置和验证</p>
            </div>
          </div>
        </div>
        <WiFiNetworkManager />
      </div>
    </div>
  )
}
