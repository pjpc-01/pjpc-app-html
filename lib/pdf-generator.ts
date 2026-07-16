import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { Invoice } from '@/hooks/useInvoices'
import { type InvoiceSettingsPreset } from '@/app/components/finance/invoice-management/InvoiceSettingsManager'
import { type ReportSettingsPreset } from '@/app/components/report/ReportSettingsManager'
import { StudentReport, ReportSubject } from '@/hooks/useStudentReports'

export type { InvoiceSettingsPreset } from '@/app/components/finance/invoice-management/InvoiceSettingsManager'

const getStatusText = (status: string): string => {
  const m: Record<string, string> = {
    draft: '草稿', issued: '已开具', sent: '已发送',
    pending: '待付款', overdue: '已逾期', paid: '已付款', cancelled: '已取消'
  }
  return m[status] || status
}

// ── Generate invoice HTML (same styling as preview) ──
export const generateInvoiceHTML = (invoice: Invoice, settings: InvoiceSettingsPreset): string => {
  const items = (invoice.items && invoice.items.length > 0
    ? invoice.items
    : [{ name: '学生费用', amount: invoice.totalAmount || 0 }])

  const subtotal = items.reduce((sum, it) => sum + (it.amount || 0), 0)
  const total = invoice.totalAmount || subtotal
  const statusText = getStatusText(invoice.status)
  const primaryColor = settings.primaryColor || '#1e40af'
  const secondaryColor = settings.secondaryColor || '#3b82f6'
  const accentColor = settings.accentColor || '#f59e0b'
  const schoolName = settings.schoolName || '智慧教育学校'

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>发票 ${invoice.invoiceNumber}</title>
  <style>
    @page { margin: 0; size: A4; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans SC', Arial, sans-serif;
      color: #1f2937;
      background: #fff;
      width: 794px;
      margin: 0 auto;
    }
    .invoice-wrapper {
      width: 100%;
      background: #fff;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
      color: #fff;
      padding: 32px 36px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header-left { display: flex; align-items: center; gap: 20px; }
    .header-logo {
      width: 64px; height: 64px;
      background: rgba(255,255,255,0.2);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 28px; font-weight: bold; color: #fff;
      overflow: hidden;
      flex-shrink: 0;
    }
    .header-logo img { width: 100%; height: 100%; object-fit: contain; }
    .header-title h1 { font-size: 22px; font-weight: 700; letter-spacing: 1px; }
    .header-title p { font-size: 12px; opacity: 0.85; margin-top: 2px; }
    .header-badge {
      background: rgba(255,255,255,0.2);
      padding: 8px 20px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      border: 1px solid rgba(255,255,255,0.3);
      white-space: nowrap;
    }
    .body { padding: 28px 36px; position: relative; }
    .watermark {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 100px;
      font-weight: 900;
      color: ${primaryColor}0D;
      pointer-events: none;
      white-space: nowrap;
      z-index: 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      gap: 24px;
      position: relative;
      z-index: 1;
    }
    .info-block { flex: 1; }
    .info-block h3 {
      font-size: 12px;
      text-transform: uppercase;
      color: #6b7280;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    .info-block p { font-size: 14px; line-height: 1.6; color: #374151; }
    .info-block .highlight { font-size: 18px; font-weight: 700; color: ${primaryColor}; }
    .divider { border: none; border-top: 2px dashed #e5e7eb; margin: 16px 0; position: relative; z-index: 1; }
    .items-table { width: 100%; border-collapse: collapse; margin: 16px 0; position: relative; z-index: 1; }
    .items-table th {
      background: ${primaryColor}15;
      color: ${primaryColor};
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 12px 16px;
      text-align: left;
      border-bottom: 2px solid ${primaryColor}30;
    }
    .items-table th:last-child { text-align: right; }
    .items-table td {
      padding: 14px 16px;
      border-bottom: 1px solid #f3f4f6;
      font-size: 14px;
    }
    .items-table td:last-child { text-align: right; font-weight: 600; }
    .items-table tr:last-child td { border-bottom: none; }
    .totals {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 2px solid #e5e7eb;
      position: relative;
      z-index: 1;
    }
    .total-line {
      display: flex; justify-content: flex-end; align-items: center;
      padding: 4px 0;
      font-size: 14px;
      color: #6b7280;
    }
    .total-line span:first-child { width: 120px; text-align: right; margin-right: 20px; }
    .total-line span:last-child { width: 120px; text-align: right; }
    .grand-total {
      display: flex; justify-content: flex-end; align-items: center;
      padding: 12px 0;
      font-size: 20px; font-weight: 700;
      color: ${primaryColor};
      border-top: 2px solid ${primaryColor};
      margin-top: 8px;
    }
    .grand-total span:first-child { width: 120px; text-align: right; margin-right: 20px; }
    .grand-total span:last-child { width: 120px; text-align: right; }
    .payment-info {
      margin-top: 24px;
      padding: 16px 20px;
      background: #f9fafb;
      border-radius: 8px;
      border-left: 4px solid ${accentColor};
      display: flex;
      gap: 40px;
      flex-wrap: wrap;
      position: relative;
      z-index: 1;
    }
    .payment-info h4 { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
    .payment-info p { font-size: 14px; font-weight: 600; color: #374151; }
    .footer {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
      line-height: 1.8;
      position: relative;
      z-index: 1;
    }
  </style>
</head>
<body>
  <div class="invoice-wrapper">
    <div class="header">
      <div class="header-left">
        <div class="header-logo">
          ${settings.schoolLogo ? `<img src="${settings.schoolLogo}" alt="logo" crossorigin="anonymous" />` : schoolName.charAt(0)}
        </div>
        <div class="header-title">
          <h1>${schoolName}</h1>
          <p>${settings.schoolNameEn || ''}</p>
        </div>
      </div>
      <div class="header-badge">发票 INVOICE</div>
    </div>

    <div class="body">
      <div class="watermark">${statusText}</div>

      <div class="info-row">
        <div class="info-block">
          <h3>发票号码 Invoice No</h3>
          <p class="highlight">${invoice.invoiceNumber}</p>
          <p style="margin-top:4px;font-size:12px;color:#9ca3af;">开具日期: ${invoice.issueDate}</p>
          <p style="font-size:12px;color:#9ca3af;">状态: ${statusText}</p>
        </div>
        <div class="info-block" style="text-align:right;">
          <h3>到期日期 Due Date</h3>
          <p class="highlight">${invoice.dueDate}</p>
        </div>
      </div>

      <div class="info-row">
        <div class="info-block">
          <h3>学生信息 Student</h3>
          <p><strong>${invoice.studentName}</strong> <span style="color:#6b7280;font-size:13px;">(${invoice.studentNumber || '-'})</span></p>
          <p>年级: ${invoice.studentGrade || '-'}</p>
        </div>
        <div class="info-block" style="text-align:right;">
          <h3>学校信息 School</h3>
          <p>${settings.schoolAddress || ''}</p>
          <p>${settings.schoolPhone || ''}</p>
          <p>${settings.schoolEmail || ''}</p>
        </div>
      </div>

      <hr class="divider" />

      <table class="items-table">
        <thead>
          <tr>
            <th>项目 Item</th>
            <th>金额 Amount (RM)</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
          <tr>
            <td>${item.name}</td>
            <td>${(item.amount || 0).toFixed(2)}</td>
          </tr>`).join('')}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-line">
          <span>小计 Subtotal</span>
          <span>RM ${subtotal.toFixed(2)}</span>
        </div>
        <div class="grand-total">
          <span>总计 Total</span>
          <span>RM ${total.toFixed(2)}</span>
        </div>
      </div>

      ${(invoice as any).latePaymentRule ? `
      <div style="margin-top:16px;padding:12px 16px;background:#fef2f2;border-radius:8px;border-left:4px solid #dc2626;font-size:12px;color:#991b1b;position:relative;z-index:1;">
        <strong>⚠️ 迟付款须知</strong><br/>
        ${(invoice as any).latePaymentRule}
      </div>` : ''}

      ${(settings.bankName || settings.bankAccount || settings.paymentTerms) ? `
      <div class="payment-info">
        ${(settings.bankName || settings.bankAccount) ? `
        <div>
          <h4>🏦 银行信息 Bank</h4>
          <p>${settings.bankName || ''}</p>
          ${settings.bankAccount ? `<p>账户: ${settings.bankAccount}</p>` : ''}
          ${settings.bankHolder ? `<p>户名: ${settings.bankHolder}</p>` : ''}
        </div>` : ''}
        ${settings.paymentTerms ? `
        <div>
          <h4>📝 付款须知</h4>
          <p>${settings.paymentTerms}</p>
        </div>` : ''}
      </div>` : ''}

      ${settings.receiptNote ? `
      <div style="margin-top:12px;padding:8px 12px;background:#fef3c7;border-radius:6px;font-size:12px;color:#92400e;position:relative;z-index:1;">
        📌 ${settings.receiptNote}
      </div>` : ''}

      <div class="footer">
        <p>${schoolName} ${settings.schoolAddress ? '| ' + settings.schoolAddress : ''}</p>
        ${settings.schoolPhone || settings.schoolEmail ? `<p>${settings.schoolPhone || ''} ${settings.schoolPhone && settings.schoolEmail ? '|' : ''} ${settings.schoolEmail || ''}</p>` : ''}
        ${settings.footerText ? `<p style="margin-top:6px;">${settings.footerText}</p>` : ''}
        ${settings.taxNumber ? `<p style="margin-top:4px;font-size:10px;color:#d1d5db;">税号: ${settings.taxNumber}</p>` : ''}
      </div>
    </div>
  </div>
</body>
</html>`
}

// ── PDF Generation: HTML → html2canvas → jsPDF ──
const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297
const RENDER_WIDTH_PX = 794  // ~A4 width at 96dpi

export const generateInvoicePDF = async (invoice: Invoice, settings: InvoiceSettingsPreset): Promise<Blob> => {
  // 1. Generate HTML
  const html = generateInvoiceHTML(invoice, settings)

  // 2. Create hidden iframe to render full HTML document
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.left = '-9999px'
  iframe.style.top = '0'
  iframe.style.width = (RENDER_WIDTH_PX + 40) + 'px'
  iframe.style.height = '2000px'
  iframe.style.zIndex = '-1'
  document.body.appendChild(iframe)

  try {
    // Write HTML into iframe
    const iframeDoc = iframe.contentDocument || iframe.contentWindow!.document
    iframeDoc.open()
    iframeDoc.write(html)
    iframeDoc.close()

    // 3. Wait for fonts/images to load
    await new Promise((r) => setTimeout(r, 600))

    // 4. Capture the invoice-wrapper (not the body) to avoid centering offset
    const wrapper = iframeDoc.querySelector('.invoice-wrapper') as HTMLElement
    const canvas = await html2canvas(wrapper, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
    })

    // 5. Calculate page dimensions
    const imgWidth = A4_WIDTH_MM
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    const pageHeight = A4_HEIGHT_MM

    // 6. Create PDF - handle multi-page
    const pdf = new jsPDF('p', 'mm', 'a4')

    if (imgHeight <= pageHeight + 5) {
      // Single page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight)
    } else {
      // Multi-page: split canvas across pages
      let remainingHeight = canvas.height
      let srcY = 0
      let pageNum = 0

      while (remainingHeight > 0) {
        if (pageNum > 0) pdf.addPage()

        const srcH = Math.min(remainingHeight, Math.floor((pageHeight / imgHeight) * canvas.height))
        const pageCanvas = document.createElement('canvas')
        pageCanvas.width = canvas.width
        pageCanvas.height = srcH
        const ctx = pageCanvas.getContext('2d')!
        ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH)

        const pageImgData = pageCanvas.toDataURL('image/png')
        const pageImgH = (pageCanvas.height * imgWidth) / pageCanvas.width
        pdf.addImage(pageImgData, 'PNG', 0, 0, imgWidth, pageImgH)

        srcY += srcH
        remainingHeight -= srcH
        pageNum++
      }
    }

    const blob = pdf.output('blob')
    return blob
  } finally {
    // Clean up
    if (iframe.parentNode) {
      document.body.removeChild(iframe)
    }
  }
}

export const downloadInvoicePDF = async (invoice: Invoice, settings: InvoiceSettingsPreset): Promise<void> => {
  try {
    const blob = await generateInvoicePDF(invoice, settings)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Invoice_' + invoice.invoiceNumber + '.pdf'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 3000)
  } catch (e) {
    console.error('PDF download failed:', e)
    throw new Error('PDF download failed')
  }
}

// ── Report Card HTML Generation ──
const scoreToEval = (score: number | null): string => {
  if (score === null || score === undefined) return "-"
  if (score >= 90) return "优秀"
  if (score >= 80) return "良好"
  if (score >= 60) return "及格"
  return "待加强"
}

const formatDate = (d: string) => {
  if (!d) return ""
  try {
    const date = new Date(d)
    return date.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })
  } catch { return d }
}

export const generateReportHTML = (report: StudentReport, settings: ReportSettingsPreset, student?: { name?: string; student_id?: string; code?: string; dob?: string; grade?: string; avatar?: string }): string => {
  const color = settings.primaryColor || "#3b82f6"

  // Use preset subjects as template, match scores from report
  const presetSubjects: string[] = (settings as any).defaultSubjects || []
  const reportSubjectMap = new Map((report.subjects || []).map((s: any) => [s.name, s]))
  const subjects = presetSubjects.length > 0
    ? presetSubjects.map(name => {
        const rs = reportSubjectMap.get(name)
        return { name, midterm: rs?.midterm ?? null, final: rs?.final ?? null, evaluation: rs?.evaluation || (rs?.final != null ? scoreToEval(rs.final) : '') }
      })
    : (report.subjects || [])

  // Compute averages
  const computeAvg = (key: 'midterm' | 'final') => {
    const scores = subjects.map(s => s[key]).filter(s => s !== null) as number[]
    if (scores.length === 0) return null
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10
  }
  const midtermAvg = computeAvg('midterm')
  const finalAvg = computeAvg('final')
  const overallAvg = report.overall_avg ?? (midtermAvg !== null && finalAvg !== null ? Math.round((midtermAvg + finalAvg) / 2 * 10) / 10 : null)

  const subjectRows = subjects.map(subj => {
    const evalText = subj.evaluation || scoreToEval(subj.final)
    const evalClass = evalText === "优秀" ? "eval-excellent" : evalText === "良好" ? "eval-good" : evalText === "及格" ? "eval-pass" : "eval-fail"
    return `
      <tr>
        <td style="font-weight:600;color:#374151;">${subj.name}</td>
        <td style="text-align:center;">${subj.midterm ?? "—"}</td>
        <td style="text-align:center;">${subj.final ?? "—"}</td>
        <td style="text-align:center;"><span class="eval-badge ${evalClass}">${evalText}</span></td>
      </tr>`
  }).join('')

  // Use preset content, fall back to report data
  const studentName = student?.name || ''
  const growthMessage = (settings as any).growthMessage
    ? (settings as any).growthMessage.replace('{studentName}', studentName)
    : (report.growth_message || '')
  const problems = (settings as any).problems?.length > 0 ? (settings as any).problems : (report.problems || [])
  const improvements = (settings as any).improvements?.length > 0 ? (settings as any).improvements : (report.improvements || [])
  const goalAcademic = (settings as any).futureGoalAcademic || report.future_goals_academic || ''
  const goalAbility = (settings as any).futureGoalAbility || report.future_goals_ability || ''
  const goalCharacter = (settings as any).futureGoalCharacter || report.future_goals_character || ''
  const summary = (settings as any).summary || report.summary || ''

  const activitiesHTML = (report.activities || []).map(a =>
    `<li style="display:flex;align-items:flex-start;gap:8px;font-size:13px;color:#4b5563;margin-bottom:4px;">
      <span style="color:${color};flex-shrink:0;">✓</span>${a}
    </li>`
  ).join('')

  const problemsHTML = (problems || []).map(p =>
    `<li style="display:flex;align-items:flex-start;gap:8px;font-size:13px;color:#4b5563;margin-bottom:4px;">
      <span style="color:#f97316;flex-shrink:0;">⚠</span>${p}
    </li>`
  ).join('')

  const improvementsHTML = (improvements || []).map(imp =>
    `<li style="display:flex;align-items:flex-start;gap:8px;font-size:13px;color:#4b5563;margin-bottom:4px;">
      <span style="color:#22c55e;flex-shrink:0;">✓</span>${imp}
    </li>`
  ).join('')

  const age = student?.dob ? (() => {
    const birth = new Date(student.dob)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age + "岁"
  })() : "—"

  const logoBlock = settings.schoolLogo
    ? `<div style="width:56px;height:56px;margin:0 auto 8px;background:rgba(255,255,255,0.2);border-radius:10px;display:flex;align-items:center;justify-content:center;overflow:hidden;">
        <img src="${settings.schoolLogo}" alt="logo" style="width:100%;height:100%;object-fit:contain;" />
      </div>`
    : ''

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${student?.name || "学生"} 报告</title>
<style>
  @page { margin: 0; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Microsoft YaHei','PingFang SC','Noto Sans SC',Arial,sans-serif;
    color:#374151; background:#fff; width:794px; margin:0 auto;
  }
  .report { width:100%; }
  .card {
    background:#fff; border-radius:12px; padding:20px 24px; margin-bottom:16px;
  }
  .header {
    background:linear-gradient(135deg,${color},${color}dd); color:#fff;
    padding:24px; text-align:center;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .header h1 { font-size:24px; font-weight:700; }
  .header .school-name { font-size:14px; font-weight:600; opacity:0.9; margin-top:4px; }
  .header .subtitle { font-size:12px; opacity:0.75; margin-top:2px; }
  .section-label {
    background:${color}; color:#fff; padding:6px 14px; border-radius:8px;
    font-size:13px; font-weight:600; display:inline-flex; align-items:center; gap:6px; margin-bottom:12px;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .section-label.orange { background:#f97316; }
  .section-label.green { background:#22c55e; }
  table { width:100%; border-collapse:collapse; margin:12px 0; }
  th {
    background:${color}15; color:${color};
    font-size:11px; text-transform:uppercase; padding:9px 12px; text-align:left;
    border-bottom:2px solid ${color}30;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  th:first-child { border-radius:8px 0 0 0; }
  th:last-child { border-radius:0 8px 0 0; }
  td { padding:10px 12px; border-bottom:1px solid #f3f4f6; font-size:13px; }
  tr:last-child td { border-bottom:none; }
  .eval-badge {
    display:inline-block; padding:2px 10px; border-radius:10px; font-size:11px; font-weight:600;
  }
  .eval-excellent { background:#d1fae5; color:#065f46; }
  .eval-good { background:#dbeafe; color:#1e40af; }
  .eval-pass { background:#fef3c7; color:#92400e; }
  .eval-fail { background:#fee2e2; color:#991b1b; }
  .stat-row { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-top:12px; }
  .stat {
    background:${color}; color:#fff; border-radius:10px; padding:14px; text-align:center;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .stat .num { font-size:24px; font-weight:700; }
  .stat .label { font-size:10px; opacity:0.8; margin-top:2px; }
  .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  ul { list-style:none; padding:0; }
  .goal-box {
    background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:14px;
  }
  .goal-box h4 { font-size:12px; font-weight:600; color:#1e40af; margin-bottom:6px; }
  .goal-box p { font-size:12px; color:#4b5563; line-height:1.5; }
  .footer {
    background:#374151; color:#fff; text-align:center; padding:12px;
    border-radius:12px; font-size:12px; font-weight:500;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .growth-box {
    background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px;
    padding:14px 16px; margin-top:12px; font-size:13px; color:#4b5563; line-height:1.6;
  }
  .student-info { display:flex; gap:16px; align-items:center; margin-bottom:4px; }
  .student-avatar {
    width:64px; height:64px; background:#e5e7eb; border-radius:10px;
    display:flex; align-items:center; justify-content:center;
    font-size:28px; color:#9ca3af; flex-shrink:0; overflow:hidden;
  }
  .student-avatar img { width:100%; height:100%; object-fit:cover; }
  .info-grid { font-size:13px; line-height:1.9; color:#4b5563; }
  .info-grid b { color:#1f2937; }
</style></head>
<body>
<div class="report">
  <div class="header">
    ${logoBlock}
    <h1>${settings.headerTitle || '学生报告'}</h1>
    ${settings.schoolName ? `<p class="school-name">${settings.schoolName}</p>` : ''}
    <p class="subtitle">${settings.headerSubtitle || '— 全面发展 · 健康成长 · 追求卓越 —'}</p>
  </div>

  <!-- Student Info -->
  <div class="card">
    <div class="student-info">
      <div class="student-avatar">
        ${student?.avatar ? `<img src="${student.avatar}" alt="" />` : '👤'}
      </div>
      <div class="info-grid">
        <b>${student?.name || "—"}</b><br/>
        编号: ${student?.student_id || student?.code || "—"} · 年级: ${student?.grade || "—"}<br/>
        年龄: ${age}<br/>
        报告日期: ${report.report_date ? formatDate(report.report_date) : "—"}
      </div>
    </div>
    ${(() => {
      // Show growth message only if growth section is enabled (or no sections config for backward compat)
      const secs = (settings.sections && settings.sections.length > 0) ? settings.sections : [{ id: "growth", type: "growth", enabled: true }]
      const growthSec = secs.find((s: any) => s.type === 'growth')
      if (!growthSec || !growthSec.enabled) return ''
      return growthMessage ? `
    <div class="growth-box">
      ❝ ${growthMessage} ❞
    </div>` : ''
    })()}
  </div>

  <!-- Section 1: Academic -->
  <div class="card">
    <div class="section-label">📚 一、学业表现</div>
    <table>
      <tr><th>学科</th><th>期中</th><th>期末</th><th>评价</th></tr>
      ${subjectRows}
    </table>
    ${overallAvg !== null ? `
    <div class="stat-row">
      <div class="stat"><div class="num">${overallAvg}</div><div class="label">平均分</div></div>
      <div class="stat"><div class="num">${report.class_rank || "—"}</div><div class="label">班级排名</div></div>
      <div class="stat"><div class="num">${report.improvement || "—"}</div><div class="label">进步幅度</div></div>
    </div>` : ''}
  </div>

  <!-- Section 2: Comprehensive -->
  <div class="card">
    <div class="section-label">⭐ 二、综合素质</div>
    ${(report.activities || []).length > 0 ? `
    <p style="font-size:13px;font-weight:600;color:#4b5563;margin-bottom:4px;">活动参与：</p>
    <ul>${activitiesHTML}</ul>` : ''}
    ${report.self_evaluation ? `
    <div style="margin-top:10px;">
      <p style="font-size:13px;font-weight:600;color:#4b5563;margin-bottom:4px;">自我评价：</p>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:10px 14px;font-size:13px;color:#4b5563;">${report.self_evaluation}</div>
    </div>` : ''}
    ${report.teacher_comment ? `
    <div style="margin-top:10px;">
      <p style="font-size:13px;font-weight:600;color:#4b5563;margin-bottom:4px;">老师评语：</p>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:10px 14px;font-size:13px;color:#4b5563;">${report.teacher_comment}</div>
    </div>` : ''}
  </div>

  ${(() => {
    const secs = settings.sections && settings.sections.length > 0 ? settings.sections : [
      { id: "problems", type: "problems", title: "二、存在问题", enabled: true },
      { id: "improvements", type: "improvements", title: "三、改进措施与建议", enabled: true },
      { id: "goals", type: "goals", title: "四、未来目标", enabled: true },
      { id: "summary", type: "summary", title: "五、总结", enabled: true },
    ]
    return secs.filter((s: any) => s.enabled).map((section: any) => {
      switch(section.type) {
        case 'problems':
          return `<div class="card">
            <div class="section-label orange">⚠ ${section.title}</div>
            ${problems.length > 0 ? `<ul>${problemsHTML}</ul>` : '<p style="font-size:13px;color:#9ca3af;">暂无记录</p>'}
          </div>`
        case 'improvements':
          return `<div class="card">
            <div class="section-label green">✓ ${section.title}</div>
            ${improvements.length > 0 ? `<ul>${improvementsHTML}</ul>` : '<p style="font-size:13px;color:#9ca3af;">暂无记录</p>'}
          </div>`
        case 'goals':
          return `<div class="card">
            <div class="section-label" style="background:${color}">🏁 ${section.title}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
              <div class="goal-box">
                <h4>📖 学业提升</h4>
                <p>${goalAcademic || "提高各科成绩，争取进入班级前列。"}</p>
              </div>
              <div class="goal-box">
                <h4>🌟 综合能力</h4>
                <p>${goalAbility || "积极参与更多课外活动，提升自己的组织和沟通能力。"}</p>
              </div>
              <div class="goal-box">
                <h4>💖 品格发展</h4>
                <p>${goalCharacter || "培养良好的学习和生活习惯，做一个全面发展的学生。"}</p>
              </div>
            </div>
          </div>`
        case 'summary':
          return `<div class="card">
            <div class="section-label" style="background:${color}">📝 ${section.title}</div>
            <p style="font-size:13px;color:#4b5563;line-height:1.6;">${summary || "—"}</p>
          </div>`
        case 'text':
          if (!section.content) return ''
          return `<div class="card">
            <div class="section-label" style="background:${color}">📄 ${section.title}</div>
            <p style="font-size:13px;color:#4b5563;line-height:1.6;">${section.content}</p>
          </div>`
        default:
          return ''
      }
    }).join('')
  })()}

  <!-- Footer -->
  ${settings.schoolAddress || settings.schoolPhone ? `
  <div style="background:#f9fafb;border-radius:10px;padding:10px 16px;font-size:11px;color:#6b7280;text-align:center;margin-bottom:12px;">
    ${settings.schoolAddress || ''} ${settings.schoolAddress && settings.schoolPhone ? '·' : ''} ${settings.schoolPhone || ''}
  </div>` : ''}
  <div class="footer">${settings.footerText || ''}</div>
</div>
</body></html>`
}

// ── Report PDF Generation ──
export const generateReportPDF = async (report: StudentReport, settings: ReportSettingsPreset, student?: { name?: string; student_id?: string; code?: string; dob?: string; grade?: string; avatar?: string }): Promise<Blob> => {
  const html = generateReportHTML(report, settings, student)

  // Create hidden iframe to render full HTML
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.left = '-9999px'
  iframe.style.top = '0'
  iframe.style.width = '834px'
  iframe.style.height = '2000px'
  iframe.style.zIndex = '-1'
  document.body.appendChild(iframe)

  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow!.document
    iframeDoc.open()
    iframeDoc.write(html)
    iframeDoc.close()

    // Wait for fonts/images to load
    await new Promise((r) => setTimeout(r, 600))

    // Capture the report container
    const wrapper = iframeDoc.querySelector('.report') as HTMLElement || iframeDoc.body
    const canvas = await html2canvas(wrapper, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
    })

    // Calculate page dimensions
    const A4_WIDTH_MM = 210
    const A4_HEIGHT_MM = 297
    const imgWidth = A4_WIDTH_MM
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    const pageHeight = A4_HEIGHT_MM

    // Create PDF - handle multi-page
    const pdf = new jsPDF('p', 'mm', 'a4')

    if (imgHeight <= pageHeight + 5) {
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight)
    } else {
      let remainingHeight = canvas.height
      let srcY = 0
      let pageNum = 0

      while (remainingHeight > 0) {
        if (pageNum > 0) pdf.addPage()

        const srcH = Math.min(remainingHeight, Math.floor((pageHeight / imgHeight) * canvas.height))
        const pageCanvas = document.createElement('canvas')
        pageCanvas.width = canvas.width
        pageCanvas.height = srcH
        const ctx = pageCanvas.getContext('2d')!
        ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH)

        const pageImgData = pageCanvas.toDataURL('image/png')
        const pageImgH = (pageCanvas.height * imgWidth) / pageCanvas.width
        pdf.addImage(pageImgData, 'PNG', 0, 0, imgWidth, pageImgH)

        srcY += srcH
        remainingHeight -= srcH
        pageNum++
      }
    }

    const blob = pdf.output('blob')
    return blob
  } finally {
    if (iframe.parentNode) {
      document.body.removeChild(iframe)
    }
  }
}

export const downloadReportPDF = async (report: StudentReport, settings: ReportSettingsPreset, student?: { name?: string; student_id?: string; code?: string; dob?: string; grade?: string; avatar?: string }): Promise<void> => {
  try {
    const blob = await generateReportPDF(report, settings, student)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Report_' + (student?.name || 'Student') + '.pdf'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 3000)
  } catch (e) {
    console.error('Report PDF download failed:', e)
    throw new Error('Report PDF download failed')
  }
}

export const printReportPDF = async (report: StudentReport, settings: ReportSettingsPreset, student?: { name?: string; student_id?: string; code?: string; dob?: string; grade?: string; avatar?: string }): Promise<void> => {
  try {
    const blob = await generateReportPDF(report, settings, student)
    const url = URL.createObjectURL(blob)
    const w = window.open(url, '_blank')
    if (w) {
      w.onload = () => {
        w.print()
        setTimeout(() => {
          w.close()
          URL.revokeObjectURL(url)
        }, 1000)
      }
    }
  } catch (e) {
    console.error('Report PDF print failed:', e)
    throw new Error('Report PDF print failed')
  }
}

export const printInvoicePDF = async (invoice: Invoice, settings: InvoiceSettingsPreset): Promise<void> => {
  try {
    const blob = await generateInvoicePDF(invoice, settings)
    const url = URL.createObjectURL(blob)
    const w = window.open(url, '_blank')
    if (w) {
      w.onload = () => {
        w.print()
        setTimeout(() => {
          w.close()
          URL.revokeObjectURL(url)
        }, 1000)
      }
    }
  } catch (e) {
    console.error('PDF print failed:', e)
    throw new Error('PDF print failed')
  }
}
