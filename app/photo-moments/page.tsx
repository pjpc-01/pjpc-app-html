"use client"

import { useState, useEffect, useCallback } from "react"
import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { usePhotoMoments, PhotoMoment } from "@/hooks/usePhotoMoments"
import { useStudents } from "@/hooks/useStudents"
import { Camera, Plus, Image, Smile, Users, Utensils, BookOpen, Gamepad2 } from "lucide-react"

const CATEGORIES = [
  { value: "activity", label: "活动", icon: Users },
  { value: "meal", label: "吃饭", icon: Utensils },
  { value: "study", label: "学习", icon: BookOpen },
  { value: "play", label: "玩耍", icon: Gamepad2 },
  { value: "other", label: "其他", icon: Camera },
]

export default function PhotoMomentsPage() {
  const { loading, getTodayPhotos, postPhoto } = usePhotoMoments()
  const { students, fetchStudents } = useStudents()

  const [photos, setPhotos] = useState<PhotoMoment[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [caption, setCaption] = useState("")
  const [category, setCategory] = useState("activity")

  useEffect(() => { fetchStudents() }, [])
  const loadPhotos = useCallback(async () => { setPhotos(await getTodayPhotos()) }, [getTodayPhotos])
  useEffect(() => { loadPhotos() }, [loadPhotos])

  const handlePost = async () => {
    if (!selectedStudent || !imageUrl) return
    await postPhoto({ studentId: selectedStudent, image_url: imageUrl, caption, category })
    setDialogOpen(false)
    setImageUrl("")
    setCaption("")
    setSelectedStudent("")
    loadPhotos()
  }

  return (
    <PageLayout title="随手拍" description="拍一张照片，一句话描述，推送给家长">
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-slate-500">今日已拍 {photos.length} 张</p>
        <Button onClick={() => setDialogOpen(true)}><Camera className="h-4 w-4 mr-2" />拍一张</Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72" />)}
        </div>
      ) : photos.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-slate-400">
          <Camera className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>今天还没有拍照</p>
          <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />拍第一张</Button>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map((p) => {
            const CatIcon = CATEGORIES.find(c => c.value === p.category)?.icon || Camera
            return (
              <Card key={p.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-[4/3] bg-slate-100 relative">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.caption} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full"><Image className="h-10 w-10 text-slate-300" /></div>
                  )}
                  <Badge className="absolute top-2 left-2 bg-white/90 text-slate-700"><CatIcon className="h-3 w-3 mr-1" />{CATEGORIES.find(c => c.value === p.category)?.label}</Badge>
                </div>
                <CardContent className="p-3">
                  <p className="font-medium text-sm">{p.expand?.studentId?.name || p.studentId}</p>
                  {p.caption && <p className="text-xs text-slate-500 mt-1">{p.caption}</p>}
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                    <Smile className="h-3 w-3" />
                    <span>{p.expand?.teacherId?.name || "老师"}</span>
                    <span>·</span>
                    <span>{p.created?.split("T")[0]}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Post Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>发布随手拍</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>选择学生 *</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger><SelectValue placeholder="选择学生..." /></SelectTrigger>
                <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>照片链接 *</Label>
              <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="粘贴照片URL..." />
            </div>
            <div>
              <Label>分类</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}><c.icon className="h-4 w-4 inline mr-2" />{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>描述</Label>
              <Input value={caption} onChange={e => setCaption(e.target.value)} placeholder="一句话描述..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handlePost} disabled={!selectedStudent || !imageUrl}>发布</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}
