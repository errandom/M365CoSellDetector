import { graphService, type EmailMessage, type ChatMessage, type MeetingTranscript } from './graphService'
import { scanHistoryService } from './scanHistoryService'
import { msxService } from './msxService'
import type { DetectedOpportunity, Communication, Entity, CommunicationType, SolutionArea } from './types'

export async function detectOpportunitiesFromGraphData(
  startDate: Date,
  endDate: Date,
  sources: CommunicationType[],
  keywords: string[],
  onProgress?: (stage: string, progress: number) => void,
  useIncrementalScan: boolean = true
): Promise<DetectedOpportunity[]> {
  const opportunities: DetectedOpportunity[] = []

  try {
    onProgress?.('Connecting to Microsoft Graph API...', 0.10)
    await new Promise(resolve => setTimeout(resolve, 500))

    const lastScanDates: { email?: Date; chat?: Date; meeting?: Date } = {}
    
    if (useIncrementalScan) {
      onProgress?.('Checking for previous scans...', 0.15)
      for (const source of sources) {
        const lastScan = await scanHistoryService.getLastScanDate(source)
        if (lastScan) {
          lastScanDates[source] = lastScan
        }
      }
    }

    const hasIncrementalData = Object.keys(lastScanDates).length > 0
    if (hasIncrementalData) {
      onProgress?.('Fetching only new communications since last scan...', 0.20)
    } else {
      onProgress?.('Fetching communications from M365...', 0.20)
    }
    
    const data = await graphService.scanCommunications(
      startDate, 
      endDate, 
      sources, 
      keywords,
      lastScanDates
    )

    onProgress?.('Processing emails...', 0.40)
    for (const email of data.emails) {
      const opportunity = await processEmail(email, keywords)
      if (opportunity) {
        opportunities.push(opportunity)
      }
    }

    onProgress?.('Processing Teams chats...', 0.60)
    for (const chat of data.chats) {
      const opportunity = await processChat(chat, keywords)
      if (opportunity) {
        opportunities.push(opportunity)
      }
    }

    onProgress?.('Processing meeting transcripts...', 0.80)
    for (const transcript of data.transcripts) {
      const opportunity = await processTranscript(transcript, keywords)
      if (opportunity) {
        opportunities.push(opportunity)
      }
    }

    onProgress?.('Analyzing opportunities with AI...', 0.85)
    await new Promise(resolve => setTimeout(resolve, 500))

    // Cross-validate with MSX to check for existing opportunities
    onProgress?.('Cross-validating with MSX...', 0.92)
    await crossValidateWithMSX(opportunities)

    const scanEndDate = new Date()
    for (const source of sources) {
      await scanHistoryService.updateScanDate(source, scanEndDate)
    }
    await scanHistoryService.updateFullScanDate(scanEndDate)

    onProgress?.('Finalizing results...', 1.0)

    return opportunities
  } catch (error) {
    console.error('Error detecting opportunities:', error)
    throw error
  }
}

async function processEmail(email: EmailMessage, keywords: string[]): Promise<DetectedOpportunity | null> {
  try {
    const matchedKeywords = keywords.filter(
      (kw) =>
        email.subject.toLowerCase().includes(kw.toLowerCase()) ||
        email.body.toLowerCase().includes(kw.toLowerCase())
    )

    if (matchedKeywords.length === 0) return null

    const partner = await extractPartner(email.body)
    const customer = await extractCustomer(email.body)
    const solutionArea = await extractSolutionArea(email.body)
    const summary = await generateSummary(email.subject, email.body)

    const communication: Communication = {
      id: email.id,
      type: 'email',
      subject: email.subject,
      from: email.from,
      date: email.receivedDateTime,
      preview: email.bodyPreview,
      content: email.body,
    }

    return {
      id: `opp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      communication,
      partner,
      customer,
      solutionArea,
      summary,
      keywords: matchedKeywords,
      confidence: calculateConfidence(matchedKeywords.length, partner, customer),
      status: 'new',
      crmAction: 'create',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Error processing email:', error)
    return null
  }
}

async function processChat(chat: ChatMessage, keywords: string[]): Promise<DetectedOpportunity | null> {
  try {
    const matchedKeywords = keywords.filter((kw) =>
      chat.body.toLowerCase().includes(kw.toLowerCase())
    )

    if (matchedKeywords.length === 0) return null

    const partner = await extractPartner(chat.body)
    const customer = await extractCustomer(chat.body)
    const solutionArea = await extractSolutionArea(chat.body)
    const summary = await generateSummary('Teams Chat', chat.body)

    const communication: Communication = {
      id: chat.id,
      type: 'chat',
      subject: 'Teams Chat Message',
      from: chat.from,
      date: chat.createdDateTime,
      preview: chat.body.substring(0, 150),
      content: chat.body,
    }

    return {
      id: `opp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      communication,
      partner,
      customer,
      solutionArea,
      summary,
      keywords: matchedKeywords,
      confidence: calculateConfidence(matchedKeywords.length, partner, customer),
      status: 'new',
      crmAction: 'create',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Error processing chat:', error)
    return null
  }
}

async function processTranscript(
  transcript: MeetingTranscript,
  keywords: string[]
): Promise<DetectedOpportunity | null> {
  try {
    const matchedKeywords = keywords.filter((kw) =>
      transcript.content.toLowerCase().includes(kw.toLowerCase())
    )

    if (matchedKeywords.length === 0) return null

    const partner = await extractPartner(transcript.content)
    const customer = await extractCustomer(transcript.content)
    const solutionArea = await extractSolutionArea(transcript.content)
    const summary = await generateSummary('Meeting Transcript', transcript.content)

    const communication: Communication = {
      id: transcript.id,
      type: 'meeting',
      subject: 'Teams Meeting Transcript',
      from: 'Meeting Participant',
      date: transcript.createdDateTime,
      preview: transcript.content.substring(0, 150),
      content: transcript.content,
    }

    return {
      id: `opp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      communication,
      partner,
      customer,
      solutionArea,
      summary,
      keywords: matchedKeywords,
      confidence: calculateConfidence(matchedKeywords.length, partner, customer),
      status: 'new',
      crmAction: 'create',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Error processing transcript:', error)
    return null
  }
}

async function extractPartner(content: string): Promise<Entity | null> {
  const partnerKeywords = [
    'partner',
    'microsoft',
    'vendor',
    'supplier',
    'consultant',
    'integrator',
  ]

  const prompt = window.spark.llmPrompt`Extract the partner company name from this text. If no partner is mentioned, return null.

Text: ${content}

Return a JSON object with:
- name: the partner company name (or null)
- confidence: a number between 0 and 1 indicating confidence

Only return the JSON, no other text.`

  try {
    const result = await window.spark.llm(prompt, 'gpt-4o-mini', true)
    const parsed = JSON.parse(result)

    if (!parsed.name) return null

    return {
      name: parsed.name,
      type: 'partner',
      confidence: parsed.confidence || 0.5,
    }
  } catch (error) {
    console.error('Error extracting partner:', error)
    return null
  }
}

async function extractCustomer(content: string): Promise<Entity | null> {
  const prompt = window.spark.llmPrompt`Extract the customer/client company name from this text. If no customer is mentioned, return null.

Text: ${content}

Return a JSON object with:
- name: the customer company name (or null)
- confidence: a number between 0 and 1 indicating confidence

Only return the JSON, no other text.`

  try {
    const result = await window.spark.llm(prompt, 'gpt-4o-mini', true)
    const parsed = JSON.parse(result)

    if (!parsed.name) return null

    return {
      name: parsed.name,
      type: 'customer',
      confidence: parsed.confidence || 0.5,
    }
  } catch (error) {
    console.error('Error extracting customer:', error)
    return null
  }
}

async function extractSolutionArea(content: string): Promise<SolutionArea | undefined> {
  const solutionAreas: SolutionArea[] = [
    'azure-migration',
    'modern-workplace',
    'security',
    'data-ai',
    'app-modernization',
    'infrastructure'
  ]

  const prompt = window.spark.llmPrompt`Analyze this text and identify the primary Microsoft solution area or technology being discussed.

Text: ${content.substring(0, 2000)}

Choose the most relevant solution area from this list:
- azure-migration: Azure cloud migration, lift and shift, datacenter modernization
- modern-workplace: Microsoft 365, Teams, productivity, collaboration tools
- security: Security, compliance, identity, Zero Trust, Defender
- data-ai: Data analytics, AI, Machine Learning, Copilot, Power BI
- app-modernization: Application modernization, containers, Kubernetes, DevOps
- infrastructure: Infrastructure, networking, hybrid cloud, Azure Arc

Return a JSON object with:
- solutionArea: one of the exact values listed above, or null if none applies
- confidence: a number between 0 and 1

Only return the JSON, no other text.`

  try {
    const result = await window.spark.llm(prompt, 'gpt-4o-mini', true)
    const parsed = JSON.parse(result)

    if (parsed.solutionArea && solutionAreas.includes(parsed.solutionArea)) {
      return parsed.solutionArea
    }
    return undefined
  } catch (error) {
    console.error('Error extracting solution area:', error)
    return undefined
  }
}

async function generateSummary(subject: string, content: string): Promise<string> {
  const truncatedContent = content.substring(0, 2000)

  const prompt = window.spark.llmPrompt`Summarize this communication in 1-2 sentences, focusing on the co-sell opportunity aspects.

Subject: ${subject}
Content: ${truncatedContent}

Provide a concise summary (max 50 words) that captures the key opportunity details.`

  try {
    const summary = await window.spark.llm(prompt, 'gpt-4o-mini')
    return summary.trim()
  } catch (error) {
    console.error('Error generating summary:', error)
    return `Discussion about ${subject}`
  }
}

function calculateConfidence(
  keywordCount: number,
  partner: Entity | null,
  customer: Entity | null
): number {
  let confidence = 0.3

  confidence += Math.min(keywordCount * 0.1, 0.3)

  if (partner) {
    confidence += partner.confidence * 0.2
  }

  if (customer) {
    confidence += customer.confidence * 0.2
  }

  return Math.min(Math.round(confidence * 100) / 100, 1)
}

/**
 * Cross-validate detected opportunities against MSX (Dynamics 365)
 * to identify existing opportunities and partner engagement status
 */
async function crossValidateWithMSX(opportunities: DetectedOpportunity[]): Promise<void> {
  // Cache for customer+partner lookups to avoid duplicate API calls
  const customerCache = new Map<string, { 
    found: boolean
    action: 'create' | 'link' | 'already_linked'
    opportunityId?: string
    opportunityName?: string
    referralId?: string
  }>()

  for (const opportunity of opportunities) {
    // Skip if no customer identified
    if (!opportunity.customer?.name) {
      continue
    }

    const customerName = opportunity.customer.name
    const partnerName = opportunity.partner?.name || ''
    const cacheKey = `${customerName}|${partnerName}`

    // Check cache first
    if (customerCache.has(cacheKey)) {
      const cached = customerCache.get(cacheKey)!
      opportunity.crmAction = cached.action
      if (cached.opportunityId) {
        opportunity.existingOpportunityId = cached.opportunityId
        opportunity.existingOpportunityName = cached.opportunityName
      }
      if (cached.referralId) {
        opportunity.existingReferralId = cached.referralId
      }
      continue
    }

    try {
      // Use comprehensive partner engagement check
      const engagementCheck = await msxService.checkPartnerEngagement(customerName, partnerName)

      if (engagementCheck.action === 'already_linked') {
        // Partner already linked to opportunity - no action needed
        opportunity.crmAction = 'already_linked'
        opportunity.existingOpportunityId = engagementCheck.opportunity?.opportunityid
        opportunity.existingOpportunityName = engagementCheck.opportunity?.name
        opportunity.existingReferralId = engagementCheck.existingReferral?.referralid

        customerCache.set(cacheKey, {
          found: true,
          action: 'already_linked',
          opportunityId: engagementCheck.opportunity?.opportunityid,
          opportunityName: engagementCheck.opportunity?.name,
          referralId: engagementCheck.existingReferral?.referralid,
        })

        console.info(`MSX: Partner "${partnerName}" already linked to opportunity "${engagementCheck.opportunity?.name}"`)
      } else if (engagementCheck.action === 'link_partner') {
        // Opportunity exists but partner not linked
        opportunity.crmAction = 'link'
        opportunity.existingOpportunityId = engagementCheck.opportunity?.opportunityid
        opportunity.existingOpportunityName = engagementCheck.opportunity?.name

        customerCache.set(cacheKey, {
          found: true,
          action: 'link',
          opportunityId: engagementCheck.opportunity?.opportunityid,
          opportunityName: engagementCheck.opportunity?.name,
        })

        console.info(`MSX: Will link partner "${partnerName}" to existing opportunity "${engagementCheck.opportunity?.name}"`)
      } else {
        // No opportunity exists - will create new
        opportunity.crmAction = 'create'
        customerCache.set(cacheKey, { found: false, action: 'create' })
        
        console.info(`MSX: No opportunity found for "${customerName}" - will create new`)
      }
    } catch (error) {
      console.warn(`MSX lookup failed for "${customerName}" / "${partnerName}":`, error)
      // On error, default to create action
      customerCache.set(cacheKey, { found: false, action: 'create' })
    }
  }
}
