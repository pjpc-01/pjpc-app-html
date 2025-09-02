import { getPocketBase, authenticateAdmin } from './pocketbase'

// 学生卡接口定义
export interface StudentCard {
  id: string
  student_id: string
  student_name: string
  cardNumber: string
  cardType: 'NFC' | 'RFID'
  status: 'active' | 'inactive' | 'lost' | 'graduated'
  center: string
  standard?: string
  balance?: number
  issuedDate?: string
  expiryDate?: string
  enrollmentDate?: string
  phone?: string
  email?: string
  parentName?: string
  address?: string
  medicalInfo?: string
  notes?: string
  usageCount?: number
  lastUsed?: string
  created: string
  updated: string
}

// 获取所有学生卡
export const getAllStudentCards = async (): Promise<StudentCard[]> => {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin()
    
    const result = await pb.collection('student_cards').getList(1, 1000, {
      sort: 'student_name'
    })
    
    return result.items.map(item => ({
      id: item.id,
      student_id: item.student_id || '',
      student_name: item.student_name || '',
      cardNumber: item.cardNumber || '',
      cardType: item.cardType || 'NFC',
      status: item.status || 'active',
      center: item.center || '',
      standard: item.standard,
      balance: item.balance,
      issuedDate: item.issuedDate,
      expiryDate: item.expiryDate,
      enrollmentDate: item.enrollmentDate,
      phone: item.phone,
      email: item.email,
      parentName: item.parentName,
      address: item.address,
      medicalInfo: item.medicalInfo,
      notes: item.notes,
      usageCount: item.usageCount || 0,
      lastUsed: item.lastUsed,
      created: item.created,
      updated: item.updated
    }))
  } catch (error) {
    console.error('获取学生卡失败:', error)
    throw error
  }
}

// 创建学生卡
export const createStudentCard = async (cardData: Partial<StudentCard>): Promise<StudentCard> => {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin()
    
    const result = await pb.collection('student_cards').create(cardData)
    
    return {
      id: result.id,
      student_id: result.student_id || '',
      student_name: result.student_name || '',
      cardNumber: result.cardNumber || '',
      cardType: result.cardType || 'NFC',
      status: result.status || 'active',
      center: result.center || '',
      standard: result.standard,
      balance: result.balance,
      issuedDate: result.issuedDate,
      expiryDate: result.expiryDate,
      enrollmentDate: result.enrollmentDate,
      phone: result.phone,
      email: result.email,
      parentName: result.parentName,
      address: result.address,
      medicalInfo: result.medicalInfo,
      notes: result.notes,
      usageCount: result.usageCount || 0,
      lastUsed: result.lastUsed,
      created: result.created,
      updated: result.updated
    }
  } catch (error) {
    console.error('创建学生卡失败:', error)
    throw error
  }
}

// 更新学生卡
export const updateStudentCard = async (id: string, cardData: Partial<StudentCard>): Promise<StudentCard> => {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin()
    
    const result = await pb.collection('student_cards').update(id, cardData)
    
    return {
      id: result.id,
      student_id: result.student_id || '',
      student_name: result.student_name || '',
      cardNumber: result.cardNumber || '',
      cardType: result.cardType || 'NFC',
      status: result.status || 'active',
      center: result.center || '',
      standard: result.standard,
      balance: result.balance,
      issuedDate: result.issuedDate,
      expiryDate: result.expiryDate,
      enrollmentDate: result.enrollmentDate,
      phone: result.phone,
      email: result.email,
      parentName: result.parentName,
      address: result.address,
      medicalInfo: result.medicalInfo,
      notes: result.notes,
      usageCount: result.usageCount || 0,
      lastUsed: result.lastUsed,
      created: result.created,
      updated: result.updated
    }
  } catch (error) {
    console.error('更新学生卡失败:', error)
    throw error
  }
}

// 删除学生卡
export const deleteStudentCard = async (id: string): Promise<boolean> => {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin()
    
    await pb.collection('student_cards').delete(id)
    return true
  } catch (error) {
    console.error('删除学生卡失败:', error)
    throw error
  }
}

// 搜索学生卡
export const searchStudentCards = async (query: string): Promise<StudentCard[]> => {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin()
    
    const result = await pb.collection('student_cards').getList(1, 100, {
      filter: `student_name ~ "${query}" || student_id ~ "${query}" || cardNumber ~ "${query}"`,
      sort: 'student_name'
    })
    
    return result.items.map(item => ({
      id: item.id,
      student_id: item.student_id || '',
      student_name: item.student_name || '',
      cardNumber: item.cardNumber || '',
      cardType: item.cardType || 'NFC',
      status: item.status || 'active',
      center: item.center || '',
      standard: item.standard,
      balance: item.balance,
      issuedDate: item.issuedDate,
      expiryDate: item.expiryDate,
      enrollmentDate: item.enrollmentDate,
      phone: item.phone,
      email: item.email,
      parentName: item.parentName,
      address: item.address,
      medicalInfo: item.medicalInfo,
      notes: item.notes,
      usageCount: item.usageCount || 0,
      lastUsed: item.lastUsed,
      created: item.created,
      updated: item.updated
    }))
  } catch (error) {
    console.error('搜索学生卡失败:', error)
    throw error
  }
}

// 获取学生卡统计信息
export const getStudentCardStats = async (): Promise<{
  total: number
  active: number
  inactive: number
  lost: number
  graduated: number
  byCenter: Record<string, number>
  byType: Record<string, number>
}> => {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin()
    
    const result = await pb.collection('student_cards').getList(1, 1000)
    const cards = result.items
    
    const stats = {
      total: cards.length,
      active: cards.filter(c => c.status === 'active').length,
      inactive: cards.filter(c => c.status === 'inactive').length,
      lost: cards.filter(c => c.status === 'lost').length,
      graduated: cards.filter(c => c.status === 'graduated').length,
      byCenter: {} as Record<string, number>,
      byType: {} as Record<string, number>
    }
    
    // 按中心统计
    cards.forEach(card => {
      const center = card.center || '未指定'
      stats.byCenter[center] = (stats.byCenter[center] || 0) + 1
    })
    
    // 按类型统计
    cards.forEach(card => {
      const type = card.cardType || 'NFC'
      stats.byType[type] = (stats.byType[type] || 0) + 1
    })
    
    return stats
  } catch (error) {
    console.error('获取学生卡统计失败:', error)
    throw error
  }
}

// 更新卡片使用情况
export const updateCardUsage = async (cardNumber: string): Promise<boolean> => {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin()
    
    // 查找卡片
    const result = await pb.collection('student_cards').getList(1, 1, {
      filter: `cardNumber = "${cardNumber}"`
    })
    
    if (result.items.length === 0) {
      throw new Error('卡片不存在')
    }
    
    const card = result.items[0]
    const newUsageCount = (card.usageCount || 0) + 1
    
    // 更新使用次数和最后使用时间
    await pb.collection('student_cards').update(card.id, {
      usageCount: newUsageCount,
      lastUsed: new Date().toISOString()
    })
    
    return true
  } catch (error) {
    console.error('更新卡片使用情况失败:', error)
    throw error
  }
}

// 根据卡片号获取学生卡
export const getStudentCardByCardNumber = async (cardNumber: string): Promise<StudentCard | null> => {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin()
    
    const result = await pb.collection('student_cards').getList(1, 1, {
      filter: `cardNumber = "${cardNumber}"`
    })
    
    if (result.items.length === 0) {
      return null
    }
    
    const item = result.items[0]
    return {
      id: item.id,
      student_id: item.student_id || '',
      student_name: item.student_name || '',
      cardNumber: item.cardNumber || '',
      cardType: item.cardType || 'NFC',
      status: item.status || 'active',
      center: item.center || '',
      standard: item.standard,
      balance: item.balance,
      issuedDate: item.issuedDate,
      expiryDate: item.expiryDate,
      enrollmentDate: item.enrollmentDate,
      phone: item.phone,
      email: item.email,
      parentName: item.parentName,
      address: item.address,
      medicalInfo: item.medicalInfo,
      notes: item.notes,
      usageCount: item.usageCount || 0,
      lastUsed: item.lastUsed,
      created: item.created,
      updated: item.updated
    }
  } catch (error) {
    console.error('根据卡片号获取学生卡失败:', error)
    throw error
  }
}

// 根据级别获取学生卡
export const getStudentCardsByLevel = async (level: string): Promise<StudentCard[]> => {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin()
    
    const result = await pb.collection('student_cards').getList(1, 1000, {
      filter: `standard = "${level}"`,
      sort: 'student_name'
    })
    
    return result.items.map(item => ({
      id: item.id,
      student_id: item.student_id || '',
      student_name: item.student_name || '',
      cardNumber: item.cardNumber || '',
      cardType: item.cardType || 'NFC',
      status: item.status || 'active',
      center: item.center || '',
      standard: item.standard,
      balance: item.balance,
      issuedDate: item.issuedDate,
      expiryDate: item.expiryDate,
      enrollmentDate: item.enrollmentDate,
      phone: item.phone,
      email: item.email,
      parentName: item.parentName,
      address: item.address,
      medicalInfo: item.medicalInfo,
      notes: item.notes,
      usageCount: item.usageCount || 0,
      lastUsed: item.lastUsed,
      created: item.created,
      updated: item.updated
    }))
  } catch (error) {
    console.error('根据级别获取学生卡失败:', error)
    throw error
  }
}
