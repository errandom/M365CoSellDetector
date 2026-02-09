import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Envelope, ChatCircle, Video, Handshake, Buildings, 
  CheckCircle, Clock, XCircle, ArrowRight, Target,
  CurrencyDollar, CalendarBlank, Lightbulb, Sparkle
} from '@phosphor-icons/react'
import type { DetectedOpportunity, SolutionArea } from '@/lib/types'
import { cn } from '@/lib/utils'

interface OpportunityCardProps {
  opportunity: DetectedOpportunity
  onReview: (id: string) => void
  onConfirm?: (id: string) => void
  onReject?: (id: string) => void
  isSelected?: boolean
  onSelect?: (id: string) => void
}

const statusConfig = {
  new: { label: 'New', color: 'bg-accent text-accent-foreground' },
  review: { label: 'In Review', color: 'bg-warning text-warning-foreground' },
  confirmed: { label: 'Confirmed', color: 'bg-success text-success-foreground' },
  synced: { label: 'Synced', color: 'bg-primary text-primary-foreground' },
  rejected: { label: 'Rejected', color: 'bg-muted text-muted-foreground' }
}

const actionConfig = {
  create: { label: 'Create New', color: 'text-accent' },
  update: { label: 'Update Existing', color: 'text-primary' },
  link: { label: 'Link Partner', color: 'text-secondary' }
}

const typeIcons = {
  email: Envelope,
  chat: ChatCircle,
  meeting: Video
}

const solutionAreaLabels: Record<SolutionArea, string> = {
  'azure-migration': 'Azure Migration',
  'modern-workplace': 'Modern Workplace',
  'security': 'Security',
  'data-ai': 'Data & AI',
  'app-modernization': 'App Modernization',
  'infrastructure': 'Infrastructure'
}

const solutionAreaColors: Record<SolutionArea, string> = {
  'azure-migration': 'bg-blue-100 text-blue-800 border-blue-200',
  'modern-workplace': 'bg-purple-100 text-purple-800 border-purple-200',
  'security': 'bg-red-100 text-red-800 border-red-200',
  'data-ai': 'bg-green-100 text-green-800 border-green-200',
  'app-modernization': 'bg-orange-100 text-orange-800 border-orange-200',
  'infrastructure': 'bg-slate-100 text-slate-800 border-slate-200'
}

export function OpportunityCard({ 
  opportunity, 
  onReview, 
  onConfirm, 
  onReject,
  isSelected,
  onSelect 
}: OpportunityCardProps) {
  const TypeIcon = typeIcons[opportunity.communication.type]
  const status = statusConfig[opportunity.status]
  const action = actionConfig[opportunity.crmAction]
  
  const confidenceColor = opportunity.confidence > 0.8 
    ? 'text-success' 
    : opportunity.confidence > 0.6 
      ? 'text-warning' 
      : 'text-muted-foreground'
  
  const confidenceLabel = opportunity.confidence > 0.8 
    ? 'High' 
    : opportunity.confidence > 0.6 
      ? 'Medium' 
      : 'Low'
  
  return (
    <Card 
      className={cn(
        "p-0 overflow-hidden hover:shadow-lg transition-all cursor-pointer border-2",
        isSelected && "border-accent ring-2 ring-accent/20",
        opportunity.status === 'new' && "border-l-4 border-l-accent"
      )}
      onClick={() => onSelect?.(opportunity.id)}
    >
      {/* Header with source type and status */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-4 border-b border-border/50">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-2 bg-muted rounded-lg flex-shrink-0">
            <TypeIcon size={18} className="text-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate text-sm">
              {opportunity.communication.subject}
            </h3>
            <p className="text-xs text-muted-foreground">
              {new Date(opportunity.communication.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
              {opportunity.engagementType && (
                <span className="ml-2 text-accent font-medium">• {opportunity.engagementType}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-xs", confidenceColor)}>
            <Sparkle size={12} className="mr-1" />
            {confidenceLabel}
          </Badge>
          <Badge className={status.color}>{status.label}</Badge>
        </div>
      </div>
      
      {/* Main content - Partner & Customer prominently displayed */}
      <div className="px-5 py-4">
        {/* Partner and Customer - Large and prominent */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Partner Section */}
          <div className={cn(
            "p-4 rounded-lg border-2",
            opportunity.partner 
              ? "bg-gradient-to-br from-accent/5 to-accent/10 border-accent/30" 
              : "bg-muted/30 border-dashed border-muted-foreground/20"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <Handshake size={18} weight="duotone" className="text-accent" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Partner</span>
            </div>
            {opportunity.partner ? (
              <>
                <p className="font-bold text-lg text-foreground leading-tight">
                  {opportunity.partner.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(opportunity.partner.confidence * 100)}% confidence
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground italic">Not detected</p>
            )}
          </div>
          
          {/* Customer Section */}
          <div className={cn(
            "p-4 rounded-lg border-2",
            opportunity.customer 
              ? "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/30" 
              : "bg-muted/30 border-dashed border-muted-foreground/20"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <Buildings size={18} weight="duotone" className="text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Account</span>
            </div>
            {opportunity.customer ? (
              <>
                <p className="font-bold text-lg text-foreground leading-tight">
                  {opportunity.customer.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(opportunity.customer.confidence * 100)}% confidence
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground italic">Not detected</p>
            )}
          </div>
        </div>
        
        {/* Ask/Expectation - Highlighted section */}
        {opportunity.askExpectation && (
          <div className="mb-4 p-4 rounded-lg bg-warning/10 border border-warning/30">
            <div className="flex items-start gap-3">
              <Target size={20} weight="duotone" className="text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-warning uppercase tracking-wide mb-1">
                  Ask / Expectation
                </p>
                <p className="text-sm font-medium text-foreground">
                  {opportunity.askExpectation}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Summary */}
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          {opportunity.summary}
        </p>
        
        {/* Deal info and Solution area */}
        <div className="flex flex-wrap gap-2 mb-4">
          {opportunity.solutionArea && (
            <Badge 
              variant="outline" 
              className={cn("text-xs font-medium", solutionAreaColors[opportunity.solutionArea])}
            >
              {solutionAreaLabels[opportunity.solutionArea]}
            </Badge>
          )}
          {opportunity.dealSize && (
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
              <CurrencyDollar size={12} className="mr-1" />
              {opportunity.dealSize}
            </Badge>
          )}
          {opportunity.timeline && (
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              <CalendarBlank size={12} className="mr-1" />
              {opportunity.timeline}
            </Badge>
          )}
        </div>
        
        {/* Next Steps suggestion */}
        {opportunity.nextSteps && opportunity.status === 'new' && (
          <div className="flex items-center gap-2 p-2 rounded bg-muted/50 text-xs">
            <Lightbulb size={14} className="text-accent flex-shrink-0" />
            <span className="text-muted-foreground">
              <span className="font-medium">Suggested:</span> {opportunity.nextSteps}
            </span>
          </div>
        )}
      </div>
      
      {/* Footer with actions */}
      <div className="px-5 py-3 bg-muted/30 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <span className={action.color}>
            {action.label}
          </span>
          {opportunity.existingOpportunityId && (
            <>
              <ArrowRight size={12} className="text-muted-foreground" />
              <span className="text-muted-foreground font-mono">{opportunity.existingOpportunityId}</span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {opportunity.status === 'new' && (
            <>
              {onReject && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation()
                    onReject(opportunity.id)
                  }}
                >
                  <XCircle size={16} />
                  Reject
                </Button>
              )}
              {onConfirm && (
                <Button
                  size="sm"
                  className="bg-success hover:bg-success/90 text-success-foreground"
                  onClick={(e) => {
                    e.stopPropagation()
                    onConfirm(opportunity.id)
                  }}
                >
                  <CheckCircle size={16} />
                  Confirm
                </Button>
              )}
            </>
          )}
          {opportunity.status === 'review' && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                onReview(opportunity.id)
              }}
            >
              <Clock size={16} />
              Review
            </Button>
          )}
          {(opportunity.status === 'confirmed' || opportunity.status === 'synced') && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onReview(opportunity.id)
              }}
            >
              View Details
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
