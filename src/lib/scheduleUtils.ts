import type { ScheduledExport, ScheduleFrequency, ScheduleDay } from './types'

export function calculateNextRun(
  frequency: ScheduleFrequency,
  time: string,
  dayOfWeek?: ScheduleDay,
  dayOfMonth?: number
): Date {
  const [hours, minutes] = time.split(':').map(Number)
  const now = new Date()
  let nextRun = new Date()
  
  nextRun.setHours(hours, minutes, 0, 0)
  
  switch (frequency) {
    case 'daily':
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1)
      }
      break
      
    case 'weekly':
      if (dayOfWeek) {
        const dayMap: Record<ScheduleDay, number> = {
          sunday: 0,
          monday: 1,
          tuesday: 2,
          wednesday: 3,
          thursday: 4,
          friday: 5,
          saturday: 6,
        }
        
        const targetDay = dayMap[dayOfWeek]
        const currentDay = nextRun.getDay()
        let daysToAdd = targetDay - currentDay
        
        if (daysToAdd < 0 || (daysToAdd === 0 && nextRun <= now)) {
          daysToAdd += 7
        }
        
        nextRun.setDate(nextRun.getDate() + daysToAdd)
      }
      break
      
    case 'monthly':
      if (dayOfMonth) {
        nextRun.setDate(dayOfMonth)
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1)
        }
        
        while (nextRun.getDate() !== dayOfMonth) {
          nextRun.setDate(0)
          nextRun.setMonth(nextRun.getMonth() + 1)
          nextRun.setDate(Math.min(dayOfMonth, nextRun.getDate()))
        }
      }
      break
  }
  
  return nextRun
}

export function formatNextRun(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  if (diffDays === 0 && diffHours < 24) {
    if (diffHours === 0) {
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      return `in ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`
    }
    return `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`
  }
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays < 7) return `in ${diffDays} days`
  
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function validateSchedule(schedule: Partial<ScheduledExport>): string[] {
  const errors: string[] = []
  
  if (!schedule.name || schedule.name.trim() === '') {
    errors.push('Schedule name is required')
  }
  
  if (!schedule.templateId) {
    errors.push('Export template is required')
  }
  
  if (!schedule.time || !/^\d{2}:\d{2}$/.test(schedule.time)) {
    errors.push('Valid time is required (HH:MM)')
  }
  
  if (!schedule.emailRecipients || schedule.emailRecipients.length === 0) {
    errors.push('At least one email recipient is required')
  }
  
  if (schedule.emailRecipients) {
    const invalidEmails = schedule.emailRecipients.filter(email => {
      return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    })
    if (invalidEmails.length > 0) {
      errors.push(`Invalid email address: ${invalidEmails.join(', ')}`)
    }
  }
  
  if (schedule.frequency === 'weekly' && !schedule.dayOfWeek) {
    errors.push('Day of week is required for weekly schedules')
  }
  
  if (schedule.frequency === 'monthly' && !schedule.dayOfMonth) {
    errors.push('Day of month is required for monthly schedules')
  }
  
  if (schedule.dayOfMonth && (schedule.dayOfMonth < 1 || schedule.dayOfMonth > 31)) {
    errors.push('Day of month must be between 1 and 31')
  }
  
  return errors
}

export function shouldRunNow(schedule: ScheduledExport): boolean {
  if (!schedule.enabled) return false
  
  const now = new Date()
  const nextRun = new Date(schedule.nextRun)
  
  return now >= nextRun
}

export async function executeScheduledExport(
  scheduleId: string,
  exportFunction: () => Promise<void>
): Promise<void> {
  try {
    await exportFunction()
  } catch (error) {
    console.error(`Failed to execute scheduled export ${scheduleId}:`, error)
    throw error
  }
}

export function getScheduleDescription(schedule: ScheduledExport): string {
  const parts: string[] = []
  
  switch (schedule.frequency) {
    case 'daily':
      parts.push('Daily')
      break
    case 'weekly':
      parts.push(`Weekly on ${schedule.dayOfWeek ? schedule.dayOfWeek.charAt(0).toUpperCase() + schedule.dayOfWeek.slice(1) + 's' : 'weekdays'}`)
      break
    case 'monthly':
      parts.push(`Monthly on day ${schedule.dayOfMonth}`)
      break
  }
  
  parts.push(`at ${schedule.time}`)
  
  return parts.join(' ')
}
