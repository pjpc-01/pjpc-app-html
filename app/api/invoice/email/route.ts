import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// POST: Send email with PDF attachment
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('pdf') as Blob
    const to = formData.get('to') as string
    const subject = formData.get('subject') as string
    const body = formData.get('body') as string
    const invoiceNumber = (formData.get('invoiceNumber') as string) || 'invoice'

    if (!file || !to) {
      return NextResponse.json({ error: 'Missing PDF or recipient email' }, { status: 400 })
    }

    // SMTP config — use env vars or fallback
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
    const smtpPort = parseInt(process.env.SMTP_PORT || '587')
    const smtpUser = process.env.SMTP_USER || ''
    const smtpPass = process.env.SMTP_PASS || ''

    if (!smtpUser || !smtpPass) {
      return NextResponse.json({ 
        error: 'SMTP not configured. Set SMTP_USER and SMTP_PASS in .env.local',
        fallback: true
      }, { status: 400 })
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass }
    })

    const buffer = Buffer.from(await file.arrayBuffer())

    await transporter.sendMail({
      from: smtpUser,
      to,
      subject: subject || `发票 ${invoiceNumber}`,
      text: body,
      attachments: [{
        filename: `Invoice_${invoiceNumber}.pdf`,
        content: buffer,
        contentType: 'application/pdf'
      }]
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('Email send failed:', e)
    return NextResponse.json({ error: e.message || 'Send failed' }, { status: 500 })
  }
}
