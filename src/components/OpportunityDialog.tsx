import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Envelope, ChatCircle, Video, Handshake, Buildings, 
  CheckCircle, XCircle, Calendar, CurrencyDollar 
} from '@phosphor-icons/react'
import type { DetectedOpportunity } from '@/lib/types'
import { useState } from 'react'

interface OpportunityDialogProps {
  opportunity: DetectedOpportunity | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm?: (id: string, editedSummary?: string) => void
  onReject?: (id: string) => void
}

const typeIcons = {
  email: Envelope,
  chat: ChatCircle,
  meeting: Video
}

const typeLabels = {
  email: 'Email',
  chat: 'Teams Chat',
  meeting: 'Teams Meeting'
}

export function OpportunityDialog({ 
  opportunity, 
  open, 
  onOpenChange,
  onConfirm,
  onReject 
}: OpportunityDialogProps) {
  const [editedSummary, setEditedSummary] = useState('')
  
  if (!opportunity) return null
  
  const TypeIcon = typeIcons[opportunity.communication.type]
  const typeLabel = typeLabels[opportunity.communication.type]
  
  const handleConfirm = () => {
    onConfirm?.(opportunity.id, editedSummary || undefined)
    onOpenChange(false)
  }
  
  const handleReject = () => {
    onReject?.(opportunity.id)
    onOpenChange(false)
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <TypeIcon size={20} className="text-foreground" />
            </div>
            <span>{opportunity.communication.subject}</span>
          </DialogTitle>
          <DialogDescription>
            Review and edit the detected co-sell opportunity before syncing to CRM
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="outline" className="flex items-center gap-1.5">
                <TypeIcon size={12} />
                {typeLabel}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1.5">
                <Calendar size={12} />
                {new Date(opportunity.communication.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Badge>
              {opportunity.dealSize && (
                <Badge variant="outline" className="flex items-center gap-1.5">
                  <CurrencyDollar size={12} />
                  {opportunity.dealSize}
                </Badge>
              )}
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-2">Detected Entities</h4>
              <div className="flex flex-wrap gap-2">
                {opportunity.partner && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-lg border border-accent/20">
                    <Handshake size={16} className="text-accent" />
                    <div>
                      <p className="text-xs text-muted-foreground">Partner</p>
                      <p className="text-sm font-medium">{opportunity.partner.name}</p>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {Math.round(opportunity.partner.confidence * 100)}%
                    </Badge>
                  </div>
                )}
                {opportunity.customer && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg border border-primary/20">
                    <Buildings size={16} className="text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Customer</p>
                      <p className="text-sm font-medium">{opportunity.customer.name}</p>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {Math.round(opportunity.customer.confidence * 100)}%
                    </Badge>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="summary" className="text-sm font-semibold mb-2 block">
                AI-Generated Summary
              </Label>
              <Textarea
                id="summary"
                value={editedSummary || opportunity.summary}
                onChange={(e) => setEditedSummary(e.target.value)}
                rows={3}
                className="font-secondary"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Edit the summary if needed before syncing to CRM
              </p>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-semibold text-sm mb-2">CRM Action</h4>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Action: </span>
                  <span className="text-accent">
                    {opportunity.crmAction === 'create' && 'Create new opportunity'}
                    {opportunity.crmAction === 'update' && 'Update existing opportunity'}
                    {opportunity.crmAction === 'link' && 'Link partner to opportunity'}
                  </span>
                </p>
                {opportunity.existingOpportunityId && (
                  <p className="text-sm mt-1">
                    <span className="font-medium">Opportunity ID: </span>
                    <span className="text-muted-foreground">{opportunity.existingOpportunityId}</span>
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-2">Original Content</h4>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">From: {opportunity.communication.from}</p>
                <p className="text-sm font-secondary whitespace-pre-wrap">
                  {opportunity.communication.content}
                </p>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-2">Matched Keywords</h4>
              <div className="flex flex-wrap gap-2">
                {opportunity.keywords.map((keyword, i) => (
                  <Badge key={i} variant="outline">{keyword}</Badge>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter className="gap-2">
          {onReject && opportunity.status === 'new' && (
            <Button variant="outline" onClick={handleReject}>
              <XCircle size={16} />
              Reject
            </Button>
          )}
          {onConfirm && (opportunity.status === 'new' || opportunity.status === 'review') && (
            <Button onClick={handleConfirm}>
              <CheckCircle size={16} />
              Confirm & Sync to CRM
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
