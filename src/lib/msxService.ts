import { authService } from './authService'
import { msxConfig, msxRequest } from './msalConfig'

export interface MSXOpportunity {
  opportunityid: string
  name: string
  customerid_account?: {
    name: string
    accountid: string
  }
  statecode: number // 0 = Open, 1 = Won, 2 = Lost
  statuscode: number
  estimatedvalue?: number
  estimatedclosedate?: string
  createdon: string
  modifiedon: string
}

export interface MSXAccount {
  accountid: string
  name: string
}

export interface MSXPartnerReferral {
  referralid: string
  name: string
  partneraccount?: {
    name: string
    accountid: string
  }
  opportunityid?: string
  statecode: number
  createdon: string
}

export interface MSXMatchResult {
  found: boolean
  opportunities: MSXOpportunity[]
  matchedAccount?: MSXAccount
}

export interface MSXPartnerEngagementCheck {
  opportunityExists: boolean
  opportunity?: MSXOpportunity
  partnerAlreadyLinked: boolean
  existingReferral?: MSXPartnerReferral
  action: 'create_opportunity' | 'link_partner' | 'already_linked'
}

class MSXService {
  private accessToken: string | null = null

  private async getAccessToken(): Promise<string> {
    try {
      this.accessToken = await authService.getAccessToken(msxRequest.scopes)
      return this.accessToken
    } catch (error) {
      console.error('Failed to get MSX access token:', error)
      throw new Error('Unable to authenticate with MSX. Please ensure you have the required permissions.')
    }
  }

  private async msxRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = await this.getAccessToken()
    const url = `${msxConfig.baseUrl}/api/data/${msxConfig.apiVersion}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        Accept: 'application/json',
        Prefer: 'odata.include-annotations="*"',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('MSX API Error:', response.status, errorText)
      
      if (response.status === 401) {
        this.accessToken = null
        throw new Error('MSX authentication expired. Please sign in again.')
      }
      if (response.status === 403) {
        throw new Error('Insufficient permissions to access MSX data.')
      }
      
      throw new Error(`MSX API request failed: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Search for accounts (customers) in MSX by name
   */
  async searchAccounts(customerName: string): Promise<MSXAccount[]> {
    if (!customerName || customerName.length < 2) {
      return []
    }

    try {
      const filter = `contains(name,'${this.escapeODataString(customerName)}')`
      const select = 'accountid,name'
      
      const response = await this.msxRequest<{ value: MSXAccount[] }>(
        `/accounts?$filter=${encodeURIComponent(filter)}&$select=${select}&$top=10`
      )
      
      return response.value
    } catch (error) {
      console.warn('Error searching MSX accounts:', error)
      return []
    }
  }

  /**
   * Search for existing opportunities by customer name
   */
  async searchOpportunitiesByCustomer(customerName: string): Promise<MSXOpportunity[]> {
    if (!customerName || customerName.length < 2) {
      return []
    }

    try {
      // Search for opportunities where the parent account name contains the customer name
      const filter = `contains(parentaccountid/name,'${this.escapeODataString(customerName)}')`
      const select = 'opportunityid,name,statecode,statuscode,estimatedvalue,estimatedclosedate,createdon,modifiedon'
      const expand = 'parentaccountid($select=accountid,name)'
      
      const response = await this.msxRequest<{ value: any[] }>(
        `/opportunities?$filter=${encodeURIComponent(filter)}&$select=${select}&$expand=${expand}&$top=20&$orderby=modifiedon desc`
      )
      
      return response.value.map((opp: any) => ({
        opportunityid: opp.opportunityid,
        name: opp.name,
        customerid_account: opp.parentaccountid ? {
          name: opp.parentaccountid.name,
          accountid: opp.parentaccountid.accountid,
        } : undefined,
        statecode: opp.statecode,
        statuscode: opp.statuscode,
        estimatedvalue: opp.estimatedvalue,
        estimatedclosedate: opp.estimatedclosedate,
        createdon: opp.createdon,
        modifiedon: opp.modifiedon,
      }))
    } catch (error) {
      console.warn('Error searching MSX opportunities:', error)
      return []
    }
  }

  /**
   * Check if a customer already has opportunities in MSX
   * Returns match details for cross-validation
   */
  async checkExistingOpportunities(customerName: string): Promise<MSXMatchResult> {
    if (!customerName || customerName.length < 2) {
      return { found: false, opportunities: [] }
    }

    try {
      // First, find matching accounts
      const accounts = await this.searchAccounts(customerName)
      
      if (accounts.length === 0) {
        return { found: false, opportunities: [] }
      }

      // Search opportunities for the first matching account
      const matchedAccount = accounts[0]
      const opportunities = await this.searchOpportunitiesByCustomer(matchedAccount.name)
      
      // Filter to only open opportunities (statecode = 0)
      const openOpportunities = opportunities.filter(opp => opp.statecode === 0)

      return {
        found: openOpportunities.length > 0,
        opportunities: openOpportunities,
        matchedAccount,
      }
    } catch (error) {
      console.warn('Error checking existing opportunities:', error)
      return { found: false, opportunities: [] }
    }
  }

  /**
   * Get a specific opportunity by ID
   */
  async getOpportunity(opportunityId: string): Promise<MSXOpportunity | null> {
    try {
      const select = 'opportunityid,name,statecode,statuscode,estimatedvalue,estimatedclosedate,createdon,modifiedon'
      const expand = 'parentaccountid($select=accountid,name)'
      
      const response = await this.msxRequest<any>(
        `/opportunities(${opportunityId})?$select=${select}&$expand=${expand}`
      )
      
      return {
        opportunityid: response.opportunityid,
        name: response.name,
        customerid_account: response.parentaccountid ? {
          name: response.parentaccountid.name,
          accountid: response.parentaccountid.accountid,
        } : undefined,
        statecode: response.statecode,
        statuscode: response.statuscode,
        estimatedvalue: response.estimatedvalue,
        estimatedclosedate: response.estimatedclosedate,
        createdon: response.createdon,
        modifiedon: response.modifiedon,
      }
    } catch (error) {
      console.warn('Error fetching MSX opportunity:', error)
      return null
    }
  }

  /**
   * Escape special characters for OData filter strings
   */
  private escapeODataString(value: string): string {
    return value
      .replace(/'/g, "''")
      .replace(/"/g, '\\"')
  }

  /**
   * Test connection to MSX
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.msxRequest<any>('/accounts?$top=1&$select=accountid')
      return true
    } catch (error) {
      console.error('MSX connection test failed:', error)
      return false
    }
  }

  /**
   * Search for partner referrals linked to an opportunity
   * Partner referrals are often stored in msdyn_referral or similar entities
   */
  async getPartnerReferralsForOpportunity(opportunityId: string): Promise<MSXPartnerReferral[]> {
    try {
      // Query partner referrals linked to this opportunity
      // Note: Entity name may vary by MSX configuration (msdyn_referral, msp_partnerreferral, etc.)
      const filter = `_msdyn_opportunityid_value eq ${opportunityId}`
      const select = 'msdyn_referralid,msdyn_name,statecode,createdon'
      const expand = 'msdyn_partneraccount($select=accountid,name)'
      
      const response = await this.msxRequest<{ value: any[] }>(
        `/msdyn_referrals?$filter=${encodeURIComponent(filter)}&$select=${select}&$expand=${expand}&$top=50`
      )
      
      return response.value.map((ref: any) => ({
        referralid: ref.msdyn_referralid,
        name: ref.msdyn_name,
        partneraccount: ref.msdyn_partneraccount ? {
          name: ref.msdyn_partneraccount.name,
          accountid: ref.msdyn_partneraccount.accountid,
        } : undefined,
        opportunityid: opportunityId,
        statecode: ref.statecode,
        createdon: ref.createdon,
      }))
    } catch (error) {
      console.warn('Error fetching partner referrals:', error)
      return []
    }
  }

  /**
   * Check if a specific partner is already linked to an opportunity
   */
  async isPartnerLinkedToOpportunity(opportunityId: string, partnerName: string): Promise<{
    linked: boolean
    referral?: MSXPartnerReferral
  }> {
    const referrals = await this.getPartnerReferralsForOpportunity(opportunityId)
    
    // Check if any referral matches the partner name (case-insensitive)
    const matchingReferral = referrals.find(ref => 
      ref.partneraccount?.name.toLowerCase().includes(partnerName.toLowerCase()) ||
      partnerName.toLowerCase().includes(ref.partneraccount?.name.toLowerCase() || '')
    )

    return {
      linked: !!matchingReferral,
      referral: matchingReferral,
    }
  }

  /**
   * Comprehensive check for partner engagement status
   * Determines if: 
   * - A new opportunity needs to be created
   * - A partner needs to be linked to an existing opportunity
   * - The partner is already linked (no action needed)
   */
  async checkPartnerEngagement(
    customerName: string,
    partnerName: string
  ): Promise<MSXPartnerEngagementCheck> {
    // First, check if opportunity exists for this customer
    const opportunityResult = await this.checkExistingOpportunities(customerName)

    if (!opportunityResult.found || opportunityResult.opportunities.length === 0) {
      // No opportunity exists - need to create new
      return {
        opportunityExists: false,
        partnerAlreadyLinked: false,
        action: 'create_opportunity',
      }
    }

    // Opportunity exists - check if partner is already linked
    const opportunity = opportunityResult.opportunities[0]
    const partnerCheck = await this.isPartnerLinkedToOpportunity(
      opportunity.opportunityid,
      partnerName
    )

    if (partnerCheck.linked) {
      // Partner already linked to this opportunity
      return {
        opportunityExists: true,
        opportunity,
        partnerAlreadyLinked: true,
        existingReferral: partnerCheck.referral,
        action: 'already_linked',
      }
    }

    // Opportunity exists but partner not linked - need to link
    return {
      opportunityExists: true,
      opportunity,
      partnerAlreadyLinked: false,
      action: 'link_partner',
    }
  }
}

export const msxService = new MSXService()
