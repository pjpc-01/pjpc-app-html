// PDF 报表导出工具
// 使用 jspdf + jspdf-autotable 生成财务 PDF

import jsPDF from "jspdf"
import "jspdf-autotable"

// ============================================================
// P&L 损益报表
// ============================================================
export interface PnLData {
  title: string
  period: string
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  revenueItems: { label: string; amount: number }[]
  expenseItems: { label: string; amount: number }[]
}

export function exportPnLPDF(data: PnLData) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // Title
  doc.setFontSize(18)
  doc.text(data.title, pageWidth / 2, 20, { align: "center" })

  // Period
  doc.setFontSize(11)
  doc.setTextColor(100)
  doc.text(`期间: ${data.period}`, pageWidth / 2, 28, { align: "center" })

  // Summary
  doc.setFontSize(12)
  doc.setTextColor(0)
  doc.text("损益汇总", 14, 40)
  doc.setFontSize(10)

  const summaryY = 48
  doc.text(`总收入: RM ${data.totalRevenue.toLocaleString("en-MY", { minimumFractionDigits: 2 })}`, 14, summaryY)
  doc.text(`总支出: RM ${data.totalExpenses.toLocaleString("en-MY", { minimumFractionDigits: 2 })}`, 14, summaryY + 7)
  doc.setTextColor(data.netProfit >= 0 ? 34 : 220)
  doc.text(`净利润: RM ${data.netProfit.toLocaleString("en-MY", { minimumFractionDigits: 2 })}`, 14, summaryY + 14)
  doc.setTextColor(0)

  // Revenue table
  doc.setFontSize(12)
  doc.text("收入明细", 14, summaryY + 30)
  ;(doc as any).autoTable({
    startY: summaryY + 36,
    head: [["项目", "金额 (RM)"]],
    body: data.revenueItems.map((item) => [item.label, item.amount.toLocaleString("en-MY", { minimumFractionDigits: 2 })]),
    foot: [["总收入", data.totalRevenue.toLocaleString("en-MY", { minimumFractionDigits: 2 })]],
    theme: "striped",
    headStyles: { fillColor: [79, 70, 229] },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
  })

  // Expense table
  const expenseStartY = (doc as any).lastAutoTable.finalY + 10
  doc.setFontSize(12)
  doc.text("支出明细", 14, expenseStartY)
  ;(doc as any).autoTable({
    startY: expenseStartY + 6,
    head: [["项目", "金额 (RM)"]],
    body: data.expenseItems.map((item) => [item.label, item.amount.toLocaleString("en-MY", { minimumFractionDigits: 2 })]),
    foot: [["总支出", data.totalExpenses.toLocaleString("en-MY", { minimumFractionDigits: 2 })]],
    theme: "striped",
    headStyles: { fillColor: [220, 38, 38] },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
  })

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 10
  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text(`生成时间: ${new Date().toLocaleString("zh-CN")}`, 14, footerY)
  doc.text("PJPC 安亲班管理系统", pageWidth - 14, footerY, { align: "right" })

  doc.save(`${data.title.replace(/\s/g, "_")}_${data.period}.pdf`)
}

// ============================================================
// 发票/收据 PDF
// ============================================================
export interface InvoicePDFData {
  invoiceNo: string
  studentName: string
  date: string
  items: { description: string; amount: number }[]
  total: number
  status: string
}

export function exportInvoicePDF(data: InvoicePDFData) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // Header
  doc.setFontSize(22)
  doc.setTextColor(79, 70, 229)
  doc.text("PJPC", 14, 20)
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text("Pusat Jagaan Prospek Cemerlang", 14, 27)

  // Invoice title
  doc.setFontSize(16)
  doc.setTextColor(0)
  doc.text("INVOICE / 发票", pageWidth - 14, 20, { align: "right" })
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`No: ${data.invoiceNo}`, pageWidth - 14, 27, { align: "right" })
  doc.text(`日期: ${data.date}`, pageWidth - 14, 34, { align: "right" })

  // Divider
  doc.setDrawColor(200)
  doc.line(14, 40, pageWidth - 14, 40)

  // Bill to
  doc.setFontSize(11)
  doc.setTextColor(0)
  doc.text("学生 / Student:", 14, 50)
  doc.setFontSize(10)
  doc.setTextColor(80)
  doc.text(data.studentName, 14, 57)

  // Items table
  ;(doc as any).autoTable({
    startY: 65,
    head: [["项目 Description", "金额 Amount (RM)"]],
    body: data.items.map((item) => [item.description, item.amount.toLocaleString("en-MY", { minimumFractionDigits: 2 })]),
    foot: [["总计 Total", data.total.toLocaleString("en-MY", { minimumFractionDigits: 2 })]],
    theme: "striped",
    headStyles: { fillColor: [79, 70, 229] },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
  })

  // Status
  const statusY = (doc as any).lastAutoTable.finalY + 15
  doc.setFontSize(10)
  doc.setTextColor(data.status === "paid" ? 34 : data.status === "pending" ? 180 : 220)
  doc.text(
    `状态: ${data.status === "paid" ? "已付款" : data.status === "pending" ? "待付款" : "已逾期"}`,
    pageWidth - 14,
    statusY,
    { align: "right" }
  )

  // Footer
  doc.setDrawColor(200)
  doc.line(14, doc.internal.pageSize.getHeight() - 15, pageWidth - 14, doc.internal.pageSize.getHeight() - 15)
  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text("No. 1 Jalan PU 10/8, Taman Puchong Utama, 47140 Puchong, Selangor", 14, doc.internal.pageSize.getHeight() - 8)

  doc.save(`Invoice_${data.invoiceNo}.pdf`)
}

// ============================================================
// AR 账龄分析表
// ============================================================
export interface AgingData {
  current: number
  days1to30: number
  days31to60: number
  days61to90: number
  days90plus: number
  items: { student: string; amount: number; daysOverdue: number }[]
}

export function exportAgingPDF(data: AgingData) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFontSize(18)
  doc.text("应收账款账龄分析", pageWidth / 2, 20, { align: "center" })
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`生成日期: ${new Date().toLocaleDateString("zh-CN")}`, pageWidth / 2, 28, { align: "center" })

  // Summary cards
  doc.setFontSize(11)
  doc.setTextColor(0)
  doc.text("账龄分布", 14, 40)
  doc.setFontSize(9)

  const agingSummary = [
    { label: "未逾期", amount: data.current, color: [34, 197, 94] },
    { label: "1-30天", amount: data.days1to30, color: [234, 179, 8] },
    { label: "31-60天", amount: data.days31to60, color: [245, 158, 11] },
    { label: "61-90天", amount: data.days61to90, color: [249, 115, 22] },
    { label: "90天+", amount: data.days90plus, color: [220, 38, 38] },
  ]

  agingSummary.forEach((item, i) => {
    const x = 14 + i * 36
    doc.setFillColor(item.color[0], item.color[1], item.color[2])
    doc.rect(x, 46, 32, 20, "F")
    doc.setTextColor(255)
    doc.setFontSize(8)
    doc.text(item.label, x + 16, 54, { align: "center" })
    doc.setFontSize(9)
    doc.text(`RM ${item.amount.toLocaleString("en-MY")}`, x + 16, 63, { align: "center" })
  })

  // Detail table
  doc.setTextColor(0)
  doc.setFontSize(11)
  doc.text("逾期明细", 14, 80)
  ;(doc as any).autoTable({
    startY: 86,
    head: [["学生", "逾期金额 (RM)", "逾期天数"]],
    body: data.items.map((item) => [
      item.student,
      item.amount.toLocaleString("en-MY", { minimumFractionDigits: 2 }),
      `${item.daysOverdue} 天`,
    ]),
    theme: "striped",
    headStyles: { fillColor: [79, 70, 229] },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "center" },
    },
  })

  doc.save(`AR_Aging_${new Date().toISOString().split("T")[0]}.pdf`)
}

// ============================================================
// 成绩单 Report Card PDF
// ============================================================
export interface ReportCardData {
  studentName: string
  grade: string
  center: string
  school?: string
  period: string
  subjects: { name: string; score: number; grade: string; remark?: string }[]
  attendance?: { present: number; absent: number; total: number }
  teacherComment?: string
  overallGrade?: string
}

const getGradeLabel = (score: number): string => {
  if (score >= 90) return "A"
  if (score >= 80) return "B"
  if (score >= 70) return "C"
  if (score >= 60) return "D"
  if (score >= 50) return "E"
  return "F"
}

const getGradeColor = (score: number): number[] => {
  if (score >= 80) return [34, 197, 94]
  if (score >= 60) return [234, 179, 8]
  if (score >= 40) return [249, 115, 22]
  return [220, 38, 38]
}

export function exportReportCardPDF(data: ReportCardData) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // === HEADER ===
  doc.setFontSize(22)
  doc.setTextColor(79, 70, 229)
  doc.text("PJPC", pageWidth / 2, 20, { align: "center" })
  doc.setFontSize(8)
  doc.setTextColor(100)
  doc.text("Pusat Jagaan Prospek Cemerlang", pageWidth / 2, 27, { align: "center" })

  doc.setDrawColor(200)
  doc.line(14, 32, pageWidth - 14, 32)

  // Title
  doc.setFontSize(16)
  doc.setTextColor(0)
  doc.text("REPORT CARD / 成绩单", pageWidth / 2, 42, { align: "center" })
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`学期: ${data.period}`, pageWidth / 2, 49, { align: "center" })

  // === STUDENT INFO ===
  const infoY = 58
  doc.setDrawColor(200)
  doc.line(14, infoY - 3, pageWidth - 14, infoY - 3)
  doc.setFontSize(10)
  doc.setTextColor(80)
  doc.text(`学生姓名: ${data.studentName}`, 14, infoY)
  doc.text(`年级: ${data.grade}`, 14, infoY + 7)
  doc.text(`中心: ${data.center}`, pageWidth / 2, infoY)
  if (data.school) doc.text(`学校: ${data.school}`, pageWidth / 2, infoY + 7)

  // === SUBJECT SCORES TABLE ===
  const tableY = infoY + 16
  const subjectsWithGrade = data.subjects.map(s => ({
    ...s,
    grade: s.grade || getGradeLabel(s.score),
  }))

  // Calculate summary
  const totalScore = subjectsWithGrade.reduce((sum, s) => sum + s.score, 0)
  const averageScore = subjectsWithGrade.length > 0 ? totalScore / subjectsWithGrade.length : 0
  const overallGrade = data.overallGrade || getGradeLabel(averageScore)

  // Color for each row
  const bodyWithStyles = subjectsWithGrade.map(s => {
    const color = getGradeColor(s.score)
    return [
      { content: s.name, styles: { fontStyle: "bold" as const } },
      { content: String(s.score), styles: { halign: "center" as const } },
      {
        content: s.grade,
        styles: {
          halign: "center" as const,
          textColor: color as [number, number, number],
          fontStyle: "bold" as const,
        },
      },
      { content: s.remark || "", styles: { fontStyle: "italic" as const, textColor: [150, 150, 150] as [number, number, number] } },
    ]
  })

  ;(doc as any).autoTable({
    startY: tableY,
    head: [["科目 Subject", "分数 Score", "等级 Grade", "备注 Remark"]],
    body: bodyWithStyles,
    foot: [[
      { content: `总分: ${totalScore}  |  平均: ${averageScore.toFixed(1)}`, colSpan: 2, styles: { fontStyle: "bold" } },
      { content: overallGrade, styles: { halign: "center", fontStyle: "bold", fontSize: 12, textColor: getGradeColor(averageScore) as [number, number, number] } },
      { content: "", styles: { fontStyle: "bold" } },
    ]],
    theme: "striped",
    headStyles: { fillColor: [79, 70, 229] },
    footStyles: { fillColor: [245, 245, 250], textColor: [0, 0, 0] },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { halign: "center", cellWidth: 25 },
      2: { halign: "center", cellWidth: 25 },
      3: { cellWidth: "auto" },
    },
  })

  let currentY = (doc as any).lastAutoTable.finalY + 10

  // === ATTENDANCE ===
  if (data.attendance) {
    doc.setFontSize(11)
    doc.setTextColor(0)
    doc.text("出勤记录 Attendance", 14, currentY)
    currentY += 6
    doc.setFontSize(9)
    doc.setTextColor(80)
    doc.text(`出席: ${data.attendance.present} 天`, 14, currentY)
    doc.text(`缺席: ${data.attendance.absent} 天`, pageWidth / 2, currentY)
    doc.text(`总天数: ${data.attendance.total} 天`, pageWidth - 50, currentY)
    currentY += 10
  }

  // === TEACHER COMMENT ===
  if (data.teacherComment) {
    doc.setDrawColor(200)
    doc.line(14, currentY - 3, pageWidth - 14, currentY - 3)
    doc.setFontSize(11)
    doc.setTextColor(0)
    doc.text("教师评语 Teacher's Comment", 14, currentY + 3)
    currentY += 10
    doc.setFontSize(9)
    doc.setTextColor(80)
    const lines = doc.splitTextToSize(data.teacherComment, pageWidth - 28)
    doc.text(lines, 14, currentY)
    currentY += lines.length * 5 + 10
  }

  // === SIGNATURE ===
  doc.setDrawColor(200)
  doc.line(14, currentY, pageWidth - 14, currentY)
  currentY += 8
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(`教师签名: ______________`, 14, currentY)
  doc.text(`日期: ${new Date().toLocaleDateString("zh-CN")}`, pageWidth - 50, currentY)
  currentY += 8
  doc.text(`家长签名: ______________`, 14, currentY)

  // === FOOTER ===
  const footerY = doc.internal.pageSize.getHeight() - 10
  doc.setFontSize(7)
  doc.setTextColor(150)
  doc.text("PJPC 安亲班管理系统 · 成绩单", 14, footerY)
  doc.text(`生成时间: ${new Date().toLocaleString("zh-CN")}`, pageWidth - 14, footerY, { align: "right" })

  doc.save(`Report_Card_${data.studentName.replace(/\s/g, "_")}_${data.period}.pdf`)
}
