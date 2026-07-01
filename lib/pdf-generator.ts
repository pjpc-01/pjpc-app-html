import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { Invoice } from '@/hooks/useInvoices'

// Register autoTable plugin on jsPDF prototype (required for Next.js ESM)
;(jsPDF as any).API.autoTable = autoTable
import { type InvoiceSettingsPreset } from '@/app/components/finance/invoice-management/InvoiceSettingsManager'

// Re-export for convenience
export type { InvoiceSettingsPreset } from '@/app/components/finance/invoice-management/InvoiceSettingsManager'

// Status helper
const getStatusText = (status: string): string => {
  const map: Record<string,string> = {draft:'草稿',issued:'已开具',sent:'已发送',pending:'待付款',overdue:'已逾期',paid:'已付款',cancelled:'已取消'}
  return map[status] || status
}

// ── Generate PDF using InvoiceSettingsPreset ──
export const generateInvoicePDF = async (
  invoice: Invoice,
  settings: InvoiceSettingsPreset
): Promise<Blob> => {
  const doc = new jsPDF()
  const pageW = doc.internal.pageSize.getWidth()

  const primaryHex = settings.primaryColor || '#1e40af'
  const secondaryHex = settings.secondaryColor || '#3b82f6'
  const accentHex = settings.accentColor || '#f59e0b'

  // ── Header Gradient (simulated) ──
  doc.setFillColor(hexToRGB(primaryHex).r, hexToRGB(primaryHex).g, hexToRGB(primaryHex).b)
  doc.rect(0, 0, pageW, 40, 'F')

  doc.setFontSize(22)
  doc.setTextColor(255, 255, 255)
  doc.text(settings.schoolName || '智慧教育学校', pageW / 2, 16, { align: "center" })
  if (settings.schoolNameEn) {
    doc.setFontSize(10)
    doc.text(settings.schoolNameEn, pageW / 2, 23, { align: "center" })
  }

  // Badge
  doc.setFontSize(12)
  doc.setTextColor(255, 255, 255)
  doc.text('INVOICE 发票', pageW - 14, 14, { align: "right" })

  doc.setDrawColor(200)
  doc.line(14, 45, pageW - 14, 45)

  // ── Invoice Info ──
  doc.setFontSize(16)
  doc.setTextColor(hexToRGB(primaryHex).r, hexToRGB(primaryHex).g, hexToRGB(primaryHex).b)
  doc.text(`Invoice #${invoice.invoiceNumber || ''}`, 14, 55)
  doc.setFontSize(10)
  doc.setTextColor(80)
  doc.text(`Issue: ${invoice.issueDate || ''}`, 14, 62)
  doc.text(`Due: ${invoice.dueDate || ''}`, 14, 68)
  doc.text(`Student: ${(invoice as any).studentName || (invoice as any).student || ''}`, 14, 74)
  doc.text(`Status: ${getStatusText(invoice.status || '')}`, 14, 80)

  // ── School Info ──
  doc.setFontSize(9)
  doc.setTextColor(120)
  const schoolInfoLines = [settings.schoolAddress, settings.schoolPhone, settings.schoolEmail].filter(Boolean)
  schoolInfoLines.forEach((line, i) => {
    doc.text(line, pageW - 14, 55 + i * 5, { align: "right" })
  })

  // ── Items Table ──
  const tableRows = (invoice.items || []).map((item: any) => [
    item.name || item.description || "—",
    `RM ${(item.amount || 0).toFixed(2)}`
  ])
  if (tableRows.length > 0) {
    (doc as any).autoTable({
      startY: 88,
      head: [["Item", "Amount (RM)"]],
      body: tableRows,
      theme: "grid",
      headStyles: { fillColor: [hexToRGB(primaryHex).r, hexToRGB(primaryHex).g, hexToRGB(primaryHex).b], textColor: 255 },
      styles: { font: "helvetica", fontSize: 10 },
      columnStyles: { 1: { halign: "right" } },
    })
  }

  const finalY = (doc as any).lastAutoTable?.finalY || 88

  // ── Total ──
  doc.setFontSize(14)
  doc.setTextColor(hexToRGB(primaryHex).r, hexToRGB(primaryHex).g, hexToRGB(primaryHex).b)
  doc.text(`Total: RM ${(invoice.totalAmount || 0).toFixed(2)}`, pageW - 14, finalY + 12, { align: "right" })

  // ── Payment Info (Bank) ──
  if (settings.bankName || settings.bankAccount) {
    const bankY = finalY + 25
    doc.setDrawColor(hexToRGB(accentHex).r, hexToRGB(accentHex).g, hexToRGB(accentHex).b)
    doc.setLineWidth(0.5)
    doc.line(14, bankY, 14, bankY + 20)
    doc.setLineWidth(0.2)
    doc.setFontSize(9)
    doc.setTextColor(80)
    doc.text('Payment Info:', 20, bankY + 4)
    doc.setFontSize(8)
    let bY = bankY + 10
    if (settings.bankName) { doc.text(`Bank: ${settings.bankName}`, 20, bY); bY += 5 }
    if (settings.bankAccount) { doc.text(`Account: ${settings.bankAccount}`, 20, bY); bY += 5 }
    if (settings.bankHolder) { doc.text(`Holder: ${settings.bankHolder}`, 20, bY) }
  }

  // ── Notes ──
  if ((invoice as any).notes) {
    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text(`Notes: ${(invoice as any).notes}`, 14, finalY + 60)
  }

  // ── Footer ──
  const footerY = doc.internal.pageSize.getHeight() - 15
  doc.setDrawColor(200)
  doc.line(14, footerY - 5, pageW - 14, footerY - 5)
  doc.setFontSize(8)
  doc.setTextColor(150)
  const footerText = settings.footerText || `Thank you for choosing ${settings.schoolName}.`
  doc.text(footerText, pageW / 2, footerY, { align: "center" })
  doc.text(`${settings.schoolName}${settings.taxNumber ? ' · Tax: ' + settings.taxNumber : ''}`, pageW / 2, footerY + 5, { align: "center" })

  return doc.output("blob")
}

// ── Hex to RGB ──
function hexToRGB(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '')
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  }
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
