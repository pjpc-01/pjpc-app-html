import { NextRequest, NextResponse } from 'next/server'

const WHATSAPP_API = 'https://graph.facebook.com/v21.0'

// POST: Send WhatsApp message with PDF document
export async function POST(req: NextRequest) {
  try {
    const { to, message, pdfUrl, invoiceNumber } = await req.json()

    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

    if (!phoneNumberId || !accessToken) {
      return NextResponse.json({
        error: 'WhatsApp API not configured. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in .env.local',
        fallback: true
      }, { status: 400 })
    }

    if (!to || !pdfUrl) {
      return NextResponse.json({ error: 'Missing "to" or "pdfUrl"' }, { status: 400 })
    }

    const toNumber = to.replace(/\s+/g, '').replace(/^0/, '60').replace(/^\+/, '')

    // 1. Send text message first
    const textRes = await fetch(`${WHATSAPP_API}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: toNumber,
        type: 'text',
        text: { body: message }
      })
    })

    if (!textRes.ok) {
      const err = await textRes.json()
      console.error('WhatsApp text send failed:', err)
      return NextResponse.json({ error: 'Text send failed', detail: err }, { status: 500 })
    }

    // 2. Send PDF document (WhatsApp downloads from the URL)
    const docRes = await fetch(`${WHATSAPP_API}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: toNumber,
        type: 'document',
        document: {
          link: pdfUrl,
          filename: `Invoice_${invoiceNumber || 'invoice'}.pdf`
        }
      })
    })

    if (!docRes.ok) {
      const err = await docRes.json()
      console.error('WhatsApp document send failed:', err)
      return NextResponse.json({ error: 'Document send failed (text was sent)', detail: err }, { status: 500 })
    }

    const result = await docRes.json()
    return NextResponse.json({ success: true, messageId: result.messages?.[0]?.id })

  } catch (e: any) {
    console.error('WhatsApp send error:', e)
    return NextResponse.json({ error: e.message || 'Send failed' }, { status: 500 })
  }
}
