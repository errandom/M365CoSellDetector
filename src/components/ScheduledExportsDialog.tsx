import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import {
  Plus,
  Trash,
  PencilSimple,
  Clock,
  Envelope,
  CalendarBlank,
  Check,
  X,
} from '@phosphor-icons/react'
import type {
  ScheduledExport,
  ScheduleFrequency,
  ScheduleDay,
  ExportTemplate,
} from '@/lib/types'
import { defaultTemplates } from '@/lib/exportUtils'
import {
  calculateNextRun,
  formatNextRun,
  validateSchedule,
  getScheduleDescription,
} from '@/lib/scheduleUtils'

interface ScheduledExportsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ScheduledExportsDialog({ open, onOpenChange }: ScheduledExportsDialogProps) {
  const [schedules, setSchedules] = useKV<ScheduledExport[]>('scheduled-exports', [])
  const [customTemplates, setCustomTemplates] = useKV<ExportTemplate[]>('custom-export-templates', [])
  const [editingSchedule, setEditingSchedule] = useState<Partial<ScheduledExport> | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const allTemplates = [...defaultTemplates, ...(customTemplates || [])]

  const handleCreate = () => {
    const newSchedule: Partial<ScheduledExport> = {
      name: '',
      templateId: defaultTemplates[0].id,
      frequency: 'weekly',
      dayOfWeek: 'monday',
      time: '09:00',
      emailRecipients: [],
      enabled: true,
    }
    setEditingSchedule(newSchedule)
    setIsCreating(true)
  }

  const handleEdit = (schedule: ScheduledExport) => {
    setEditingSchedule({ ...schedule })
    setIsCreating(false)
  }

  const handleSave = () => {
    if (!editingSchedule) return

    const errors = validateSchedule(editingSchedule)
    if (errors.length > 0) {
      toast.error('Validation failed', {
        description: errors[0],
      })
      return
    }

    const now = new Date().toISOString()
    const nextRun = calculateNextRun(
      editingSchedule.frequency!,
      editingSchedule.time!,
      editingSchedule.dayOfWeek,
      editingSchedule.dayOfMonth
    )

    if (isCreating) {
      const newSchedule: ScheduledExport = {
        id: `schedule-${Date.now()}`,
        name: editingSchedule.name!,
        templateId: editingSchedule.templateId!,
        frequency: editingSchedule.frequency!,
        dayOfWeek: editingSchedule.dayOfWeek,
        dayOfMonth: editingSchedule.dayOfMonth,
        time: editingSchedule.time!,
        emailRecipients: editingSchedule.emailRecipients!,
        enabled: editingSchedule.enabled ?? true,
        nextRun: nextRun.toISOString(),
        createdAt: now,
        updatedAt: now,
      }

      setSchedules((current) => [...(current || []), newSchedule])
      toast.success('Schedule created', {
        description: `Next run: ${formatNextRun(nextRun)}`,
      })
    } else {
      setSchedules((current) =>
        (current || []).map((s) =>
          s.id === editingSchedule.id
            ? {
                ...s,
                ...editingSchedule,
                nextRun: nextRun.toISOString(),
                updatedAt: now,
              }
            : s
        )
      )
      toast.success('Schedule updated')
    }

    setEditingSchedule(null)
    setIsCreating(false)
  }

  const handleDelete = (id: string) => {
    setSchedules((current) => (current || []).filter((s) => s.id !== id))
    toast.success('Schedule deleted')
  }

  const handleToggle = (id: string, enabled: boolean) => {
    setSchedules((current) =>
      (current || []).map((s) =>
        s.id === id
          ? {
              ...s,
              enabled,
              updatedAt: new Date().toISOString(),
            }
          : s
      )
    )
    toast.success(enabled ? 'Schedule enabled' : 'Schedule disabled')
  }

  const handleCancel = () => {
    setEditingSchedule(null)
    setIsCreating(false)
  }

  const handleAddRecipient = (email: string) => {
    if (!editingSchedule) return
    if (editingSchedule.emailRecipients?.includes(email)) return

    setEditingSchedule({
      ...editingSchedule,
      emailRecipients: [...(editingSchedule.emailRecipients || []), email],
    })
  }

  const handleRemoveRecipient = (email: string) => {
    if (!editingSchedule) return

    setEditingSchedule({
      ...editingSchedule,
      emailRecipients: (editingSchedule.emailRecipients || []).filter((e) => e !== email),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock size={24} className="text-primary" />
            Scheduled Exports
          </DialogTitle>
          <DialogDescription>
            Automatically export and email reports on a recurring schedule
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 h-[calc(90vh-200px)]">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Active Schedules</h3>
              <Button onClick={handleCreate} size="sm">
                <Plus size={16} />
                New Schedule
              </Button>
            </div>

            <ScrollArea className="h-[calc(100%-60px)]">
              {!schedules || schedules.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No scheduled exports yet</p>
                  <p className="text-xs mt-2">Create one to automate your reporting</p>
                </div>
              ) : (
                <div className="space-y-3 pr-4">
                  {schedules.map((schedule) => {
                    const template = allTemplates.find((t) => t.id === schedule.templateId)
                    return (
                      <div
                        key={schedule.id}
                        className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm">{schedule.name}</h4>
                              <Badge
                                variant={schedule.enabled ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {schedule.enabled ? 'Active' : 'Paused'}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              {getScheduleDescription(schedule)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Template: <span className="font-medium">{template?.name}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={schedule.enabled}
                              onCheckedChange={(checked) => handleToggle(schedule.id, checked)}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(schedule)}
                            >
                              <PencilSimple size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(schedule.id)}
                            >
                              <Trash size={16} className="text-destructive" />
                            </Button>
                          </div>
                        </div>

                        <Separator className="my-2" />

                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Envelope size={14} />
                              <span>{schedule.emailRecipients.length} recipient(s)</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <CalendarBlank size={14} />
                              <span>Next: {formatNextRun(schedule.nextRun)}</span>
                            </div>
                          </div>
                          {schedule.lastRun && (
                            <span className="text-muted-foreground">
                              Last run: {new Date(schedule.lastRun).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {editingSchedule && (
            <>
              <Separator orientation="vertical" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold">
                    {isCreating ? 'New Schedule' : 'Edit Schedule'}
                  </h3>
                  <Button variant="ghost" size="sm" onClick={handleCancel}>
                    <X size={16} />
                  </Button>
                </div>

                <ScrollArea className="h-[calc(100%-100px)]">
                  <div className="space-y-4 pr-4">
                    <div>
                      <Label htmlFor="schedule-name">Schedule Name</Label>
                      <Input
                        id="schedule-name"
                        value={editingSchedule.name || ''}
                        onChange={(e) =>
                          setEditingSchedule({ ...editingSchedule, name: e.target.value })
                        }
                        placeholder="Weekly Partner Report"
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="template">Export Template</Label>
                      <Select
                        value={editingSchedule.templateId}
                        onValueChange={(value) =>
                          setEditingSchedule({ ...editingSchedule, templateId: value })
                        }
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {allTemplates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="frequency">Frequency</Label>
                      <Select
                        value={editingSchedule.frequency}
                        onValueChange={(value: ScheduleFrequency) => {
                          const updates: Partial<ScheduledExport> = {
                            ...editingSchedule,
                            frequency: value,
                          }
                          if (value === 'weekly' && !editingSchedule.dayOfWeek) {
                            updates.dayOfWeek = 'monday'
                          }
                          if (value === 'monthly' && !editingSchedule.dayOfMonth) {
                            updates.dayOfMonth = 1
                          }
                          setEditingSchedule(updates)
                        }}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {editingSchedule.frequency === 'weekly' && (
                      <div>
                        <Label htmlFor="day-of-week">Day of Week</Label>
                        <Select
                          value={editingSchedule.dayOfWeek}
                          onValueChange={(value: ScheduleDay) =>
                            setEditingSchedule({ ...editingSchedule, dayOfWeek: value })
                          }
                        >
                          <SelectTrigger className="mt-1.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monday">Monday</SelectItem>
                            <SelectItem value="tuesday">Tuesday</SelectItem>
                            <SelectItem value="wednesday">Wednesday</SelectItem>
                            <SelectItem value="thursday">Thursday</SelectItem>
                            <SelectItem value="friday">Friday</SelectItem>
                            <SelectItem value="saturday">Saturday</SelectItem>
                            <SelectItem value="sunday">Sunday</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {editingSchedule.frequency === 'monthly' && (
                      <div>
                        <Label htmlFor="day-of-month">Day of Month</Label>
                        <Input
                          id="day-of-month"
                          type="number"
                          min={1}
                          max={31}
                          value={editingSchedule.dayOfMonth || 1}
                          onChange={(e) =>
                            setEditingSchedule({
                              ...editingSchedule,
                              dayOfMonth: parseInt(e.target.value),
                            })
                          }
                          className="mt-1.5"
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={editingSchedule.time || '09:00'}
                        onChange={(e) =>
                          setEditingSchedule({ ...editingSchedule, time: e.target.value })
                        }
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email-recipient">Email Recipients</Label>
                      <div className="flex gap-2 mt-1.5">
                        <Input
                          id="email-recipient"
                          type="email"
                          placeholder="user@example.com"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              const input = e.currentTarget
                              if (input.value.trim()) {
                                handleAddRecipient(input.value.trim())
                                input.value = ''
                              }
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            const input = document.getElementById(
                              'email-recipient'
                            ) as HTMLInputElement
                            if (input?.value.trim()) {
                              handleAddRecipient(input.value.trim())
                              input.value = ''
                            }
                          }}
                        >
                          <Plus size={16} />
                        </Button>
                      </div>
                      {editingSchedule.emailRecipients &&
                        editingSchedule.emailRecipients.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {editingSchedule.emailRecipients.map((email) => (
                              <Badge key={email} variant="secondary" className="gap-1">
                                {email}
                                <button
                                  onClick={() => handleRemoveRecipient(email)}
                                  className="hover:text-destructive"
                                >
                                  <X size={12} />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                </ScrollArea>

                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button onClick={handleSave} className="flex-1">
                    <Check size={16} />
                    {isCreating ? 'Create Schedule' : 'Save Changes'}
                  </Button>
                  <Button onClick={handleCancel} variant="outline">
                    Cancel
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
