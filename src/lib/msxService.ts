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

export interface MSXMatchResult {
  found: boolean
  opportunities: MSXOpportunity[]
  matchedAccount?: MSXAccount
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
}

export const msxService = new MSXService()
