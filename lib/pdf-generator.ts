import jsPDF from "jspdf"
import "jspdf-autotable"
import { Invoice } from '@/hooks/useInvoices'
import { renderInvoiceTemplate, type TemplateData } from './template-renderer'

export interface PDFOptions {
  schoolName: string
  schoolLogo?: string
  schoolAddress: string
  schoolPhone: string
  schoolEmail: string
  taxNumber: string
}

// ── Generate PDF from HTML template ──
export const generateInvoicePDF = async (
  invoice: Invoice,
  options: PDFOptions,
  templateHtml?: string
): Promise<Blob> => {
  const doc = new jsPDF()

  if (templateHtml) {
    // === TEMPLATE PATH ===
    // Build TemplateData from invoice
    const templateData: TemplateData = {
      schoolName: options.schoolName,
      schoolAddress: options.schoolAddress,
      schoolPhone: options.schoolPhone,
      schoolEmail: options.schoolEmail,
      invoiceNumber: invoice.invoiceNumber || '',
      issueDate: invoice.issueDate || '',
      dueDate: invoice.dueDate || '',
      studentName: (invoice as any).studentName || (invoice as any).student || '',
      studentGrade: (invoice as any).grade || (invoice as any).standard || '',
      parentName: (invoice as any).parentName || (invoice as any).parent_name || '',
      items: (invoice.items || []).map((i: any) => ({
        name: i.name || i.description || '',
        amount: Number(i.amount) || 0
      })),
      totalAmount: Number(invoice.totalAmount) || 0,
      tax: Number((invoice as any).tax) || 0,
      discount: Number((invoice as any).discount) || 0,
      paymentMethod: (invoice as any).paymentMethod || '',
      notes: (invoice as any).notes || ''
    }

    // Render the HTML template with data
    const renderedHtml = renderInvoiceTemplate(templateHtml, templateData)

    // Wrap in a styled container for PDF conversion
    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 11px; color: #333; margin: 0; padding: 20px; }
  .invoice-template { max-width: 780px; margin: 0 auto; }
  .header { text-align: center; margin-bottom: 16px; }
  .header h1 { font-size: 20px; margin: 0 0 4px 0; color: #4f46e5; }
  .header p { margin: 2px 0; font-size: 10px; color: #666; }
  .invoice-info { margin-bottom: 16px; }
  .invoice-info h2 { font-size: 16px; margin: 0 0 8px 0; }
  .invoice-info p { margin: 2px 0; }
  .student-info { margin-bottom: 16px; }
  .student-info h3 { font-size: 13px; margin: 0 0 6px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
  .items { margin-bottom: 16px; }
  .items h3 { font-size: 13px; margin: 0 0 6px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
  .item { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dotted #e5e7eb; }
  .total { text-align: right; font-size: 16px; font-weight: bold; margin-top: 12px; padding-top: 8px; border-top: 2px solid #333; }
  table { width: 100%; border-collapse: collapse; }
  table th { background: #4f46e5; color: white; padding: 6px 10px; text-align: left; font-size: 10px; }
  table td { padding: 6px 10px; border-bottom: 1px solid #e5e7eb; font-size: 10px; }
  .notes-section { margin-top: 16px; font-size: 10px; color: #666; }
</style>
</head>
<body>
  ${renderedHtml}
</body>
</html>`

    // Convert HTML to PDF using jsPDF.html() (html2canvas internally)
    await doc.html(fullHtml, {
      callback: function (doc) {
        // PDF generated — callback fires when done
      },
      x: 5,
      y: 5,
      width: doc.internal.pageSize.getWidth() - 10,
      windowWidth: 820
    })

    return doc.output("blob")
  }

  // === FALLBACK: Hardcoded layout (no template) ===
  return generateHardcodedPDF(invoice, options, doc)
}

// ── Fallback hardcoded layout ──
function generateHardcodedPDF(invoice: Invoice, options: PDFOptions, doc: jsPDF): Blob {
  const pageW = doc.internal.pageSize.getWidth()

  // Header / School Info
  doc.setFontSize(20)
  doc.setTextColor(79, 70, 229)
  doc.text(options.schoolName, pageW / 2, 20, { align: "center" })
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(options.schoolAddress, pageW / 2, 27, { align: "center" })
  doc.text(`Tel: ${options.schoolPhone}  |  Email: ${options.schoolEmail}`, pageW / 2, 32, { align: "center" })
  doc.text(`Tax No: ${options.taxNumber}`, pageW / 2, 37, { align: "center" })

  doc.setDrawColor(200)
  doc.line(14, 42, pageW - 14, 42)

  // Invoice Info
  doc.setFontSize(16)
  doc.setTextColor(51)
  doc.text(`Invoice #${invoice.invoiceNumber}`, 14, 52)
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Issue: ${invoice.issueDate}`, 14, 59)
  doc.text(`Due: ${invoice.dueDate}`, 14, 65)
  doc.text(`Student: ${(invoice as any).studentName || (invoice as any).student || ''}`, 14, 71)

  // Items Table
  const tableRows = (invoice.items || []).map((item: any) => [
    item.name || item.description || "—",
    `RM ${(item.amount || 0).toFixed(2)}`
  ])
  if (tableRows.length > 0) {
    (doc as any).autoTable({
      startY: 80,
      head: [["Item", "Amount (RM)"]],
      body: tableRows,
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      styles: { font: "helvetica", fontSize: 10 },
      columnStyles: { 1: { halign: "right" } },
    })
  }

  const finalY = (doc as any).lastAutoTable?.finalY || 80

  // Total
  doc.setFontSize(14)
  doc.setTextColor(51)
  doc.text(`Total: RM ${(invoice.totalAmount || 0).toFixed(2)}`, pageW - 14, finalY + 12, { align: "right" })

  // Notes
  if ((invoice as any).notes) {
    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text(`Notes: ${(invoice as any).notes}`, 14, finalY + 25)
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15
  doc.setDrawColor(200)
  doc.line(14, footerY - 5, pageW - 14, footerY - 5)
  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text(`Thank you for choosing ${options.schoolName}.`, pageW / 2, footerY, { align: "center" })

  return doc.output("blob")
}

// ── Download PDF ──
export const downloadInvoicePDF = async (
  invoice: Invoice,
  options: PDFOptions,
  templateHtml?: string
): Promise<void> => {
  try {
    const blob = await generateInvoicePDF(invoice, options, templateHtml)
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
  options: PDFOptions,
  templateHtml?: string
): Promise<void> => {
  try {
    const blob = await generateInvoicePDF(invoice, options, templateHtml)
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
