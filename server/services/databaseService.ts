import sql from 'mssql'
import { databaseConfig, tables } from '../config/database.js'
import type { 
  FabricOpportunity, 
  FabricPartnerReferral,
  OpportunityWithReferrals,
  OpportunitySearchParams,
  PartnerReferralSearchParams 
} from '../types/fabricTypes.js'

// Store for user-token connections (keyed by token hash for safety)
const connectionCache = new Map<string, { pool: sql.ConnectionPool; expires: number }>()
const CONNECTION_TTL = 5 * 60 * 1000 // 5 minutes

// Simple hash function for token caching (not cryptographic, just for cache key)
function hashToken(token: string): string {
  let hash = 0
  for (let i = 0; i < token.length; i++) {
    const char = token.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(36)
}

// Store current request's token (set by middleware)
let currentUserToken: string | null = null

/**
 * Set the current user's SQL token (called from middleware)
 */
export function setUserToken(token: string | null): void {
  currentUserToken = token
}

/**
 * Get the current user's SQL token
 */
export function getUserToken(): string | null {
  return currentUserToken
}

/**
 * Connect to the Fabric SQL database with user-delegated authentication
 */
export async function connectToDatabase(userToken?: string): Promise<sql.ConnectionPool> {
  const token = userToken || currentUserToken
  
  if (!token) {
    throw new Error('No SQL access token provided. User must be authenticated.')
  }
  
  const tokenHash = hashToken(token)
  
  // Check cache for existing connection
  const cached = connectionCache.get(tokenHash)
  if (cached && cached.pool.connected && cached.expires > Date.now()) {
    return cached.pool
  }
  
  // Clean up expired connection if exists
  if (cached) {
    try {
      await cached.pool.close()
    } catch {
      // Ignore close errors
    }
    connectionCache.delete(tokenHash)
  }

  try {
    const pool = await sql.connect({
      server: databaseConfig.server,
      port: databaseConfig.port,
      database: databaseConfig.database,
      options: {
        encrypt: databaseConfig.options.encrypt,
        trustServerCertificate: databaseConfig.options.trustServerCertificate
      },
      connectionTimeout: databaseConfig.connectionTimeout,
      authentication: {
        type: 'azure-active-directory-access-token',
        options: {
          token: token
        }
      }
    })
    
    // Cache the connection
    connectionCache.set(tokenHash, {
      pool,
      expires: Date.now() + CONNECTION_TTL
    })

    console.log('Connected to Fabric SQL database with user token')
    return pool
  } catch (error) {
    console.error('Database connection error:', error)
    throw error
  }
}

/**
 * Close all database connections
 */
export async function closeDatabaseConnection(): Promise<void> {
  for (const [key, { pool }] of connectionCache) {
    try {
      await pool.close()
    } catch {
      // Ignore close errors
    }
    connectionCache.delete(key)
  }
  console.log('All database connections closed')
}

/**
 * Get all opportunities with optional filtering
 */
export async function getOpportunities(params?: OpportunitySearchParams): Promise<FabricOpportunity[]> {
  const connection = await connectToDatabase()
  const request = connection.request()
  
  let query = `SELECT * FROM ${tables.opportunities}`
  const conditions: string[] = []
  
  if (params?.partnerId) {
    conditions.push('PartnerId = @partnerId')
    request.input('partnerId', sql.VarChar, params.partnerId)
  }
  
  if (params?.customerId) {
    conditions.push('CustomerId = @customerId')
    request.input('customerId', sql.VarChar, params.customerId)
  }
  
  if (params?.status) {
    conditions.push('Status = @status')
    request.input('status', sql.VarChar, params.status)
  }
  
  if (params?.fromDate) {
    conditions.push('CreatedDate >= @fromDate')
    request.input('fromDate', sql.DateTime, params.fromDate)
  }
  
  if (params?.toDate) {
    conditions.push('CreatedDate <= @toDate')
    request.input('toDate', sql.DateTime, params.toDate)
  }
  
  if (params?.searchText) {
    conditions.push('(OpportunityName LIKE @searchText OR CustomerName LIKE @searchText OR PartnerName LIKE @searchText)')
    request.input('searchText', sql.VarChar, `%${params.searchText}%`)
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ')
  }
  
  query += ' ORDER BY CreatedDate DESC'
  
  if (params?.limit) {
    query = `SELECT TOP ${params.limit} * FROM (${query}) AS t`
  }
  
  const result = await request.query<FabricOpportunity>(query)
  return result.recordset
}

/**
 * Get a single opportunity by ID
 */
export async function getOpportunityById(opportunityId: string): Promise<FabricOpportunity | null> {
  const connection = await connectToDatabase()
  const request = connection.request()
  
  request.input('opportunityId', sql.VarChar, opportunityId)
  
  const result = await request.query<FabricOpportunity>(`
    SELECT * FROM ${tables.opportunities} 
    WHERE OpportunityId = @opportunityId
  `)
  
  return result.recordset.length > 0 ? result.recordset[0] : null
}

/**
 * Get all partner referrals with optional filtering
 */
export async function getPartnerReferrals(params?: PartnerReferralSearchParams): Promise<FabricPartnerReferral[]> {
  const connection = await connectToDatabase()
  const request = connection.request()
  
  let query = `SELECT * FROM ${tables.partnerReferrals}`
  const conditions: string[] = []
  
  if (params?.opportunityId) {
    conditions.push('OpportunityId = @opportunityId')
    request.input('opportunityId', sql.VarChar, params.opportunityId)
  }
  
  if (params?.partnerId) {
    conditions.push('PartnerId = @partnerId')
    request.input('partnerId', sql.VarChar, params.partnerId)
  }
  
  if (params?.referralStatus) {
    conditions.push('ReferralStatus = @referralStatus')
    request.input('referralStatus', sql.VarChar, params.referralStatus)
  }
  
  if (params?.fromDate) {
    conditions.push('CreatedDate >= @fromDate')
    request.input('fromDate', sql.DateTime, params.fromDate)
  }
  
  if (params?.toDate) {
    conditions.push('CreatedDate <= @toDate')
    request.input('toDate', sql.DateTime, params.toDate)
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ')
  }
  
  query += ' ORDER BY CreatedDate DESC'
  
  if (params?.limit) {
    query = `SELECT TOP ${params.limit} * FROM (${query}) AS t`
  }
  
  const result = await request.query<FabricPartnerReferral>(query)
  return result.recordset
}

/**
 * Get a single partner referral by ID
 */
export async function getPartnerReferralById(referralId: string): Promise<FabricPartnerReferral | null> {
  const connection = await connectToDatabase()
  const request = connection.request()
  
  request.input('referralId', sql.VarChar, referralId)
  
  const result = await request.query<FabricPartnerReferral>(`
    SELECT * FROM ${tables.partnerReferrals} 
    WHERE ReferralId = @referralId
  `)
  
  return result.recordset.length > 0 ? result.recordset[0] : null
}

/**
 * Get opportunities with their associated partner referrals
 */
export async function getOpportunitiesWithReferrals(params?: OpportunitySearchParams): Promise<OpportunityWithReferrals[]> {
  const opportunities = await getOpportunities(params)
  
  const result: OpportunityWithReferrals[] = []
  
  for (const opportunity of opportunities) {
    const referrals = await getPartnerReferrals({ 
      opportunityId: opportunity.OpportunityId 
    })
    
    result.push({
      opportunity,
      referrals
    })
  }
  
  return result
}

/**
 * Get dashboard metrics from the database
 */
export async function getDashboardMetrics(): Promise<{
  totalOpportunities: number
  activePartnerReferrals: number
  totalPipelineValue: number
  topPartners: { partnerId: string; partnerName: string; count: number; totalValue: number }[]
  recentOpportunities: FabricOpportunity[]
}> {
  const connection = await connectToDatabase()
  
  // Get total opportunities count
  const countResult = await connection.request().query(`
    SELECT COUNT(*) as total FROM ${tables.opportunities}
  `)
  const totalOpportunities = countResult.recordset[0].total
  
  // Get active partner referrals count
  const referralsCountResult = await connection.request().query(`
    SELECT COUNT(*) as total FROM ${tables.partnerReferrals}
  `)
  const activePartnerReferrals = referralsCountResult.recordset[0].total
  
  // Get total pipeline value
  const pipelineResult = await connection.request().query(`
    SELECT ISNULL(SUM(CAST(EstimatedRevenue AS DECIMAL(18,2))), 0) as totalValue 
    FROM ${tables.opportunities}
  `)
  const totalPipelineValue = pipelineResult.recordset[0].totalValue || 0
  
  // Get top partners by opportunity count and value
  const topPartnersResult = await connection.request().query<{
    PartnerId: string
    PartnerName: string
    opportunityCount: number
    totalValue: number
  }>(`
    SELECT TOP 10
      PartnerId,
      PartnerName,
      COUNT(*) as opportunityCount,
      ISNULL(SUM(CAST(EstimatedRevenue AS DECIMAL(18,2))), 0) as totalValue
    FROM ${tables.opportunities}
    WHERE PartnerId IS NOT NULL
    GROUP BY PartnerId, PartnerName
    ORDER BY opportunityCount DESC
  `)
  
  const topPartners = topPartnersResult.recordset.map(row => ({
    partnerId: row.PartnerId,
    partnerName: row.PartnerName,
    count: row.opportunityCount,
    totalValue: row.totalValue
  }))
  
  // Get recent opportunities
  const recentResult = await connection.request().query<FabricOpportunity>(`
    SELECT TOP 10 * FROM ${tables.opportunities}
    ORDER BY CreatedDate DESC
  `)
  
  return {
    totalOpportunities,
    activePartnerReferrals,
    totalPipelineValue,
    topPartners,
    recentOpportunities: recentResult.recordset
  }
}

/**
 * Search across opportunities and referrals
 */
export async function searchOpportunitiesAndReferrals(
  searchText: string,
  limit: number = 50
): Promise<{ opportunities: FabricOpportunity[]; referrals: FabricPartnerReferral[] }> {
  const connection = await connectToDatabase()
  const request = connection.request()
  
  request.input('searchText', sql.VarChar, `%${searchText}%`)
  request.input('limit', sql.Int, limit)
  
  const opportunitiesResult = await request.query<FabricOpportunity>(`
    SELECT TOP (@limit) * FROM ${tables.opportunities}
    WHERE OpportunityName LIKE @searchText 
       OR CustomerName LIKE @searchText 
       OR PartnerName LIKE @searchText
       OR OpportunityId LIKE @searchText
    ORDER BY CreatedDate DESC
  `)
  
  const request2 = connection.request()
  request2.input('searchText', sql.VarChar, `%${searchText}%`)
  request2.input('limit', sql.Int, limit)
  
  const referralsResult = await request2.query<FabricPartnerReferral>(`
    SELECT TOP (@limit) * FROM ${tables.partnerReferrals}
    WHERE PartnerName LIKE @searchText 
       OR ReferralId LIKE @searchText
       OR OpportunityId LIKE @searchText
    ORDER BY CreatedDate DESC
  `)
  
  return {
    opportunities: opportunitiesResult.recordset,
    referrals: referralsResult.recordset
  }
}
