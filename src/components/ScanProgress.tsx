import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'
import { Sparkle } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

interface ScanProgressProps {
  stage: string
  progress: number
}

export function ScanProgress({ stage, progress }: ScanProgressProps) {
  return (
    <Card className="p-8">
      <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="p-4 bg-accent/10 rounded-full"
        >
          <Sparkle size={32} weight="duotone" className="text-accent" />
        </motion.div>
        
        <div className="w-full space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">{stage}</p>
            <p className="text-sm font-semibold text-accent">{Math.round(progress * 100)}%</p>
          </div>
          <Progress value={progress * 100} className="h-2" />
        </div>
        
        <p className="text-xs text-muted-foreground text-center">
          AI is analyzing your communications for co-sell opportunities...
        </p>
      </div>
    </Card>
  )
}
