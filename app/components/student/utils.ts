// 年级转换函数：将英文年级转换为华文年级
export const convertGradeToChinese = (grade: string): string => {
  if (!grade) return '未知年级'
  
  const gradeStr = grade.toString().toLowerCase().trim()
  
  // 英文年级映射
  const englishGradeMap: Record<string, string> = {
    // Standard格式（Google Sheets中的标准格式）
    'standard 1': '一年级',
    'standard1': '一年级',
    'std 1': '一年级',
    'std1': '一年级',
    's1': '一年级',
    '1': '一年级',
    
    'standard 2': '二年级',
    'standard2': '二年级',
    'std 2': '二年级',
    'std2': '二年级',
    's2': '二年级',
    '2': '二年级',
    
    'standard 3': '三年级',
    'standard3': '三年级',
    'std 3': '三年级',
    'std3': '三年级',
    's3': '三年级',
    '3': '三年级',
    
    'standard 4': '四年级',
    'standard4': '四年级',
    'std 4': '四年级',
    'std4': '四年级',
    's4': '四年级',
    '4': '四年级',
    
    'standard 5': '五年级',
    'standard5': '五年级',
    'std 5': '五年级',
    'std5': '五年级',
    's5': '五年级',
    '5': '五年级',
    
    'standard 6': '六年级',
    'standard6': '六年级',
    'std 6': '六年级',
    'std6': '六年级',
    's6': '六年级',
    '6': '六年级',
    
    // Grade格式
    'grade 1': '一年级',
    'grade1': '一年级',
    '1st grade': '一年级',
    '1st': '一年级',
    'first grade': '一年级',
    'first': '一年级',
    
    'grade 2': '二年级',
    'grade2': '二年级',
    '2nd grade': '二年级',
    '2nd': '二年级',
    'second grade': '二年级',
    'second': '二年级',
    
    'grade 3': '三年级',
    'grade3': '三年级',
    '3rd grade': '三年级',
    '3rd': '三年级',
    'third grade': '三年级',
    'third': '三年级',
    
    'grade 4': '四年级',
    'grade4': '四年级',
    '4th grade': '四年级',
    '4th': '四年级',
    'fourth grade': '四年级',
    'fourth': '四年级',
    
    'grade 5': '五年级',
    'grade5': '五年级',
    '5th grade': '五年级',
    '5th': '五年级',
    'fifth grade': '五年级',
    'fifth': '五年级',
    
    'grade 6': '六年级',
    'grade6': '六年级',
    '6th grade': '六年级',
    '6th': '六年级',
    'sixth grade': '六年级',
    'sixth': '六年级',
    
    // 中学年级
    'grade 7': '初一',
    'grade7': '初一',
    '7th grade': '初一',
    '7th': '初一',
    'seventh grade': '初一',
    'seventh': '初一',
    '7': '初一',
    
    'grade 8': '初二',
    'grade8': '初二',
    '8th grade': '初二',
    '8th': '初二',
    'eighth grade': '初二',
    'eighth': '初二',
    '8': '初二',
    
    'grade 9': '初三',
    'grade9': '初三',
    '9th grade': '初三',
    '9th': '初三',
    'ninth grade': '初三',
    'ninth': '初三',
    '9': '初三',
    
    'grade 10': '高一',
    'grade10': '高一',
    '10th grade': '高一',
    '10th': '高一',
    'tenth grade': '高一',
    'tenth': '高一',
    '10': '高一',
    
    'grade 11': '高二',
    'grade11': '高二',
    '11th grade': '高二',
    '11th': '高二',
    'eleventh grade': '高二',
    'eleventh': '高二',
    '11': '高二',
    
    'grade 12': '高三',
    'grade12': '高三',
    '12th grade': '高三',
    '12th': '高三',
    'twelfth grade': '高三',
    'twelfth': '高三',
    '12': '高三',
    
    // Form格式（马来西亚中学）
    'form 1': '初一',
    'form1': '初一',
    'f1': '初一',
    
    'form 2': '初二',
    'form2': '初二',
    'f2': '初二',
    
    'form 3': '初三',
    'form3': '初三',
    'f3': '初三',
    
    'form 4': '高一',
    'form4': '高一',
    'f4': '高一',
    
    'form 5': '高二',
    'form5': '高二',
    'f5': '高二',
    
    'form 6': '高三',
    'form6': '高三',
    'f6': '高三',
    
    // 华文年级
    '一年级': '一年级',
    '二年级': '二年级',
    '三年级': '三年级',
    '四年级': '四年级',
    '五年级': '五年级',
    '六年级': '六年级',
    '初一': '初一',
    '初二': '初二',
    '初三': '初三',
    '高一': '高一',
    '高二': '高二',
    '高三': '高三',
  }
  
  return englishGradeMap[gradeStr] || grade
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
      `"${student.name || ''}"`,
      `"${student.studentId || ''}"`,
      `"${convertGradeToChinese(student.grade) || ''}"`,
      `"${student.gender || ''}"`,
      `"${formatBirthDate(student.birthDate) || ''}"`,
      `"${calculateAge(student.birthDate) || ''}"`,
      `"${student.phone || ''}"`,
      `"${student.email || ''}"`,
      `"${student.address || ''}"`,
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