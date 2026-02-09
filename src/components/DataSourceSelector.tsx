import { useState, useEffect } from 'react'
import { Database, Cloud, TestTube, Check, X, Spinner } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { fabricDatabaseService } from '@/lib/fabricDatabaseService'
import type { DataSource } from '@/lib/useFabricData'

interface DataSourceSelectorProps {
  value: DataSource
  onChange: (source: DataSource) => void
  className?: string
}

export function DataSourceSelector({ value, onChange, className }: DataSourceSelectorProps) {
  const [fabricStatus, setFabricStatus] = useState<'checking' | 'connected' | 'unavailable'>('checking')

  useEffect(() => {
    const checkFabricConnection = async () => {
      try {
        const isAvailable = await fabricDatabaseService.checkHealth()
        setFabricStatus(isAvailable ? 'connected' : 'unavailable')
      } catch {
        setFabricStatus('unavailable')
      }
    }

    checkFabricConnection()
  }, [])

  const getSourceIcon = (source: DataSource) => {
    switch (source) {
      case 'fabric':
        return <Database size={16} weight="duotone" />
      case 'graph':
        return <Cloud size={16} weight="duotone" />
      case 'mock':
        return <TestTube size={16} weight="duotone" />
    }
  }

  const getStatusBadge = () => {
    switch (fabricStatus) {
      case 'checking':
        return (
          <Badge variant="outline" className="ml-2 gap-1">
            <Spinner size={12} className="animate-spin" />
            Checking
          </Badge>
        )
      case 'connected':
        return (
          <Badge variant="outline" className="ml-2 gap-1 text-success border-success">
            <Check size={12} weight="bold" />
            Connected
          </Badge>
        )
      case 'unavailable':
        return (
          <Badge variant="outline" className="ml-2 gap-1 text-destructive border-destructive">
            <X size={12} weight="bold" />
            Unavailable
          </Badge>
        )
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-muted-foreground">Data Source:</span>
      <Select value={value} onValueChange={(v) => onChange(v as DataSource)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue>
            <span className="flex items-center gap-2">
              {getSourceIcon(value)}
              {value === 'fabric' && 'Fabric SQL'}
              {value === 'graph' && 'Graph API'}
              {value === 'mock' && 'Demo Data'}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="fabric" disabled={fabricStatus === 'unavailable'}>
            <span className="flex items-center gap-2">
              <Database size={16} weight="duotone" />
              Fabric SQL
              {fabricStatus === 'unavailable' && (
                <span className="text-xs text-muted-foreground">(unavailable)</span>
              )}
            </span>
          </SelectItem>
          <SelectItem value="graph">
            <span className="flex items-center gap-2">
              <Cloud size={16} weight="duotone" />
              Graph API
            </span>
          </SelectItem>
          <SelectItem value="mock">
            <span className="flex items-center gap-2">
              <TestTube size={16} weight="duotone" />
              Demo Data
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
      {value === 'fabric' && getStatusBadge()}
    </div>
  )
}
