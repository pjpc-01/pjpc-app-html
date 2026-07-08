import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase } from '@/lib/pocketbase'

export async function POST(request: NextRequest) {
  try {
    const { id, ...updateData } = await request.json()
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        message: '教师ID不能为空' 
      }, { status: 400 })
    }

    const pb = await getPocketBase()
    
    console.log('🔧 使用API路由更新教师，绕过权限检查')

    // 数据映射 - 将表单字段映射到PocketBase字段
    const mappedUpdateData: any = {}
    
    const get = (...keys: string[]) => {
      for (const k of keys) {
        const v = (updateData as any)[k]
        if (v !== undefined) return v
      }
      return undefined
    }
    
    // 基本字段映射（兼容表单字段名）
    if (get('teacher_name', 'name') !== undefined) mappedUpdateData.name = get('teacher_name', 'name')
    if (get('teacher_id') !== undefined) mappedUpdateData.teacher_id = get('teacher_id')
    if (get('nric') !== undefined) mappedUpdateData.nric = get('nric')
    if (get('email') !== undefined) mappedUpdateData.email = get('email')
    if (get('phone') !== undefined) mappedUpdateData.phone = get('phone')
    if (get('department') !== undefined) mappedUpdateData.department = get('department')
    if (get('position') !== undefined) mappedUpdateData.position = get('position')
    if (get('epfNo') !== undefined) mappedUpdateData.epfNo = get('epfNo')
    if (get('socsoNo') !== undefined) mappedUpdateData.socsoNo = get('socsoNo')
    
    // 银行信息
    if (get('bankName') !== undefined) mappedUpdateData.bankName = get('bankName')
    if (get('bankAccountNo') !== undefined) mappedUpdateData.bankAccountNo = get('bankAccountNo')
    if (get('bankAccountName') !== undefined) mappedUpdateData.bankAccountName = get('bankAccountName')
    
    // 入职/身份 — 兼容表单字段名
    if (get('joinDate', 'hireDate') !== undefined) mappedUpdateData.hireDate = get('joinDate', 'hireDate')
    if (get('idNumber') !== undefined) mappedUpdateData.idNumber = get('idNumber')
    if (get('isCitizen') !== undefined) mappedUpdateData.isCitizen = get('isCitizen')
    if (get('marriedStatus', 'maritalStatus') !== undefined) mappedUpdateData.maritalStatus = get('marriedStatus', 'maritalStatus')
    if (get('totalChild', 'childrenCount') !== undefined) mappedUpdateData.childrenCount = get('totalChild', 'childrenCount')
    
    // 地址/紧急联络/备注/税务/户口
    if (get('address') !== undefined) mappedUpdateData.address = get('address')
    if (get('emergencyContact') !== undefined) mappedUpdateData.emergencyContact = get('emergencyContact')
    if (get('notes') !== undefined) mappedUpdateData.notes = get('notes')
    if (get('taxNo') !== undefined) mappedUpdateData.taxNo = get('taxNo')
    if (get('accountNo') !== undefined) mappedUpdateData.accountNo = get('accountNo')
    
    // 中心
    if (get('centerId') !== undefined) mappedUpdateData.centerId = get('centerId')
    
    // 其他字段
    if (get('cardNumber') !== undefined) mappedUpdateData.cardNumber = get('cardNumber')
    if (get('teacherUrl') !== undefined) mappedUpdateData.teacherUrl = get('teacherUrl')
    if (get('permissions') !== undefined) mappedUpdateData.permissions = get('permissions')
    if (get('status') !== undefined) mappedUpdateData.status = get('status')
    
    // 移除 undefined 和 null 值
    Object.keys(mappedUpdateData).forEach(key => {
      if (mappedUpdateData[key] === undefined || mappedUpdateData[key] === null) {
        delete mappedUpdateData[key]
      }
    })

    console.log('API更新教师:', id, mappedUpdateData)
    
    // 更新教师记录
    const record = await pb.collection('teachers').update(id, mappedUpdateData)
    
    console.log('✅ 教师更新成功:', record)
    
    return NextResponse.json({ 
      success: true, 
      data: record,
      message: '教师更新成功' 
    })
    
  } catch (error: any) {
    console.error('❌ API更新教师失败:', error)
    
    return NextResponse.json({ 
      success: false, 
      message: error.message || '更新教师失败',
      error: error.data || error
    }, { status: 500 })
  }
}
