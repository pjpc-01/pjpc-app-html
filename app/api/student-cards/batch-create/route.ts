import { NextRequest, NextResponse } from 'next/server'
import { pb } from '@/lib/pocketbase'
import { StudentCard } from '@/lib/pocketbase-students-card'

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
    console.log('PocketBase URL:', pb.baseURL)
    console.log('PocketBase 认证状态:', pb.authStore.isValid)
    
         // 始终重新认证以确保认证状态
     console.log('重新认证 PocketBase...')
     try {
       const adminEmail = 'pjpcemerlang@gmail.com'
       const adminPassword = '0122270775Sw!'
       
       await pb.admins.authWithPassword(adminEmail, adminPassword)
       console.log('✅ PocketBase 认证成功')
     } catch (authError) {
       console.error('❌ PocketBase 认证失败:', authError)
       return NextResponse.json({
         error: 'PocketBase 认证失败，请检查管理员账户配置',
         details: authError instanceof Error ? authError.message : '未知错误'
       }, { status: 401 })
     }
    
    const createdCards: StudentCard[] = []
    const errors: string[] = []
    
    for (const card of cards) {
      try {
                 // 清理和验证数据 - 只包含必要字段
         const cleanCard = {
           studentId: card.studentId?.trim() || '',
           studentName: card.studentName?.trim() || '',
           studentUrl: card.studentUrl?.trim() || '',
           level: card.level || '',
           grade: card.grade?.trim() || '',
           cardType: card.cardType || '',
           status: card.status || '',
           balance: typeof card.balance === 'number' ? card.balance : 0
         }
        
        // 验证必填字段
        if (!cleanCard.studentId || !cleanCard.studentName || !cleanCard.studentUrl) {
          throw new Error(`缺少必填字段: studentId=${cleanCard.studentId}, studentName=${cleanCard.studentName}, studentUrl=${cleanCard.studentUrl}`)
        }
        
        console.log(`尝试创建学生卡片: ${cleanCard.studentId}`)
        console.log('创建数据:', cleanCard)
        
        const record = await pb.collection('students_card').create(cleanCard)
        createdCards.push(record as unknown as StudentCard)
        console.log(`✅ 成功创建学生卡片: ${cleanCard.studentId}`)
        
      } catch (error) {
        const errorMsg = `创建学生卡片失败 (${card.studentId}): ${error instanceof Error ? error.message : '未知错误'}`
        console.error(`❌ ${errorMsg}`)
        console.error('详细错误:', error)
        errors.push(errorMsg)
        // 继续处理其他卡片，不中断整个批量操作
      }
    }
    
    console.log(`批量创建完成: 成功 ${createdCards.length} 个，失败 ${errors.length} 个`)
    
    // 验证创建结果
    if (createdCards.length > 0) {
      console.log('创建的学生卡片:', createdCards.map(c => ({ id: c.id, studentId: c.studentId, studentName: c.studentName })))
    }
    
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
