import sql from 'mssql'
import { connectToDatabase } from './databaseService.js'
import type {
  ScanSession,
  CreateScanSessionInput,
  DetectedOpportunityRecord,
  CreateDetectedOpportunityInput,
  UpdateOpportunityReviewInput,
  UpdateOpportunitySyncInput,
  OpportunityAction,
  CreateOpportunityActionInput,
  ScanResultsSummary,
  CompleteScanResult,
  ScanSessionSearchParams,
  DetectedOpportunitySearchParams,
  ScanStatus
} from '../types/fabricTypes.js'

// Table names for scan results
const tables = {
  scanSessions: 'dbo.ScanSessions',
  detectedOpportunities: 'dbo.DetectedOpportunities',
  opportunityActions: 'dbo.OpportunityActions',
  scanResultsSummary: 'dbo.vw_ScanResultsSummary'
}

// ============================================
// SCAN SESSIONS
// ============================================

/**
 * Create a new scan session
 */
export async function createScanSession(input: CreateScanSessionInput): Promise<ScanSession> {
  const connection = await connectToDatabase()
  const request = connection.request()
  
  const scanId = crypto.randomUUID()
  
  request.input('ScanId', sql.UniqueIdentifier, scanId)
  request.input('ScanName', sql.NVarChar(255), input.ScanName || null)
  request.input('ScanType', sql.NVarChar(50), input.ScanType)
  request.input('ScanDateRangeStart', sql.DateTime2, input.ScanDateRangeStart)
  request.input('ScanDateRangeEnd', sql.DateTime2, input.ScanDateRangeEnd)
  request.input('SourcesScanned', sql.NVarChar(100), input.SourcesScanned.join(','))
  request.input('KeywordsUsed', sql.NVarChar(sql.MAX), input.KeywordsUsed ? JSON.stringify(input.KeywordsUsed) : null)
  request.input('ScannedByUserId', sql.NVarChar(255), input.ScannedByUserId || null)
  request.input('ScannedByUserEmail', sql.NVarChar(255), input.ScannedByUserEmail || null)
  request.input('ScannedByUserName', sql.NVarChar(255), input.ScannedByUserName || null)
  
  await request.query(`
    INSERT INTO ${tables.scanSessions} (
      ScanId, ScanName, ScanType, ScanDateRangeStart, ScanDateRangeEnd,
      SourcesScanned, KeywordsUsed, ScannedByUserId, ScannedByUserEmail, ScannedByUserName,
      ScanStatus, TotalCommunicationsScanned, OpportunitiesDetected,
      HighConfidenceCount, MediumConfidenceCount, LowConfidenceCount
    ) VALUES (
      @ScanId, @ScanName, @ScanType, @ScanDateRangeStart, @ScanDateRangeEnd,
      @SourcesScanned, @KeywordsUsed, @ScannedByUserId, @ScannedByUserEmail, @ScannedByUserName,
      'in_progress', 0, 0, 0, 0, 0
    )
  `)
  
  const result = await getScanSessionById(scanId)
  if (!result) {
    throw new Error('Failed to create scan session')
  }
  
  return result
}

/**
 * Get a scan session by ID
 */
export async function getScanSessionById(scanId: string): Promise<ScanSession | null> {
  const connection = await connectToDatabase()
  const request = connection.request()
  
  request.input('ScanId', sql.UniqueIdentifier, scanId)
  
  const result = await request.query<ScanSession>(`
    SELECT * FROM ${tables.scanSessions}
    WHERE ScanId = @ScanId
  `)
  
  return result.recordset.length > 0 ? result.recordset[0] : null
}

/**
 * Update scan session upon completion
 */
export async function completeScanSession(
  scanId: string,
  stats: {
    totalCommunications: number
    opportunitiesDetected: number
    highConfidenceCount: number
    mediumConfidenceCount: number
    lowConfidenceCount: number
  },
  status: ScanStatus = 'completed',
  errorMessage?: string
): Promise<ScanSession | null> {
  const connection = await connectToDatabase()
  const request = connection.request()
  
  const completedAt = new Date()
  
  request.input('ScanId', sql.UniqueIdentifier, scanId)
  request.input('TotalCommunicationsScanned', sql.Int, stats.totalCommunications)
  request.input('OpportunitiesDetected', sql.Int, stats.opportunitiesDetected)
  request.input('HighConfidenceCount', sql.Int, stats.highConfidenceCount)
  request.input('MediumConfidenceCount', sql.Int, stats.mediumConfidenceCount)
  request.input('LowConfidenceCount', sql.Int, stats.lowConfidenceCount)
  request.input('ScanCompletedAt', sql.DateTime2, completedAt)
  request.input('ScanStatus', sql.NVarChar(50), status)
  request.input('ErrorMessage', sql.NVarChar(sql.MAX), errorMessage || null)
  
  await request.query(`
    UPDATE ${tables.scanSessions}
    SET 
      TotalCommunicationsScanned = @TotalCommunicationsScanned,
      OpportunitiesDetected = @OpportunitiesDetected,
      HighConfidenceCount = @HighConfidenceCount,
      MediumConfidenceCount = @MediumConfidenceCount,
      LowConfidenceCount = @LowConfidenceCount,
      ScanCompletedAt = @ScanCompletedAt,
      ScanDurationSeconds = DATEDIFF(SECOND, ScanStartedAt, @ScanCompletedAt),
      ScanStatus = @ScanStatus,
      ErrorMessage = @ErrorMessage,
      ModifiedAt = GETUTCDATE()
    WHERE ScanId = @ScanId
  `)
  
  return getScanSessionById(scanId)
}

/**
 * Get scan sessions with optional filtering
 */
export async function getScanSessions(params?: ScanSessionSearchParams): Promise<ScanSession[]> {
  const connection = await connectToDatabase()
  const request = connection.request()
  
  let query = `SELECT * FROM ${tables.scanSessions}`
  const conditions: string[] = []
  
  if (params?.userId) {
    conditions.push('ScannedByUserId = @userId')
    request.input('userId', sql.NVarChar(255), params.userId)
  }
  
  if (params?.status) {
    conditions.push('ScanStatus = @status')
    request.input('status', sql.NVarChar(50), params.status)
  }
  
  if (params?.scanType) {
    conditions.push('ScanType = @scanType')
    request.input('scanType', sql.NVarChar(50), params.scanType)
  }
  
  if (params?.fromDate) {
    conditions.push('ScanStartedAt >= @fromDate')
    request.input('fromDate', sql.DateTime2, params.fromDate)
  }
  
  if (params?.toDate) {
    conditions.push('ScanStartedAt <= @toDate')
    request.input('toDate', sql.DateTime2, params.toDate)
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ')
  }
  
  query += ' ORDER BY ScanStartedAt DESC'
  
  if (params?.limit) {
    query = `SELECT TOP ${params.limit} * FROM (${query}) AS t`
  }
  
  const result = await request.query<ScanSession>(query)
  return result.recordset
}

/**
 * Get scan results summary (from view)
 */
export async function getScanResultsSummary(limit: number = 20): Promise<ScanResultsSummary[]> {
  const connection = await connectToDatabase()
  const request = connection.request()
  
  const result = await request.query<ScanResultsSummary>(`
    SELECT TOP ${limit} * FROM ${tables.scanResultsSummary}
    ORDER BY ScanStartedAt DESC
  `)
  
  return result.recordset
}

// ============================================
// DETECTED OPPORTUNITIES
// ============================================

/**
 * Create a detected opportunity record
 */
export async function createDetectedOpportunity(input: CreateDetectedOpportunityInput): Promise<DetectedOpportunityRecord> {
  const connection = await connectToDatabase()
  const request = connection.request()
  
  const opportunityId = crypto.randomUUID()
  
  request.input('DetectedOpportunityId', sql.UniqueIdentifier, opportunityId)
  request.input('ScanId', sql.UniqueIdentifier, input.ScanId)
  request.input('CommunicationId', sql.NVarChar(255), input.CommunicationId)
  request.input('CommunicationType', sql.NVarChar(50), input.CommunicationType)
  request.input('CommunicationSubject', sql.NVarChar(500), input.CommunicationSubject || null)
  request.input('CommunicationFrom', sql.NVarChar(255), input.CommunicationFrom || null)
  request.input('CommunicationDate', sql.DateTime2, input.CommunicationDate || null)
  request.input('CommunicationPreview', sql.NVarChar(500), input.CommunicationPreview?.substring(0, 500) || null)
  request.input('CommunicationContent', sql.NVarChar(sql.MAX), input.CommunicationContent || null)
  request.input('PartnerName', sql.NVarChar(255), input.PartnerName || null)
  request.input('PartnerConfidence', sql.Decimal(5, 4), input.PartnerConfidence || null)
  request.input('CustomerName', sql.NVarChar(255), input.CustomerName || null)
  request.input('CustomerConfidence', sql.Decimal(5, 4), input.CustomerConfidence || null)
  request.input('Summary', sql.NVarChar(sql.MAX), input.Summary || null)
  request.input('DetectedKeywords', sql.NVarChar(sql.MAX), input.DetectedKeywords ? JSON.stringify(input.DetectedKeywords) : null)
  request.input('OverallConfidence', sql.Decimal(5, 4), input.OverallConfidence)
  request.input('SuggestedCRMAction', sql.NVarChar(50), input.SuggestedCRMAction || null)
  request.input('LinkedOpportunityId', sql.NVarChar(255), input.LinkedOpportunityId || null)
  request.input('EstimatedDealSize', sql.NVarChar(100), input.EstimatedDealSize || null)
  request.input('EstimatedTimeline', sql.NVarChar(100), input.EstimatedTimeline || null)
  
  await request.query(`
    INSERT INTO ${tables.detectedOpportunities} (
      DetectedOpportunityId, ScanId, CommunicationId, CommunicationType,
      CommunicationSubject, CommunicationFrom, CommunicationDate,
      CommunicationPreview, CommunicationContent,
      PartnerName, PartnerConfidence, CustomerName, CustomerConfidence,
      Summary, DetectedKeywords, OverallConfidence,
      SuggestedCRMAction, LinkedOpportunityId,
      EstimatedDealSize, EstimatedTimeline,
      ReviewStatus, SyncStatus
    ) VALUES (
      @DetectedOpportunityId, @ScanId, @CommunicationId, @CommunicationType,
      @CommunicationSubject, @CommunicationFrom, @CommunicationDate,
      @CommunicationPreview, @CommunicationContent,
      @PartnerName, @PartnerConfidence, @CustomerName, @CustomerConfidence,
      @Summary, @DetectedKeywords, @OverallConfidence,
      @SuggestedCRMAction, @LinkedOpportunityId,
      @EstimatedDealSize, @EstimatedTimeline,
      'pending', 'not_synced'
    )
  `)
  
  const result = await getDetectedOpportunityById(opportunityId)
  if (!result) {
    throw new Error('Failed to create detected opportunity')
  }
  
  return result
}

/**
 * Create multiple detected opportunities in a batch
 */
export async function createDetectedOpportunitiesBatch(inputs: CreateDetectedOpportunityInput[]): Promise<string[]> {
  const ids: string[] = []
  
  for (const input of inputs) {
    const record = await createDetectedOpportunity(input)
    ids.push(record.DetectedOpportunityId)
  }
  
  return ids
}

/**
 * Get a detected opportunity by ID
 */
export async function getDetectedOpportunityById(opportunityId: string): Promise<DetectedOpportunityRecord | null> {
  const connection = await connectToDatabase()
  const request = connection.request()
  
  request.input('DetectedOpportunityId', sql.UniqueIdentifier, opportunityId)
  
  const result = await request.query<DetectedOpportunityRecord>(`
    SELECT * FROM ${tables.detectedOpportunities}
    WHERE DetectedOpportunityId = @DetectedOpportunityId
  `)
  
  return result.recordset.length > 0 ? result.recordset[0] : null
}

/**
 * Get detected opportunities with filtering
 */
export async function getDetectedOpportunities(params?: DetectedOpportunitySearchParams): Promise<DetectedOpportunityRecord[]> {
  const connection = await connectToDatabase()
  const request = connection.request()
  
  let query = `SELECT * FROM ${tables.detectedOpportunities}`
  const conditions: string[] = []
  
  if (params?.scanId) {
    conditions.push('ScanId = @scanId')
    request.input('scanId', sql.UniqueIdentifier, params.scanId)
  }
  
  if (params?.reviewStatus) {
    conditions.push('ReviewStatus = @reviewStatus')
    request.input('reviewStatus', sql.NVarChar(50), params.reviewStatus)
  }
  
  if (params?.syncStatus) {
    conditions.push('SyncStatus = @syncStatus')
    request.input('syncStatus', sql.NVarChar(50), params.syncStatus)
  }
  
  if (params?.partnerName) {
    conditions.push('PartnerName LIKE @partnerName')
    request.input('partnerName', sql.NVarChar(255), `%${params.partnerName}%`)
  }
  
  if (params?.customerName) {
    conditions.push('CustomerName LIKE @customerName')
    request.input('customerName', sql.NVarChar(255), `%${params.customerName}%`)
  }
  
  if (params?.minConfidence !== undefined) {
    conditions.push('OverallConfidence >= @minConfidence')
    request.input('minConfidence', sql.Decimal(5, 4), params.minConfidence)
  }
  
  if (params?.fromDate) {
    conditions.push('CreatedAt >= @fromDate')
    request.input('fromDate', sql.DateTime2, params.fromDate)
  }
  
  if (params?.toDate) {
    conditions.push('CreatedAt <= @toDate')
    request.input('toDate', sql.DateTime2, params.toDate)
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ')
  }
  
  query += ' ORDER BY CreatedAt DESC'
  
  if (params?.limit) {
    query = `SELECT TOP ${params.limit} * FROM (${query}) AS t`
  }
  
  const result = await request.query<DetectedOpportunityRecord>(query)
  return result.recordset
}

/**
 * Get opportunities for a specific scan
 */
export async function getOpportunitiesByScan(scanId: string): Promise<DetectedOpportunityRecord[]> {
  return getDetectedOpportunities({ scanId })
}

/**
 * Update opportunity review status
 */
export async function updateOpportunityReview(input: UpdateOpportunityReviewInput): Promise<DetectedOpportunityRecord | null> {
  const connection = await connectToDatabase()
  const request = connection.request()
  
  // Get current state for action log
  const current = await getDetectedOpportunityById(input.DetectedOpportunityId)
  
  request.input('DetectedOpportunityId', sql.UniqueIdentifier, input.DetectedOpportunityId)
  request.input('ReviewStatus', sql.NVarChar(50), input.ReviewStatus)
  request.input('ReviewedByUserId', sql.NVarChar(255), input.ReviewedByUserId || null)
  request.input('ReviewedByUserEmail', sql.NVarChar(255), input.ReviewedByUserEmail || null)
  request.input('ReviewNotes', sql.NVarChar(sql.MAX), input.ReviewNotes || null)
  request.input('ReviewedAt', sql.DateTime2, new Date())
  
  await request.query(`
    UPDATE ${tables.detectedOpportunities}
    SET 
      ReviewStatus = @ReviewStatus,
      ReviewedByUserId = @ReviewedByUserId,
      ReviewedByUserEmail = @ReviewedByUserEmail,
      ReviewNotes = @ReviewNotes,
      ReviewedAt = @ReviewedAt,
      ModifiedAt = GETUTCDATE()
    WHERE DetectedOpportunityId = @DetectedOpportunityId
  `)
  
  // Log the action
  if (current) {
    await createOpportunityAction({
      DetectedOpportunityId: input.DetectedOpportunityId,
      ActionType: input.ReviewStatus === 'confirmed' ? 'confirmed' : 
                  input.ReviewStatus === 'rejected' ? 'rejected' : 'reviewed',
      ActionDescription: `Review status changed to ${input.ReviewStatus}`,
      PreviousValue: { reviewStatus: current.ReviewStatus },
      NewValue: { reviewStatus: input.ReviewStatus, notes: input.ReviewNotes },
      ActionByUserId: input.ReviewedByUserId,
      ActionByUserEmail: input.ReviewedByUserEmail
    })
  }
  
  return getDetectedOpportunityById(input.DetectedOpportunityId)
}

/**
 * Update opportunity sync status
 */
export async function updateOpportunitySync(input: UpdateOpportunitySyncInput): Promise<DetectedOpportunityRecord | null> {
  const connection = await connectToDatabase()
  const request = connection.request()
  
  // Get current state for action log
  const current = await getDetectedOpportunityById(input.DetectedOpportunityId)
  
  request.input('DetectedOpportunityId', sql.UniqueIdentifier, input.DetectedOpportunityId)
  request.input('SyncStatus', sql.NVarChar(50), input.SyncStatus)
  request.input('SyncedToOpportunityId', sql.NVarChar(255), input.SyncedToOpportunityId || null)
  request.input('SyncErrorMessage', sql.NVarChar(sql.MAX), input.SyncErrorMessage || null)
  
  let syncedAt = null
  if (input.SyncStatus === 'synced') {
    syncedAt = new Date()
  }
  request.input('SyncedAt', sql.DateTime2, syncedAt)
  
  await request.query(`
    UPDATE ${tables.detectedOpportunities}
    SET 
      SyncStatus = @SyncStatus,
      SyncedToOpportunityId = @SyncedToOpportunityId,
      SyncedAt = @SyncedAt,
      SyncErrorMessage = @SyncErrorMessage,
      ReviewStatus = CASE WHEN @SyncStatus = 'synced' THEN 'synced' ELSE ReviewStatus END,
      ModifiedAt = GETUTCDATE()
    WHERE DetectedOpportunityId = @DetectedOpportunityId
  `)
  
  // Log the action
  if (current) {
    await createOpportunityAction({
      DetectedOpportunityId: input.DetectedOpportunityId,
      ActionType: input.SyncStatus === 'synced' ? 'synced' : 'updated',
      ActionDescription: `Sync status changed to ${input.SyncStatus}`,
      PreviousValue: { syncStatus: current.SyncStatus },
      NewValue: { 
        syncStatus: input.SyncStatus, 
        syncedToOpportunityId: input.SyncedToOpportunityId 
      }
    })
  }
  
  return getDetectedOpportunityById(input.DetectedOpportunityId)
}

/**
 * Bulk update review status for multiple opportunities
 */
export async function bulkUpdateReviewStatus(
  opportunityIds: string[],
  reviewStatus: 'pending' | 'confirmed' | 'rejected' | 'synced',
  userId?: string,
  userEmail?: string
): Promise<number> {
  let updated = 0
  
  for (const id of opportunityIds) {
    await updateOpportunityReview({
      DetectedOpportunityId: id,
      ReviewStatus: reviewStatus,
      ReviewedByUserId: userId,
      ReviewedByUserEmail: userEmail
    })
    updated++
  }
  
  return updated
}

// ============================================
// OPPORTUNITY ACTIONS (AUDIT LOG)
// ============================================

/**
 * Create an action log entry
 */
export async function createOpportunityAction(input: CreateOpportunityActionInput): Promise<OpportunityAction> {
  const connection = await connectToDatabase()
  const request = connection.request()
  
  const actionId = crypto.randomUUID()
  
  request.input('ActionId', sql.UniqueIdentifier, actionId)
  request.input('DetectedOpportunityId', sql.UniqueIdentifier, input.DetectedOpportunityId)
  request.input('ActionType', sql.NVarChar(50), input.ActionType)
  request.input('ActionDescription', sql.NVarChar(500), input.ActionDescription || null)
  request.input('PreviousValue', sql.NVarChar(sql.MAX), input.PreviousValue ? JSON.stringify(input.PreviousValue) : null)
  request.input('NewValue', sql.NVarChar(sql.MAX), input.NewValue ? JSON.stringify(input.NewValue) : null)
  request.input('ActionByUserId', sql.NVarChar(255), input.ActionByUserId || null)
  request.input('ActionByUserEmail', sql.NVarChar(255), input.ActionByUserEmail || null)
  request.input('ActionByUserName', sql.NVarChar(255), input.ActionByUserName || null)
  
  await request.query(`
    INSERT INTO ${tables.opportunityActions} (
      ActionId, DetectedOpportunityId, ActionType, ActionDescription,
      PreviousValue, NewValue,
      ActionByUserId, ActionByUserEmail, ActionByUserName
    ) VALUES (
      @ActionId, @DetectedOpportunityId, @ActionType, @ActionDescription,
      @PreviousValue, @NewValue,
      @ActionByUserId, @ActionByUserEmail, @ActionByUserName
    )
  `)
  
  const result = await getOpportunityActionById(actionId)
  if (!result) {
    throw new Error('Failed to create action log entry')
  }
  
  return result
}

/**
 * Get an action log entry by ID
 */
export async function getOpportunityActionById(actionId: string): Promise<OpportunityAction | null> {
  const connection = await connectToDatabase()
  const request = connection.request()
  
  request.input('ActionId', sql.UniqueIdentifier, actionId)
  
  const result = await request.query<OpportunityAction>(`
    SELECT * FROM ${tables.opportunityActions}
    WHERE ActionId = @ActionId
  `)
  
  return result.recordset.length > 0 ? result.recordset[0] : null
}

/**
 * Get action history for an opportunity
 */
export async function getOpportunityActions(opportunityId: string): Promise<OpportunityAction[]> {
  const connection = await connectToDatabase()
  const request = connection.request()
  
  request.input('DetectedOpportunityId', sql.UniqueIdentifier, opportunityId)
  
  const result = await request.query<OpportunityAction>(`
    SELECT * FROM ${tables.opportunityActions}
    WHERE DetectedOpportunityId = @DetectedOpportunityId
    ORDER BY ActionAt DESC
  `)
  
  return result.recordset
}

// ============================================
// COMPLETE SCAN WORKFLOW
// ============================================

/**
 * Save a complete scan result (session + all opportunities)
 */
export async function saveCompleteScanResult(
  sessionInput: CreateScanSessionInput,
  opportunities: CreateDetectedOpportunityInput[],
  totalCommunicationsScanned: number
): Promise<CompleteScanResult> {
  // Create the scan session
  const session = await createScanSession(sessionInput)
  
  // Create all detected opportunities
  const savedOpportunities: DetectedOpportunityRecord[] = []
  let highConfidence = 0
  let mediumConfidence = 0
  let lowConfidence = 0
  
  for (const oppInput of opportunities) {
    const opp = await createDetectedOpportunity({
      ...oppInput,
      ScanId: session.ScanId
    })
    savedOpportunities.push(opp)
    
    // Count confidence levels
    if (opp.OverallConfidence >= 0.8) {
      highConfidence++
    } else if (opp.OverallConfidence >= 0.5) {
      mediumConfidence++
    } else {
      lowConfidence++
    }
  }
  
  // Complete the scan session with statistics
  const completedSession = await completeScanSession(session.ScanId, {
    totalCommunications: totalCommunicationsScanned,
    opportunitiesDetected: savedOpportunities.length,
    highConfidenceCount: highConfidence,
    mediumConfidenceCount: mediumConfidence,
    lowConfidenceCount: lowConfidence
  })
  
  return {
    session: completedSession || session,
    opportunities: savedOpportunities
  }
}

/**
 * Get a complete scan result by scan ID
 */
export async function getCompleteScanResult(scanId: string): Promise<CompleteScanResult | null> {
  const session = await getScanSessionById(scanId)
  if (!session) {
    return null
  }
  
  const opportunities = await getOpportunitiesByScan(scanId)
  
  return {
    session,
    opportunities
  }
}

/**
 * Delete a scan session and all its opportunities
 */
export async function deleteScanSession(scanId: string): Promise<boolean> {
  const connection = await connectToDatabase()
  const request = connection.request()
  
  request.input('ScanId', sql.UniqueIdentifier, scanId)
  
  // Due to CASCADE, this will delete opportunities and actions too
  const result = await request.query(`
    DELETE FROM ${tables.scanSessions}
    WHERE ScanId = @ScanId
  `)
  
  return (result.rowsAffected[0] || 0) > 0
}
