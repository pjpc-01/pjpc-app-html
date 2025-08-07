import { Invoice } from '@/hooks/useInvoices'

export interface PDFOptions {
  schoolName: string
  schoolLogo?: string
  schoolAddress: string
  schoolPhone: string
  schoolEmail: string
  taxNumber: string
}

export const generateInvoicePDF = async (invoice: Invoice, options: PDFOptions): Promise<Blob> => {
  // This is a mock implementation that would typically use a library like jsPDF or react-pdf
  // In a real implementation, you would use a proper PDF library
  
  const pdfContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>发票 - ${invoice.invoiceNumber}</title>
      <style>
        body {
          font-family: 'Microsoft YaHei', Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background: white;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .school-info {
          margin-bottom: 20px;
        }
        .invoice-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .invoice-details {
          flex: 1;
        }
        .invoice-number {
          font-size: 24px;
          font-weight: bold;
          color: #333;
          margin-bottom: 10px;
        }
        .status {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .status.${invoice.status} {
          background: ${getStatusColor(invoice.status)};
          color: white;
        }
        .student-info {
          margin-bottom: 30px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .items-table th,
        .items-table td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        .items-table th {
          background: #f5f5f5;
          font-weight: bold;
        }
        .totals {
          text-align: right;
          margin-bottom: 30px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .total-amount {
          font-size: 20px;
          font-weight: bold;
          color: #333;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #666;
        }
        .payment-info {
          margin-top: 20px;
          padding: 15px;
          background: #f9f9f9;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${options.schoolName}</h1>
        <div class="school-info">
          <p>地址: ${options.schoolAddress}</p>
          <p>电话: ${options.schoolPhone} | 邮箱: ${options.schoolEmail}</p>
          <p>税号: ${options.taxNumber}</p>
        </div>
      </div>
      
      <div class="invoice-info">
        <div class="invoice-details">
          <div class="invoice-number">发票号码: ${invoice.invoiceNumber}</div>
          <div>开票日期: ${invoice.issueDate}</div>
          <div>到期日期: ${invoice.dueDate}</div>
          <div>学生: ${invoice.student}</div>
        </div>
        <div>
          <span class="status ${invoice.status}">${getStatusText(invoice.status)}</span>
        </div>
      </div>
      
      <table class="items-table">
        <thead>
          <tr>
            <th>项目</th>
            <th>金额 (RM)</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map(item => `
            <tr>
              <td>${item.name}</td>
              <td>${item.amount.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="totals">
        <div class="total-row">
          <span>小计:</span>
          <span>RM ${invoice.amount.toFixed(2)}</span>
        </div>
        ${invoice.tax > 0 ? `
          <div class="total-row">
            <span>税费:</span>
            <span>RM ${invoice.tax.toFixed(2)}</span>
          </div>
        ` : ''}
        ${invoice.discount > 0 ? `
          <div class="total-row">
            <span>折扣:</span>
            <span>-RM ${invoice.discount.toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="total-row total-amount">
          <span>总计:</span>
          <span>RM ${invoice.totalAmount.toFixed(2)}</span>
        </div>
      </div>
      
      ${invoice.paymentMethod ? `
        <div class="payment-info">
          <h4>付款信息</h4>
          <p>付款方式: ${invoice.paymentMethod}</p>
          ${invoice.paidDate ? `<p>付款日期: ${invoice.paidDate}</p>` : ''}
        </div>
      ` : ''}
      
      ${invoice.notes ? `
        <div class="payment-info">
          <h4>备注</h4>
          <p>${invoice.notes}</p>
        </div>
      ` : ''}
      
      <div class="footer">
        <p>感谢您选择${options.schoolName}！如有疑问，请联系我们。</p>
        <p>本发票由系统自动生成，具有法律效力。</p>
      </div>
    </body>
    </html>
  `

  // In a real implementation, you would use a PDF library here
  // For now, we'll return a mock blob
  const blob = new Blob([pdfContent], { type: 'text/html' })
  return blob
}

const getStatusColor = (status: Invoice['status']): string => {
  switch (status) {
    case 'draft': return '#6b7280'
    case 'issued': return '#3b82f6'
    case 'sent': return '#8b5cf6'
    case 'pending': return '#f59e0b'
    case 'overdue': return '#ef4444'
    case 'paid': return '#10b981'
    case 'cancelled': return '#6b7280'
    default: return '#6b7280'
  }
}

const getStatusText = (status: Invoice['status']): string => {
  switch (status) {
    case 'draft': return '草稿'
    case 'issued': return '已开具'
    case 'sent': return '已发送'
    case 'pending': return '待付款'
    case 'overdue': return '已逾期'
    case 'paid': return '已付款'
    case 'cancelled': return '已取消'
    default: return '未知'
  }
}

export const downloadInvoicePDF = async (invoice: Invoice, options: PDFOptions): Promise<void> => {
  try {
    const blob = await generateInvoicePDF(invoice, options)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `发票_${invoice.invoiceNumber}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('PDF generation failed:', error)
    throw new Error('PDF generation failed')
  }
}

export const printInvoicePDF = async (invoice: Invoice, options: PDFOptions): Promise<void> => {
  try {
    const blob = await generateInvoicePDF(invoice, options)
    const url = URL.createObjectURL(blob)
    const printWindow = window.open(url, '_blank')
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print()
        setTimeout(() => {
          printWindow.close()
          URL.revokeObjectURL(url)
        }, 1000)
      }
    }
  } catch (error) {
    console.error('PDF printing failed:', error)
    throw new Error('PDF printing failed')
  }
} 