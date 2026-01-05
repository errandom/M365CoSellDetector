import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { scanHistoryService, type ScanHistory } from '@/lib/scanHistoryService'
import { Clock, ArrowClockwise, Trash } from '@phosphor-icons/react'
import { formatDistanceToNow } from 'date-fns'

interface ScanHistoryCardProps {
  useIncrementalScan: boolean
  onToggleIncrementalScan: (enabled: boolean) => void
}

export function ScanHistoryCard({ useIncrementalScan, onToggleIncrementalScan }: ScanHistoryCardProps) {
  const [history, setHistory] = useState<ScanHistory | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setLoading(true)
    const data = await scanHistoryService.getScanHistory()
    setHistory(data)
    setLoading(false)
  }

  const handleClearHistory = async () => {
    await scanHistoryService.clearHistory()
    await loadHistory()
  }

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'Never'
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
    } catch {
      return 'Invalid date'
    }
  }

  const hasHistory = history?.lastFullScan || Object.keys(history?.lastScanBySource || {}).length > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-accent" />
            <CardTitle className="text-base">Scan History</CardTitle>
          </div>
          {hasHistory && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearHistory}
              className="h-8 px-2"
            >
              <Trash size={16} />
              Clear
            </Button>
          )}
        </div>
        <CardDescription>
          Track previous scans and enable incremental scanning for faster results
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted rounded-md">
          <div className="flex items-center gap-3">
            <ArrowClockwise 
              size={20} 
              className={useIncrementalScan ? 'text-accent' : 'text-muted-foreground'} 
            />
            <div>
              <Label htmlFor="incremental-scan" className="cursor-pointer font-medium">
                Incremental Scanning
              </Label>
              <p className="text-xs text-muted-foreground">
                Only scan new communications since last scan
              </p>
            </div>
          </div>
          <Switch
            id="incremental-scan"
            checked={useIncrementalScan}
            onCheckedChange={onToggleIncrementalScan}
          />
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            Loading history...
          </div>
        ) : !hasHistory ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No scan history yet. Run your first scan to begin tracking.
          </div>
        ) : (
          <div className="space-y-3">
            {history?.lastFullScan && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last Full Scan:</span>
                <Badge variant="secondary">
                  {formatDate(history.lastFullScan)}
                </Badge>
              </div>
            )}
            
            {history?.lastScanBySource?.email && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last Email Scan:</span>
                <Badge variant="outline">
                  {formatDate(history.lastScanBySource.email)}
                </Badge>
              </div>
            )}
            
            {history?.lastScanBySource?.chat && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last Chat Scan:</span>
                <Badge variant="outline">
                  {formatDate(history.lastScanBySource.chat)}
                </Badge>
              </div>
            )}
            
            {history?.lastScanBySource?.meeting && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last Meeting Scan:</span>
                <Badge variant="outline">
                  {formatDate(history.lastScanBySource.meeting)}
                </Badge>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
