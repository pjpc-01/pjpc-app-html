import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase } from '@/lib/pocketbase'
import { StudentCard } from '@/lib/pocketbase-students-card'

// 静态导出配置
export const dynamic = 'force-static'

export async function POST(request: NextRequest) {
  try {
    const { cards } = await request.json()
    
    if (!Array.isArray(cards)) {
      return NextResponse.json(
        { error: 'cards 必须是数组' },
        { status: 400 }
      )
    }
    
    console.log(`开始批量创建 ${cards.length} 个学生卡片...`)
    
    const pb = await getPocketBase()
    
    // 认证
    await authenticateAdmin(pb)
    console.log('✅ PocketBase 认证成功')
    
    const createdCards: StudentCard[] = []
    const errors: string[] = []
    
    for (const card of cards) {
      try {
        // 只包含必要字段，与简单测试保持一致（加入 center 支持）
        const cleanCard = {
          studentId: card.studentId?.trim() || '',
          studentName: card.studentName?.trim() || '',
          studentUrl: card.studentUrl?.trim() || '',
          center: (card.center?.trim?.() || '').trim(),
          grade: card.grade?.trim?.() || ''
        }
        
        // 验证必填字段
        if (!cleanCard.studentId || !cleanCard.studentName || !cleanCard.studentUrl) {
          throw new Error(`缺少必填字段: studentId=${cleanCard.studentId}, studentName=${cleanCard.studentName}, studentUrl=${cleanCard.studentUrl}`)
        }
        
        console.log(`尝试创建学生卡片: ${cleanCard.studentId}`)
        
        const record = await pb.collection('students').create(cleanCard)
        createdCards.push(record as unknown as StudentCard)
        console.log(`✅ 成功创建学生卡片: ${cleanCard.studentId}`)
        
      } catch (error) {
        const errorMsg = `创建学生卡片失败 (${card.studentId}): ${error instanceof Error ? error.message : '未知错误'}`
        console.error(`❌ ${errorMsg}`)
        errors.push(errorMsg)
        // 继续处理其他卡片，不中断整个批量操作
      }
    }
    
    console.log(`批量创建完成: 成功 ${createdCards.length} 个，失败 ${errors.length} 个`)
    
    return NextResponse.json({
      success: true,
      created: createdCards.length,
      failed: errors.length,
      errors: errors,
      cards: createdCards
    })
    
  } catch (error) {
    console.error('批量创建学生卡片失败:', error)
    return NextResponse.json(
      { error: '批量创建失败' },
      { status: 500 }
    )
  }
}
