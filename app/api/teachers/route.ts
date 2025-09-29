import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'
import { authenticateAdmin } from '@/lib/auth-utils'
import { getPocketBase } from '@/lib/pocketbase-optimized'

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://pjpc.tplinkdns.com:8090')

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 尝试获取教师数据...')
    
    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const email = searchParams.get('email')
    
    // 先尝试管理员认证
    try {
      await authenticateAdmin(pb)
      console.log('✅ 管理员认证成功')
    } catch (authError: any) {
      console.log('⚠️ 管理员认证失败，尝试无认证访问:', authError.message)
    }
    
    let teachers
    
    // 根据查询参数进行过滤
    if (userId) {
      console.log('🔍 通过用户ID查找教师:', userId)
      teachers = await pb.collection('teachers').getList(1, 500, {
        filter: `user_id = "${userId}"`
      })
    } else if (email) {
      console.log('🔍 通过邮箱查找教师:', email)
      teachers = await pb.collection('teachers').getList(1, 500, {
        filter: `email = "${email}"`
      })
    } else {
      // 获取所有教师
      teachers = await pb.collection('teachers').getList(1, 500)
    }
    
    console.log(`✅ 获取到 ${teachers.items.length} 个教师`)
    
    return NextResponse.json({ 
      success: true, 
      data: {
        items: teachers.items,
        totalItems: teachers.totalItems
      },
      teachers: teachers.items, // 保持向后兼容
      total: teachers.totalItems,
      count: teachers.items.length
    })
  } catch (error: any) {
    console.error('❌ 获取教师数据失败:', error)
    console.error('错误详情:', {
      message: error.message,
      status: error.status,
      data: error.data
    })
    
    // 如果teachers集合不存在，返回空数组而不是错误
    if (error.status === 404 || error.message?.includes('not found')) {
      console.log('⚠️ teachers集合不存在，返回空数组')
      return NextResponse.json({ 
        success: true, 
        data: {
          items: [],
          totalItems: 0
        },
        teachers: [], // 保持向后兼容
        total: 0,
        count: 0,
        message: 'teachers集合不存在'
      })
    }
    
    return NextResponse.json({ 
      success: false,
      error: '获取教师数据失败',
      message: error.message || '未知错误',
      details: {
        status: error.status,
        data: error.data,
        originalError: error.toString()
      }
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin(pb)
    
    const body = await request.json()
    console.log('🔍 接收到的教师数据:', body)
    
    const { 
      name, 
      user_id, 
      center_assignment, 
      email, 
      phone, 
      position = '教师',
      department = '教学部',
      status = 'active',
      permissions = 'normal_teacher'
    } = body

    // 验证必需字段
    if (!name) {
      return NextResponse.json({ 
        success: false,
        error: '缺少必需字段',
        message: '姓名是必需的'
      }, { status: 400 })
    }

    const teacherData = {
      name,
      user_id: user_id || '',
      center_assignment: center_assignment || '',
      email: email || '',
      phone: phone || '',
      position,
      department,
      status,
      permissions,
      hireDate: new Date().toISOString().split('T')[0] // 只取日期部分
    }

    console.log('🔍 准备创建的教师数据:', teacherData)

    const teacher = await pb.collection('teachers').create(teacherData)
    console.log('✅ 教师创建成功:', teacher.id)
    
    return NextResponse.json({ success: true, teacher })
  } catch (error: any) {
    console.error('创建教师失败:', error)
    return NextResponse.json({ 
      success: false,
      error: '创建教师失败',
      message: error.message || '未知错误',
      details: error.response?.data || error
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, teacherId, cardNumber } = body

    // 支持多种ID字段名
    const teacherIdToUpdate = id || teacherId
    if (!teacherIdToUpdate) {
      return NextResponse.json({ 
        success: false,
        error: '缺少教师ID' 
      }, { status: 400 })
    }

    if (!cardNumber) {
      return NextResponse.json({ 
        success: false,
        error: '缺少卡号' 
      }, { status: 400 })
    }

    console.log('🔄 更新教师卡号:', { teacherIdToUpdate, cardNumber })

    const updateData = {
      cardNumber: cardNumber
    }

    const teacher = await pb.collection('teachers').update(teacherIdToUpdate, updateData)
    
    console.log('✅ 教师卡号更新成功:', teacher)
    
    return NextResponse.json({ 
      success: true, 
      teacher,
      message: '教师卡号更新成功'
    })
  } catch (error: any) {
    console.error('更新教师卡号失败:', error)
    
    // 如果teachers集合不存在，返回友好错误
    if (error.status === 404 || error.message?.includes('not found')) {
      return NextResponse.json({ 
        success: false,
        error: 'teachers集合不存在',
        message: '无法更新教师卡号，因为teachers集合不存在'
      }, { status: 404 })
    }
    
    return NextResponse.json({ 
      success: false,
      error: '更新教师卡号失败',
      message: error.message || '未知错误',
      details: error
    }, { status: 500 })
  }
}