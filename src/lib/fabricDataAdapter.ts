/**
 * Fabric Data Adapter
 * Converts Fabric SQL data to the application's existing types
 */

import { fabricDatabaseService, type FabricOpportunity, type FabricPartnerReferral, type FabricDashboardMetrics } from './fabricDatabaseService'
import type { DetectedOpportunity, DashboardMetrics, Entity, Communication, OpportunityStatus, CRMAction } from './types'

/**
 * Convert a Fabric opportunity to the application's DetectedOpportunity format
 */
export function fabricOpportunityToDetectedOpportunity(
  fabricOpp: FabricOpportunity,
  referrals?: FabricPartnerReferral[]
): DetectedOpportunity {
  // Create partner entity if partner data exists
  const partner: Entity | null = fabricOpp.PartnerName
    ? {
        name: fabricOpp.PartnerName,
        type: 'partner',
        confidence: 1.0, // Data from CRM is confirmed
      }
    : null

  // Create customer entity if customer data exists
  const customer: Entity | null = fabricOpp.CustomerName
    ? {
        name: fabricOpp.CustomerName,
        type: 'customer',
        confidence: 1.0,
      }
    : null

  // Map Fabric status to app status
  const statusMapping: Record<string, OpportunityStatus> = {
    new: 'new',
    active: 'confirmed',
    pending: 'review',
    won: 'synced',
    lost: 'rejected',
    closed: 'synced',
    open: 'new',
    qualified: 'confirmed',
  }
  const status: OpportunityStatus = statusMapping[
    fabricOpp.Status?.toLowerCase() || ''
  ] || 'new'

  // Determine CRM action based on data state
  const crmAction: CRMAction = fabricOpp.ReferralId ? 'update' : 'create'

  // Create a synthetic communication object from the opportunity data
  const communication: Communication = {
    id: `fabric-${fabricOpp.OpportunityId}`,
    type: 'email', // Default type for CRM data
    subject: fabricOpp.OpportunityName,
    from: fabricOpp.OwnerEmail || fabricOpp.OwnerName || 'CRM System',
    date: fabricOpp.CreatedDate || new Date().toISOString(),
    preview: fabricOpp.Description?.substring(0, 200) || `Co-sell opportunity with ${fabricOpp.PartnerName || 'Partner'}`,
    content: buildOpportunityContent(fabricOpp, referrals),
  }

  // Extract keywords from opportunity data
  const keywords: string[] = []
  if (fabricOpp.CoSellType) keywords.push(fabricOpp.CoSellType)
  if (fabricOpp.SolutionArea) keywords.push(fabricOpp.SolutionArea)
  if (fabricOpp.Type) keywords.push(fabricOpp.Type)
  if (fabricOpp.PartnerType) keywords.push(fabricOpp.PartnerType)
  keywords.push('co-sell', 'partner referral')

  // Format deal size
  const dealSize = fabricOpp.EstimatedRevenue
    ? formatCurrency(fabricOpp.EstimatedRevenue, fabricOpp.Currency)
    : undefined

  // Format timeline
  const timeline = fabricOpp.ExpectedCloseDate
    ? formatDate(fabricOpp.ExpectedCloseDate)
    : undefined

  return {
    id: fabricOpp.OpportunityId,
    communication,
    partner,
    customer,
    summary: buildOpportunitySummary(fabricOpp),
    keywords,
    confidence: 1.0, // CRM data is confirmed
    status,
    crmAction,
    existingOpportunityId: fabricOpp.OpportunityId,
    dealSize,
    timeline,
    createdAt: fabricOpp.CreatedDate || new Date().toISOString(),
    updatedAt: fabricOpp.ModifiedDate || new Date().toISOString(),
  }
}

/**
 * Build content string from opportunity data
 */
function buildOpportunityContent(
  opp: FabricOpportunity,
  referrals?: FabricPartnerReferral[]
): string {
  const lines: string[] = []
  
  lines.push(`Opportunity: ${opp.OpportunityName}`)
  lines.push(`Opportunity ID: ${opp.OpportunityId}`)
  lines.push('')
  
  if (opp.CustomerName) {
    lines.push(`Customer: ${opp.CustomerName}`)
    if (opp.CustomerIndustry) lines.push(`Industry: ${opp.CustomerIndustry}`)
    if (opp.CustomerCountry) lines.push(`Location: ${opp.CustomerCity ? `${opp.CustomerCity}, ` : ''}${opp.CustomerCountry}`)
    lines.push('')
  }
  
  if (opp.PartnerName) {
    lines.push(`Partner: ${opp.PartnerName}`)
    if (opp.PartnerType) lines.push(`Partner Type: ${opp.PartnerType}`)
    lines.push('')
  }
  
  if (opp.SolutionArea) lines.push(`Solution Area: ${opp.SolutionArea}`)
  if (opp.Stage) lines.push(`Stage: ${opp.Stage}`)
  if (opp.Status) lines.push(`Status: ${opp.Status}`)
  if (opp.CoSellStatus) lines.push(`Co-Sell Status: ${opp.CoSellStatus}`)
  
  if (opp.EstimatedRevenue) {
    lines.push(`Estimated Revenue: ${formatCurrency(opp.EstimatedRevenue, opp.Currency)}`)
  }
  
  if (opp.ExpectedCloseDate) {
    lines.push(`Expected Close: ${formatDate(opp.ExpectedCloseDate)}`)
  }
  
  if (opp.Description) {
    lines.push('')
    lines.push(`Description: ${opp.Description}`)
  }
  
  if (referrals && referrals.length > 0) {
    lines.push('')
    lines.push('--- Partner Referral Details ---')
    for (const ref of referrals) {
      lines.push(`Referral ID: ${ref.ReferralId}`)
      if (ref.ReferralStatus) lines.push(`Referral Status: ${ref.ReferralStatus}`)
      if (ref.ReferralType) lines.push(`Referral Type: ${ref.ReferralType}`)
      if (ref.EstimatedDealValue) lines.push(`Deal Value: ${formatCurrency(ref.EstimatedDealValue, ref.Currency)}`)
      if (ref.EngagementType) lines.push(`Engagement Type: ${ref.EngagementType}`)
      if (ref.ContactName) lines.push(`Contact: ${ref.ContactName}`)
      lines.push('')
    }
  }
  
  if (opp.OwnerName) {
    lines.push(`Microsoft Seller: ${opp.OwnerName}${opp.OwnerEmail ? ` (${opp.OwnerEmail})` : ''}`)
  }
  
  return lines.join('\n')
}

/**
 * Build a summary string for the opportunity
 */
function buildOpportunitySummary(opp: FabricOpportunity): string {
  const parts: string[] = []
  
  if (opp.CoSellType || opp.CoSellStatus) {
    parts.push(`${opp.CoSellType || 'Co-sell'} opportunity`)
  } else {
    parts.push('Partner opportunity')
  }
  
  if (opp.PartnerName) {
    parts.push(`with ${opp.PartnerName}`)
  }
  
  if (opp.CustomerName) {
    parts.push(`for ${opp.CustomerName}`)
  }
  
  if (opp.SolutionArea) {
    parts.push(`- ${opp.SolutionArea}`)
  }
  
  if (opp.EstimatedRevenue) {
    parts.push(`(${formatCurrency(opp.EstimatedRevenue, opp.Currency)})`)
  }
  
  return parts.join(' ')
}

/**
 * Format currency value
 */
function formatCurrency(value: number, currency?: string): string {
  const curr = currency || 'USD'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: curr,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Format date string
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

/**
 * Convert Fabric dashboard metrics to app DashboardMetrics format
 */
export function fabricMetricsToDashboardMetrics(
  fabricMetrics: FabricDashboardMetrics
): DashboardMetrics {
  // Generate recent activity from recent opportunities
  const activityMap = new Map<string, number>()
  
  for (const opp of fabricMetrics.recentOpportunities) {
    if (opp.CreatedDate) {
      const date = opp.CreatedDate.split('T')[0]
      activityMap.set(date, (activityMap.get(date) || 0) + 1)
    }
  }
  
  // Fill in the last 14 days
  const recentActivity: { date: string; count: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    recentActivity.push({
      date: dateStr,
      count: activityMap.get(dateStr) || 0,
    })
  }
  
  // Map top partners
  const topPartners = fabricMetrics.topPartners.map((p) => ({
    name: p.partnerName || p.partnerId,
    opportunities: p.count,
    value: p.totalValue,
  }))
  
  // Calculate approximate counts
  const pendingReview = Math.floor(fabricMetrics.totalOpportunities * 0.2)
  const synced = fabricMetrics.totalOpportunities - pendingReview
  
  return {
    totalOpportunities: fabricMetrics.totalOpportunities,
    pendingReview,
    synced,
    activePartners: fabricMetrics.topPartners.length,
    pipelineValue: fabricMetrics.totalPipelineValue,
    conversionRate: 67.5, // Placeholder - would need actual calculation
    recentActivity,
    topPartners,
  }
}

/**
 * Fetch opportunities from Fabric and convert to DetectedOpportunity format
 */
export async function fetchOpportunitiesFromFabric(params?: {
  fromDate?: Date
  toDate?: Date
  searchText?: string
  limit?: number
}): Promise<DetectedOpportunity[]> {
  try {
    const fabricOpportunities = await fabricDatabaseService.getOpportunitiesWithReferrals({
      fromDate: params?.fromDate,
      toDate: params?.toDate,
      searchText: params?.searchText,
      limit: params?.limit,
    })
    
    return fabricOpportunities.map((item) =>
      fabricOpportunityToDetectedOpportunity(item.opportunity, item.referrals)
    )
  } catch (error) {
    console.error('Error fetching opportunities from Fabric:', error)
    throw error
  }
}

/**
 * Fetch dashboard metrics from Fabric
 */
export async function fetchDashboardMetricsFromFabric(): Promise<DashboardMetrics> {
  try {
    const fabricMetrics = await fabricDatabaseService.getDashboardMetrics()
    return fabricMetricsToDashboardMetrics(fabricMetrics)
  } catch (error) {
    console.error('Error fetching dashboard metrics from Fabric:', error)
    throw error
  }
}
