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
    
    // 基本字段映射
    if (updateData.teacher_name !== undefined) mappedUpdateData.name = updateData.teacher_name
    if (updateData.teacher_id !== undefined) mappedUpdateData.teacher_id = updateData.teacher_id
    if (updateData.nric !== undefined) mappedUpdateData.nric = updateData.nric
    if (updateData.email !== undefined) mappedUpdateData.email = updateData.email
    if (updateData.phone !== undefined) mappedUpdateData.phone = updateData.phone
    if (updateData.department !== undefined) mappedUpdateData.department = updateData.department
    if (updateData.position !== undefined) mappedUpdateData.position = updateData.position
    if (updateData.epfNo !== undefined) mappedUpdateData.epfNo = updateData.epfNo
    if (updateData.socsoNo !== undefined) mappedUpdateData.socsoNo = updateData.socsoNo
    if (updateData.bankName !== undefined) mappedUpdateData.bankName = updateData.bankName
    if (updateData.bankAccountNo !== undefined) mappedUpdateData.bankAccountNo = updateData.bankAccountNo
    if (updateData.bankAccountName !== undefined) mappedUpdateData.bankAccountName = updateData.bankAccountName
    if (updateData.hireDate !== undefined) mappedUpdateData.hireDate = updateData.hireDate
    if (updateData.idNumber !== undefined) mappedUpdateData.idNumber = updateData.idNumber
    if (updateData.address !== undefined) mappedUpdateData.address = updateData.address
    if (updateData.childrenCount !== undefined) mappedUpdateData.childrenCount = updateData.childrenCount
    if (updateData.maritalStatus !== undefined) mappedUpdateData.maritalStatus = updateData.maritalStatus
    if (updateData.cardNumber !== undefined) mappedUpdateData.cardNumber = updateData.cardNumber
    if (updateData.teacherUrl !== undefined) mappedUpdateData.teacherUrl = updateData.teacherUrl
    if (updateData.permissions !== undefined) mappedUpdateData.permissions = updateData.permissions
    if (updateData.status !== undefined) mappedUpdateData.status = updateData.status
    
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
