import { NextRequest, NextResponse } from 'next/server'
import { nfcManager } from '@/lib/nfc-rfid'

// 静态导出配置
export const dynamic = 'force-static'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'add-test-cards') {
      // 添加测试卡片
      const testCards = [
        {
          cardNumber: 'NFC_TEST_001',
          studentId: 'G16',
          studentName: '张三',
          cardType: 'NFC' as const,
          status: 'active' as const,
          issuedDate: new Date(),
          usageCount: 0,
          studentUrl: 'https://school.com/student/G16'
        },
        {
          cardNumber: 'RFID_TEST_001',
          studentId: 'G17',
          studentName: '李四',
          cardType: 'RFID' as const,
          status: 'active' as const,
          issuedDate: new Date(),
          usageCount: 0,
          studentUrl: 'https://school.com/student/G17'
        },
        {
          cardNumber: 'NFC_TEST_002',
          studentId: 'G18',
          studentName: '王五',
          cardType: 'NFC' as const,
          status: 'active' as const,
          issuedDate: new Date(),
          usageCount: 0,
          studentUrl: 'https://school.com/student/G18'
        },
        {
          cardNumber: 'RFID_TEST_002',
          studentId: 'G19',
          studentName: '赵六',
          cardType: 'RFID' as const,
          status: 'active' as const,
          issuedDate: new Date(),
          usageCount: 0,
          studentUrl: 'https://school.com/student/G19'
        }
      ]

      const results = []
      for (const cardData of testCards) {
        try {
          const card = await nfcManager.addCard(cardData)
          results.push({ success: true, card })
        } catch (error) {
          results.push({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Test cards added successfully',
        results
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error adding test data:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to add test data',
        success: false
      },
      { status: 500 }
    )
  }
} 