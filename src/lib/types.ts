export type CommunicationType = 'email' | 'chat' | 'meeting'

export type OpportunityStatus = 'new' | 'review' | 'confirmed' | 'synced' | 'rejected'

export type CRMAction = 'create' | 'update' | 'link'

export type IndustryVertical = 'financial-services' | 'healthcare' | 'retail' | 'manufacturing' | 'technology' | 'government' | 'education'

export type SolutionArea = 'azure-migration' | 'modern-workplace' | 'security' | 'data-ai' | 'app-modernization' | 'infrastructure' | 'business-applications' | 'dynamics-365'

// ============================================
// Partner Identification
// ============================================
export interface PartnerIdentifier {
  partnerOneId?: string           // Primary identifier in Partner One system
  mpnId?: string                  // Microsoft Partner Network ID
  name: string                    // Partner organization name
  nameMatchConfidence?: number    // Confidence score if matched by name (0-1)
}

// ============================================
// Account (Customer) Identification
// ============================================
export interface AccountIdentifier {
  crmAccountId?: string          // CRM Account ID
  tpid?: string                  // Top Parent ID
  name: string                   // Account/customer name
  nameMatchConfidence?: number   // Confidence score if matched by name (0-1)
}

// ============================================
// BANT - Budget, Authority, Need, Timeline
// ============================================
export interface Budget {
  amount: number                 // Original amount
  currency: string               // Original currency (USD, EUR, GBP, etc.)
  amountUSD: number              // Converted to USD for uniform reporting
  confidence: number             // Confidence in extraction (0-1)
}

export interface Contact {
  name?: string
  email?: string
  phone?: string
  title?: string
  role?: string                  // e.g., "Decision Maker", "Technical Evaluator"
}

export interface Authority {
  customerContact?: Contact      // Primary - customer decision maker
  partnerContact?: Contact       // Secondary - partner contact
  confidence: number             // Confidence in extraction (0-1)
}

export interface Need {
  description: string            // What the customer needs/is asking Microsoft
  solutionArea?: SolutionArea    // Which solution/technology area
  products?: string[]            // Specific products mentioned (Azure, M365, etc.)
  services?: string[]            // Services needed (implementation, support, etc.)
  confidence: number             // Confidence in extraction (0-1)
}

export interface Timeline {
  estimatedCloseDate?: string    // ISO date string
  dueDate?: string               // Simple due date if close date unknown
  timeframeDescription?: string  // e.g., "Q2 2026", "within 6 months"
  urgency?: 'low' | 'medium' | 'high' | 'critical'
  confidence: number             // Confidence in extraction (0-1)
}

export interface BANT {
  budget?: Budget
  authority?: Authority
  need?: Need
  timeline?: Timeline
  score: number                  // Overall BANT completeness score (0-100)
  missingElements: ('budget' | 'authority' | 'need' | 'timeline')[]
}

// ============================================
// Partner Referral
// ============================================
export interface PartnerReferral {
  referralId: string             // Unique referral identifier
  partner: PartnerIdentifier     // Single partner (required)
  account: AccountIdentifier     // Single account (required)
  bant: BANT                     // BANT qualification
  status: 'draft' | 'submitted' | 'accepted' | 'declined' | 'expired' | 'won' | 'lost'
  source: 'detected' | 'manual' | 'partner-center' | 'import'
  createdAt: string
  updatedAt: string
  expiresAt?: string
  notes?: string
}

// Legacy Entity type (kept for backward compatibility)
export interface Entity {
  name: string
  type: 'partner' | 'customer'
  confidence: number
  // Extended identifiers
  partnerOneId?: string
  mpnId?: string
  crmAccountId?: string
  tpid?: string
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
  createdAt: string
  updatedAt: string
  
  // BANT Qualification
  bant?: BANT
  
  // Partner Referral data (if this becomes a referral)
  referral?: PartnerReferral
  
  // Legacy fields (kept for backward compatibility, now derived from BANT)
  dealSize?: string               // Derived from bant.budget
  timeline?: string               // Derived from bant.timeline
  askExpectation?: string         // Derived from bant.need.description
  solutionArea?: SolutionArea     // Derived from bant.need.solutionArea
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
