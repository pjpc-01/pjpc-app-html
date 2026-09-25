// 年级显示统一走 @/lib/grades
// 原来这里自己写：canonical 输入原样返回（'Standard 1'），中文输入却转成 'Standard 1（一年级）'
// → 同一个年级两种显示。现在统一。
export { gradeLabel as convertGradeToChinese } from '@/lib/grades'

// 格式化出生日期
export const formatBirthDate = (dateString: string): string => {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch (error) {
    return dateString
  }
}

// 计算年龄
export const calculateAge = (birthDate: string): number => {
  if (!birthDate) return 0
  
  try {
    const birth = new Date(birthDate)
    const today = new Date()
    
    if (isNaN(birth.getTime())) return 0
    
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  } catch (error) {
    return 0
  }
}



// 验证电话号码格式
export const validatePhone = (phone: string): boolean => {
  if (!phone) return true // 允许空值
  // 马来西亚电话号码格式验证
  return /^(\+?60|0)[1-9]\d{8}$/.test(phone.replace(/\s/g, ''))
}

// 验证邮箱格式
export const validateEmail = (email: string): boolean => {
  if (!email) return true // 允许空值
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 生成CSV内容
export const generateCSV = (studentData: any[]): string => {
  if (!studentData || studentData.length === 0) return ''
  
  const headers = [
    '姓名',
    '学号',
    '年级',
    '性别',
    '出生日期',
    '年龄',
    '联系电话',
    '邮箱',
    '地址',
    '家长姓名',
    '家长电话',
    '状态',
    '入学日期',
    '备注'
  ]
  
  const csvContent = [
    headers.join(','),
    ...studentData.map(student => [
      `"${student.student_name || ''}"`,
      `"${student.student_id || ''}"`,
      `"${convertGradeToChinese(student.standard) || ''}"`,
      `"${student.gender || ''}"`,
      `"${formatBirthDate(student.dob) || ''}"`,
      `"${calculateAge(student.dob) || ''}"`,
      `"${student.phone || ''}"`,
      `"${student.email || ''}"`,
      `"${student.home_address || ''}"`,
      `"${student.parentName || ''}"`,
      `"${student.parentPhone || ''}"`,
      `"${student.status || ''}"`,
      `"${formatBirthDate(student.enrollmentDate) || ''}"`,
      `"${student.notes || ''}"`
    ].join(','))
  ].join('\n')
  
  return csvContent
}

// 下载CSV文件
export const downloadCSV = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
} 