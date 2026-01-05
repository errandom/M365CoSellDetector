import { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { CalendarBlank, Download, Funnel, Notebook } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { DetectedOpportunity, OpportunityStatus, CommunicationType } from '@/lib/types'
import { 
  exportToExcel, 
  applyFilters, 
  getUniquePartners, 
  getUniqueCustomers,
  defaultColumns,
  type ExportFilters,
  type ExportColumn
} from '@/lib/exportUtils'
import { TemplateSelector } from '@/components/TemplateSelector'

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  opportunities: DetectedOpportunity[]
}

const statusOptions: { value: OpportunityStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'review', label: 'In Review' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'synced', label: 'Synced' },
  { value: 'rejected', label: 'Rejected' },
]

const sourceOptions: { value: CommunicationType; label: string }[] = [
  { value: 'email', label: 'Email' },
  { value: 'chat', label: 'Chat' },
  { value: 'meeting', label: 'Meeting' },
]

export function ExportDialog({ open, onOpenChange, opportunities }: ExportDialogProps) {
  const [filters, setFilters] = useState<ExportFilters>({
    status: [],
    communicationType: [],
  })
  const [columns, setColumns] = useState<ExportColumn[]>(defaultColumns)
  const [dateFrom, setDateFrom] = useState<Date | undefined>()
  const [dateTo, setDateTo] = useState<Date | undefined>()
  const [minConfidence, setMinConfidence] = useState<number>(0)
  const [selectedPartners, setSelectedPartners] = useState<string[]>([])
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])

  const availablePartners = useMemo(() => getUniquePartners(opportunities), [opportunities])
  const availableCustomers = useMemo(() => getUniqueCustomers(opportunities), [opportunities])

  const currentFilters = useMemo((): ExportFilters => ({
    ...filters,
    dateFrom,
    dateTo,
    minConfidence,
    partners: selectedPartners,
    customers: selectedCustomers,
  }), [filters, dateFrom, dateTo, minConfidence, selectedPartners, selectedCustomers])

  const filteredCount = useMemo(() => 
    applyFilters(opportunities, currentFilters).length,
    [opportunities, currentFilters]
  )

  const toggleStatus = (status: OpportunityStatus) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status]
    }))
  }

  const toggleSourceType = (type: CommunicationType) => {
    setFilters(prev => ({
      ...prev,
      communicationType: prev.communicationType.includes(type)
        ? prev.communicationType.filter(t => t !== type)
        : [...prev.communicationType, type]
    }))
  }

  const toggleColumn = (field: ExportColumn['field']) => {
    setColumns(prev =>
      prev.map(col =>
        col.field === field ? { ...col, enabled: !col.enabled } : col
      )
    )
  }

  const togglePartner = (partner: string) => {
    setSelectedPartners(prev =>
      prev.includes(partner)
        ? prev.filter(p => p !== partner)
        : [...prev, partner]
    )
  }

  const toggleCustomer = (customer: string) => {
    setSelectedCustomers(prev =>
      prev.includes(customer)
        ? prev.filter(c => c !== customer)
        : [...prev, customer]
    )
  }

  const clearAllFilters = () => {
    setFilters({ status: [], communicationType: [] })
    setDateFrom(undefined)
    setDateTo(undefined)
    setMinConfidence(0)
    setSelectedPartners([])
    setSelectedCustomers([])
  }

  const handleApplyTemplate = (templateFilters: ExportFilters, templateColumns: ExportColumn[]) => {
    setFilters({
      status: templateFilters.status,
      communicationType: templateFilters.communicationType,
    })
    setMinConfidence(templateFilters.minConfidence || 0)
    setColumns(templateColumns)
  }

  const handleExport = () => {
    exportToExcel(opportunities, currentFilters, columns)
    onOpenChange(false)
  }

  const activeFilterCount = 
    filters.status.length +
    filters.communicationType.length +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0) +
    (minConfidence > 0 ? 1 : 0) +
    selectedPartners.length +
    selectedCustomers.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download size={20} />
            Export to Excel
          </DialogTitle>
          <DialogDescription>
            Customize filters and columns for your export
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="templates" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Notebook size={16} />
              Templates
            </TabsTrigger>
            <TabsTrigger value="filters" className="flex items-center gap-2">
              <Funnel size={16} />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                  {activeFilterCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="columns">Columns</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="flex-1 overflow-hidden mt-4">
            <TemplateSelector
              currentFilters={currentFilters}
              currentColumns={columns}
              onApplyTemplate={handleApplyTemplate}
            />
          </TabsContent>

          <TabsContent value="filters" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-base font-semibold">Status</Label>
                    {filters.status.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilters(prev => ({ ...prev, status: [] }))}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {statusOptions.map(option => (
                      <Badge
                        key={option.value}
                        variant={filters.status.includes(option.value) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleStatus(option.value)}
                      >
                        {option.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-base font-semibold">Source Type</Label>
                    {filters.communicationType.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilters(prev => ({ ...prev, communicationType: [] }))}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sourceOptions.map(option => (
                      <Badge
                        key={option.value}
                        variant={filters.communicationType.includes(option.value) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleSourceType(option.value)}
                      >
                        {option.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-base font-semibold mb-3 block">Date Range</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">From</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !dateFrom && 'text-muted-foreground'
                            )}
                          >
                            <CalendarBlank size={16} className="mr-2" />
                            {dateFrom ? format(dateFrom, 'PPP') : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dateFrom}
                            onSelect={setDateFrom}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">To</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !dateTo && 'text-muted-foreground'
                            )}
                          >
                            <CalendarBlank size={16} className="mr-2" />
                            {dateTo ? format(dateTo, 'PPP') : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dateTo}
                            onSelect={setDateTo}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Minimum Confidence: {Math.round(minConfidence * 100)}%
                  </Label>
                  <Input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={minConfidence * 100}
                    onChange={(e) => setMinConfidence(parseInt(e.target.value) / 100)}
                    className="w-full"
                  />
                </div>

                {availablePartners.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-base font-semibold">Partners</Label>
                        {selectedPartners.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedPartners([])}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {availablePartners.map(partner => (
                          <div key={partner} className="flex items-center gap-2">
                            <Checkbox
                              id={`partner-${partner}`}
                              checked={selectedPartners.includes(partner)}
                              onCheckedChange={() => togglePartner(partner)}
                            />
                            <Label
                              htmlFor={`partner-${partner}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {partner}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {availableCustomers.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-base font-semibold">Customers</Label>
                        {selectedCustomers.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCustomers([])}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {availableCustomers.map(customer => (
                          <div key={customer} className="flex items-center gap-2">
                            <Checkbox
                              id={`customer-${customer}`}
                              checked={selectedCustomers.includes(customer)}
                              onCheckedChange={() => toggleCustomer(customer)}
                            />
                            <Label
                              htmlFor={`customer-${customer}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {customer}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="columns" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {columns.map(column => (
                  <div key={column.field} className="flex items-center gap-2">
                    <Checkbox
                      id={`column-${column.field}`}
                      checked={column.enabled}
                      onCheckedChange={() => toggleColumn(column.field)}
                    />
                    <Label
                      htmlFor={`column-${column.field}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {column.label}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {filteredCount} of {opportunities.length} opportunities will be exported
            </p>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Clear All Filters
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={filteredCount === 0}>
              <Download size={16} />
              Export Excel
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
