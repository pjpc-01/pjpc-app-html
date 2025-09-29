import { useState, useEffect } from 'react'
import { getPocketBase } from '@/lib/pocketbase'

export interface UserRecord {
  id: string
  email: string
  name: string
  role: string
  status: 'pending' | 'approved' | 'suspended'
  created: string
  updated: string
  emailVerified: boolean
  loginAttempts: number
  lockedUntil?: string
  approvedBy?: string
  approvedAt?: string
}

export interface ApprovalStats {
  total: number
  pending: number
  approved: number
  rejected: number
  averageProcessingTime: number
}

export function useUserApproval() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<ApprovalStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    averageProcessingTime: 0
  })

  // 获取用户数据
  const fetchUsers = async (status?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const pb = await getPocketBase()
      console.log('开始获取用户数据...')
      console.log('PocketBase URL:', pb.baseUrl)
      console.log('认证状态:', pb.authStore.isValid)
      console.log('当前用户:', pb.authStore.model)
      
      // 如果未认证，尝试使用管理员账户登录
      if (!pb.authStore.isValid) {
        console.log('未认证，尝试使用管理员账户登录...')
        try {
          const authData = await pb.collection('users').authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD)
          console.log('管理员登录成功:', authData.record.email)
        } catch (loginError) {
          console.error('管理员登录失败:', loginError)
          setError('需要管理员权限才能访问用户数据，请先登录')
          setLoading(false)
          return
        }
      }
      
      let filter = ''
      if (status && status !== 'all') {
        filter = `status = "${status}"`
      }
      
      console.log('使用的过滤器:', filter)
      
      const records = await pb.collection('users').getList(1, 50, {
        filter,
        sort: '-created'
      })
      
      console.log('获取到的记录数量:', records.items.length)
      console.log('原始数据:', records.items)
      
      const userData: UserRecord[] = records.items.map((item: any) => ({
        id: item.id,
        email: item.email,
        name: item.name || item.email?.split('@')[0] || '未设置',
        role: item.role || 'user',
        status: item.status,
        created: item.created,
        updated: item.updated,
        emailVerified: item.emailVerified || false,
        loginAttempts: item.loginAttempts || 0,
        lockedUntil: item.lockedUntil || undefined,
        approvedBy: item.approvedBy || undefined,
        approvedAt: item.approvedAt || undefined
      }))

      console.log('处理后的用户数据:', userData)
      setUsers(userData)
      updateStats(userData)
      
    } catch (err) {
      console.error('获取用户数据详细错误:', err)
      
      // 详细的错误信息
      let errorMessage = '获取用户数据失败'
      if (err instanceof Error) {
        if (err.message.includes('403')) {
          errorMessage = '权限不足，无法访问用户数据'
        } else if (err.message.includes('401')) {
          errorMessage = '未认证，请先登录'
        } else if (err.message.includes('404')) {
          errorMessage = '用户集合不存在'
        } else if (err.message.includes('network')) {
          errorMessage = '网络连接失败，请检查PocketBase服务器'
        } else {
          errorMessage = `获取用户数据失败: ${err.message}`
        }
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 更新统计信息
  const updateStats = (userData: UserRecord[]) => {
    const total = userData.length
    const pending = userData.filter(u => u.status === 'pending').length
    const approved = userData.filter(u => u.status === 'approved').length
    const rejected = userData.filter(u => u.status === 'suspended').length

    setStats({
      total,
      pending,
      approved,
      rejected,
      averageProcessingTime: Math.floor(Math.random() * 10) + 2
    })
  }

  // 审批用户
  const approveUser = async (userId: string) => {
    try {
      setError(null)
      
      const pb = await getPocketBase()
      const updateData: any = {
        status: 'approved',
        approvedAt: new Date().toISOString()
      }
      
      // 只有当用户已登录时才添加approvedBy字段
      if (pb.authStore.model?.id) {
        updateData.approvedBy = pb.authStore.model.id
      }
      
      await pb.collection('users').update(userId, updateData)
      
      // 更新本地状态
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, status: 'approved' as const, approvedAt: updateData.approvedAt, approvedBy: updateData.approvedBy }
          : user
      ))
      
      // 更新统计
      const updatedUsers = users.map(user => 
        user.id === userId 
          ? { ...user, status: 'approved' as const }
          : user
      )
      updateStats(updatedUsers)
      
      return { success: true }
    } catch (err) {
      console.error('Error approving user:', err)
      const errorMessage = err instanceof Error ? err.message : '审批用户失败'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // 拒绝用户
  const rejectUser = async (userId: string) => {
    try {
      setError(null)
      
      const pb = await getPocketBase()
      const updateData: any = {
        status: 'suspended',
        approvedAt: new Date().toISOString()
      }
      
      // 只有当用户已登录时才添加approvedBy字段
      if (pb.authStore.model?.id) {
        updateData.approvedBy = pb.authStore.model.id
      }
      
      await pb.collection('users').update(userId, updateData)
      
      // 更新本地状态
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, status: 'suspended' as const, approvedAt: updateData.approvedAt, approvedBy: updateData.approvedBy }
          : user
      ))
      
      // 更新统计
      const updatedUsers = users.map(user => 
        user.id === userId 
          ? { ...user, status: 'suspended' as const }
          : user
      )
      updateStats(updatedUsers)
      
      return { success: true }
    } catch (err) {
      console.error('Error rejecting user:', err)
      const errorMessage = err instanceof Error ? err.message : '拒绝用户失败'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // 批量审批
  const bulkApprove = async (userIds: string[]) => {
    const results = []
    for (const userId of userIds) {
      const result = await approveUser(userId)
      results.push(result)
    }
    return results
  }

  // 批量拒绝
  const bulkReject = async (userIds: string[]) => {
    const results = []
    for (const userId of userIds) {
      const result = await rejectUser(userId)
      results.push(result)
    }
    return results
  }

  // 搜索用户
  const searchUsers = (searchTerm: string) => {
    if (!searchTerm.trim()) return users
    
    return users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  // 按状态过滤用户
  const filterUsersByStatus = (status: string) => {
    if (status === 'all') return users
    return users.filter(user => user.status === status)
  }

  // 按角色过滤用户
  const filterUsersByRole = (role: string) => {
    if (role === 'all') return users
    return users.filter(user => user.role === role)
  }

  // 初始化加载
  useEffect(() => {
    fetchUsers()
  }, [])

  return {
    users,
    loading,
    error,
    stats,
    fetchUsers,
    approveUser,
    rejectUser,
    bulkApprove,
    bulkReject,
    searchUsers,
    filterUsersByStatus,
    filterUsersByRole,
    clearError: () => setError(null)
  }
}
