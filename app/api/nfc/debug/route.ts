import { NextRequest, NextResponse } from 'next/server'
import { nfcManager } from '@/lib/nfc-rfid'

export async function GET(request: NextRequest) {
  try {
    const cards = await nfcManager.getAllCards()
    
    return NextResponse.json({
      success: true,
      count: cards.length,
      cards: cards.map(card => ({
        id: card.id,
        cardNumber: card.cardNumber,
        studentName: card.studentName,
        cardType: card.cardType,
        status: card.status
      }))
    })
  } catch (error) {
    console.error('Error getting cards:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to get cards',
        success: false
      },
      { status: 500 }
    )
  }
} 