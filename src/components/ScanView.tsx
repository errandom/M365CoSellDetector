import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MagnifyingGlass, Calendar as CalendarIcon, Envelope, ChatCircle, Video, Plus, X, Tag } from '@phosphor-icons/react'
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfYear } from 'date-fns'
import type { CommunicationType } from '@/lib/types'

interface ScanViewProps {
  onStartScan: (config: {
    dateRange: { from: Date; to: Date }
    sources: CommunicationType[]
    keywords: string[]
  }) => void
  isScanning: boolean
}

type DatePreset = {
  label: string
  getValue: () => { from: Date; to: Date }
}

const DEFAULT_KEYWORDS = ['co-sell', 'partner', 'joint opportunity', 'collaboration', 'partnership', 'referral']

const DATE_PRESETS: DatePreset[] = [
  {
    label: 'Last 7 days',
    getValue: () => ({ from: subDays(new Date(), 7), to: new Date() })
  },
  {
    label: 'Last 14 days',
    getValue: () => ({ from: subDays(new Date(), 14), to: new Date() })
  },
  {
    label: 'Last 30 days',
    getValue: () => ({ from: subDays(new Date(), 30), to: new Date() })
  },
  {
    label: 'Last 60 days',
    getValue: () => ({ from: subDays(new Date(), 60), to: new Date() })
  },
  {
    label: 'Last 90 days',
    getValue: () => ({ from: subDays(new Date(), 90), to: new Date() })
  },
  {
    label: 'This month',
    getValue: () => ({ from: startOfMonth(new Date()), to: new Date() })
  },
  {
    label: 'Last month',
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1)
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) }
    }
  },
  {
    label: 'This year',
    getValue: () => ({ from: startOfYear(new Date()), to: new Date() })
  }
]

export function ScanView({ onStartScan, isScanning }: ScanViewProps) {
  const [dateFrom, setDateFrom] = useState<Date>(subDays(new Date(), 30))
  const [dateTo, setDateTo] = useState<Date>(new Date())
  const [selectedSources, setSelectedSources] = useState<CommunicationType[]>(['email', 'chat', 'meeting'])
  const [savedKeywords, setSavedKeywords] = useKV<string[]>('scan-keywords', DEFAULT_KEYWORDS)
  const [keywords, setKeywords] = useState<string[]>(DEFAULT_KEYWORDS)
  const [newKeyword, setNewKeyword] = useState('')
  const [selectedPreset, setSelectedPreset] = useState<string>('Last 30 days')
  
  useEffect(() => {
    if (savedKeywords && savedKeywords.length > 0) {
      setKeywords(savedKeywords)
    }
  }, [savedKeywords])
  
  const toggleSource = (source: CommunicationType) => {
    setSelectedSources(prev =>
      prev.includes(source)
        ? prev.filter(s => s !== source)
        : [...prev, source]
    )
  }
  
  const applyDatePreset = (preset: DatePreset) => {
    const { from, to } = preset.getValue()
    setDateFrom(from)
    setDateTo(to)
    setSelectedPreset(preset.label)
  }
  
  const addKeyword = () => {
    const trimmed = newKeyword.trim().toLowerCase()
    if (trimmed && !keywords.includes(trimmed)) {
      const newKeywords = [...keywords, trimmed]
      setKeywords(newKeywords)
      setSavedKeywords(newKeywords)
      setNewKeyword('')
    }
  }
  
  const removeKeyword = (keyword: string) => {
    const newKeywords = keywords.filter(k => k !== keyword)
    setKeywords(newKeywords)
    setSavedKeywords(newKeywords)
  }
  
  const resetKeywords = () => {
    setKeywords(DEFAULT_KEYWORDS)
    setSavedKeywords(DEFAULT_KEYWORDS)
  }
  
  const handleStartScan = () => {
    if (selectedSources.length === 0 || keywords.length === 0) return
    onStartScan({
      dateRange: { from: dateFrom, to: dateTo },
      sources: selectedSources,
      keywords
    })
  }
  
  const handleDateChange = (type: 'from' | 'to', date: Date | undefined) => {
    if (date) {
      if (type === 'from') setDateFrom(date)
      else setDateTo(date)
      setSelectedPreset('')
    }
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Scan for Co-Sell Opportunities</h2>
            <p className="text-sm text-muted-foreground">
              Configure your scan to detect partner collaboration opportunities across your Microsoft 365 communications.
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold mb-3 block">Data Sources</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => toggleSource('email')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    selectedSources.includes('email')
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-accent/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox checked={selectedSources.includes('email')} />
                    <Envelope size={20} className={selectedSources.includes('email') ? 'text-accent' : 'text-muted-foreground'} />
                    <div className="text-left">
                      <p className="font-medium text-sm">Outlook Email</p>
                      <p className="text-xs text-muted-foreground">Scan inbox & sent</p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => toggleSource('chat')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    selectedSources.includes('chat')
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-accent/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox checked={selectedSources.includes('chat')} />
                    <ChatCircle size={20} className={selectedSources.includes('chat') ? 'text-accent' : 'text-muted-foreground'} />
                    <div className="text-left">
                      <p className="font-medium text-sm">Teams Chat</p>
                      <p className="text-xs text-muted-foreground">1:1 & group chats</p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => toggleSource('meeting')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    selectedSources.includes('meeting')
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-accent/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox checked={selectedSources.includes('meeting')} />
                    <Video size={20} className={selectedSources.includes('meeting') ? 'text-accent' : 'text-muted-foreground'} />
                    <div className="text-left">
                      <p className="font-medium text-sm">Meetings</p>
                      <p className="text-xs text-muted-foreground">Transcripts</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
            
            <div>
              <Label className="text-base font-semibold mb-3 block">Date Range</Label>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {DATE_PRESETS.map(preset => (
                  <Button
                    key={preset.label}
                    variant={selectedPreset === preset.label ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => applyDatePreset(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm mb-2 block">From</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon size={16} />
                        {format(dateFrom, 'MMM dd, yyyy')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={(date) => handleDateChange('from', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <Label className="text-sm mb-2 block">To</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon size={16} />
                        {format(dateTo, 'MMM dd, yyyy')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={(date) => handleDateChange('to', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Tag size={18} className="text-accent" />
                  Detection Keywords
                </Label>
                <Button variant="ghost" size="sm" onClick={resetKeywords}>
                  Reset to defaults
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground mb-3">
                Customize the keywords used to identify co-sell opportunities in communications
              </p>
              
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Add custom keyword..."
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addKeyword()
                    }
                  }}
                  className="flex-1"
                />
                <Button onClick={addKeyword} disabled={!newKeyword.trim()}>
                  <Plus size={16} />
                  Add
                </Button>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                {keywords.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {keywords.map(keyword => (
                      <Badge 
                        key={keyword} 
                        variant="secondary"
                        className="pr-1 flex items-center gap-1"
                      >
                        {keyword}
                        <button
                          onClick={() => removeKeyword(keyword)}
                          className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                        >
                          <X size={12} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No keywords selected. Add at least one keyword to scan.
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleStartScan} 
            disabled={isScanning || selectedSources.length === 0 || keywords.length === 0}
            className="w-full"
            size="lg"
          >
            <MagnifyingGlass size={20} />
            {isScanning ? 'Scanning...' : 'Start AI Scan'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
