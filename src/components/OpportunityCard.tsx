import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Envelope, ChatCircle, Video, Handshake, Buildings, 
  CheckCircle, Clock, XCircle, ArrowRight, Cube 
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
  create: { label: 'Create New Opportunity', color: 'text-accent' },
  link: { label: 'Link to Existing', color: 'text-primary' },
  already_linked: { label: 'Already in MSX', color: 'text-muted-foreground' }
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
  
  return (
    <Card 
      className={cn(
        "p-5 hover:shadow-lg transition-shadow cursor-pointer border-2",
        isSelected && "border-accent"
      )}
      onClick={() => onSelect?.(opportunity.id)}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-2 bg-muted rounded-lg flex-shrink-0">
            <TypeIcon size={20} className="text-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {opportunity.communication.subject}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(opportunity.communication.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>
        <Badge className={status.color}>{status.label}</Badge>
      </div>
      
      <p className="text-sm text-foreground mb-4 font-secondary leading-relaxed">
        {opportunity.summary}
      </p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {opportunity.partner && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 rounded-md border border-accent/20">
            <Handshake size={14} className="text-accent flex-shrink-0" />
            <span className="text-xs font-medium text-foreground">{opportunity.partner.name}</span>
            <span className={cn("text-xs", confidenceColor)}>
              {Math.round(opportunity.partner.confidence * 100)}%
            </span>
          </div>
        )}
        {opportunity.customer && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-md border border-primary/20">
            <Buildings size={14} className="text-primary flex-shrink-0" />
            <span className="text-xs font-medium text-foreground">{opportunity.customer.name}</span>
            <span className={cn("text-xs", confidenceColor)}>
              {Math.round(opportunity.customer.confidence * 100)}%
            </span>
          </div>
        )}
        {opportunity.solutionArea && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/10 rounded-md border border-secondary/20">
            <Cube size={14} className="text-secondary flex-shrink-0" />
            <span className="text-xs font-medium text-foreground">{solutionAreaLabels[opportunity.solutionArea]}</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-2 text-xs">
          <span className={action.color}>
            {action.label}
          </span>
          {(opportunity.existingOpportunityName || opportunity.existingOpportunityId) && (
            <>
              <ArrowRight size={12} className="text-muted-foreground" />
              <span className="text-muted-foreground truncate max-w-[150px]" title={opportunity.existingOpportunityName || opportunity.existingOpportunityId}>
                {opportunity.existingOpportunityName || opportunity.existingOpportunityId}
              </span>
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
