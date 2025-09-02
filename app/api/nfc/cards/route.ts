import { NextRequest, NextResponse } from 'next/server'
import { nfcManager } from '@/lib/nfc-rfid'

// 静态导出配置
export const dynamic = 'force-static'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cardNumber, studentId, studentName, cardType, status, issuedDate, expiryDate, notes } = body

    // 验证必要参数
    if (!cardNumber || !studentId || !studentName) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // 检查卡号是否已存在
    const existingCard = await nfcManager.getCardByNumber(cardNumber)
    if (existingCard) {
      return NextResponse.json(
        { error: 'Card number already exists' },
        { status: 409 }
      )
    }

    // 添加新卡
    const newCard = await nfcManager.addCard({
      cardNumber,
      studentId,
      studentName,
      cardType: cardType || 'NFC',
      status: status || 'active',
      issuedDate: new Date(issuedDate),
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      usageCount: 0,
      notes,
    })

    return NextResponse.json({
      success: true,
      data: newCard,
      message: 'Card added successfully'
    })

  } catch (error) {
    console.error('Error adding NFC card:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to add card',
        success: false
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const cardNumber = searchParams.get('cardNumber')

    let cards

    if (studentId) {
      // 根据学生ID获取卡
      const card = await nfcManager.getCardByStudentId(studentId)
      cards = card ? [card] : []
    } else if (cardNumber) {
      // 根据卡号获取卡
      const card = await nfcManager.getCardByNumber(cardNumber)
      cards = card ? [card] : []
    } else {
      // 获取所有卡
      cards = await nfcManager.getAllCards()
    }

    return NextResponse.json({
      success: true,
      data: cards,
      count: cards.length
    })

  } catch (error) {
    console.error('Error fetching NFC cards:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch cards',
        success: false
      },
      { status: 500 }
    )
  }
} 