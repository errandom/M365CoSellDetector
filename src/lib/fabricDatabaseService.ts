/**
 * Fabric Database Service
 * Frontend service to communicate with the backend API for Fabric SQL data
 * Uses user-delegated authentication to access Fabric SQL
 */

import { authService } from './authService'

// API base URL - can be configured via environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

/**
 * Get the SQL access token for database operations
 * Returns null if user is not authenticated
 */
async function getSqlToken(): Promise<string | null> {
  try {
    if (!authService.isAuthenticated()) {
      return null
    }
    return await authService.getSqlAccessToken()
  } catch (error) {
    console.error('Failed to get SQL access token:', error)
    return null
  }
}

/**
 * Types mirroring the server types for frontend use
 */
export interface FabricOpportunity {
  OpportunityId: string
  OpportunityName: string
  CustomerId?: string
  CustomerName?: string
  CustomerIndustry?: string
  CustomerSegment?: string
  CustomerCountry?: string
  CustomerCity?: string
  PartnerId?: string
  PartnerName?: string
  PartnerType?: string
  Status?: string
  Stage?: string
  Type?: string
  SolutionArea?: string
  EstimatedRevenue?: number
  ActualRevenue?: number
  Currency?: string
  CreatedDate?: string
  ModifiedDate?: string
  CloseDate?: string
  ExpectedCloseDate?: string
  OwnerId?: string
  OwnerName?: string
  OwnerEmail?: string
  Source?: string
  CampaignId?: string
  Description?: string
  Notes?: string
  CoSellStatus?: string
  CoSellType?: string
  PartnerEngagementId?: string
  ReferralId?: string
}

export interface FabricPartnerReferral {
  ReferralId: string
  OpportunityId?: string
  PartnerId: string
  PartnerName?: string
  PartnerOrganizationId?: string
  PartnerProgramId?: string
  PartnerType?: string
  ReferralStatus?: string
  ReferralType?: string
  ReferralSource?: string
  CustomerName?: string
  CustomerId?: string
  EngagementType?: string
  EngagementStatus?: string
  EstimatedDealValue?: number
  Currency?: string
  CreatedDate?: string
  ModifiedDate?: string
  ExpirationDate?: string
  AcceptedDate?: string
  DeclinedDate?: string
  ClosedDate?: string
  ContactName?: string
  ContactEmail?: string
  ContactPhone?: string
  SellerName?: string
  SellerEmail?: string
  MSSellerId?: string
  Notes?: string
  Consent?: boolean
  ConsentTimestamp?: string
  SolutionArea?: string
  Products?: string
  Services?: string
  Country?: string
  Region?: string
  State?: string
}

export interface OpportunityWithReferrals {
  opportunity: FabricOpportunity
  referrals: FabricPartnerReferral[]
}

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

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  count?: number
}

export interface OpportunitySearchParams {
  partnerId?: string
  customerId?: string
  status?: string
  fromDate?: Date
  toDate?: Date
  searchText?: string
  limit?: number
}

export interface ReferralSearchParams {
  opportunityId?: string
  partnerId?: string
  referralStatus?: string
  fromDate?: Date
  toDate?: Date
  limit?: number
}

/**
 * Generic fetch wrapper with error handling
 * Automatically includes SQL bearer token for user-delegated auth
 */
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    // Get the SQL access token for the current user
    const sqlToken = await getSqlToken()
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>),
    }
    
    // Add Authorization header if we have a token
    if (sqlToken) {
      headers['Authorization'] = `Bearer ${sqlToken}`
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `API request failed: ${response.statusText}`)
    }

    const data: ApiResponse<T> = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'API request failed')
    }

    return data.data as T
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error)
    throw error
  }
}

/**
 * Build query string from params object
 */
function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams()
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      if (value instanceof Date) {
        searchParams.set(key, value.toISOString())
      } else {
        searchParams.set(key, String(value))
      }
    }
  }
  
  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

class FabricDatabaseService {
  private isAvailable: boolean | null = null

  /**
   * Check if the backend API is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`)
      const data = await response.json()
      this.isAvailable = data.status === 'ok'
      return this.isAvailable
    } catch {
      this.isAvailable = false
      return false
    }
  }

  /**
   * Get availability status (cached)
   */
  isServiceAvailable(): boolean | null {
    return this.isAvailable
  }

  /**
   * Get all opportunities with optional filtering
   */
  async getOpportunities(params?: OpportunitySearchParams): Promise<FabricOpportunity[]> {
    const query = params ? buildQueryString(params) : ''
    return apiFetch<FabricOpportunity[]>(`/opportunities${query}`)
  }

  /**
   * Get a single opportunity by ID
   */
  async getOpportunityById(opportunityId: string): Promise<FabricOpportunity | null> {
    try {
      return await apiFetch<FabricOpportunity>(`/opportunities/${encodeURIComponent(opportunityId)}`)
    } catch {
      return null
    }
  }

  /**
   * Get referrals for a specific opportunity
   */
  async getOpportunityReferrals(opportunityId: string): Promise<FabricPartnerReferral[]> {
    return apiFetch<FabricPartnerReferral[]>(`/opportunities/${encodeURIComponent(opportunityId)}/referrals`)
  }

  /**
   * Get all partner referrals with optional filtering
   */
  async getReferrals(params?: ReferralSearchParams): Promise<FabricPartnerReferral[]> {
    const query = params ? buildQueryString(params) : ''
    return apiFetch<FabricPartnerReferral[]>(`/referrals${query}`)
  }

  /**
   * Get a single referral by ID
   */
  async getReferralById(referralId: string): Promise<FabricPartnerReferral | null> {
    try {
      return await apiFetch<FabricPartnerReferral>(`/referrals/${encodeURIComponent(referralId)}`)
    } catch {
      return null
    }
  }

  /**
   * Get opportunities with their associated referrals
   */
  async getOpportunitiesWithReferrals(params?: OpportunitySearchParams): Promise<OpportunityWithReferrals[]> {
    const query = params ? buildQueryString(params) : ''
    return apiFetch<OpportunityWithReferrals[]>(`/opportunities-with-referrals${query}`)
  }

  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(): Promise<FabricDashboardMetrics> {
    return apiFetch<FabricDashboardMetrics>('/dashboard/metrics')
  }

  /**
   * Search across opportunities and referrals
   */
  async search(query: string, limit?: number): Promise<{ opportunities: FabricOpportunity[]; referrals: FabricPartnerReferral[] }> {
    const params = buildQueryString({ q: query, limit })
    return apiFetch<{ opportunities: FabricOpportunity[]; referrals: FabricPartnerReferral[] }>(`/search${params}`)
  }
}

export const fabricDatabaseService = new FabricDatabaseService()
