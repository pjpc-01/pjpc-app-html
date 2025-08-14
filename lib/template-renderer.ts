export interface TemplateData {
  schoolName: string
  schoolAddress: string
  schoolPhone: string
  schoolEmail: string
  invoiceNumber: string
  issueDate: string
  dueDate: string
  studentName: string
  studentGrade: string
  parentName: string
  items: Array<{ name: string; amount: number }>
  totalAmount: number
  tax: number
  discount: number
  paymentMethod?: string
  notes?: string
}

export function renderInvoiceTemplate(template: string, data: TemplateData): string {
  let renderedTemplate = template

  // Replace simple variables
  const simpleVariables = {
    schoolName: data.schoolName,
    schoolAddress: data.schoolAddress,
    schoolPhone: data.schoolPhone,
    schoolEmail: data.schoolEmail,
    invoiceNumber: data.invoiceNumber,
    issueDate: data.issueDate,
    dueDate: data.dueDate,
    studentName: data.studentName,
    studentGrade: data.studentGrade,
    parentName: data.parentName,
    totalAmount: data.totalAmount,
    tax: data.tax,
    discount: data.discount,
    paymentMethod: data.paymentMethod || '',
    notes: data.notes || ''
  }

  Object.entries(simpleVariables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    renderedTemplate = renderedTemplate.replace(regex, String(value))
  })

  // Handle items array with {{#each items}} syntax
  const eachItemsRegex = /\{\{#each items\}\}([\s\S]*?)\{\{\/each\}\}/g
  renderedTemplate = renderedTemplate.replace(eachItemsRegex, (match, itemTemplate) => {
    return data.items.map(item => {
      let itemHtml = itemTemplate
      itemHtml = itemHtml.replace(/\{\{name\}\}/g, item.name)
      itemHtml = itemHtml.replace(/\{\{amount\}\}/g, String(item.amount))
      return itemHtml
    }).join('')
  })

  // Handle conditional blocks (basic implementation)
  // {{#if condition}}content{{/if}}
  const ifRegex = /\{\{#if ([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g
  renderedTemplate = renderedTemplate.replace(ifRegex, (match, condition, content) => {
    const value = simpleVariables[condition as keyof typeof simpleVariables]
    return value ? content : ''
  })

  return renderedTemplate
}

export function extractTemplateVariables(template: string): string[] {
  const variables = new Set<string>()
  
  // Extract simple variables {{variableName}}
  const simpleVariableRegex = /\{\{([^}]+)\}\}/g
  let match
  while ((match = simpleVariableRegex.exec(template)) !== null) {
    const variable = match[1].trim()
    // Skip control structures
    if (!variable.startsWith('#') && !variable.startsWith('/')) {
      variables.add(variable)
    }
  }

  return Array.from(variables)
}

export function validateTemplate(template: string, data: TemplateData): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  const requiredVariables = extractTemplateVariables(template)
  
  for (const variable of requiredVariables) {
    if (!(variable in data)) {
      errors.push(`Missing required variable: ${variable}`)
    }
  }

  // Check for syntax errors in control structures
  const eachBlocks = template.match(/\{\{#each items\}\}/g) || []
  const eachEndBlocks = template.match(/\{\{\/each\}\}/g) || []
  
  if (eachBlocks.length !== eachEndBlocks.length) {
    errors.push('Mismatched {{#each items}} and {{/each}} blocks')
  }

  const ifBlocks = template.match(/\{\{#if [^}]+\}\}/g) || []
  const ifEndBlocks = template.match(/\{\{\/if\}\}/g) || []
  
  if (ifBlocks.length !== ifEndBlocks.length) {
    errors.push('Mismatched {{#if}} and {{/if}} blocks')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
} 