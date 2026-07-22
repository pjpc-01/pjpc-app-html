import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase } from '@/lib/pocketbase'
import { authenticateAdmin } from '@/lib/auth-utils'
import { TeacherSalaryStructure, TeacherSalaryRecord } from '@/lib/pocketbase-schema'

// 获取教师薪资结构
export async function GET(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin(pb)

    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacher_id')
    const type = searchParams.get('type') || 'structure' // structure | record

    if (type === 'structure') {
      // 获取薪资结构
      let filter = 'status = "active"'
      if (teacherId) {
        filter += ` && teacher_id = "${teacherId}"`
      }

      const records = await pb.collection('teacher_salary_structures').getList(1, 100, {
        filter,
        sort: '-effective_date'
      })

      // 手动 join 教师名字（因为 teacher_id 是 text 字段不是 relation）
      const teacherIds = [...new Set(records.items.map(r => r.teacher_id).filter(Boolean))]
      const teachers = teacherIds.length > 0
        ? await pb.collection('teachers').getList(1, 100, {
            filter: teacherIds.map(id => `id = "${id}"`).join(' || ')
          })
        : { items: [] }
      const teacherMap = new Map(teachers.items.map(t => [t.id, { name: t.name, email: t.email }]))

      const data = records.items.map(r => ({
        ...r,
        expand: {
          teacher_id: teacherMap.get(r.teacher_id) || { name: '未知教师', email: '' }
        }
      }))

      return NextResponse.json({
        success: true,
        data,
        total: records.totalItems
      })
    } else {
      // 获取薪资记录
      let filter = '1=1'
      if (teacherId) {
        filter += ` && teacher_id = "${teacherId}"`
      }

      const year = searchParams.get('year')
      const month = searchParams.get('month')
      if (year) {
        filter += ` && year = ${year}`
      }
      if (month) {
        filter += ` && month = ${month}`
      }

      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')

      const records = await pb.collection('teacher_salary_records').getList(page, limit, {
        filter,
        sort: '-year,-month'
      })

      // 手动 join 教师名字（text 字段不支持 expand）
      const recordTeacherIds = [...new Set(records.items.map(r => r.teacher_id).filter(Boolean))]
      const allTeachers = recordTeacherIds.length > 0
        ? await pb.collection('teachers').getList(1, 100, {
            filter: recordTeacherIds.map(id => `id = "${id}"`).join(' || ')
          })
        : { items: [] }
      const allTeacherMap = new Map(allTeachers.items.map(t => [t.id, { name: t.name, email: t.email }]))

      const recordsData = records.items.map(r => ({
        ...r,
        expand: {
          teacher_id: allTeacherMap.get(r.teacher_id) || { name: '未知教师', email: '' }
        }
      }))

      return NextResponse.json({
        success: true,
        data: recordsData,
        total: records.totalItems,
        page,
        totalPages: records.totalPages
      })
    }
  } catch (error) {
    console.error('获取教师薪资数据失败:', error)
    return NextResponse.json(
      { success: false, error: '获取教师薪资数据失败' },
      { status: 500 }
    )
  }
}

// 创建薪资结构
export async function POST(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin(pb)

    const body = await request.json()
    const { type, data } = body

    if (type === 'structure') {
      // 创建薪资结构
      const salaryStructure: Partial<TeacherSalaryStructure> = {
        teacher_id: data.teacher_id,
        base_salary: data.base_salary,
        hourly_rate: data.hourly_rate,
        overtime_rate: data.overtime_rate,
        allowances: data.allowances || 0,
        epf_rate: data.epf_rate || 0.11,
        epf_employer_rate: data.epf_employer_rate || 0.13,
        socso_rate: data.socso_rate || 0.005,
        eis_rate: data.eis_rate || 0.002,
        tax_rate: data.tax_rate || 0,
        salary_type: data.salary_type || 'monthly',
        effective_date: data.effective_date,
        end_date: data.end_date,
        status: 'active',
        notes: data.notes
      }

      const record = await pb.collection('teacher_salary_structures').create(salaryStructure)

      return NextResponse.json({
        success: true,
        data: record,
        message: '薪资结构创建成功'
      })
    } else if (type === 'record') {
      // 生成 payslip serial number
      const year = data.year
      const month = data.month
      const count = await pb.collection('teacher_salary_records').getList(1, 1, {
        filter: `year = ${year} && month = ${month}`
      })
      const seq = String((count.totalItems || 0) + 1).padStart(3, '0')
      const payslipNo = `PS-${year}${String(month).padStart(2, '0')}-${seq}`

      // 创建薪资记录
      const salaryRecord: Partial<TeacherSalaryRecord> = {
        teacher_id: data.teacher_id,
        salary_period: data.salary_period,
        year: data.year,
        month: data.month,
        payslip_no: payslipNo,
        base_salary: data.base_salary,
        hours_worked: data.hours_worked || 0,
        overtime_hours: data.overtime_hours || 0,
        overtime_pay: data.overtime_pay || 0,
        allowances: data.allowances || 0,
        gross_salary: data.gross_salary,
        epf_deduction: data.epf_deduction || 0,
        socso_deduction: data.socso_deduction || 0,
        eis_deduction: data.eis_deduction || 0,
        tax_deduction: data.tax_deduction || 0,
        other_deductions: data.other_deductions || 0,
        net_salary: data.net_salary,
        bonus: data.bonus || 0,
        commission: data.commission || 0,
        status: 'paid',
        notes: data.notes,
        created_by: data.created_by
      }

      const record = await pb.collection('teacher_salary_records').create(salaryRecord)

      return NextResponse.json({
        success: true,
        data: record,
        message: '薪资记录创建成功'
      })
    }

    return NextResponse.json(
      { success: false, error: '无效的请求类型' },
      { status: 400 }
    )
  } catch (error) {
    console.error('创建教师薪资数据失败:', error)
    return NextResponse.json(
      { success: false, error: '创建教师薪资数据失败' },
      { status: 500 }
    )
  }
}

// 更新薪资数据
export async function PUT(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin(pb)

    const body = await request.json()
    const { type, id, data } = body

    if (type === 'structure') {
      // 更新薪资结构
      const record = await pb.collection('teacher_salary_structures').update(id, data)
      return NextResponse.json({
        success: true,
        data: record,
        message: '薪资结构更新成功'
      })
    } else if (type === 'record') {
      // 更新薪资记录
      const record = await pb.collection('teacher_salary_records').update(id, data)
      return NextResponse.json({
        success: true,
        data: record,
        message: '薪资记录更新成功'
      })
    }

    return NextResponse.json(
      { success: false, error: '无效的请求类型' },
      { status: 400 }
    )
  } catch (error) {
    console.error('更新教师薪资数据失败:', error)
    return NextResponse.json(
      { success: false, error: '更新教师薪资数据失败' },
      { status: 500 }
    )
  }
}

// 删除薪资数据
export async function DELETE(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin(pb)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')

    if (!id || !type) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }

    if (type === 'structure') {
      await pb.collection('teacher_salary_structures').delete(id)
    } else if (type === 'record') {
      await pb.collection('teacher_salary_records').delete(id)
    }

    return NextResponse.json({
      success: true,
      message: '删除成功'
    })
  } catch (error) {
    console.error('删除教师薪资数据失败:', error)
    return NextResponse.json(
      { success: false, error: '删除教师薪资数据失败' },
      { status: 500 }
    )
  }
}
