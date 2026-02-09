/**
 * Scan Results Adapter
 * Converts between the app's DetectedOpportunity type and the database record format
 */

import type { DetectedOpportunity, CommunicationType, OpportunityStatus, CRMAction } from './types'
import type { 
  CreateScanSessionInput, 
  CreateDetectedOpportunityInput,
  DetectedOpportunityRecord,
  ScanSession,
  CompleteScanResult,
  ReviewStatus,
  SyncStatus
} from './scanResultsService'

/**
 * Convert app's DetectedOpportunity to database input format
 */
export function detectedOpportunityToDbInput(opp: DetectedOpportunity): CreateDetectedOpportunityInput {
  return {
    CommunicationId: opp.communication.id,
    CommunicationType: opp.communication.type,
    CommunicationSubject: opp.communication.subject,
    CommunicationFrom: opp.communication.from,
    CommunicationDate: opp.communication.date ? new Date(opp.communication.date) : undefined,
    CommunicationPreview: opp.communication.preview,
    CommunicationContent: opp.communication.content,
    PartnerName: opp.partner?.name,
    PartnerConfidence: opp.partner?.confidence,
    CustomerName: opp.customer?.name,
    CustomerConfidence: opp.customer?.confidence,
    Summary: opp.summary,
    DetectedKeywords: opp.keywords,
    OverallConfidence: opp.confidence,
    SuggestedCRMAction: opp.crmAction,
    LinkedOpportunityId: opp.existingOpportunityId,
    EstimatedDealSize: opp.dealSize,
    EstimatedTimeline: opp.timeline,
  }
}

/**
 * Convert multiple app opportunities to database input format
 */
export function detectedOpportunitiesToDbInputs(opportunities: DetectedOpportunity[]): CreateDetectedOpportunityInput[] {
  return opportunities.map(detectedOpportunityToDbInput)
}

/**
 * Convert database record back to app's DetectedOpportunity format
 */
export function dbRecordToDetectedOpportunity(record: DetectedOpportunityRecord): DetectedOpportunity {
  // Parse keywords from JSON string
  let keywords: string[] = []
  if (record.DetectedKeywords) {
    try {
      keywords = JSON.parse(record.DetectedKeywords)
    } catch {
      keywords = []
    }
  }

  // Map review status to app status
  const statusMapping: Record<ReviewStatus, OpportunityStatus> = {
    pending: 'review',
    confirmed: 'confirmed',
    rejected: 'rejected',
    synced: 'synced',
  }

  return {
    id: record.DetectedOpportunityId,
    communication: {
      id: record.CommunicationId,
      type: record.CommunicationType,
      subject: record.CommunicationSubject || '',
      from: record.CommunicationFrom || '',
      date: record.CommunicationDate || record.CreatedAt,
      preview: record.CommunicationPreview || '',
      content: record.CommunicationContent || '',
    },
    partner: record.PartnerName
      ? {
          name: record.PartnerName,
          type: 'partner',
          confidence: record.PartnerConfidence || 0,
        }
      : null,
    customer: record.CustomerName
      ? {
          name: record.CustomerName,
          type: 'customer',
          confidence: record.CustomerConfidence || 0,
        }
      : null,
    summary: record.Summary || '',
    keywords,
    confidence: record.OverallConfidence,
    status: statusMapping[record.ReviewStatus] || 'new',
    crmAction: (record.SuggestedCRMAction as CRMAction) || 'create',
    existingOpportunityId: record.LinkedOpportunityId || record.SyncedToOpportunityId,
    dealSize: record.EstimatedDealSize,
    timeline: record.EstimatedTimeline,
    createdAt: record.CreatedAt,
    updatedAt: record.ModifiedAt,
  }
}

/**
 * Convert database records to app opportunities
 */
export function dbRecordsToDetectedOpportunities(records: DetectedOpportunityRecord[]): DetectedOpportunity[] {
  return records.map(dbRecordToDetectedOpportunity)
}

/**
 * Create scan session input from scan configuration
 */
export function createScanSessionInput(config: {
  name?: string
  scanType?: 'manual' | 'scheduled' | 'incremental'
  dateRange: { from: Date; to: Date }
  sources: CommunicationType[]
  keywords: string[]
  user?: {
    id?: string
    email?: string
    name?: string
  }
}): CreateScanSessionInput {
  return {
    ScanName: config.name,
    ScanType: config.scanType || 'manual',
    ScanDateRangeStart: config.dateRange.from,
    ScanDateRangeEnd: config.dateRange.to,
    SourcesScanned: config.sources,
    KeywordsUsed: config.keywords,
    ScannedByUserId: config.user?.id,
    ScannedByUserEmail: config.user?.email,
    ScannedByUserName: config.user?.name,
  }
}

/**
 * Map app OpportunityStatus to database ReviewStatus
 */
export function statusToReviewStatus(status: OpportunityStatus): ReviewStatus {
  const mapping: Record<OpportunityStatus, ReviewStatus> = {
    new: 'pending',
    review: 'pending',
    confirmed: 'confirmed',
    synced: 'synced',
    rejected: 'rejected',
  }
  return mapping[status]
}

/**
 * Map database ReviewStatus to app OpportunityStatus
 */
export function reviewStatusToStatus(reviewStatus: ReviewStatus): OpportunityStatus {
  const mapping: Record<ReviewStatus, OpportunityStatus> = {
    pending: 'review',
    confirmed: 'confirmed',
    rejected: 'rejected',
    synced: 'synced',
  }
  return mapping[reviewStatus]
}

/**
 * Calculate confidence level category
 */
export function getConfidenceLevel(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= 0.8) return 'high'
  if (confidence >= 0.5) return 'medium'
  return 'low'
}

/**
 * Count opportunities by confidence level
 */
export function countByConfidenceLevel(opportunities: DetectedOpportunity[]): {
  high: number
  medium: number
  low: number
} {
  return opportunities.reduce(
    (acc, opp) => {
      const level = getConfidenceLevel(opp.confidence)
      acc[level]++
      return acc
    },
    { high: 0, medium: 0, low: 0 }
  )
}

/**
 * Get summary statistics for a scan result
 */
export function getScanResultStats(result: CompleteScanResult): {
  totalOpportunities: number
  byStatus: Record<ReviewStatus, number>
  byConfidence: { high: number; medium: number; low: number }
  avgConfidence: number
  duration: string
} {
  const opportunities = result.opportunities
  
  const byStatus: Record<ReviewStatus, number> = {
    pending: 0,
    confirmed: 0,
    rejected: 0,
    synced: 0,
  }
  
  let totalConfidence = 0
  const byConfidence = { high: 0, medium: 0, low: 0 }
  
  for (const opp of opportunities) {
    byStatus[opp.ReviewStatus]++
    totalConfidence += opp.OverallConfidence
    
    const level = getConfidenceLevel(opp.OverallConfidence)
    byConfidence[level]++
  }
  
  const avgConfidence = opportunities.length > 0 
    ? totalConfidence / opportunities.length 
    : 0
  
  const durationSeconds = result.session.ScanDurationSeconds || 0
  const duration = durationSeconds > 60 
    ? `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`
    : `${durationSeconds}s`
  
  return {
    totalOpportunities: opportunities.length,
    byStatus,
    byConfidence,
    avgConfidence,
    duration,
  }
}
