import { Router, Request, Response } from 'express'
import {
  getOpportunities,
  getOpportunityById,
  getPartnerReferrals,
  getPartnerReferralById,
  getOpportunitiesWithReferrals,
  getDashboardMetrics,
  searchOpportunitiesAndReferrals
} from '../services/databaseService.js'
import type { ApiResponse, FabricOpportunity, FabricPartnerReferral, OpportunityWithReferrals, FabricDashboardMetrics } from '../types/fabricTypes.js'

export const databaseRouter = Router()

/**
 * GET /api/opportunities
 * Get all opportunities with optional filtering
 */
databaseRouter.get('/opportunities', async (req: Request, res: Response) => {
  try {
    const { partnerId, customerId, status, fromDate, toDate, searchText, limit } = req.query
    
    const params = {
      partnerId: partnerId as string | undefined,
      customerId: customerId as string | undefined,
      status: status as string | undefined,
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined,
      searchText: searchText as string | undefined,
      limit: limit ? parseInt(limit as string) : undefined
    }
    
    const opportunities = await getOpportunities(params)
    
    const response: ApiResponse<FabricOpportunity[]> = {
      success: true,
      data: opportunities,
      count: opportunities.length
    }
    
    res.json(response)
  } catch (error) {
    console.error('Error fetching opportunities:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
    res.status(500).json(response)
  }
})

/**
 * GET /api/opportunities/:id
 * Get a single opportunity by ID
 */
databaseRouter.get('/opportunities/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const opportunity = await getOpportunityById(id)
    
    if (!opportunity) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Opportunity not found'
      }
      return res.status(404).json(response)
    }
    
    const response: ApiResponse<FabricOpportunity> = {
      success: true,
      data: opportunity
    }
    
    res.json(response)
  } catch (error) {
    console.error('Error fetching opportunity:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
    res.status(500).json(response)
  }
})

/**
 * GET /api/opportunities/:id/referrals
 * Get referrals for a specific opportunity
 */
databaseRouter.get('/opportunities/:id/referrals', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const referrals = await getPartnerReferrals({ opportunityId: id })
    
    const response: ApiResponse<FabricPartnerReferral[]> = {
      success: true,
      data: referrals,
      count: referrals.length
    }
    
    res.json(response)
  } catch (error) {
    console.error('Error fetching referrals:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
    res.status(500).json(response)
  }
})

/**
 * GET /api/referrals
 * Get all partner referrals with optional filtering
 */
databaseRouter.get('/referrals', async (req: Request, res: Response) => {
  try {
    const { opportunityId, partnerId, referralStatus, fromDate, toDate, limit } = req.query
    
    const params = {
      opportunityId: opportunityId as string | undefined,
      partnerId: partnerId as string | undefined,
      referralStatus: referralStatus as string | undefined,
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    }
    
    const referrals = await getPartnerReferrals(params)
    
    const response: ApiResponse<FabricPartnerReferral[]> = {
      success: true,
      data: referrals,
      count: referrals.length
    }
    
    res.json(response)
  } catch (error) {
    console.error('Error fetching referrals:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
    res.status(500).json(response)
  }
})

/**
 * GET /api/referrals/:id
 * Get a single referral by ID
 */
databaseRouter.get('/referrals/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const referral = await getPartnerReferralById(id)
    
    if (!referral) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Referral not found'
      }
      return res.status(404).json(response)
    }
    
    const response: ApiResponse<FabricPartnerReferral> = {
      success: true,
      data: referral
    }
    
    res.json(response)
  } catch (error) {
    console.error('Error fetching referral:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
    res.status(500).json(response)
  }
})

/**
 * GET /api/opportunities-with-referrals
 * Get opportunities with their associated referrals
 */
databaseRouter.get('/opportunities-with-referrals', async (req: Request, res: Response) => {
  try {
    const { partnerId, customerId, status, fromDate, toDate, searchText, limit } = req.query
    
    const params = {
      partnerId: partnerId as string | undefined,
      customerId: customerId as string | undefined,
      status: status as string | undefined,
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined,
      searchText: searchText as string | undefined,
      limit: limit ? parseInt(limit as string) : undefined
    }
    
    const data = await getOpportunitiesWithReferrals(params)
    
    const response: ApiResponse<OpportunityWithReferrals[]> = {
      success: true,
      data,
      count: data.length
    }
    
    res.json(response)
  } catch (error) {
    console.error('Error fetching opportunities with referrals:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
    res.status(500).json(response)
  }
})

/**
 * GET /api/dashboard/metrics
 * Get dashboard metrics from the database
 */
databaseRouter.get('/dashboard/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await getDashboardMetrics()
    
    const response: ApiResponse<FabricDashboardMetrics> = {
      success: true,
      data: metrics
    }
    
    res.json(response)
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
    res.status(500).json(response)
  }
})

/**
 * GET /api/search
 * Search across opportunities and referrals
 */
databaseRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, limit } = req.query
    
    if (!q || typeof q !== 'string') {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Search query (q) is required'
      }
      return res.status(400).json(response)
    }
    
    const searchLimit = limit ? parseInt(limit as string) : 50
    const results = await searchOpportunitiesAndReferrals(q, searchLimit)
    
    const response: ApiResponse<{ opportunities: FabricOpportunity[]; referrals: FabricPartnerReferral[] }> = {
      success: true,
      data: results,
      count: results.opportunities.length + results.referrals.length
    }
    
    res.json(response)
  } catch (error) {
    console.error('Error searching:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
    res.status(500).json(response)
  }
})
