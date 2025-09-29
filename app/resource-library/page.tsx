"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import PageLayout from "@/components/layouts/PageLayout"
import ResourceLibrary from "@/app/components/features/resource-library"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function ResourceLibraryPage() {
  const router = useRouter()
  const { userProfile } = useAuth()

  return (
    <PageLayout
      title="资源库系统"
      description="教学资源共享、学习资料下载和多媒体内容管理"
      userRole={userProfile?.role || 'teacher'}
      status="系统正常"
      background="bg-gray-50"
      actions={
        <Button 
          variant="outline" 
          onClick={() => router.push('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          返回仪表板
        </Button>
      }
    >
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">教学资源库</h1>
          <p className="text-gray-600">共享和管理教学资源，支持多媒体内容上传下载</p>
        </div>

        {/* 资源库组件 */}
        <ResourceLibrary />
      </div>
    </PageLayout>
  )
}
