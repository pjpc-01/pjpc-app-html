"use client"

import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollText } from "lucide-react"

export default function FinanceReceiptsPage() {
  return (
    <PageLayout
      title="收据管理"
      description="管理收据记录"
      userRole="admin"
      status="系统正常"
      background="bg-gray-50"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            收据管理
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">收据管理功能开发中…</p>
        </CardContent>
      </Card>
    </PageLayout>
  )
}
