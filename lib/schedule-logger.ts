import { pb } from '@/lib/pocketbase'

export interface ScheduleLogData {
  scheduleId?: string
  action: 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'auto_schedule' | 'conflict_detected' | 'permission_denied'
  userId: string
  userName: string
  userRole: string
  details?: any
  oldValues?: any
  newValues?: any
  ipAddress?: string
  userAgent?: string
  status: 'success' | 'failed' | 'pending' | 'cancelled'
  errorMessage?: string
}

export class ScheduleLogger {
  static async log(data: ScheduleLogData): Promise<void> {
    try {
      await pb.collection('schedule_logs').create({
        schedule_id: data.scheduleId || null,
        action: data.action,
        user_id: data.userId,
        user_name: data.userName,
        user_role: data.userRole,
        details: data.details || null,
        old_values: data.oldValues || null,
        new_values: data.newValues || null,
        ip_address: data.ipAddress || null,
        user_agent: data.userAgent || null,
        status: data.status,
        error_message: data.errorMessage || null
      })
    } catch (error) {
      console.error('记录排班日志失败:', error)
      // 不抛出错误，避免影响主要业务逻辑
    }
  }

  static async getLogs(scheduleId?: string, userId?: string, action?: string, limit: number = 50): Promise<any[]> {
    try {
      let filter = ''
      const conditions = []

      if (scheduleId) {
        conditions.push(`schedule_id = "${scheduleId}"`)
      }
      if (userId) {
        conditions.push(`user_id = "${userId}"`)
      }
      if (action) {
        conditions.push(`action = "${action}"`)
      }

      if (conditions.length > 0) {
        filter = conditions.join(' && ')
      }

      const logs = await pb.collection('schedule_logs').getList(1, limit, {
        filter,
        sort: '-created'
      })

      return logs.items
    } catch (error) {
      console.error('获取排班日志失败:', error)
      return []
    }
  }

  static async getScheduleHistory(scheduleId: string): Promise<any[]> {
    return this.getLogs(scheduleId)
  }

  static async getUserActivity(userId: string, limit: number = 100): Promise<any[]> {
    return this.getLogs(undefined, userId, undefined, limit)
  }

  static async getSystemActivity(limit: number = 200): Promise<any[]> {
    return this.getLogs(undefined, undefined, undefined, limit)
  }
}

// 便捷的日志记录函数
export const logScheduleAction = async (
  action: ScheduleLogData['action'],
  userId: string,
  userName: string,
  userRole: string,
  options: Partial<ScheduleLogData> = {}
) => {
  await ScheduleLogger.log({
    action,
    userId,
    userName,
    userRole,
    status: 'success',
    ...options
  })
}

export const logScheduleError = async (
  action: ScheduleLogData['action'],
  userId: string,
  userName: string,
  userRole: string,
  errorMessage: string,
  options: Partial<ScheduleLogData> = {}
) => {
  await ScheduleLogger.log({
    action,
    userId,
    userName,
    userRole,
    status: 'failed',
    errorMessage,
    ...options
  })
}
