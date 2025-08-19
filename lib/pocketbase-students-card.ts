import { pb } from './pocketbase'

// 检查认证状态
const checkAuth = () => {
  if (!pb.authStore.isValid) {
    console.warn('PocketBase 未认证，尝试匿名访问...')
    // 对于公开的集合，可能不需要认证
  }
}

// 学生卡片接口定义
export interface StudentCard {
  id: string
  studentId: string
  center: string
  grade: string
  studentName: string
  cardNumber?: string
  cardType?: 'NFC' | 'RFID'
  studentUrl: string
  balance?: number
  status: 'active' | 'inactive' | 'lost' | 'graduated'
  issuedDate?: string
  expiryDate?: string
  lastUsed?: string
  usageCount?: number
  enrollmentDate?: string
  phone?: string
  email?: string
  parentName?: string
  parentPhone?: string
  address?: string
  emergencyContact?: string
  medicalInfo?: string
  notes?: string
  created: string
  updated: string
}

// 创建学生卡片
export const createStudentCard = async (data: Omit<StudentCard, 'id' | 'created' | 'updated'>): Promise<StudentCard> => {
  try {
    checkAuth()
    
    // 清理和验证数据
    const cleanData = {
      studentId: data.studentId?.trim() || '',
      level: data.level || 'primary',
      grade: data.grade?.trim() || '',
      studentName: data.studentName?.trim() || '',
      cardNumber: data.cardNumber?.trim() || '',
      cardType: data.cardType || 'NFC',
      studentUrl: data.studentUrl?.trim() || '',
      balance: typeof data.balance === 'number' ? data.balance : 0,
      status: data.status || 'active',
      issuedDate: data.issuedDate || '',
      expiryDate: data.expiryDate || '',
      lastUsed: data.lastUsed || '',
      usageCount: typeof data.usageCount === 'number' ? data.usageCount : 0,
      enrollmentDate: data.enrollmentDate || '',
      phone: data.phone?.trim() || '',
      email: data.email?.trim() || '',
      parentName: data.parentName?.trim() || '',
      parentPhone: data.parentPhone?.trim() || '',
      address: data.address?.trim() || '',
      emergencyContact: data.emergencyContact?.trim() || '',
      medicalInfo: data.medicalInfo?.trim() || '',
      notes: data.notes?.trim() || ''
    }
    
    console.log('创建学生卡片数据:', cleanData)
    console.log('PocketBase认证状态:', pb.authStore.isValid)
    console.log('当前用户:', pb.authStore.model)
    
    const record = await pb.collection('students_card').create(cleanData)
    return record as StudentCard
  } catch (error) {
    console.error('创建学生卡片失败:', error)
    console.error('失败的数据:', data)
    console.error('PocketBase认证状态:', pb.authStore.isValid)
    throw error
  }
}

// 获取所有学生卡片
export const getAllStudentCards = async (): Promise<StudentCard[]> => {
  try {
    checkAuth()
    console.log('PocketBase认证状态:', pb.authStore.isValid)
    
    const records = await pb.collection('students_card').getFullList({
      sort: 'studentId'
    })
    return records as StudentCard[]
  } catch (error) {
    console.error('获取学生卡片列表失败:', error)
    console.error('PocketBase认证状态:', pb.authStore.isValid)
    throw error
  }
}

// 根据级别获取学生卡片
export const getStudentCardsByLevel = async (level: 'primary' | 'secondary'): Promise<StudentCard[]> => {
  try {
    const records = await pb.collection('students_card').getFullList({
      filter: `level = "${level}"`,
      sort: 'studentId'
    })
    return records as StudentCard[]
  } catch (error) {
    console.error('根据级别获取学生卡片失败:', error)
    throw error
  }
}

// 根据学号和级别获取学生卡片
export const getStudentCardById = async (studentId: string, level: 'primary' | 'secondary'): Promise<StudentCard | null> => {
  try {
    const record = await pb.collection('students_card').getFirstListItem(
      `studentId = "${studentId}" && level = "${level}"`
    )
    return record as StudentCard
  } catch (error) {
    console.error('获取学生卡片失败:', error)
    return null
  }
}

// 根据卡号获取学生卡片
export const getStudentCardByCardNumber = async (cardNumber: string): Promise<StudentCard | null> => {
  try {
    const record = await pb.collection('students_card').getFirstListItem(
      `cardNumber = "${cardNumber}"`
    )
    return record as StudentCard
  } catch (error) {
    console.error('根据卡号获取学生卡片失败:', error)
    return null
  }
}

// 更新学生卡片
export const updateStudentCard = async (id: string, data: Partial<StudentCard>): Promise<StudentCard> => {
  try {
    const record = await pb.collection('students_card').update(id, data)
    return record as StudentCard
  } catch (error) {
    console.error('更新学生卡片失败:', error)
    throw error
  }
}

// 删除学生卡片
export const deleteStudentCard = async (id: string): Promise<void> => {
  try {
    await pb.collection('students_card').delete(id)
  } catch (error) {
    console.error('删除学生卡片失败:', error)
    throw error
  }
}

// 搜索学生卡片
export const searchStudentCards = async (query: string): Promise<StudentCard[]> => {
  try {
    const records = await pb.collection('students_card').getFullList({
      filter: `studentName ~ "${query}" || studentId ~ "${query}"`,
      sort: 'studentId'
    })
    return records as StudentCard[]
  } catch (error) {
    console.error('搜索学生卡片失败:', error)
    throw error
  }
}

// 批量创建学生卡片
export const batchCreateStudentCards = async (cards: Omit<StudentCard, 'id' | 'created' | 'updated'>[]): Promise<StudentCard[]> => {
  try {
    // PocketBase 不支持真正的批量创建，所以我们需要逐个创建
    const createdCards: StudentCard[] = []
    const errors: string[] = []
    
    for (const card of cards) {
      try {
        // 清理和验证数据
        const cleanCard = {
          studentId: card.studentId?.trim() || '',
          level: card.level || 'primary',
          grade: card.grade?.trim() || '',
          studentName: card.studentName?.trim() || '',
          cardNumber: card.cardNumber?.trim() || '',
          cardType: card.cardType || 'NFC',
          studentUrl: card.studentUrl?.trim() || '',
          balance: typeof card.balance === 'number' ? card.balance : 0,
          status: card.status || 'active',
          issuedDate: card.issuedDate || '',
          expiryDate: card.expiryDate || '',
          lastUsed: card.lastUsed || '',
          usageCount: typeof card.usageCount === 'number' ? card.usageCount : 0,
          enrollmentDate: card.enrollmentDate || '',
          phone: card.phone?.trim() || '',
          email: card.email?.trim() || '',
          parentName: card.parentName?.trim() || '',
          parentPhone: card.parentPhone?.trim() || '',
          address: card.address?.trim() || '',
          emergencyContact: card.emergencyContact?.trim() || '',
          medicalInfo: card.medicalInfo?.trim() || '',
          notes: card.notes?.trim() || ''
        }
        
        // 验证必填字段
        if (!cleanCard.studentId || !cleanCard.studentName || !cleanCard.studentUrl) {
          throw new Error(`缺少必填字段: studentId=${cleanCard.studentId}, studentName=${cleanCard.studentName}, studentUrl=${cleanCard.studentUrl}`)
        }
        
        const record = await pb.collection('students_card').create(cleanCard)
        createdCards.push(record as StudentCard)
        console.log(`成功创建学生卡片: ${cleanCard.studentId}`)
      } catch (error) {
        const errorMsg = `创建学生卡片失败 (${card.studentId}): ${error instanceof Error ? error.message : '未知错误'}`
        console.error(errorMsg)
        errors.push(errorMsg)
        // 继续处理其他卡片，不中断整个批量操作
      }
    }
    
    if (errors.length > 0) {
      console.warn('批量创建过程中出现错误:', errors)
    }
    
    return createdCards
  } catch (error) {
    console.error('批量创建学生卡片失败:', error)
    throw error
  }
}

// 更新卡片使用记录
export const updateCardUsage = async (id: string, usageCount: number): Promise<StudentCard> => {
  try {
    const record = await pb.collection('students_card').update(id, {
      lastUsed: new Date().toISOString(),
      usageCount: usageCount + 1
    })
    return record as StudentCard
  } catch (error) {
    console.error('更新卡片使用记录失败:', error)
    throw error
  }
}

// 获取统计信息
export const getStudentCardStats = async () => {
  try {
    const allCards = await getAllStudentCards()
    
    return {
      totalCards: allCards.length,
      primaryCards: allCards.filter(card => card.level === 'primary').length,
      secondaryCards: allCards.filter(card => card.level === 'secondary').length,
      activeCards: allCards.filter(card => card.status === 'active').length,
      inactiveCards: allCards.filter(card => card.status === 'inactive').length,
      lostCards: allCards.filter(card => card.status === 'lost').length,
      graduatedCards: allCards.filter(card => card.status === 'graduated').length,
      totalBalance: allCards.reduce((sum, card) => sum + (card.balance || 0), 0),
      totalUsageCount: allCards.reduce((sum, card) => sum + (card.usageCount || 0), 0)
    }
  } catch (error) {
    console.error('获取统计信息失败:', error)
    throw error
  }
}
