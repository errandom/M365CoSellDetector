import { Card } from '@/components/ui/card'
import { TrendUp, TrendDown } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

interface MetricCardProps {
  title: string
  value: string | number
  trend?: {
    direction: 'up' | 'down'
    value: string
  }
  icon: React.ReactNode
  delay?: number
}

export function MetricCard({ title, value, trend, icon, delay = 0 }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="p-5 hover:shadow-md transition-shadow h-full">
        <div className="flex items-start justify-between h-full">
          <div className="flex-1 flex flex-col">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              {title}
            </p>
            <p className="text-3xl font-bold text-foreground mb-1">
              {value}
            </p>
            <div className="mt-auto min-h-[20px]">
              {trend && (
                <div className="flex items-center gap-1">
                  {trend.direction === 'up' ? (
                    <TrendUp size={14} weight="bold" className="text-success" />
                  ) : (
                    <TrendDown size={14} weight="bold" className="text-destructive" />
                  )}
                  <span className={`text-xs font-medium ${
                    trend.direction === 'up' ? 'text-success' : 'text-destructive'
                  }`}>
                    {trend.value}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="p-3 bg-accent/10 rounded-lg">
            {icon}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
