import { useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import type { ScheduledExport, DetectedOpportunity, ExportTemplate } from '@/lib/types'
import { defaultTemplates, applyTemplate, exportToExcel } from '@/lib/exportUtils'
import { calculateNextRun, shouldRunNow } from '@/lib/scheduleUtils'

export function useScheduledExports(opportunities: DetectedOpportunity[]) {
  const [schedules, setSchedules] = useKV<ScheduledExport[]>('scheduled-exports', [])
  const [customTemplates] = useKV<ExportTemplate[]>('custom-export-templates', [])

  useEffect(() => {
    if (!schedules || schedules.length === 0) return

    const checkInterval = setInterval(() => {
      const now = new Date()

      schedules.forEach((schedule) => {
        if (!shouldRunNow(schedule)) return

        const allTemplates = [...defaultTemplates, ...(customTemplates || [])]
        const template = allTemplates.find((t) => t.id === schedule.templateId)

        if (!template) {
          console.error(`Template ${schedule.templateId} not found for schedule ${schedule.id}`)
          return
        }

        try {
          const { filters, columns } = applyTemplate(template)
          
          const filename = `${schedule.name.replace(/\s+/g, '-').toLowerCase()}-${now.toISOString().split('T')[0]}.xlsx`
          
          exportToExcel(opportunities, filters, columns, filename)

          const nextRun = calculateNextRun(
            schedule.frequency,
            schedule.time,
            schedule.dayOfWeek,
            schedule.dayOfMonth
          )

          setSchedules((current) =>
            (current || []).map((s) =>
              s.id === schedule.id
                ? {
                    ...s,
                    lastRun: now.toISOString(),
                    nextRun: nextRun.toISOString(),
                    updatedAt: now.toISOString(),
                  }
                : s
            )
          )

          toast.success('Scheduled export completed', {
            description: `${schedule.name} has been exported and prepared for delivery`,
          })

          simulateEmailDelivery(schedule.emailRecipients, filename)
        } catch (error) {
          console.error(`Failed to execute scheduled export ${schedule.id}:`, error)
          toast.error('Scheduled export failed', {
            description: `Failed to export ${schedule.name}`,
          })
        }
      })
    }, 60000)

    return () => clearInterval(checkInterval)
  }, [schedules, customTemplates, opportunities, setSchedules])
}

async function simulateEmailDelivery(recipients: string[], filename: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  
  toast.info('Email delivery simulated', {
    description: `Report ${filename} would be sent to ${recipients.length} recipient(s)`,
  })
}
