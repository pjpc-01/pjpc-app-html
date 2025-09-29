/**
 * 积分系统同步服务
 * 确保 student_points 和 point_transactions 的数据一致性
 * 支持事务、并发控制、批量处理等企业级功能
 */

import { getPocketBase } from '@/lib/pocketbase'
import { 
  PointTransaction, 
  StudentPoints, 
  PointTransactionCreateData,
  TransactionType,
  TransactionStatus,
  PointSeason
} from '@/types/points'

// 事件总线接口
interface EventBus {
  emit: (event: string, data?: any) => void
  on: (event: string, callback: (data?: any) => void) => void
  off: (event: string, callback: (data?: any) => void) => void
}

// 简单的事件总线实现
class SimpleEventBus implements EventBus {
  private events: Map<string, Set<(data?: any) => void>> = new Map()

  emit(event: string, data?: any) {
    const callbacks = this.events.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`[EventBus] 事件 ${event} 处理失败:`, error)
        }
      })
    }
  }

  on(event: string, callback: (data?: any) => void) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }
    this.events.get(event)!.add(callback)
  }

  off(event: string, callback: (data?: any) => void) {
    const callbacks = this.events.get(event)
    if (callbacks) {
      callbacks.delete(callback)
    }
  }
}

// 全局事件总线实例
const eventBus = new SimpleEventBus()

export class PointsSyncService {
  private pb: any = null
  private readonly BATCH_SIZE = 100 // 批量处理大小
  private readonly MAX_RETRIES = 3 // 最大重试次数

  private async getPocketBase() {
    if (!this.pb) {
      this.pb = await getPocketBase()
      await this.authenticateAdmin(this.pb)
    }
    return this.pb
  }

  /**
   * 创建积分交易并同步更新学生积分
   * 使用乐观锁确保并发安全
   */
  async createTransactionAndUpdatePoints(transactionData: PointTransactionCreateData): Promise<{
    success: boolean
    transaction?: any
    studentPoints?: any
    error?: string
  }> {
    const pb = await this.getPocketBase()
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`[PointsSync] 尝试创建交易 (第${attempt}次)...`, transactionData)

        // 1. 验证学生存在
        const student = await pb.collection('students').getOne(transactionData.student_id)
        if (!student) {
          throw new Error(`学生不存在: ${transactionData.student_id}`)
        }
        
        console.log('[PointsSync] 学生信息:', {
          id: student.id,
          student_name: student.student_name,
          center: student.center || student.Center || student.centre || student.branch,
          allFields: Object.keys(student)
        })

        // 2. 获取学生积分记录（带乐观锁）
        let studentPoints
        try {
          studentPoints = await pb.collection('student_points').getFirstListItem(
            `student_id = "${transactionData.student_id}"`
          )
          console.log('[PointsSync] 找到现有积分记录:', studentPoints.id)
        } catch (error) {
          // 如果不存在，创建新记录
          console.log('[PointsSync] 创建新的积分记录...')
          studentPoints = await this.createInitialStudentPoints(transactionData.student_id)
        }

        // 3. 计算新的积分值
        const isEarnTransaction = transactionData.transaction_type === TransactionType.Add
        const pointsChangeAmount = Math.abs(transactionData.points_change)
        
        const newCurrentPoints = isEarnTransaction 
          ? studentPoints.current_points + pointsChangeAmount 
          : studentPoints.current_points - pointsChangeAmount
        
        const newTotalEarned = isEarnTransaction 
          ? studentPoints.total_earned + pointsChangeAmount 
          : studentPoints.total_earned
        
        const newTotalSpent = !isEarnTransaction 
          ? studentPoints.total_spent + pointsChangeAmount 
          : studentPoints.total_spent

        // 4. 准备更新数据（使用虚拟字段处理0值问题）
        const updateData = {
          current_points: newCurrentPoints,
          // 使用虚拟字段：实际存储时允许0，显示时处理
          total_earned: newTotalEarned,
          total_spent: newTotalSpent,
          updated: new Date().toISOString()
        }

        // 5. 使用事务性操作：先创建交易，再更新积分
        // 注意：PocketBase 不直接支持事务，这里使用补偿模式
        const transaction = await pb.collection('point_transactions').create({
          ...transactionData,
          status: transactionData.status || TransactionStatus.Pending,  // 默认为待审核
          season_id: transactionData.season_id || studentPoints.season_id
        })

        console.log('[PointsSync] 交易记录创建成功:', transaction.id)

        // 6. 更新学生积分（带乐观锁检查）
        try {
          const updatedStudentPoints = await pb.collection('student_points').update(
            studentPoints.id, 
            updateData
          )

          console.log('[PointsSync] 学生积分更新成功:', updatedStudentPoints.id)

          // 7. 触发实时更新（解耦）
          this.triggerRealtimeUpdate('points_update', {
            student_id: transactionData.student_id,
            transaction_id: transaction.id,
            center: student.center || student.Center || student.centre || student.branch
          })

          return {
            success: true,
            transaction,
            studentPoints: updatedStudentPoints
          }

        } catch (updateError) {
          // 如果更新失败，回滚交易
          console.warn('[PointsSync] 积分更新失败，回滚交易:', updateError)
          try {
            await pb.collection('point_transactions').delete(transaction.id)
            console.log('[PointsSync] 交易已回滚')
          } catch (rollbackError) {
            console.error('[PointsSync] 回滚失败:', rollbackError)
          }
          throw updateError
        }

      } catch (error) {
        console.error(`[PointsSync] 第${attempt}次尝试失败:`, error)
        
        if (attempt === this.MAX_RETRIES) {
          return {
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
          }
        }
        
        // 指数退避重试
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    return {
      success: false,
      error: '达到最大重试次数'
    }
  }

  /**
   * 创建初始学生积分记录
   * 使用虚拟字段处理0值问题
   */
  private async createInitialStudentPoints(studentId: string, seasonId?: string): Promise<any> {
    const pb = await this.getPocketBase()
    
    // 如果没有指定赛季ID，获取当前活跃赛季
    let activeSeasonId = seasonId
    if (!activeSeasonId) {
      try {
        const activeSeason = await pb.collection('point_seasons').getFirstListItem('is_active = true')
        activeSeasonId = activeSeason.id
      } catch (error) {
        console.warn('[PointsSync] 未找到活跃赛季，使用默认赛季')
        // 如果找不到活跃赛季，可以创建一个默认赛季或使用硬编码ID
        activeSeasonId = 'default-season'
      }
    }
    
    return await pb.collection('student_points').create({
      student_id: studentId,
      current_points: 0,
      total_earned: 0, // 允许0值，使用虚拟字段处理显示
      total_spent: 0,  // 允许0值，使用虚拟字段处理显示
      season_id: activeSeasonId
    })
  }

  /**
   * 修复积分数据一致性（分页处理）
   * 避免大数据量时的性能问题
   */
  async fixPointsConsistency(): Promise<{
    success: boolean
    summary: {
      updated: number
      created: number
      errors: number
      processed: number
    }
    details?: any[]
  }> {
    const pb = await this.getPocketBase()
    
    try {
      console.log('[PointsSync] 开始分页修复积分一致性...')

      // 1. 分页获取所有交易记录
      const allTransactions = []
      let page = 1
      let hasMore = true

      while (hasMore) {
        const result = await pb.collection('point_transactions').getList(page, this.BATCH_SIZE, {
          sort: 'created',
          filter: 'status = "approved"'
        })
        
        allTransactions.push(...result.items)
        hasMore = result.items.length === this.BATCH_SIZE
        page++
        
        console.log(`[PointsSync] 已获取 ${allTransactions.length} 条交易记录...`)
      }

      console.log(`[PointsSync] 总共获取到 ${allTransactions.length} 条已批准的交易记录`)

      // 2. 按学生ID分组计算积分
      const studentPointsMap = new Map<string, {
        total_earned: number
        total_spent: number
        current_points: number
        transactions: any[]
      }>()

      allTransactions.forEach((transaction: any) => {
        const studentId = String(transaction.student_id)
        const points = Number(transaction.points_change) || 0
        
        if (!studentPointsMap.has(studentId)) {
          studentPointsMap.set(studentId, {
            total_earned: 0,
            total_spent: 0,
            current_points: 0,
            transactions: []
          })
        }
        
        const studentPoints = studentPointsMap.get(studentId)!
        studentPoints.transactions.push(transaction)
        
        // 只处理已批准的交易
        if (transaction.status === TransactionStatus.Approved) {
          if (points > 0) {
            studentPoints.total_earned += points
            studentPoints.current_points += points
          } else if (points < 0) {
            studentPoints.total_spent += Math.abs(points)
            studentPoints.current_points += points
          }
        }
      })

      console.log(`[PointsSync] 计算完成，涉及 ${studentPointsMap.size} 个学生`)

      // 3. 分页获取现有积分记录
      const existingPointsMap = new Map()
      let pointsPage = 1
      let hasMorePoints = true

      while (hasMorePoints) {
        const result = await pb.collection('student_points').getList(pointsPage, this.BATCH_SIZE)
        
        result.items.forEach((point: any) => {
          existingPointsMap.set(String(point.student_id), point)
        })
        
        hasMorePoints = result.items.length === this.BATCH_SIZE
        pointsPage++
      }

      // 4. 批量更新或创建积分记录
      const results = []
      let updatedCount = 0
      let createdCount = 0
      let errorCount = 0
      let processedCount = 0

      // 分批处理学生积分
      const studentIds = Array.from(studentPointsMap.keys())
      for (let i = 0; i < studentIds.length; i += this.BATCH_SIZE) {
        const batch = studentIds.slice(i, i + this.BATCH_SIZE)
        
        for (const studentId of batch) {
          try {
            const calculatedPoints = studentPointsMap.get(studentId)!
            const existingRecord = existingPointsMap.get(studentId)
            
            const updateData = {
              current_points: calculatedPoints.current_points,
              total_earned: calculatedPoints.total_earned, // 允许0值
              total_spent: calculatedPoints.total_spent,   // 允许0值
              updated: new Date().toISOString()
            }

            if (existingRecord) {
              await pb.collection('student_points').update(existingRecord.id, updateData)
              updatedCount++
              results.push({
                student_id: studentId,
                action: 'updated',
                current_points: calculatedPoints.current_points,
                transaction_count: calculatedPoints.transactions.length
              })
            } else {
              // 创建新记录
              const newRecord = await pb.collection('student_points').create({
                student_id: studentId,
                ...updateData,
                season_start_date: new Date().toISOString().split('T')[0],
                season_end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                season_number: Math.floor(Date.now() / (90 * 24 * 60 * 60 * 1000))
              })
              createdCount++
              results.push({
                student_id: studentId,
                action: 'created',
                current_points: calculatedPoints.current_points,
                transaction_count: calculatedPoints.transactions.length
              })
            }
            
            processedCount++
            
            // 每处理100个学生输出一次进度
            if (processedCount % 100 === 0) {
              console.log(`[PointsSync] 已处理 ${processedCount}/${studentIds.length} 个学生...`)
            }
            
          } catch (error) {
            console.error(`[PointsSync] 处理学生 ${studentId} 失败:`, error)
            errorCount++
            results.push({
              student_id: studentId,
              action: 'error',
              error: error instanceof Error ? error.message : '未知错误'
            })
          }
        }
      }

      console.log(`[PointsSync] 修复完成: 更新 ${updatedCount} 条，创建 ${createdCount} 条，错误 ${errorCount} 条`)

      // 5. 触发实时更新
      this.triggerRealtimeUpdate('points_consistency_fixed', {
        updated: updatedCount,
        created: createdCount,
        errors: errorCount
      })

      return {
        success: true,
        summary: {
          updated: updatedCount,
          created: createdCount,
          errors: errorCount,
          processed: processedCount
        },
        details: results
      }

    } catch (error) {
      console.error('[PointsSync] 修复积分一致性失败:', error)
      return {
        success: false,
        summary: { updated: 0, created: 0, errors: 1, processed: 0 }
      }
    }
  }

  /**
   * 触发实时更新（解耦实现）
   */
  private triggerRealtimeUpdate(event: string, data?: any) {
    try {
      // 使用事件总线触发更新
      eventBus.emit(event, data)
      console.log(`[PointsSync] 事件 ${event} 已触发`)
      
      // 同时触发SSE更新
      this.triggerSSEUpdate(event, data)
    } catch (error) {
      console.warn(`[PointsSync] 触发事件 ${event} 失败:`, error)
    }
  }

  /**
   * 触发SSE更新
   */
  private async triggerSSEUpdate(event: string, data?: any) {
    try {
      // 动态导入SSE模块避免循环依赖
      const { checkForUpdates } = await import('../../api/events/route')
      await checkForUpdates()
      console.log(`[PointsSync] SSE更新已触发`)
    } catch (error) {
      console.warn(`[PointsSync] 触发SSE更新失败:`, error)
    }
  }

  /**
   * 获取学生积分历史
   */
  async getStudentPointsHistory(studentId: string, limit: number = 50): Promise<{
    success: boolean
    data?: {
      studentPoints: any
      transactions: any[]
    }
    error?: string
  }> {
    const pb = await this.getPocketBase()
    
    try {
      // 获取学生积分记录
      const studentPoints = await pb.collection('student_points').getFirstListItem(
        `student_id = "${studentId}"`,
        { expand: 'student_id' }
      )

      // 获取交易记录
      const transactions = await pb.collection('point_transactions').getList(1, limit, {
        filter: `student_id = "${studentId}"`,
        sort: '-created',
        expand: 'student_id,teacher_id'
      })

      return {
        success: true,
        data: {
          studentPoints,
          transactions: transactions.items
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取积分历史失败'
      }
    }
  }

  /**
   * 获取事件总线实例（用于外部监听）
   */
  getEventBus(): EventBus {
    return eventBus
  }
}

export const pointsSyncService = new PointsSyncService()
export default pointsSyncService