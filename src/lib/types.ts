export type CommunicationType = 'email' | 'chat' | 'meeting'

export type OpportunityStatus = 'new' | 'review' | 'confirmed' | 'synced' | 'rejected'

// MSX Action types:
// - create: Create new MSX opportunity (no matching opportunity found)
// - link: Link partner to existing MSX opportunity (opportunity exists but partner not linked)
// - already_linked: Partner engagement already exists in MSX (no action needed)
export type CRMAction = 'create' | 'link' | 'already_linked'

export type IndustryVertical = 'financial-services' | 'healthcare' | 'retail' | 'manufacturing' | 'technology' | 'government' | 'education'

export type SolutionArea = 'azure-migration' | 'modern-workplace' | 'security' | 'data-ai' | 'app-modernization' | 'infrastructure'

export interface Entity {
  name: string
  type: 'partner' | 'customer'
  confidence: number
}

export interface Communication {
  id: string
  type: CommunicationType
  subject: string
  from: string
  date: string
  preview: string
  content: string
  participants?: string[]
}

export interface DetectedOpportunity {
  id: string
  communication: Communication
  partner: Entity | null
  customer: Entity | null
  solutionArea?: SolutionArea
  summary: string
  keywords: string[]
  confidence: number
  status: OpportunityStatus
  crmAction: CRMAction
  existingOpportunityId?: string
  existingOpportunityName?: string
  existingReferralId?: string
  dealSize?: string
  timeline?: string
  createdAt: string
  updatedAt: string
}

export interface ScanConfig {
  dateRange: {
    from: Date
    to: Date
  }
  sources: CommunicationType[]
  keywords: string[]
}

export interface DashboardMetrics {
  totalOpportunities: number
  pendingReview: number
  synced: number
  activePartners: number
  pipelineValue: number
  conversionRate: number
  recentActivity: {
    date: string
    count: number
  }[]
  topPartners: {
    name: string
    opportunities: number
    value: number
  }[]
}

export interface ExportTemplate {
  id: string
  name: string
  description: string
  isDefault?: boolean
  filters: {
    status: OpportunityStatus[]
    communicationType: CommunicationType[]
    minConfidence?: number
  }
  columns: string[]
  createdAt: string
  updatedAt: string
}

export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly'

export type ScheduleDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export interface ScheduledExport {
  id: string
  name: string
  templateId: string
  frequency: ScheduleFrequency
  dayOfWeek?: ScheduleDay
  dayOfMonth?: number
  time: string
  emailRecipients: string[]
  enabled: boolean
  lastRun?: string
  nextRun: string
  createdAt: string
  updatedAt: string
}
