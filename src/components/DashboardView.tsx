import { MetricCard } from '@/components/MetricCard'
import { Card } from '@/components/ui/card'
import { 
  TrendUp, Handshake, Clock, CheckCircle, 
  CurrencyDollar, ChartBar 
} from '@phosphor-icons/react'
import type { DashboardMetrics } from '@/lib/types'

interface DashboardViewProps {
  metrics: DashboardMetrics
}

export function DashboardView({ metrics }: DashboardViewProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Partner Engagements"
          value={metrics.totalOpportunities}
          trend={{ direction: 'up', value: '+12% this month' }}
          icon={<TrendUp size={24} weight="duotone" className="text-accent" />}
          delay={0}
        />
        <MetricCard
          title="Pending Review"
          value={metrics.pendingReview}
          icon={<Clock size={24} weight="duotone" className="text-warning" />}
          delay={0.1}
        />
        <MetricCard
          title="Synced to MSX"
          value={metrics.synced}
          trend={{ direction: 'up', value: '+8 this week' }}
          icon={<CheckCircle size={24} weight="duotone" className="text-success" />}
          delay={0.2}
        />
        <MetricCard
          title="Active Partners"
          value={metrics.activePartners}
          icon={<Handshake size={24} weight="duotone" className="text-primary" />}
          delay={0.3}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CurrencyDollar size={20} className="text-accent" />
              Pipeline Overview
            </h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <p className="text-sm text-muted-foreground">Total Pipeline Value</p>
                <p className="text-2xl font-bold text-foreground">
                  ${(metrics.pipelineValue / 1000000).toFixed(1)}M
                </p>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-accent to-primary"
                  style={{ width: '75%' }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-xl font-bold text-success">
                  {metrics.conversionRate}%
                </p>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-success"
                  style={{ width: `${metrics.conversionRate}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ChartBar size={20} className="text-accent" />
              Top Partners
            </h3>
          </div>
          
          <div className="space-y-3">
            {metrics.topPartners.slice(0, 5).map((partner, index) => (
              <div key={partner.name} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-accent">{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{partner.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {partner.opportunities} opportunities
                  </p>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  ${(partner.value / 1000000).toFixed(1)}M
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
      
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">Last 14 days</p>
        </div>
        
        <div className="flex items-end justify-between gap-2 h-40">
          {metrics.recentActivity.map((day) => {
            const maxCount = Math.max(...metrics.recentActivity.map(d => d.count))
            const height = (day.count / maxCount) * 100
            
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-muted rounded-t-md overflow-hidden flex items-end" style={{ height: '100%' }}>
                  <div 
                    className="w-full bg-gradient-to-t from-accent to-accent/60 rounded-t-md transition-all hover:from-accent/80"
                    style={{ height: `${height}%` }}
                    title={`${day.count} opportunities on ${new Date(day.date).toLocaleDateString()}`}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(day.date).getDate()}
                </p>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
