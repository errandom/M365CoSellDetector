import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CheckCircle, FloppyDisk, Plus, Trash } from '@phosphor-icons/react'
import { defaultTemplates, applyTemplate, createTemplateFromCurrent } from '@/lib/exportUtils'
import type { ExportTemplate } from '@/lib/types'
import type { ExportFilters, ExportColumn } from '@/lib/exportUtils'

interface TemplateSelectorProps {
  currentFilters: ExportFilters
  currentColumns: ExportColumn[]
  onApplyTemplate: (filters: ExportFilters, columns: ExportColumn[]) => void
}

export function TemplateSelector({ currentFilters, currentColumns, onApplyTemplate }: TemplateSelectorProps) {
  const [customTemplates, setCustomTemplates] = useKV<ExportTemplate[]>('export-templates', [])
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  const allTemplates = [...defaultTemplates, ...(customTemplates || [])]

  const handleApplyTemplate = (templateId: string) => {
    const template = allTemplates.find(t => t.id === templateId)
    if (template) {
      const { filters, columns } = applyTemplate(template)
      onApplyTemplate(filters, columns)
      setSelectedTemplate(templateId)
    }
  }

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return

    const newTemplate: ExportTemplate = {
      id: `custom-${Date.now()}`,
      ...createTemplateFromCurrent(templateName.trim(), templateDescription.trim(), currentFilters, currentColumns),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setCustomTemplates((current) => [...(current || []), newTemplate])
    setTemplateName('')
    setTemplateDescription('')
    setSaveDialogOpen(false)
  }

  const handleDeleteTemplate = (templateId: string) => {
    setCustomTemplates((current) => (current || []).filter(t => t.id !== templateId))
    if (selectedTemplate === templateId) {
      setSelectedTemplate(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Export Templates</h3>
          <p className="text-sm text-muted-foreground">
            Quick presets for common reporting needs
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setSaveDialogOpen(true)}>
          <Plus size={16} />
          Save Current
        </Button>
      </div>

      <ScrollArea className="h-[280px]">
        <div className="grid grid-cols-1 gap-3 pr-4">
          {allTemplates.map(template => (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all hover:border-primary ${
                selectedTemplate === template.id ? 'border-primary bg-accent/5' : ''
              }`}
              onClick={() => handleApplyTemplate(template.id)}
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm">{template.name}</CardTitle>
                      {template.isDefault && (
                        <Badge variant="secondary" className="text-xs">Built-in</Badge>
                      )}
                      {selectedTemplate === template.id && (
                        <CheckCircle size={16} weight="fill" className="text-primary" />
                      )}
                    </div>
                    <CardDescription className="text-xs mt-1">
                      {template.description}
                    </CardDescription>
                  </div>
                  {!template.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteTemplate(template.id)
                      }}
                    >
                      <Trash size={14} />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="flex flex-wrap gap-1.5">
                  {template.filters.status.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {template.filters.status.length} status filter{template.filters.status.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                  {template.filters.communicationType.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {template.filters.communicationType.length} source{template.filters.communicationType.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                  {template.filters.minConfidence && template.filters.minConfidence > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {Math.round(template.filters.minConfidence * 100)}% min confidence
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {template.columns.length} column{template.columns.length > 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FloppyDisk size={20} />
              Save Export Template
            </DialogTitle>
            <DialogDescription>
              Save your current filters and column selection as a reusable template
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Q4 Partner Review"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Brief description of what this template is used for..."
                className="mt-2"
                rows={3}
              />
            </div>

            <div className="p-3 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">Current Configuration:</p>
              <div className="flex flex-wrap gap-1.5">
                {currentFilters.status.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {currentFilters.status.length} status filter{currentFilters.status.length > 1 ? 's' : ''}
                  </Badge>
                )}
                {currentFilters.communicationType.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {currentFilters.communicationType.length} source{currentFilters.communicationType.length > 1 ? 's' : ''}
                  </Badge>
                )}
                {currentFilters.minConfidence && currentFilters.minConfidence > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(currentFilters.minConfidence * 100)}% min confidence
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs">
                  {currentColumns.filter(c => c.enabled).length} column{currentColumns.filter(c => c.enabled).length > 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} disabled={!templateName.trim()}>
              <FloppyDisk size={16} />
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
