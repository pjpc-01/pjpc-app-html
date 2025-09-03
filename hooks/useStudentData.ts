import { useState, useEffect, useCallback } from 'react'
import { pb } from '@/lib/pocketbase-instance'
import type { Student } from '@/lib/pocketbase-instance'

export interface StudentData {
  id: string
  student_id?: string
  student_name?: string
  dob?: string
  father_phone?: string
  mother_phone?: string
  home_address?: string
  gender?: string
  serviceType?: 'afterschool' | 'tuition'
  register_form_url?: string
  standard?: string
  level?: 'primary' | 'secondary'
  center?: 'WX 01' | 'WX 02' | 'WX 03' | 'WX 04'
  nric?: string
  school?: string
  parentPhone?: string
  emergencyContact?: string
  emergencyPhone?: string
  healthInfo?: string
  pickupMethod?: 'parent' | 'guardian' | 'authorized' | 'public' | 'walking'
  authorizedPickup1Name?: string
  authorizedPickup1Phone?: string
  authorizedPickup1Relation?: string
  authorizedPickup2Name?: string
  authorizedPickup2Phone?: string
  authorizedPickup2Relation?: string
  authorizedPickup3Name?: string
  authorizedPickup3Phone?: string
  authorizedPickup3Relation?: string
  registrationDate?: string
  tuitionStatus?: 'pending' | 'paid' | 'partial' | 'overdue'
  birthCertificate?: string | null
  avatar?: string | null
  cardNumber?: string
  cardType?: 'NFC' | 'RFID'
  studentUrl?: string
  balance?: number
  status?: 'active' | 'inactive' | 'lost' | 'graduated'
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

export const useStudentData = () => {
  const [students, setStudents] = useState<StudentData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取所有学生数据
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('开始获取合并后的学生数据...')
      
      // 使用API路由获取学生数据，确保数据一致性
      const response = await fetch('/api/students', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || '获取学生数据失败')
      }
      
      const studentData = data.students || []
      console.log(`成功获取 ${studentData.length} 个学生数据`)
      
      // 转换数据格式
      const formattedStudents: StudentData[] = studentData.map((student: any) => ({
        id: student.id,
        student_id: student.student_id,
        student_name: student.student_name,
        dob: student.dob,
        father_phone: student.father_phone,
        mother_phone: student.mother_phone,
        home_address: student.home_address,
        gender: student.gender,
        serviceType: student.serviceType,
        register_form_url: student.register_form_url,
        standard: student.standard,
        level: student.level,
        center: student.center,
        nric: student.nric,
        school: student.school,
        parentPhone: student.parentPhone,
        emergencyContact: student.emergencyContact,
        emergencyPhone: student.emergencyPhone,
        healthInfo: student.healthInfo,
        pickupMethod: student.pickupMethod,
        authorizedPickup1Name: student.authorizedPickup1Name,
        authorizedPickup1Phone: student.authorizedPickup1Phone,
        authorizedPickup1Relation: student.authorizedPickup1Relation,
        authorizedPickup2Name: student.authorizedPickup2Name,
        authorizedPickup2Phone: student.authorizedPickup2Phone,
        authorizedPickup2Relation: student.authorizedPickup2Relation,
        authorizedPickup3Name: student.authorizedPickup3Name,
        authorizedPickup3Phone: student.authorizedPickup3Phone,
        authorizedPickup3Relation: student.authorizedPickup3Relation,
        registrationDate: student.registrationDate,
        tuitionStatus: student.tuitionStatus,
        birthCertificate: student.birthCert || student.birthCertificate,
        avatar: student.photo || student.avatar,
        cardNumber: student.cardNumber,
        cardType: student.cardType,
        studentUrl: student.studentUrl,
        balance: student.balance,
        status: student.status || 'active',
        issuedDate: student.issuedDate,
        expiryDate: student.expiryDate,
        enrollmentDate: student.enrollmentDate,
        phone: student.phone,
        email: student.email,
        parentName: student.parentName,
        address: student.address,
        medicalInfo: student.medicalInfo,
        notes: student.notes,
        usageCount: student.usageCount || 0,
        lastUsed: student.lastUsed,
        created: student.created,
        updated: student.updated,
      }))
      
      setStudents(formattedStudents)
      console.log('学生数据格式化完成')
      
    } catch (err: any) {
      console.error('获取学生数据失败:', err)
      setError(err.message || '获取学生数据失败')
    } finally {
      setLoading(false)
    }
  }, [])

  // 添加学生
  const addStudent = useCallback(async (studentData: Partial<StudentData>) => {
    try {
      console.log('添加学生:', studentData)
      
      const dataToSave = {
        ...studentData,
        student_name: studentData.student_name || '未命名学生',
        status: studentData.status || 'active',
      }
      
      // 使用API路由添加学生，确保数据一致性
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || '添加学生失败')
      }
      
      console.log('学生添加成功:', data.student.id)
      
      // 刷新数据
      await fetchStudents()
      return data.student
      
    } catch (err: any) {
      console.error('添加学生失败:', err)
      throw new Error(`添加学生失败: ${err.message}`)
    }
  }, [fetchStudents])

  // 更新学生
  const updateStudent = useCallback(async (id: string, studentData: Partial<StudentData>) => {
    try {
      console.log('更新学生:', id, studentData)
      
      if (!pb.authStore.isValid) {
        throw new Error('用户未认证')
      }
      
      const updateData = {
        ...studentData,
        updated: new Date().toISOString(),
      }
      
      await pb.collection('students').update(id, updateData)
      console.log('学生更新成功')
      
      // 刷新数据
      await fetchStudents()
      
    } catch (err: any) {
      console.error('更新学生失败:', err)
      throw new Error(`更新学生失败: ${err.message}`)
    }
  }, [fetchStudents])

  // 删除学生
  const deleteStudent = useCallback(async (id: string) => {
    try {
      console.log('删除学生:', id)
      
      if (!pb.authStore.isValid) {
        throw new Error('用户未认证')
      }
      
      await pb.collection('students').delete(id)
      console.log('学生删除成功')
      
      // 刷新数据
      await fetchStudents()
      
    } catch (err: any) {
      console.error('删除学生失败:', err)
      throw new Error(`删除学生失败: ${err.message}`)
    }
  }, [fetchStudents])

  // 搜索学生
  const searchStudents = useCallback(async (query: string) => {
    try {
      console.log('搜索学生:', query)
      
      // 使用API路由搜索学生，确保数据一致性
      const response = await fetch(`/api/students?search=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || '搜索学生失败')
      }
      
      const studentData = data.students || []
      console.log(`搜索到 ${studentData.length} 个学生`)
      
      // 转换数据格式
      const formattedStudents: StudentData[] = studentData.map((student: any) => ({
        id: student.id,
        student_id: student.student_id,
        student_name: student.student_name,
        dob: student.dob,
        father_phone: student.father_phone,
        mother_phone: student.mother_phone,
        home_address: student.home_address,
        gender: student.gender,
        serviceType: student.serviceType,
        register_form_url: student.register_form_url,
        standard: student.standard,
        level: student.level,
        center: student.center,
        nric: student.nric,
        school: student.school,
        parentPhone: student.parentPhone,
        emergencyContact: student.emergencyContact,
        emergencyPhone: student.emergencyPhone,
        healthInfo: student.healthInfo,
        pickupMethod: student.pickupMethod,
        authorizedPickup1Name: student.authorizedPickup1Name,
        authorizedPickup1Phone: student.authorizedPickup1Phone,
        authorizedPickup1Relation: student.authorizedPickup1Relation,
        authorizedPickup2Name: student.authorizedPickup2Name,
        authorizedPickup2Phone: student.authorizedPickup2Phone,
        authorizedPickup2Relation: student.authorizedPickup2Relation,
        authorizedPickup3Name: student.authorizedPickup3Name,
        authorizedPickup3Phone: student.authorizedPickup3Phone,
        authorizedPickup3Relation: student.authorizedPickup3Relation,
        registrationDate: student.registrationDate,
        tuitionStatus: student.tuitionStatus,
        birthCertificate: student.birthCert || student.birthCertificate,
        avatar: student.photo || student.avatar,
        cardNumber: student.cardNumber,
        cardType: student.cardType,
        studentUrl: student.studentUrl,
        balance: student.balance,
        status: student.status || 'active',
        issuedDate: student.issuedDate,
        expiryDate: student.expiryDate,
        enrollmentDate: student.enrollmentDate,
        phone: student.phone,
        email: student.email,
        parentName: student.parentName,
        address: student.address,
        medicalInfo: student.medicalInfo,
        notes: student.notes,
        usageCount: student.usageCount || 0,
        lastUsed: student.lastUsed,
        created: student.created,
        updated: student.updated,
      }))
      
      return formattedStudents
      
    } catch (err: any) {
      console.error('搜索学生失败:', err)
      throw new Error(`搜索学生失败: ${err.message}`)
    }
  }, [])

  // 根据中心获取学生
  const getStudentsByCenter = useCallback(async (center: string) => {
    try {
      console.log('获取中心学生:', center)
      
      // 使用API路由获取学生数据，确保数据一致性
      const response = await fetch(`/api/students?center=${encodeURIComponent(center)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || '获取学生数据失败')
      }
      
      const studentData = data.students || []
      console.log(`中心 ${center} 有 ${studentData.length} 个学生`)
      
      // 转换数据格式
      const formattedStudents: StudentData[] = studentData.map((student: any) => ({
        id: student.id,
        student_id: student.student_id,
        student_name: student.student_name,
        dob: student.dob,
        father_phone: student.father_phone,
        mother_phone: student.mother_phone,
        home_address: student.home_address,
        gender: student.gender,
        serviceType: student.serviceType,
        register_form_url: student.register_form_url,
        standard: student.standard,
        level: student.level,
        center: student.center,
        nric: student.nric,
        school: student.school,
        parentPhone: student.parentPhone,
        emergencyContact: student.emergencyContact,
        emergencyPhone: student.emergencyPhone,
        healthInfo: student.healthInfo,
        pickupMethod: student.pickupMethod,
        authorizedPickup1Name: student.authorizedPickup1Name,
        authorizedPickup1Phone: student.authorizedPickup1Phone,
        authorizedPickup1Relation: student.authorizedPickup1Relation,
        authorizedPickup2Name: student.authorizedPickup2Name,
        authorizedPickup2Phone: student.authorizedPickup2Phone,
        authorizedPickup2Relation: student.authorizedPickup2Relation,
        authorizedPickup3Name: student.authorizedPickup3Name,
        authorizedPickup3Phone: student.authorizedPickup3Phone,
        authorizedPickup3Relation: student.authorizedPickup3Relation,
        registrationDate: student.registrationDate,
        tuitionStatus: student.tuitionStatus,
        birthCertificate: student.birthCert || student.birthCertificate,
        avatar: student.photo || student.avatar,
        cardNumber: student.cardNumber,
        cardType: student.cardType,
        studentUrl: student.studentUrl,
        balance: student.balance,
        status: student.status || 'active',
        issuedDate: student.issuedDate,
        expiryDate: student.expiryDate,
        enrollmentDate: student.enrollmentDate,
        phone: student.phone,
        email: student.email,
        parentName: student.parentName,
        address: student.address,
        medicalInfo: student.medicalInfo,
        notes: student.notes,
        usageCount: student.usageCount || 0,
        lastUsed: student.lastUsed,
        created: student.created,
        updated: student.updated,
      }))
      
      return formattedStudents
      
    } catch (err: any) {
      console.error('获取中心学生失败:', err)
      throw new Error(`获取中心学生失败: ${err.message}`)
    }
  }, [])

  // 手动刷新数据
  const refetch = useCallback(() => {
    console.log('手动刷新学生数据')
    fetchStudents()
  }, [fetchStudents])

  // 初始数据获取
  useEffect(() => {
    console.log('useStudentData useEffect triggered')
    fetchStudents()
  }, [fetchStudents])

  return {
    students,
    loading,
    error,
    refetch,
    addStudent,
    updateStudent,
    deleteStudent,
    searchStudents,
    getStudentsByCenter
  }
}
