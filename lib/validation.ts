/**
 * 输入验证工具函数
 * 提供统一的输入清理和验证功能
 */

/**
 * 清理HTML标签和潜在危险内容
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*>/gi, '')
    .replace(/<link\b[^<]*>/gi, '')
    .replace(/<meta\b[^<]*>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim()
}

/**
 * 验证邮箱格式
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

/**
 * 验证密码强度
 */
export function validatePassword(password: string): {
  isValid: boolean
  score: number
  errors: string[]
  suggestions: string[]
} {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      score: 0,
      errors: ['密码不能为空'],
      suggestions: ['请输入密码']
    }
  }
  
  const errors: string[] = []
  const suggestions: string[] = []
  let score = 0
  
  // 长度检查
  if (password.length < 8) {
    errors.push('密码长度至少8位')
    suggestions.push('增加密码长度到至少8位')
  } else if (password.length >= 12) {
    score += 20
  } else {
    score += 10
  }
  
  // 大写字母检查
  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含大写字母')
    suggestions.push('添加大写字母（A-Z）')
  } else {
    score += 20
  }
  
  // 小写字母检查
  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含小写字母')
    suggestions.push('添加小写字母（a-z）')
  } else {
    score += 20
  }
  
  // 数字检查
  if (!/\d/.test(password)) {
    errors.push('密码必须包含数字')
    suggestions.push('添加数字（0-9）')
  } else {
    score += 20
  }
  
  // 特殊字符检查
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('密码必须包含特殊字符')
    suggestions.push('添加特殊字符（!@#$%^&*等）')
  } else {
    score += 20
  }
  
  // 常见密码检查
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ]
  
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    errors.push('密码包含常见词汇，不够安全')
    suggestions.push('避免使用常见词汇')
    score -= 10
  }
  
  return {
    isValid: errors.length === 0,
    score: Math.max(0, score),
    errors,
    suggestions
  }
}

/**
 * 验证手机号
 */
export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false
  }
  
  // 清理空格和特殊字符
  const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '')
  
  // 马来西亚手机号格式验证
  const malaysiaPhoneRegex = /^(01)[0-9]\d{7,8}$/
  const internationalPhoneRegex = /^\+6?01[0-9]\d{7,8}$/
  
  return malaysiaPhoneRegex.test(cleanPhone) || internationalPhoneRegex.test(cleanPhone)
}

/**
 * 验证学生ID格式
 */
export function validateStudentId(studentId: string): boolean {
  if (!studentId || typeof studentId !== 'string') {
    return false
  }
  
  // 学生ID格式：4-20位字母数字组合
  const idRegex = /^[A-Z0-9]{4,20}$/
  return idRegex.test(studentId.trim().toUpperCase())
}

/**
 * 验证NRIC（身份证号）
 */
export function validateNRIC(nric: string): boolean {
  if (!nric || typeof nric !== 'string') {
    return false
  }
  
  // 马来西亚NRIC格式：12位数字，可能包含连字符
  const cleanNRIC = nric.replace(/[-\s]/g, '')
  const nricRegex = /^\d{12}$/
  
  return nricRegex.test(cleanNRIC)
}

/**
 * 验证姓名
 */
export function validateName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false
  }
  
  const trimmedName = name.trim()
  
  // 姓名长度检查
  if (trimmedName.length < 2 || trimmedName.length > 50) {
    return false
  }
  
  // 姓名只能包含字母、空格、连字符、撇号
  const nameRegex = /^[a-zA-Z\s\-']+$/
  return nameRegex.test(trimmedName)
}

/**
 * 验证金额
 */
export function validateAmount(amount: string | number): boolean {
  if (amount === null || amount === undefined) {
    return false
  }
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(numAmount)) {
    return false
  }
  
  // 金额必须大于0，小于等于1000000
  return numAmount > 0 && numAmount <= 1000000
}

/**
 * 清理和验证文本输入
 */
export function sanitizeText(input: string, maxLength: number = 255): string {
  if (!input || typeof input !== 'string') {
    return ''
  }
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .substring(0, maxLength)
    .trim()
}

/**
 * 验证URL
 */
export function validateUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }
  
  try {
    const urlObj = new URL(url)
    return ['http:', 'https:'].includes(urlObj.protocol)
  } catch {
    return false
  }
}

/**
 * 验证日期格式
 */
export function validateDate(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') {
    return false
  }
  
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

/**
 * 验证年龄（基于出生日期）
 */
export function validateAge(birthDate: string, minAge: number = 0, maxAge: number = 120): boolean {
  if (!validateDate(birthDate)) {
    return false
  }
  
  const birth = new Date(birthDate)
  const today = new Date()
  const age = today.getFullYear() - birth.getFullYear()
  
  return age >= minAge && age <= maxAge
}

/**
 * 综合验证函数
 */
export function validateInput(type: string, value: any, options: any = {}): {
  isValid: boolean
  errors: string[]
  sanitizedValue?: string
} {
  const errors: string[] = []
  let sanitizedValue: string | undefined
  
  switch (type) {
    case 'email':
      if (!validateEmail(value)) {
        errors.push('邮箱格式不正确')
      }
      break
      
    case 'password':
      const passwordValidation = validatePassword(value)
      if (!passwordValidation.isValid) {
        errors.push(...passwordValidation.errors)
      }
      break
      
    case 'phone':
      if (!validatePhone(value)) {
        errors.push('手机号格式不正确')
      }
      break
      
    case 'studentId':
      if (!validateStudentId(value)) {
        errors.push('学生ID格式不正确（4-20位字母数字）')
      }
      break
      
    case 'nric':
      if (!validateNRIC(value)) {
        errors.push('身份证号格式不正确（12位数字）')
      }
      break
      
    case 'name':
      if (!validateName(value)) {
        errors.push('姓名格式不正确（2-50位字母）')
      }
      break
      
    case 'amount':
      if (!validateAmount(value)) {
        errors.push('金额格式不正确（0-1000000）')
      }
      break
      
    case 'url':
      if (!validateUrl(value)) {
        errors.push('URL格式不正确')
      }
      break
      
    case 'date':
      if (!validateDate(value)) {
        errors.push('日期格式不正确')
      }
      break
      
    case 'text':
    default:
      sanitizedValue = sanitizeText(value, options.maxLength)
      break
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue
  }
}

/**
 * 批量验证表单数据
 */
export function validateFormData(formData: Record<string, any>, validationRules: Record<string, any>): {
  isValid: boolean
  errors: Record<string, string[]>
  sanitizedData: Record<string, any>
} {
  const errors: Record<string, string[]> = {}
  const sanitizedData: Record<string, any> = {}
  
  Object.keys(validationRules).forEach(field => {
    const rule = validationRules[field]
    const value = formData[field]
    
    const validation = validateInput(rule.type, value, rule.options)
    
    if (!validation.isValid) {
      errors[field] = validation.errors
    }
    
    sanitizedData[field] = validation.sanitizedValue !== undefined ? validation.sanitizedValue : value
  })
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData
  }
}