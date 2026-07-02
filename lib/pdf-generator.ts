import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { Invoice } from '@/hooks/useInvoices'

import { type InvoiceSettingsPreset } from '@/app/components/finance/invoice-management/InvoiceSettingsManager'

// Re-export for convenience
export type { InvoiceSettingsPreset } from '@/app/components/finance/invoice-management/InvoiceSettingsManager'

// Status helper
const getStatusText = (status: string): string => {
  const map: Record<string,string> = {draft:'草稿',issued:'已开具',sent:'已发送',pending:'待付款',overdue:'已逾期',paid:'已付款',cancelled:'已取消'}
  return map[status] || status
}

// Hex to RGB
function hexToRGB(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '')
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  }
}

// ── Build HTML string for the invoice ──
function buildInvoiceHTML(invoice: Invoice, settings: InvoiceSettingsPreset): string {
  const primaryHex = settings.primaryColor || '#1e40af'
  const accentHex = settings.accentColor || '#f59e0b'
  const rgb = hexToRGB(primaryHex)
  const rgbAccent = hexToRGB(accentHex)
  
  const itemsHTML = (invoice.items || []).map((item: any) => 
    `<tr><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${item.name || item.description || "—"}</td><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right">RM ${(item.amount || 0).toFixed(2)}</td></tr>`
  ).join('')
  
  const bankHTML = (settings.bankName || settings.bankAccount) ? `
    <div style="margin-top:16px;border-left:3px solid ${accentHex};padding-left:12px">
      <p style="font-size:10px;margin:0 0 4px;color:#6b7280">Payment Info</p>
      ${settings.bankName ? `<p style="font-size:9px;margin:0;color:#374151">Bank: ${settings.bankName}</p>` : ''}
      ${settings.bankAccount ? `<p style="font-size:9px;margin:0;color:#374151">Account: ${settings.bankAccount}</p>` : ''}
      ${settings.bankHolder ? `<p style="font-size:9px;margin:0;color:#374151">Holder: ${settings.bankHolder}</p>` : ''}
    </div>` : ''
    
  const notesHTML = (invoice as any).notes ? `<p style="font-size:9px;color:#6b7280;margin-top:12px">Notes: ${(invoice as any).notes}</p>` : ''
    
  const footerText = settings.footerText || `Thank you for choosing ${settings.schoolName || 'our school'}.`

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box }
  body { font-family: "Noto Sans SC", "Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", sans-serif; color:#1f2937; padding:0; }
</style>
</head>
<body>
<div style="width:595px;margin:0 auto">

  <!-- Header -->
  <div style="background:${primaryHex};color:#fff;padding:16px 20px;position:relative">
    <div style="font-size:22px;font-weight:700;text-align:center">${settings.schoolName || '智慧教育学校'}</div>
    ${settings.schoolNameEn ? `<div style="font-size:10px;text-align:center;margin-top:2px">${settings.schoolNameEn}</div>` : ''}
    <div style="position:absolute;right:20px;top:14px;font-size:12px">INVOICE 发票</div>
  </div>

  <!-- Invoice Info -->
  <div style="display:flex;justify-content:space-between;padding:14px 20px">
    <div>
      <div style="font-size:16px;font-weight:700;color:${primaryHex}">Invoice #${invoice.invoiceNumber || ''}</div>
      <div style="font-size:10px;color:#6b7280;margin-top:2px">Issue: ${invoice.issueDate || ''}</div>
      <div style="font-size:10px;color:#6b7280">Due: ${invoice.dueDate || ''}</div>
      <div style="font-size:10px;color:#6b7280">Student: ${(invoice as any).studentName || (invoice as any).student || ''}</div>
      <div style="font-size:10px;color:#6b7280">Status: ${getStatusText(invoice.status || '')}</div>
    </div>
    <div style="text-align:right;font-size:9px;color:#9ca3af">
      ${settings.schoolAddress ? `<div>${settings.schoolAddress}</div>` : ''}
      ${settings.schoolPhone ? `<div>${settings.schoolPhone}</div>` : ''}
      ${settings.schoolEmail ? `<div>${settings.schoolEmail}</div>` : ''}
    </div>
  </div>

  <!-- Items Table -->
  <div style="padding:0 20px">
    ${(invoice.items || []).length > 0 ? `
    <table style="width:100%;border-collapse:collapse;font-size:10px">
      <thead>
        <tr style="background:${primaryHex};color:#fff">
          <th style="padding:6px 8px;text-align:left">Item</th>
          <th style="padding:6px 8px;text-align:right">Amount (RM)</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
      </tbody>
    </table>
    ` : ''}

    <!-- Total -->
    <div style="text-align:right;font-size:14px;font-weight:700;color:${primaryHex};padding-top:8px;border-top:1px solid #e5e7eb;margin-top:8px">
      Total: RM ${(invoice.totalAmount || 0).toFixed(2)}
    </div>
  </div>

  <!-- Payment Info -->
  <div style="padding:0 20px">
    ${bankHTML}
    ${notesHTML}
  </div>

  <!-- Footer -->
  <div style="margin-top:24px;padding:10px 20px;border-top:1px solid #e5e7eb;text-align:center;font-size:8px;color:#9ca3af">
    <div>${footerText}</div>
    <div>${settings.schoolName || ''}${settings.taxNumber ? ' · Tax: ' + settings.taxNumber : ''}</div>
  </div>

</div>
</body>
</html>`
}

// ── Generate PDF using jsPDF html() for native Chinese rendering ──
export const generateInvoicePDF = async (
  invoice: Invoice,
  settings: InvoiceSettingsPreset
): Promise<Blob> => {
  const doc = new jsPDF({ unit: 'px', format: 'a4' })
  const html = buildInvoiceHTML(invoice, settings)
  
  await doc.html(html, {
    x: 0,
    y: 0,
    width: doc.internal.pageSize.getWidth(),
    windowWidth: 595, // A4 width in px at 72dpi
    autoPaging: 'text',
  })
  
  return doc.output("blob")
}

// ── Download PDF ──
export const downloadInvoicePDF = async (
  invoice: Invoice,
  settings: InvoiceSettingsPreset
): Promise<void> => {
  try {
    const blob = await generateInvoicePDF(invoice, settings)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Invoice_${invoice.invoiceNumber}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('PDF generation failed:', error)
    throw new Error('PDF generation failed')
  }
}

// ── Print PDF ──
export const printInvoicePDF = async (
  invoice: Invoice,
  settings: InvoiceSettingsPreset
): Promise<void> => {
  try {
    const blob = await generateInvoicePDF(invoice, settings)
    const url = URL.createObjectURL(blob)
    const printWindow = window.open(url, '_blank')
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print()
        setTimeout(() => { printWindow.close(); URL.revokeObjectURL(url) }, 1000)
      }
    }
  } catch (error) {
    console.error('PDF printing failed:', error)
    throw new Error('PDF printing failed')
  }
}
