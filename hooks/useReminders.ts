import { useState, useCallback } from 'react'
import { Invoice } from './useInvoices'

export interface Reminder {
  id: string
  invoiceId: string
  type: 'email' | 'sms' | 'system'
  status: 'scheduled' | 'sent' | 'failed'
  scheduledDate: string
  sentDate: string | null
  message: string
  recipient: string
  attempts: number
  maxAttempts: number
}

export interface ReminderTemplate {
  id: string
  name: string
  subject: string
  body: string
  type: 'email' | 'sms'
  daysBeforeDue: number
}

export const useReminders = (invoices: Invoice[]) => {
  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: "1",
      invoiceId: "2",
      type: 'email',
      status: 'sent',
      scheduledDate: '2024-01-25',
      sentDate: '2024-01-25',
      message: '您的发票 INV-2024-002 即将到期，请及时付款。',
      recipient: 'parent2@example.com',
      attempts: 1,
      maxAttempts: 3
    },
    {
      id: "2",
      invoiceId: "3",
      type: 'sms',
      status: 'sent',
      scheduledDate: '2024-01-26',
      sentDate: '2024-01-26',
      message: '您的发票已逾期，请尽快付款。',
      recipient: '+86-138-0000-0000',
      attempts: 1,
      maxAttempts: 3
    }
  ])

  const [templates, setTemplates] = useState<ReminderTemplate[]>([
    {
      id: 'first-reminder',
      name: '首次提醒',
      subject: '发票到期提醒',
      body: '尊敬的家长，您的发票 {invoiceNumber} 将于 {dueDate} 到期，请及时付款。',
      type: 'email',
      daysBeforeDue: 7
    },
    {
      id: 'final-reminder',
      name: '最终提醒',
      subject: '发票逾期提醒',
      body: '您的发票 {invoiceNumber} 已逾期，请尽快付款以避免额外费用。',
      type: 'email',
      daysBeforeDue: 0
    },
    {
      id: 'sms-reminder',
      name: '短信提醒',
      subject: '',
      body: '您的发票 {invoiceNumber} 即将到期，请及时付款。',
      type: 'sms',
      daysBeforeDue: 3
    }
  ])

  const scheduleReminder = useCallback((invoiceId: string, templateId: string, scheduledDate: string) => {
    const template = templates.find(t => t.id === templateId)
    if (!template) return null

    const invoice = invoices.find(inv => inv.id === invoiceId)
    if (!invoice) return null

    const message = template.body
      .replace('{invoiceNumber}', invoice.invoiceNumber)
      .replace('{dueDate}', invoice.dueDate)

    const newReminder: Reminder = {
      id: Math.max(...reminders.map(r => parseInt(r.id)), 0) + 1 + "",
      invoiceId,
      type: template.type,
      status: 'scheduled',
      scheduledDate,
      sentDate: null,
      message,
      recipient: template.type === 'email' ? invoice.parentEmail || '' : '+86-138-0000-0000',
      attempts: 0,
      maxAttempts: 3
    }

    setReminders(prev => [...prev, newReminder])
    return newReminder
  }, [reminders, templates, invoices])

  const sendReminder = useCallback((reminderId: string) => {
    setReminders(prev => prev.map(reminder => {
      if (reminder.id === reminderId) {
        return {
          ...reminder,
          status: 'sent',
          sentDate: new Date().toISOString().split('T')[0],
          attempts: reminder.attempts + 1
        }
      }
      return reminder
    }))
  }, [])

  const markReminderFailed = useCallback((reminderId: string) => {
    setReminders(prev => prev.map(reminder => {
      if (reminder.id === reminderId) {
        return {
          ...reminder,
          status: 'failed',
          attempts: reminder.attempts + 1
        }
      }
      return reminder
    }))
  }, [])

  const getRemindersByInvoice = useCallback((invoiceId: string) => {
    return reminders.filter(reminder => reminder.invoiceId === invoiceId)
  }, [reminders])

  const getScheduledReminders = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]
    return reminders.filter(reminder => 
      reminder.status === 'scheduled' && reminder.scheduledDate <= today
    )
  }, [reminders])

  const getOverdueInvoicesForReminders = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]
    return invoices.filter(invoice => {
      const isOverdue = invoice.dueDate < today
      const hasPendingReminders = reminders.some(r => 
        r.invoiceId === invoice.id && r.status === 'scheduled'
      )
      return isOverdue && !hasPendingReminders
    })
  }, [invoices, reminders])

  const autoScheduleReminders = useCallback(() => {
    const today = new Date()
    const overdueInvoices = getOverdueInvoicesForReminders()
    
    overdueInvoices.forEach(invoice => {
      // Schedule immediate reminder for overdue invoices
      scheduleReminder(invoice.id, 'final-reminder', today.toISOString().split('T')[0])
    })

    // Schedule upcoming reminders for invoices due soon
    const upcomingInvoices = invoices.filter(invoice => {
      const dueDate = new Date(invoice.dueDate)
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntilDue > 0 && daysUntilDue <= 7
    })

    upcomingInvoices.forEach(invoice => {
      const dueDate = new Date(invoice.dueDate)
      const reminderDate = new Date(dueDate.getTime() - 7 * 24 * 60 * 60 * 1000)
      
      if (reminderDate >= today) {
        scheduleReminder(invoice.id, 'first-reminder', reminderDate.toISOString().split('T')[0])
      }
    })
  }, [invoices, getOverdueInvoicesForReminders, scheduleReminder])

  const getReminderStatistics = useCallback(() => {
    const total = reminders.length
    const sent = reminders.filter(r => r.status === 'sent').length
    const scheduled = reminders.filter(r => r.status === 'scheduled').length
    const failed = reminders.filter(r => r.status === 'failed').length
    
    const emailReminders = reminders.filter(r => r.type === 'email').length
    const smsReminders = reminders.filter(r => r.type === 'sms').length
    
    return {
      total,
      sent,
      scheduled,
      failed,
      emailReminders,
      smsReminders,
      successRate: total > 0 ? (sent / total) * 100 : 0
    }
  }, [reminders])

  const addTemplate = useCallback((template: Omit<ReminderTemplate, 'id'>) => {
    const newTemplate: ReminderTemplate = {
      ...template,
      id: `template-${Date.now()}`
    }
    setTemplates(prev => [...prev, newTemplate])
    return newTemplate
  }, [])

  const updateTemplate = useCallback((templateId: string, updates: Partial<ReminderTemplate>) => {
    setTemplates(prev => prev.map(template => 
      template.id === templateId ? { ...template, ...updates } : template
    ))
  }, [])

  const deleteTemplate = useCallback((templateId: string) => {
    setTemplates(prev => prev.filter(template => template.id !== templateId))
  }, [])

  return {
    reminders,
    templates,
    scheduleReminder,
    sendReminder,
    markReminderFailed,
    getRemindersByInvoice,
    getScheduledReminders,
    getOverdueInvoicesForReminders,
    autoScheduleReminders,
    getReminderStatistics,
    addTemplate,
    updateTemplate,
    deleteTemplate
  }
} 