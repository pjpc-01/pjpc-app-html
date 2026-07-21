"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  CreditCard, Search, Plus, Trash2, RefreshCw, ArrowRightLeft,
  User, Users, BarChart3, Shield, XCircle, CheckCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import PageLayout from "@/components/layouts/PageLayout"

interface NfcCard {
  id: string
  card_uid: string
  type: "student" | "teacher"
  status: string
  studentId?: string
  teacherId?: string
  notes?: string
  created?: string
}

interface PersonInfo {
  id: string
  name: string
  cardNumber?: string
  center?: string
  status?: string
}

export default function CardManagementPage() {
  const router = useRouter()
  const [cards, setCards] = useState<NfcCard[]>([])
  const [students, setStudents] = useState<Record<string, PersonInfo>>({})
  const [teachers, setTeachers] = useState<Record<string, PersonInfo>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [page, setPage] = useState(1)
  const pageSize = 15
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showIssueDialog, setShowIssueDialog] = useState(false)
  const [selectedCard, setSelectedCard] = useState<NfcCard | null>(null)
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [transferPersonId, setTransferPersonId] = useState("")
  const [transferPersonType, setTransferPersonType] = useState("student")
  const [allPeople, setAllPeople] = useState<{students: PersonInfo[], teachers: PersonInfo[]}>({ students: [], teachers: [] })

  // New card form
  const [newCard, setNewCard] = useState({ card_uid: "", personType: "student", personId: "", notes: "" })
  const [unlinkedPeople, setUnlinkedPeople] = useState<{students: PersonInfo[], teachers: PersonInfo[]}>({ students: [], teachers: [] })

  // 检测卡号是否已存在
  const cardUidExists = useMemo(() => {
    if (!newCard.card_uid.trim()) return null
    const uid = newCard.card_uid.trim()
    const found = cards.find(c => c.card_uid === uid)
    return found || null
  }, [newCard.card_uid, cards])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/cards")
      const data = await res.json()
      if (data.success) {
        setCards(data.cards || [])
        const sMap: Record<string, PersonInfo> = {}
        for (const [id, s] of Object.entries(data.students || {})) {
          sMap[id] = s as PersonInfo
        }
        setStudents(sMap)
        const tMap: Record<string, PersonInfo> = {}
        for (const [id, t] of Object.entries(data.teachers || {})) {
          tMap[id] = t as PersonInfo
        }
        setTeachers(tMap)
      }
    } catch (e) {
      console.error("Failed to fetch cards:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])
  useEffect(() => { setPage(1) }, [filterType, filterStatus, search])

  // Filtered cards
  const filteredCards = useMemo(() => {
    return cards.filter(c => {
      if (filterType !== "all" && c.type !== filterType) return false
      if (filterStatus !== "all" && c.status !== filterStatus) return false
      if (search) {
        const person = c.type === "student" ? students[c.studentId || ""] : teachers[c.teacherId || ""]
        const name = person?.name || ""
        if (!name.toLowerCase().includes(search.toLowerCase()) && !c.card_uid.includes(search)) return false
      }
      return true
    })
  }, [cards, filterType, filterStatus, search, students, teachers])

  // Paginated + reset on filter change
  const totalPages = Math.max(1, Math.ceil(filteredCards.length / pageSize))
  const paginatedCards = filteredCards.slice((page - 1) * pageSize, page * pageSize)

  // Students without cards, split by center
  const noCardBreakdown = useMemo(() => {
    const pu1: PersonInfo[] = []
    const batu14: PersonInfo[] = []
    for (const s of Object.values(students)) {
      if (s.status === "graduated") continue
      if (s.cardNumber && s.cardNumber !== "-") continue
      const c = (s.center || "").toUpperCase()
      if (c === "PU1") pu1.push(s)
      else if (c === "BATU14") batu14.push(s)
      else pu1.push(s) // default to PU1
    }
    return { pu1, batu14 }
  }, [students])

  // Stats
  const stats = {
    total: cards.length,
    active: cards.filter(c => c.status === "active").length,
    student: cards.filter(c => c.type === "student").length,
    teacher: cards.filter(c => c.type === "teacher").length,
  }

  const getPersonName = (card: NfcCard) => {
    if (card.type === "student") return students[card.studentId || ""]?.name || "未关联"
    return teachers[card.teacherId || ""]?.name || "未关联"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-100 text-green-800">正常</Badge>
      case "inactive": return <Badge className="bg-gray-100 text-gray-800">停用</Badge>
      case "lost": return <Badge className="bg-red-100 text-red-800">挂失</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleIssueCard = async () => {
    if (!newCard.card_uid || !newCard.personId) return
    if (cardUidExists) return  // 已存在，不发
    try {
      await fetch("/api/cards/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_uid: newCard.card_uid,
          type: newCard.personType,
          personId: newCard.personId,
          notes: newCard.notes || "手动发卡",
        }),
      })
      setShowIssueDialog(false)
      setNewCard({ card_uid: "", personType: "student", personId: "", notes: "" })
      fetchData()
    } catch (e) {
      console.error("发卡失败:", e)
    }
  }

  const handleRevokeCard = async (card: NfcCard) => {
    if (!confirm(`确定要停用卡片 ${card.card_uid} 吗？`)) return
    try {
      await fetch("/api/cards/actions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: card.id, status: "inactive" }),
      })
      fetchData()
    } catch (e) {
      console.error("停用失败:", e)
    }
  }

  const handleDeleteCard = async (card: NfcCard) => {
    if (!confirm(`确定要删除卡片 ${card.card_uid} 吗？此操作不可恢复。`)) return
    try {
      await fetch(`/api/cards/actions?id=${card.id}`, { method: "DELETE" })
      fetchData()
    } catch (e) {
      console.error("删除失败:", e)
    }
  }

  const openTransferDialog = async (card: NfcCard) => {
    setSelectedCard(card)
    // Fetch ALL people (not just unlinked) for transfer
    try {
      const [sRes, tRes] = await Promise.all([
        fetch("/api/pocketbase-proxy/api/collections/students/records?perPage=500"),
        fetch("/api/pocketbase-proxy/api/collections/teachers/records?perPage=500"),
      ])
      const [sData, tData] = await Promise.all([sRes.json(), tRes.json()])
      setAllPeople({
        students: (sData.items || []).map((s: any) => ({ id: s.id, name: s.student_name || s.name, cardNumber: s.cardNumber })),
        teachers: (tData.items || []).map((t: any) => ({ id: t.id, name: t.name || t.teacher_name, cardNumber: t.cardNumber })),
      })
    } catch {}
    setTransferPersonType(card.type)
    setTransferPersonId("")
    setShowTransferDialog(true)
  }

  const handleTransferCard = async () => {
    if (!selectedCard || !transferPersonId) return
    try {
      await fetch("/api/cards/actions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: selectedCard.id,
          action: "transfer",
          newPersonId: transferPersonId,
          newType: transferPersonType,
        }),
      })
      setShowTransferDialog(false)
      fetchData()
    } catch (e) {
      console.error("转绑失败:", e)
    }
  }

  const openIssueDialog = () => {
    // Find people without cards (exclude graduated, check against nfc_cards not student.cardNumber)
    const activeCardStudentIds = new Set(
      cards.filter(c => c.type === "student" && c.status === "active").map(c => c.studentId)
    )
    const unlinkedStudents = Object.values(students).filter(s => {
      if (s.status === "graduated" || s.status === "deleted") return false
      return !activeCardStudentIds.has(s.id)
    })
    const activeCardTeacherIds = new Set(
      cards.filter(c => c.type === "teacher" && c.status === "active").map(c => c.teacherId)
    )
    const unlinkedTeachers = Object.values(teachers).filter(t => !activeCardTeacherIds.has(t.id))
    setUnlinkedPeople({ students: unlinkedStudents, teachers: unlinkedTeachers })
    setShowIssueDialog(true)
  }

  return (
    <PageLayout
      title="NFC 卡片管理"
      description="统一管理所有 NFC 卡片：发卡、挂失、停用、查看记录"
      backUrl="/"
      userRole="admin"
      status="系统正常"
      background="from-slate-50 to-blue-50"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100"><CreditCard className="h-6 w-6 text-blue-600" /></div>
              <div><p className="text-2xl font-bold">{stats.total}</p><p className="text-sm text-gray-500">总卡片数</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100"><CheckCircle className="h-6 w-6 text-green-600" /></div>
              <div><p className="text-2xl font-bold">{stats.active}</p><p className="text-sm text-gray-500">活跃卡片</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100"><Users className="h-6 w-6 text-purple-600" /></div>
              <div><p className="text-2xl font-bold">{stats.student}</p><p className="text-sm text-gray-500">学生卡</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-100"><Shield className="h-6 w-6 text-amber-600" /></div>
              <div><p className="text-2xl font-bold">{stats.teacher}</p><p className="text-sm text-gray-500">教师卡</p></div>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索卡号或姓名..."
                className="pl-10"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-28"><SelectValue placeholder="类型" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="student">学生</SelectItem>
                <SelectItem value="teacher">教师</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-28"><SelectValue placeholder="状态" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">正常</SelectItem>
                <SelectItem value="inactive">停用</SelectItem>
                <SelectItem value="lost">挂失</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-1" />刷新
            </Button>
            <Button size="sm" onClick={openIssueDialog}>
              <Plus className="h-4 w-4 mr-1" />发卡
            </Button>
          </div>
        </div>

        {/* Cards Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>卡片列表</CardTitle>
            <CardDescription>共 {filteredCards.length} 张卡片 · 第{page}/{totalPages}页</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">加载中...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>卡号</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>持卡人</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>备注</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCards.map(card => (
                    <TableRow key={card.id}>
                      <TableCell className="font-mono text-sm">{card.card_uid}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={card.type === "teacher" ? "border-amber-300 text-amber-700" : "border-blue-300 text-blue-700"}>
                          {card.type === "teacher" ? <Shield className="h-3 w-3 mr-1" /> : <User className="h-3 w-3 mr-1" />}
                          {card.type === "teacher" ? "教师" : "学生"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{getPersonName(card)}</TableCell>
                      <TableCell>{getStatusBadge(card.status)}</TableCell>
                      <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">{card.notes || "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {card.status === "active" && (
                            <Button variant="ghost" size="sm" onClick={() => handleRevokeCard(card)} title="停用">
                              <XCircle className="h-4 w-4 text-orange-500" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => openTransferDialog(card)} title="转绑">
                            <ArrowRightLeft className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteCard(card)} title="删除">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginatedCards.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        没有符合条件的卡片
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p-1))}>上一页</Button>
            <span className="text-sm text-gray-500">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p+1))}>下一页</Button>
          </div>
        )}

        {/* No-card breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">无卡人员</CardTitle>
            <CardDescription>在校学生中未绑定卡片的人员</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-sm mb-2 text-blue-700">🏫 PU1 ({noCardBreakdown.pu1.length}人)</h4>
                {noCardBreakdown.pu1.length === 0 ? (
                  <p className="text-sm text-gray-400">全部有卡 ✅</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {noCardBreakdown.pu1.map(p => (
                      <span key={p.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">{p.name}</span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2 text-green-700">🏫 BATU14 ({noCardBreakdown.batu14.length}人)</h4>
                {noCardBreakdown.batu14.length === 0 ? (
                  <p className="text-sm text-gray-400">全部有卡 ✅</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {noCardBreakdown.batu14.map(p => (
                      <span key={p.id} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">{p.name}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Issue Card Dialog */}
        <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>发放新卡片</DialogTitle>
              <DialogDescription>为未绑定卡片的人员发放 NFC 卡</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>卡片 UID</Label>
                <Input
                  placeholder="刷卡自动填入或手动输入"
                  value={newCard.card_uid}
                  onChange={e => setNewCard({ ...newCard, card_uid: e.target.value })}
                  className={cardUidExists ? "border-red-400 focus-visible:ring-red-400" : ""}
                />
                {cardUidExists && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    已存在 — {cardUidExists.type === "student" 
                      ? `学生: ${students[cardUidExists.studentId || ""]?.name || "未知"}` 
                      : `教师: ${teachers[cardUidExists.teacherId || ""]?.name || "未知"}`}
                    （状态: {cardUidExists.status === "active" ? "正常" : cardUidExists.status}）
                  </p>
                )}
              </div>
              <div>
                <Label>人员类型</Label>
                <Select value={newCard.personType} onValueChange={v => setNewCard({ ...newCard, personType: v, personId: "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">学生</SelectItem>
                    <SelectItem value="teacher">教师</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>
                  {newCard.personType === "student" ? "学生" : "教师"}
                  <span className="text-xs text-gray-400 ml-2">（仅显示未绑卡的人员）</span>
                </Label>
                <Select value={newCard.personId} onValueChange={v => setNewCard({ ...newCard, personId: v })}>
                  <SelectTrigger><SelectValue placeholder="选择人员..." /></SelectTrigger>
                  <SelectContent>
                    {(newCard.personType === "student" ? unlinkedPeople.students : unlinkedPeople.teachers).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>备注</Label>
                <Input
                  placeholder="发卡备注"
                  value={newCard.notes}
                  onChange={e => setNewCard({ ...newCard, notes: e.target.value })}
                />
              </div>
              <Button onClick={handleIssueCard} disabled={!newCard.card_uid || !newCard.personId || !!cardUidExists} className="w-full">
                <Plus className="h-4 w-4 mr-1" />确认发卡
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Transfer Card Dialog */}
        <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-blue-500" />
                转绑卡片
              </DialogTitle>
              <DialogDescription>
                将卡片 <span className="font-mono text-blue-600">{selectedCard?.card_uid}</span> 转绑给其他人
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-3 text-sm">
                <p>当前持卡人：<span className="font-semibold">{selectedCard ? getPersonName(selectedCard) : ""}</span></p>
                <p className="text-xs text-gray-500">转绑后原持卡人将失去此卡</p>
              </div>
              <div>
                <Label>新持卡人类型</Label>
                <Select value={transferPersonType} onValueChange={v => { setTransferPersonType(v); setTransferPersonId("") }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">学生</SelectItem>
                    <SelectItem value="teacher">教师</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>
                  {transferPersonType === "student" ? "学生" : "教师"}
                  <span className="text-xs text-gray-400 ml-2">（已有卡的人会标注）</span>
                </Label>
                <Select value={transferPersonId} onValueChange={setTransferPersonId}>
                  <SelectTrigger><SelectValue placeholder="选择人员..." /></SelectTrigger>
                  <SelectContent>
                    {(transferPersonType === "student" ? allPeople.students : allPeople.teachers).map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}{p.cardNumber ? " [有卡]" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleTransferCard} disabled={!transferPersonId} className="w-full">
                <ArrowRightLeft className="h-4 w-4 mr-1" />确认转绑
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  )
}
