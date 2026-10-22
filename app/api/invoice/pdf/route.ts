import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// POST: Upload PDF blob, store to public/invoices/, return URL
export async function POST(req: NextRequest) {
  const gate = await requireRoles(req, ['admin', 'teacher', 'office_admin'])
  if ('error' in gate) return gate.error
  try {
    const formData = await req.formData()
    const file = formData.get('pdf') as Blob
    const invoiceNumber = formData.get('invoiceNumber') as string || 'unknown'

    if (!file) {
      return NextResponse.json({ error: 'No PDF file provided' }, { status: 400 })
    }

    // Ensure public/invoices/ directory exists
    const dir = join(process.cwd(), 'public', 'invoices')
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = `Invoice_${invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`
    const filepath = join(dir, filename)

    await writeFile(filepath, buffer)

    const url = `/invoices/${filename}`
    return NextResponse.json({ success: true, url })
  } catch (e: any) {
    console.error('PDF upload failed:', e)
    return NextResponse.json({ error: e.message || 'Upload failed' }, { status: 500 })
  }
}
