export type CommunicationType = 'email' | 'chat' | 'meeting'

export type OpportunityStatus = 'new' | 'review' | 'confirmed' | 'synced' | 'rejected'

export type CRMAction = 'create' | 'update' | 'link'

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
  summary: string
  keywords: string[]
  confidence: number
  status: OpportunityStatus
  crmAction: CRMAction
  existingOpportunityId?: string
  dealSize?: string
  timeline?: string
  createdAt: string
  updatedAt: string
  // Additional fields for prominent display
  askExpectation?: string         // What the partner/customer is asking for
  solutionArea?: SolutionArea     // Azure, Modern Work, Security, etc.
  engagementType?: string         // Co-sell, Referral, Joint proposal
  nextSteps?: string              // Suggested next action
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
