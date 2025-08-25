// 年级转换函数：统一年级显示格式
export const convertGradeToChinese = (grade: string): string => {
  if (!grade) return '未知年级'
  
  // 如果已经是标准格式，直接返回
  if (grade.includes('Standard') || grade.includes('Form')) {
    return grade
  }
  
  // 处理数字年级
  const gradeNum = parseInt(grade.toString())
  if (!isNaN(gradeNum)) {
    const gradeMap: Record<number, string> = {
      1: 'Standard 1（一年级）',
      2: 'Standard 2（二年级）',
      3: 'Standard 3（三年级）',
      4: 'Standard 4（四年级）',
      5: 'Standard 5（五年级）',
      6: 'Standard 6（六年级）',
      7: 'Form 1（初一）',
      8: 'Form 2（初二）',
      9: 'Form 3（初三）',
      10: 'Form 4（高一）',
      11: 'Form 5（高二）',
      12: 'Form 6（高三）'
    }
    return gradeMap[gradeNum] || grade
  }
  
  // 处理中文年级名称
  const chineseGradeMap: Record<string, string> = {
    '一年级': 'Standard 1（一年级）',
    '二年级': 'Standard 2（二年级）',
    '三年级': 'Standard 3（三年级）',
    '四年级': 'Standard 4（四年级）',
    '五年级': 'Standard 5（五年级）',
    '六年级': 'Standard 6（六年级）',
    '初一': 'Form 1（初一）',
    '初二': 'Form 2（初二）',
    '初三': 'Form 3（初三）',
    '高一': 'Form 4（高一）',
    '高二': 'Form 5（高二）',
    '高三': 'Form 6（高三）'
  }
  
  return chineseGradeMap[grade] || grade
}

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