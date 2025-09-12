"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import BirthdaysPanel from "@/app/components/management/birthdays-panel"
import PointsManagement from "@/app/components/management/points-management"
import AnnouncementManagement from "@/app/components/management/announcement-management"
import NFCBackgroundRunner from "@/app/components/systems/nfc-background-runner"
import { useStudents } from "@/hooks/useStudents"

export default function OperationsHubPage() {
  const { students } = useStudents()
  const [center, setCenter] = useState<string>("all")

  const centers = useMemo(() => {
    const set = new Set<string>()
    students.forEach((s: any) => { if (s.center) set.add(s.center) })
    return Array.from(set)
  }, [students])

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden p-3 md:p-6">
      {/* 顶部栏：分行选择与隐形NFC后台运行 */}
      <div className="flex items-center justify-between gap-3">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-base md:text-lg">运营控制中心</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <div className="text-sm text-gray-600">分行</div>
            <Select value={center} onValueChange={setCenter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有中心</SelectItem>
                {centers.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* NFC 后台考勤，无界面 */}
        <NFCBackgroundRunner center={center} enabled={true} />
      </div>

      <Separator className="my-3" />

      {/* 主体两栏：左侧业务Tab，右侧生日看板 */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-3 overflow-hidden">
        <div className="lg:col-span-2 min-h-0 overflow-y-auto pr-1">
          <Tabs defaultValue="points" className="space-y-3">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="points">积分管理</TabsTrigger>
              <TabsTrigger value="announcements">公告中心</TabsTrigger>
            </TabsList>

            <TabsContent value="points">
              <PointsManagement />
            </TabsContent>

            <TabsContent value="announcements">
              <AnnouncementManagement />
            </TabsContent>
          </Tabs>
        </div>

        <div className="min-h-0 overflow-y-auto">
          <BirthdaysPanel center={center} />
        </div>
      </div>
    </div>
  )
}


