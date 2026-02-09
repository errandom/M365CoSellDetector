/**
 * Types representing the Fabric SQL database tables:
 * - dbo._Opportunities: All opportunities with partner referrals
 * - dbo._PartnerReferralData: Partner referral/engagement data
 * 
 * Note: These types are based on expected schema. Adjust column names
 * to match your actual database schema after initial testing.
 */

/**
 * Represents a record from dbo._Opportunities table
 */
export interface FabricOpportunity {
  // Primary identifiers
  OpportunityId: string
  OpportunityName: string
  
  // Customer information
  CustomerId?: string
  CustomerName?: string
  CustomerIndustry?: string
  CustomerSegment?: string
  CustomerCountry?: string
  CustomerCity?: string
  
  // Partner information (linked to referral)
  PartnerId?: string
  PartnerName?: string
  PartnerType?: string
  
  // Opportunity details
  Status?: string
  Stage?: string
  Type?: string
  SolutionArea?: string
  
  // Financial information
  EstimatedRevenue?: number
  ActualRevenue?: number
  Currency?: string
  
  // Dates
  CreatedDate?: Date
  ModifiedDate?: Date
  CloseDate?: Date
  ExpectedCloseDate?: Date
  
  // Microsoft seller information
  OwnerId?: string
  OwnerName?: string
  OwnerEmail?: string
  
  // Additional metadata
  Source?: string
  CampaignId?: string
  Description?: string
  Notes?: string
  
  // Co-sell specific fields
  CoSellStatus?: string
  CoSellType?: string
  PartnerEngagementId?: string
  ReferralId?: string
}

/**
 * Represents a record from dbo._PartnerReferralData table
 */
export interface FabricPartnerReferral {
  // Primary identifiers
  ReferralId: string
  OpportunityId?: string
  
  // Partner information
  PartnerId: string
  PartnerName?: string
  PartnerOrganizationId?: string
  PartnerProgramId?: string
  PartnerType?: string
  
  // Referral details
  ReferralStatus?: string
  ReferralType?: string
  ReferralSource?: string
  
  // Customer information
  CustomerName?: string
  CustomerId?: string
  
  // Engagement details
  EngagementType?: string
  EngagementStatus?: string
  
  // Financial information
  EstimatedDealValue?: number
  Currency?: string
  
  // Dates
  CreatedDate?: Date
  ModifiedDate?: Date
  ExpirationDate?: Date
  AcceptedDate?: Date
  DeclinedDate?: Date
  ClosedDate?: Date
  
  // Contact information
  ContactName?: string
  ContactEmail?: string
  ContactPhone?: string
  
  // Seller information
  SellerName?: string
  SellerEmail?: string
  MSSellerId?: string
  
  // Additional metadata
  Notes?: string
  Consent?: boolean
  ConsentTimestamp?: Date
  
  // Solution/Product information
  SolutionArea?: string
  Products?: string
  Services?: string
  
  // Location
  Country?: string
  Region?: string
  State?: string
}

/**
 * Combined opportunity with its referrals
 */
export interface OpportunityWithReferrals {
  opportunity: FabricOpportunity
  referrals: FabricPartnerReferral[]
}

/**
 * Search parameters for opportunities
 */
export interface OpportunitySearchParams {
  partnerId?: string
  customerId?: string
  status?: string
  fromDate?: Date
  toDate?: Date
  searchText?: string
  limit?: number
}

/**
 * Search parameters for partner referrals
 */
export interface PartnerReferralSearchParams {
  opportunityId?: string
  partnerId?: string
  referralStatus?: string
  fromDate?: Date
  toDate?: Date
  limit?: number
}

/**
 * Dashboard metrics from database
 */
export interface FabricDashboardMetrics {
  totalOpportunities: number
  activePartnerReferrals: number
  totalPipelineValue: number
  topPartners: {
    partnerId: string
    partnerName: string
    count: number
    totalValue: number
  }[]
  recentOpportunities: FabricOpportunity[]
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  count?: number
}

// ============================================
// SCAN RESULTS TYPES
// ============================================

/**
 * Scan types
 */
export type ScanType = 'manual' | 'scheduled' | 'incremental'

export type ScanStatus = 'in_progress' | 'completed' | 'failed' | 'cancelled'

export type ReviewStatus = 'pending' | 'confirmed' | 'rejected' | 'synced'

export type SyncStatus = 'not_synced' | 'pending' | 'synced' | 'failed'

export type ActionType = 'created' | 'reviewed' | 'confirmed' | 'rejected' | 'synced' | 'updated' | 'exported'

/**
 * Represents a scan session record in dbo.ScanSessions
 */
export interface ScanSession {
  ScanId: string
  ScanName?: string
  ScanType: ScanType
  ScanDateRangeStart: Date
  ScanDateRangeEnd: Date
  SourcesScanned: string  // comma-separated: 'email,chat,meeting'
  KeywordsUsed?: string   // JSON array
  TotalCommunicationsScanned: number
  OpportunitiesDetected: number
  HighConfidenceCount: number
  MediumConfidenceCount: number
  LowConfidenceCount: number
  ScannedByUserId?: string
  ScannedByUserEmail?: string
  ScannedByUserName?: string
  ScanStartedAt: Date
  ScanCompletedAt?: Date
  ScanDurationSeconds?: number
  ScanStatus: ScanStatus
  ErrorMessage?: string
  CreatedAt: Date
  ModifiedAt: Date
}

/**
 * Input for creating a new scan session
 */
export interface CreateScanSessionInput {
  ScanName?: string
  ScanType: ScanType
  ScanDateRangeStart: Date
  ScanDateRangeEnd: Date
  SourcesScanned: string[]
  KeywordsUsed?: string[]
  ScannedByUserId?: string
  ScannedByUserEmail?: string
  ScannedByUserName?: string
}

/**
 * Represents a detected opportunity in dbo.DetectedOpportunities
 */
export interface DetectedOpportunityRecord {
  DetectedOpportunityId: string
  ScanId: string
  
  // Source Communication
  CommunicationId: string
  CommunicationType: 'email' | 'chat' | 'meeting'
  CommunicationSubject?: string
  CommunicationFrom?: string
  CommunicationDate?: Date
  CommunicationPreview?: string
  CommunicationContent?: string
  
  // Detected Entities
  PartnerName?: string
  PartnerConfidence?: number
  CustomerName?: string
  CustomerConfidence?: number
  
  // AI Analysis
  Summary?: string
  DetectedKeywords?: string  // JSON array
  OverallConfidence: number
  
  // Suggested Actions
  SuggestedCRMAction?: 'create' | 'update' | 'link'
  LinkedOpportunityId?: string
  
  // Deal Information
  EstimatedDealSize?: string
  EstimatedTimeline?: string
  
  // Review Status
  ReviewStatus: ReviewStatus
  ReviewedByUserId?: string
  ReviewedByUserEmail?: string
  ReviewedAt?: Date
  ReviewNotes?: string
  
  // Sync Status
  SyncStatus: SyncStatus
  SyncedToOpportunityId?: string
  SyncedAt?: Date
  SyncErrorMessage?: string
  
  CreatedAt: Date
  ModifiedAt: Date
}

/**
 * Input for creating a detected opportunity
 */
export interface CreateDetectedOpportunityInput {
  ScanId: string
  CommunicationId: string
  CommunicationType: 'email' | 'chat' | 'meeting'
  CommunicationSubject?: string
  CommunicationFrom?: string
  CommunicationDate?: Date
  CommunicationPreview?: string
  CommunicationContent?: string
  PartnerName?: string
  PartnerConfidence?: number
  CustomerName?: string
  CustomerConfidence?: number
  Summary?: string
  DetectedKeywords?: string[]
  OverallConfidence: number
  SuggestedCRMAction?: 'create' | 'update' | 'link'
  LinkedOpportunityId?: string
  EstimatedDealSize?: string
  EstimatedTimeline?: string
}

/**
 * Input for updating opportunity review status
 */
export interface UpdateOpportunityReviewInput {
  DetectedOpportunityId: string
  ReviewStatus: ReviewStatus
  ReviewedByUserId?: string
  ReviewedByUserEmail?: string
  ReviewNotes?: string
}

/**
 * Input for updating opportunity sync status
 */
export interface UpdateOpportunitySyncInput {
  DetectedOpportunityId: string
  SyncStatus: SyncStatus
  SyncedToOpportunityId?: string
  SyncErrorMessage?: string
}

/**
 * Represents an action log entry in dbo.OpportunityActions
 */
export interface OpportunityAction {
  ActionId: string
  DetectedOpportunityId: string
  ActionType: ActionType
  ActionDescription?: string
  PreviousValue?: string  // JSON
  NewValue?: string       // JSON
  ActionByUserId?: string
  ActionByUserEmail?: string
  ActionByUserName?: string
  ActionAt: Date
}

/**
 * Input for creating an action log entry
 */
export interface CreateOpportunityActionInput {
  DetectedOpportunityId: string
  ActionType: ActionType
  ActionDescription?: string
  PreviousValue?: object
  NewValue?: object
  ActionByUserId?: string
  ActionByUserEmail?: string
  ActionByUserName?: string
}

/**
 * Scan results summary from the view
 */
export interface ScanResultsSummary {
  ScanId: string
  ScanName?: string
  ScanType: ScanType
  ScanDateRangeStart: Date
  ScanDateRangeEnd: Date
  SourcesScanned: string
  OpportunitiesDetected: number
  ScanStartedAt: Date
  ScanCompletedAt?: Date
  ScanStatus: ScanStatus
  ScannedByUserName?: string
  ScannedByUserEmail?: string
  PendingReviewCount: number
  ConfirmedCount: number
  RejectedCount: number
  SyncedCount: number
  AvgConfidence?: number
}

/**
 * Complete scan result with all detected opportunities
 */
export interface CompleteScanResult {
  session: ScanSession
  opportunities: DetectedOpportunityRecord[]
}

/**
 * Search parameters for scan sessions
 */
export interface ScanSessionSearchParams {
  userId?: string
  status?: ScanStatus
  scanType?: ScanType
  fromDate?: Date
  toDate?: Date
  limit?: number
}

/**
 * Search parameters for detected opportunities
 */
export interface DetectedOpportunitySearchParams {
  scanId?: string
  reviewStatus?: ReviewStatus
  syncStatus?: SyncStatus
  partnerName?: string
  customerName?: string
  minConfidence?: number
  fromDate?: Date
  toDate?: Date
  limit?: number
}

