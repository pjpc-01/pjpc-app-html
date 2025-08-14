import { useState, useCallback, useEffect } from 'react'
import { pb } from '@/lib/pocketbase'
import { Invoice } from './useInvoices'

export interface Reminder {
  id: string
  invoiceId: string
  studentId?: string
  reminderType: 'payment_due' | 'payment_overdue' | 'payment_confirmation' | 'receipt_sent'
  status: 'scheduled' | 'sent' | 'failed'
  scheduledDate: string
  sentDate?: string
  channel: 'email' | 'sms' | 'whatsapp' | 'system'
  recipient: string
  subject?: string
  message: string
  attempts: number
  maxAttempts: number
  notes?: string
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
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  // Authentication function
  const authenticate = useCallback(async () => {
    try {
      // Check if already authenticated
      if (pb.authStore.isValid) {
        return true
      }

      // Try to authenticate with admin credentials
      await pb.collection('users').authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
      console.log('✅ Authentication successful for reminders')
      return true
    } catch (authError) {
      console.error('❌ Authentication failed for reminders:', authError)
      setError('Authentication failed. Please check your credentials.')
      return false
    }
  }, [])

  // Load reminders from PocketBase
  useEffect(() => {
    const loadReminders = async () => {
      try {
        setLoading(true)
        setError(null)

        // Authenticate first
        const isAuthenticated = await authenticate()
        if (!isAuthenticated) {
          setLoading(false)
          return
        }

        const records = await pb.collection('reminders').getFullList({
          sort: '-scheduledDate',
          expand: 'invoiceId'
        })
        
        const mapped: Reminder[] = records.map((r: any) => ({
          id: r.id,
          invoiceId: r.invoiceId,
          studentId: r.studentId || r.expand?.invoiceId?.studentId,
          reminderType: r.reminderType,
          status: r.status,
          scheduledDate: r.scheduledDate,
          sentDate: r.sentDate,
          channel: r.channel,
          recipient: r.recipient,
          subject: r.subject,
          message: r.message,
          attempts: r.attempts || 0,
          maxAttempts: r.maxAttempts || 3,
          notes: r.notes
        }))
        
        setReminders(mapped)
        setError(null)
      } catch (err: any) {
        console.error('Failed to load reminders from PocketBase:', err)
        
        // Handle authentication errors
        if (err.status === 403) {
          setError('Access denied. Please check your permissions.')
        } else if (err.status === 401) {
          setError('Authentication required. Please log in.')
        } else {
          setError('Failed to load reminders: ' + (err.message || 'Unknown error'))
        }
        
        // Fallback to sample data if PocketBase is not available
        setReminders([
          {
            id: "1",
            invoiceId: "2",
            studentId: "2",
            reminderType: 'payment_due',
            status: 'sent',
            scheduledDate: '2024-01-25',
            sentDate: '2024-01-25',
            channel: 'email',
            recipient: 'parent2@example.com',
            subject: '发票到期提醒',
            message: '您的发票 INV-2024-002 即将到期，请及时付款。',
            attempts: 1,
            maxAttempts: 3
          },
          {
            id: "2",
            invoiceId: "3",
            studentId: "3",
            reminderType: 'payment_overdue',
            status: 'sent',
            scheduledDate: '2024-01-26',
            sentDate: '2024-01-26',
            channel: 'sms',
            recipient: '+86-138-0000-0000',
            subject: '发票逾期提醒',
            message: '您的发票已逾期，请尽快付款。',
            attempts: 1,
            maxAttempts: 3
          }
        ])
      } finally {
        setLoading(false)
      }
    }
    
    loadReminders()
  }, [authenticate])

  const scheduleReminder = useCallback(async (invoiceId: string, templateId: string, scheduledDate: string) => {
    try {
      // Ensure authentication
      const isAuthenticated = await authenticate()
      if (!isAuthenticated) {
        throw new Error('Authentication required')
      }

      const template = templates.find(t => t.id === templateId)
      if (!template) return null

      const invoice = invoices.find(inv => inv.id === invoiceId)
      if (!invoice) return null

      const message = template.body
        .replace('{invoiceNumber}', invoice.invoiceNumber)
        .replace('{dueDate}', invoice.dueDate)

      const reminderData = {
        invoiceId,
        studentId: invoice.studentId,
        reminderType: (template.type === 'email' ? 'payment_due' : 'payment_overdue') as 'payment_due' | 'payment_overdue' | 'payment_confirmation' | 'receipt_sent',
        status: 'scheduled' as const,
        scheduledDate,
        channel: template.type,
        recipient: invoice.parentEmail || (template.type === 'email' ? 'parent@example.com' : '+86-138-0000-0000'),
        subject: template.subject,
        message,
        attempts: 0,
        maxAttempts: 3
      }

      const created = await pb.collection('reminders').create(reminderData)
      
      const newReminder: Reminder = {
        ...reminderData,
        id: created.id
      }

      setReminders(prev => [...prev, newReminder])
      return newReminder
    } catch (err: any) {
      console.error('Failed to schedule reminder:', err)
      if (err.status === 403) {
        throw new Error('Access denied. Please check your permissions.')
      }
      throw err
    }
  }, [templates, invoices, authenticate])

  const sendReminder = useCallback(async (reminderId: string) => {
    try {
      // Ensure authentication
      const isAuthenticated = await authenticate()
      if (!isAuthenticated) {
        throw new Error('Authentication required')
      }

      await pb.collection('reminders').update(reminderId, {
        status: 'sent',
        sentDate: new Date().toISOString().split('T')[0],
        attempts: (reminders.find(r => r.id === reminderId)?.attempts || 0) + 1
      })
      
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
    } catch (err: any) {
      console.error('Failed to send reminder:', err)
      if (err.status === 403) {
        throw new Error('Access denied. Please check your permissions.')
      }
      throw err
    }
  }, [reminders, authenticate])

  const markReminderFailed = useCallback(async (reminderId: string) => {
    try {
      // Ensure authentication
      const isAuthenticated = await authenticate()
      if (!isAuthenticated) {
        throw new Error('Authentication required')
      }

      await pb.collection('reminders').update(reminderId, {
        status: 'failed',
        attempts: (reminders.find(r => r.id === reminderId)?.attempts || 0) + 1
      })
      
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
    } catch (err: any) {
      console.error('Failed to mark reminder as failed:', err)
      if (err.status === 403) {
        throw new Error('Access denied. Please check your permissions.')
      }
      throw err
    }
  }, [reminders, authenticate])

  const getRemindersByInvoice = useCallback((invoiceId: string) => {
    return reminders.filter(reminder => reminder.invoiceId === invoiceId)
  }, [reminders])

  const getRemindersByStudent = useCallback((studentId: string) => {
    return reminders.filter(reminder => reminder.studentId === studentId)
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

  const autoScheduleReminders = useCallback(async () => {
    try {
      // Ensure authentication
      const isAuthenticated = await authenticate()
      if (!isAuthenticated) {
        throw new Error('Authentication required')
      }

      const today = new Date()
      const overdueInvoices = getOverdueInvoicesForReminders()
      
      for (const invoice of overdueInvoices) {
        // Schedule immediate reminder for overdue invoices
        await scheduleReminder(invoice.id, 'final-reminder', today.toISOString().split('T')[0])
      }

      // Schedule upcoming reminders for invoices due soon
      const upcomingInvoices = invoices.filter(invoice => {
        const dueDate = new Date(invoice.dueDate)
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        return daysUntilDue > 0 && daysUntilDue <= 7
      })

      for (const invoice of upcomingInvoices) {
        const dueDate = new Date(invoice.dueDate)
        const reminderDate = new Date(dueDate.getTime() - 7 * 24 * 60 * 60 * 1000)
        
        if (reminderDate >= today) {
          await scheduleReminder(invoice.id, 'first-reminder', reminderDate.toISOString().split('T')[0])
        }
      }
    } catch (err: any) {
      console.error('Failed to auto-schedule reminders:', err)
      if (err.status === 403) {
        throw new Error('Access denied. Please check your permissions.')
      }
      throw err
    }
  }, [invoices, getOverdueInvoicesForReminders, scheduleReminder, authenticate])

  const getReminderStatistics = useCallback(() => {
    const total = reminders.length
    const sent = reminders.filter(r => r.status === 'sent').length
    const scheduled = reminders.filter(r => r.status === 'scheduled').length
    const failed = reminders.filter(r => r.status === 'failed').length
    
    const emailReminders = reminders.filter(r => r.channel === 'email').length
    const smsReminders = reminders.filter(r => r.channel === 'sms').length
    const whatsappReminders = reminders.filter(r => r.channel === 'whatsapp').length
    
    return {
      total,
      sent,
      scheduled,
      failed,
      emailReminders,
      smsReminders,
      whatsappReminders,
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
    loading,
    error,
    templates,
    scheduleReminder,
    sendReminder,
    markReminderFailed,
    getRemindersByInvoice,
    getRemindersByStudent,
    getScheduledReminders,
    getOverdueInvoicesForReminders,
    autoScheduleReminders,
    getReminderStatistics,
    addTemplate,
    updateTemplate,
    deleteTemplate
  }
} 