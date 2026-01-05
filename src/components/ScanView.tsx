import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { MagnifyingGlass, Calendar as CalendarIcon, Envelope, ChatCircle, Video } from '@phosphor-icons/react'
import { format } from 'date-fns'
import type { CommunicationType } from '@/lib/types'

interface ScanViewProps {
  onStartScan: (config: {
    dateRange: { from: Date; to: Date }
    sources: CommunicationType[]
  }) => void
  isScanning: boolean
}

export function ScanView({ onStartScan, isScanning }: ScanViewProps) {
  const [dateFrom, setDateFrom] = useState<Date>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  const [dateTo, setDateTo] = useState<Date>(new Date())
  const [selectedSources, setSelectedSources] = useState<CommunicationType[]>(['email', 'chat', 'meeting'])
  
  const toggleSource = (source: CommunicationType) => {
    setSelectedSources(prev =>
      prev.includes(source)
        ? prev.filter(s => s !== source)
        : [...prev, source]
    )
  }
  
  const handleStartScan = () => {
    if (selectedSources.length === 0) return
    onStartScan({
      dateRange: { from: dateFrom, to: dateTo },
      sources: selectedSources
    })
  }
  
  return (
    <div className="max-w-3xl mx-auto">
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
                        onSelect={(date) => date && setDateFrom(date)}
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
                        onSelect={(date) => date && setDateTo(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Detection Keywords</h4>
            <p className="text-xs text-muted-foreground mb-2">
              The AI will scan for these co-sell indicators:
            </p>
            <div className="flex flex-wrap gap-2">
              {['co-sell', 'partner', 'joint opportunity', 'collaboration', 'partnership', 'referral'].map(keyword => (
                <span key={keyword} className="px-2 py-1 bg-background rounded text-xs font-medium">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
          
          <Button 
            onClick={handleStartScan} 
            disabled={isScanning || selectedSources.length === 0}
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
