import { NextRequest, NextResponse } from 'next/server'
import { pb } from '@/lib/pocketbase'

// 检查排班操作权限
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { action, scheduleId, userId } = data

    // 获取用户信息
    const user = await pb.collection('users').getOne(userId)
    
    // 获取排班信息（如果需要）
    let schedule = null
    if (scheduleId) {
      schedule = await pb.collection('schedules').getOne(scheduleId)
    }

    const permissions = {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canApprove: false,
      canReject: false,
      canAutoSchedule: false
    }

    // 根据用户角色设置权限
    switch (user.role) {
      case 'admin':
        // 管理员拥有所有权限
        permissions.canView = true
        permissions.canCreate = true
        permissions.canEdit = true
        permissions.canDelete = true
        permissions.canApprove = true
        permissions.canReject = true
        permissions.canAutoSchedule = true
        break

      case 'manager':
        // 管理层可以查看、创建、编辑、审批排班
        permissions.canView = true
        permissions.canCreate = true
        permissions.canEdit = true
        permissions.canDelete = true
        permissions.canApprove = true
        permissions.canReject = true
        permissions.canAutoSchedule = true
        break

      case 'teacher':
        // 教师只能查看自己的排班
        permissions.canView = true
        permissions.canCreate = false
        permissions.canEdit = false
        permissions.canDelete = false
        permissions.canApprove = false
        permissions.canReject = false
        permissions.canAutoSchedule = false
        
        // 如果是查看自己的排班，可以编辑
        if (schedule && schedule.employee_id === userId) {
          permissions.canEdit = true
        }
        break

      case 'coordinator':
        // 协调员可以查看和创建排班，但不能删除
        permissions.canView = true
        permissions.canCreate = true
        permissions.canEdit = true
        permissions.canDelete = false
        permissions.canApprove = false
        permissions.canReject = false
        permissions.canAutoSchedule = true
        break

      default:
        // 默认无权限
        break
    }

    // 检查特定操作权限
    let hasPermission = false
    switch (action) {
      case 'view':
        hasPermission = permissions.canView
        break
      case 'create':
        hasPermission = permissions.canCreate
        break
      case 'edit':
        hasPermission = permissions.canEdit
        break
      case 'delete':
        hasPermission = permissions.canDelete
        break
      case 'approve':
        hasPermission = permissions.canApprove
        break
      case 'reject':
        hasPermission = permissions.canReject
        break
      case 'auto_schedule':
        hasPermission = permissions.canAutoSchedule
        break
      default:
        hasPermission = false
    }

    return NextResponse.json({
      success: true,
      hasPermission,
      permissions,
      userRole: user.role,
      message: hasPermission ? '操作允许' : '权限不足'
    })

  } catch (error) {
    console.error('检查权限失败:', error)
    return NextResponse.json(
      { success: false, error: '检查权限失败' },
      { status: 500 }
    )
  }
}

// 获取用户可访问的排班数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '缺少用户ID' },
        { status: 400 }
      )
    }

    let filter = ''
    
    // 根据角色设置数据访问范围
    switch (role) {
      case 'admin':
      case 'manager':
        // 管理员和管理层可以查看所有排班
        filter = ''
        break
      case 'teacher':
        // 教师只能查看自己的排班
        filter = `employee_id = "${userId}"`
        break
      case 'coordinator':
        // 协调员可以查看自己负责的中心的排班
        const user = await pb.collection('users').getOne(userId)
        if (user.center) {
          filter = `center = "${user.center}"`
        }
        break
      default:
        filter = 'id = ""' // 无权限
    }

    const schedules = await pb.collection('schedules').getList(1, 100, {
      filter,
      sort: '-created'
    })

    return NextResponse.json({
      success: true,
      schedules: schedules.items,
      total: schedules.totalItems,
      accessLevel: role
    })

  } catch (error) {
    console.error('获取排班数据失败:', error)
    return NextResponse.json(
      { success: false, error: '获取排班数据失败' },
      { status: 500 }
    )
  }
}
