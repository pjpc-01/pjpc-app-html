import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { Invoice } from '@/hooks/useInvoices'
import { type InvoiceSettingsPreset } from '@/app/components/finance/invoice-management/InvoiceSettingsManager'

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
          <p><strong>${invoice.studentName}</strong></p>
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
