import { Router, Request, Response } from 'express'
import {
  createScanSession,
  getScanSessionById,
  completeScanSession,
  getScanSessions,
  getScanResultsSummary,
  createDetectedOpportunity,
  createDetectedOpportunitiesBatch,
  getDetectedOpportunityById,
  getDetectedOpportunities,
  getOpportunitiesByScan,
  updateOpportunityReview,
  updateOpportunitySync,
  bulkUpdateReviewStatus,
  getOpportunityActions,
  saveCompleteScanResult,
  getCompleteScanResult,
  deleteScanSession
} from '../services/scanResultsService.js'
import type {
  ApiResponse,
  ScanSession,
  DetectedOpportunityRecord,
  OpportunityAction,
  CompleteScanResult,
  ScanResultsSummary,
  CreateScanSessionInput,
  CreateDetectedOpportunityInput,
  UpdateOpportunityReviewInput,
  UpdateOpportunitySyncInput,
  ScanStatus,
  ReviewStatus
} from '../types/fabricTypes.js'

export const scanResultsRouter = Router()

// ============================================
// SCAN SESSIONS ENDPOINTS
// ============================================

/**
 * POST /api/scans
 * Create a new scan session
 */
scanResultsRouter.post('/scans', async (req: Request, res: Response) => {
  try {
    const input: CreateScanSessionInput = req.body
    
    // Validate required fields
    if (!input.ScanType || !input.ScanDateRangeStart || !input.ScanDateRangeEnd || !input.SourcesScanned) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: ScanType, ScanDateRangeStart, ScanDateRangeEnd, SourcesScanned'
      } as ApiResponse<null>)
    }
    
    const session = await createScanSession(input)
    
    res.status(201).json({
      success: true,
      data: session,
      message: 'Scan session created'
    } as ApiResponse<ScanSession>)
  } catch (error) {
    console.error('Error creating scan session:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<null>)
  }
})

/**
 * GET /api/scans
 * Get all scan sessions with optional filtering
 */
scanResultsRouter.get('/scans', async (req: Request, res: Response) => {
  try {
    const { userId, status, scanType, fromDate, toDate, limit } = req.query
    
    const sessions = await getScanSessions({
      userId: userId as string,
      status: status as ScanStatus,
      scanType: scanType as 'manual' | 'scheduled' | 'incremental',
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    })
    
    res.json({
      success: true,
      data: sessions,
      count: sessions.length
    } as ApiResponse<ScanSession[]>)
  } catch (error) {
    console.error('Error fetching scan sessions:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<null>)
  }
})

/**
 * GET /api/scans/summary
 * Get scan results summary
 */
scanResultsRouter.get('/scans/summary', async (req: Request, res: Response) => {
  try {
    const { limit } = req.query
    const summary = await getScanResultsSummary(limit ? parseInt(limit as string) : 20)
    
    res.json({
      success: true,
      data: summary,
      count: summary.length
    } as ApiResponse<ScanResultsSummary[]>)
  } catch (error) {
    console.error('Error fetching scan summary:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<null>)
  }
})

/**
 * GET /api/scans/:id
 * Get a specific scan session by ID
 */
scanResultsRouter.get('/scans/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const session = await getScanSessionById(id)
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Scan session not found'
      } as ApiResponse<null>)
    }
    
    res.json({
      success: true,
      data: session
    } as ApiResponse<ScanSession>)
  } catch (error) {
    console.error('Error fetching scan session:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<null>)
  }
})

/**
 * GET /api/scans/:id/complete
 * Get complete scan result with all opportunities
 */
scanResultsRouter.get('/scans/:id/complete', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const result = await getCompleteScanResult(id)
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Scan session not found'
      } as ApiResponse<null>)
    }
    
    res.json({
      success: true,
      data: result
    } as ApiResponse<CompleteScanResult>)
  } catch (error) {
    console.error('Error fetching complete scan result:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<null>)
  }
})

/**
 * PUT /api/scans/:id/complete
 * Mark a scan session as completed
 */
scanResultsRouter.put('/scans/:id/complete', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { 
      totalCommunications, 
      opportunitiesDetected, 
      highConfidenceCount, 
      mediumConfidenceCount, 
      lowConfidenceCount, 
      status, 
      errorMessage 
    } = req.body
    
    const session = await completeScanSession(
      id,
      {
        totalCommunications: totalCommunications || 0,
        opportunitiesDetected: opportunitiesDetected || 0,
        highConfidenceCount: highConfidenceCount || 0,
        mediumConfidenceCount: mediumConfidenceCount || 0,
        lowConfidenceCount: lowConfidenceCount || 0
      },
      status || 'completed',
      errorMessage
    )
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Scan session not found'
      } as ApiResponse<null>)
    }
    
    res.json({
      success: true,
      data: session,
      message: 'Scan session completed'
    } as ApiResponse<ScanSession>)
  } catch (error) {
    console.error('Error completing scan session:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<null>)
  }
})

/**
 * DELETE /api/scans/:id
 * Delete a scan session and all its data
 */
scanResultsRouter.delete('/scans/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const deleted = await deleteScanSession(id)
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Scan session not found'
      } as ApiResponse<null>)
    }
    
    res.json({
      success: true,
      message: 'Scan session deleted'
    } as ApiResponse<null>)
  } catch (error) {
    console.error('Error deleting scan session:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<null>)
  }
})

// ============================================
// DETECTED OPPORTUNITIES ENDPOINTS
// ============================================

/**
 * POST /api/scans/:id/opportunities
 * Add a detected opportunity to a scan
 */
scanResultsRouter.post('/scans/:id/opportunities', async (req: Request, res: Response) => {
  try {
    const { id: scanId } = req.params
    const input: CreateDetectedOpportunityInput = { ...req.body, ScanId: scanId }
    
    // Validate required fields
    if (!input.CommunicationId || !input.CommunicationType || input.OverallConfidence === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: CommunicationId, CommunicationType, OverallConfidence'
      } as ApiResponse<null>)
    }
    
    const opportunity = await createDetectedOpportunity(input)
    
    res.status(201).json({
      success: true,
      data: opportunity,
      message: 'Detected opportunity created'
    } as ApiResponse<DetectedOpportunityRecord>)
  } catch (error) {
    console.error('Error creating detected opportunity:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<null>)
  }
})

/**
 * POST /api/scans/:id/opportunities/batch
 * Add multiple detected opportunities to a scan
 */
scanResultsRouter.post('/scans/:id/opportunities/batch', async (req: Request, res: Response) => {
  try {
    const { id: scanId } = req.params
    const { opportunities } = req.body as { opportunities: CreateDetectedOpportunityInput[] }
    
    if (!opportunities || !Array.isArray(opportunities)) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid opportunities array'
      } as ApiResponse<null>)
    }
    
    const inputsWithScanId = opportunities.map(o => ({ ...o, ScanId: scanId }))
    const ids = await createDetectedOpportunitiesBatch(inputsWithScanId)
    
    res.status(201).json({
      success: true,
      data: ids,
      count: ids.length,
      message: `Created ${ids.length} detected opportunities`
    } as ApiResponse<string[]>)
  } catch (error) {
    console.error('Error creating opportunities batch:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<null>)
  }
})

/**
 * GET /api/scans/:id/opportunities
 * Get all opportunities for a scan
 */
scanResultsRouter.get('/scans/:id/opportunities', async (req: Request, res: Response) => {
  try {
    const { id: scanId } = req.params
    const opportunities = await getOpportunitiesByScan(scanId)
    
    res.json({
      success: true,
      data: opportunities,
      count: opportunities.length
    } as ApiResponse<DetectedOpportunityRecord[]>)
  } catch (error) {
    console.error('Error fetching scan opportunities:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<null>)
  }
})

/**
 * GET /api/detected-opportunities
 * Get detected opportunities with filtering
 */
scanResultsRouter.get('/detected-opportunities', async (req: Request, res: Response) => {
  try {
    const { scanId, reviewStatus, syncStatus, partnerName, customerName, minConfidence, fromDate, toDate, limit } = req.query
    
    const opportunities = await getDetectedOpportunities({
      scanId: scanId as string,
      reviewStatus: reviewStatus as ReviewStatus,
      syncStatus: syncStatus as 'not_synced' | 'pending' | 'synced' | 'failed',
      partnerName: partnerName as string,
      customerName: customerName as string,
      minConfidence: minConfidence ? parseFloat(minConfidence as string) : undefined,
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    })
    
    res.json({
      success: true,
      data: opportunities,
      count: opportunities.length
    } as ApiResponse<DetectedOpportunityRecord[]>)
  } catch (error) {
    console.error('Error fetching detected opportunities:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<null>)
  }
})

/**
 * GET /api/detected-opportunities/:id
 * Get a specific detected opportunity
 */
scanResultsRouter.get('/detected-opportunities/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const opportunity = await getDetectedOpportunityById(id)
    
    if (!opportunity) {
      return res.status(404).json({
        success: false,
        error: 'Detected opportunity not found'
      } as ApiResponse<null>)
    }
    
    res.json({
      success: true,
      data: opportunity
    } as ApiResponse<DetectedOpportunityRecord>)
  } catch (error) {
    console.error('Error fetching detected opportunity:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<null>)
  }
})

/**
 * PUT /api/detected-opportunities/:id/review
 * Update opportunity review status
 */
scanResultsRouter.put('/detected-opportunities/:id/review', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { reviewStatus, reviewedByUserId, reviewedByUserEmail, reviewNotes } = req.body
    
    if (!reviewStatus) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: reviewStatus'
      } as ApiResponse<null>)
    }
    
    const opportunity = await updateOpportunityReview({
      DetectedOpportunityId: id,
      ReviewStatus: reviewStatus,
      ReviewedByUserId: reviewedByUserId,
      ReviewedByUserEmail: reviewedByUserEmail,
      ReviewNotes: reviewNotes
    })
    
    if (!opportunity) {
      return res.status(404).json({
        success: false,
        error: 'Detected opportunity not found'
      } as ApiResponse<null>)
    }
    
    res.json({
      success: true,
      data: opportunity,
      message: `Review status updated to ${reviewStatus}`
    } as ApiResponse<DetectedOpportunityRecord>)
  } catch (error) {
    console.error('Error updating review status:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<null>)
  }
})

/**
 * PUT /api/detected-opportunities/:id/sync
 * Update opportunity sync status
 */
scanResultsRouter.put('/detected-opportunities/:id/sync', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { syncStatus, syncedToOpportunityId, syncErrorMessage } = req.body
    
    if (!syncStatus) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: syncStatus'
      } as ApiResponse<null>)
    }
    
    const opportunity = await updateOpportunitySync({
      DetectedOpportunityId: id,
      SyncStatus: syncStatus,
      SyncedToOpportunityId: syncedToOpportunityId,
      SyncErrorMessage: syncErrorMessage
    })
    
    if (!opportunity) {
      return res.status(404).json({
        success: false,
        error: 'Detected opportunity not found'
      } as ApiResponse<null>)
    }
    
    res.json({
      success: true,
      data: opportunity,
      message: `Sync status updated to ${syncStatus}`
    } as ApiResponse<DetectedOpportunityRecord>)
  } catch (error) {
    console.error('Error updating sync status:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<null>)
  }
})

/**
 * PUT /api/detected-opportunities/bulk-review
 * Bulk update review status for multiple opportunities
 */
scanResultsRouter.put('/detected-opportunities/bulk-review', async (req: Request, res: Response) => {
  try {
    const { opportunityIds, reviewStatus, userId, userEmail } = req.body
    
    if (!opportunityIds || !Array.isArray(opportunityIds) || !reviewStatus) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: opportunityIds (array), reviewStatus'
      } as ApiResponse<null>)
    }
    
    const updated = await bulkUpdateReviewStatus(opportunityIds, reviewStatus, userId, userEmail)
    
    res.json({
      success: true,
      count: updated,
      message: `Updated ${updated} opportunities to ${reviewStatus}`
    } as ApiResponse<null>)
  } catch (error) {
    console.error('Error bulk updating review status:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<null>)
  }
})

/**
 * GET /api/detected-opportunities/:id/actions
 * Get action history for an opportunity
 */
scanResultsRouter.get('/detected-opportunities/:id/actions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const actions = await getOpportunityActions(id)
    
    res.json({
      success: true,
      data: actions,
      count: actions.length
    } as ApiResponse<OpportunityAction[]>)
  } catch (error) {
    console.error('Error fetching opportunity actions:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<null>)
  }
})

// ============================================
// COMPLETE SCAN WORKFLOW ENDPOINT
// ============================================

/**
 * POST /api/scans/complete
 * Save a complete scan result (session + opportunities in one call)
 */
scanResultsRouter.post('/scans/complete', async (req: Request, res: Response) => {
  try {
    const { session, opportunities, totalCommunicationsScanned } = req.body as {
      session: CreateScanSessionInput
      opportunities: CreateDetectedOpportunityInput[]
      totalCommunicationsScanned: number
    }
    
    // Validate required fields
    if (!session || !opportunities) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: session, opportunities'
      } as ApiResponse<null>)
    }
    
    const result = await saveCompleteScanResult(
      session,
      opportunities,
      totalCommunicationsScanned || opportunities.length
    )
    
    res.status(201).json({
      success: true,
      data: result,
      message: `Scan saved with ${result.opportunities.length} opportunities`
    } as ApiResponse<CompleteScanResult>)
  } catch (error) {
    console.error('Error saving complete scan result:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<null>)
  }
})
